import { create } from 'zustand';
import api from '../services/api';

export const useLocationStore = create((set) => ({
  nearbyUsers: [],
  isLoading: false,
  error: null,
  lastUpdate: null,

  fetchNearby: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/location/nearby');
      if (response.data.success) {
        set({ nearbyUsers: response.data.data, lastUpdate: Date.now() });
      }
    } catch (error) {
      set({ error: error.response?.data?.error || error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateLocation: async (latitude, longitude) => {
    try {
      await api.post('/location/update', { latitude, longitude });
      return true;
    } catch (error) {
      console.error('Failed to update location on server:', error.message);
      return false;
    }
  },
}));
