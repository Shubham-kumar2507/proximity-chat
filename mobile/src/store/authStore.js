import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isProfileComplete: false,

  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
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

  login: async (token, userData) => {
    await SecureStore.setItemAsync('userToken', token);
    set({
      user: userData,
      isAuthenticated: true,
      isProfileComplete: userData.isVerified,
    });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('userToken');
    set({ user: null, isAuthenticated: false, isProfileComplete: false });
  },

  updateProfile: (userData) => {
    set({ user: userData, isProfileComplete: userData.isVerified });
  },
}));
