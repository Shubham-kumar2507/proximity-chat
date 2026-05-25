import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import socketService from '../services/socket';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isProfileComplete: false,

  checkAuth: async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (accessToken) {
        const response = await api.get('/users/me');
        if (response.data.success) {
          set({
            user: response.data.data,
            isAuthenticated: true,
            isProfileComplete: response.data.data.isVerified,
            isLoading: false,
          });
          return;
        }
      }
    } catch (error) {
      console.log('Auth check failed:', error.message);
    }
    set({ user: null, isAuthenticated: false, isProfileComplete: false, isLoading: false });
  },

  login: async (tokens, userData) => {
    await AsyncStorage.setItem('accessToken', tokens.accessToken);
    await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
    set({
      user: userData,
      isAuthenticated: true,
      isProfileComplete: userData.isVerified,
    });
  },

  logout: async () => {
    socketService.disconnect();
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch {
        // noop
      }
    }
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    set({ user: null, isAuthenticated: false, isProfileComplete: false });
  },

  updateProfile: (userData) => {
    set({ user: userData, isProfileComplete: userData.isVerified });
  },
}));
