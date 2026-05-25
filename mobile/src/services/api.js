import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getDefaultApiUrl() {
  if (Platform.OS === 'web') return 'http://localhost:4000/api';
  const hostUri = Constants.expoConfig?.hostUri || '';
  const host = hostUri.split(':')[0];
  if (host) return `http://${host}:4000/api`;
  return 'http://localhost:4000/api';
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || getDefaultApiUrl();

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

let refreshPromise = null;

api.interceptors.request.use(
  async (config) => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const isRefreshCall = originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshCall) {
      originalRequest._retry = true;
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        return Promise.reject(error);
      }

      if (!refreshPromise) {
        refreshPromise = api
          .post('/auth/refresh', { refreshToken })
          .then(async (response) => {
            const data = response.data.data;
            await AsyncStorage.setItem('accessToken', data.accessToken);
            await AsyncStorage.setItem('refreshToken', data.refreshToken);
            return data.accessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      try {
        const nextAccessToken = await refreshPromise;
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
