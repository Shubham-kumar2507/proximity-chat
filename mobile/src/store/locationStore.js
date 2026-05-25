import { create } from 'zustand';
import api from '../services/api';

export const useLocationStore = create((set, get) => ({
  nearbyUsers: [],
  isLoading: false,
  error: null,
  lastUpdate: null,
  radiusKm: 0.5,

  setRadiusKm: (radiusKm) => set({ radiusKm }),

  fetchNearby: async () => {
    const { radiusKm } = get();
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/location/nearby', {
        params: { radius: radiusKm },
      });
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
