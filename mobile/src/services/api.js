import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Set API URL based on environment or local IP
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:4000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle global auth errors (e.g., token expiry)
    if (error.response && error.response.status === 401) {
      // You could dispatch a logout action here via authStore
    }
    return Promise.reject(error);
  }
);

export default api;
