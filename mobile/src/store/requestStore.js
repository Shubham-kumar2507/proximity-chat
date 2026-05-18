import { create } from 'zustand';
import api from '../services/api';

export const useRequestStore = create((set, get) => ({
  incomingRequests: [],
  isLoading: false,
  error: null,

  fetchIncoming: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/requests/incoming');
      if (response.data.success) {
        set({ incomingRequests: response.data.data });
      }
    } catch (error) {
      set({ error: error.response?.data?.error || error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addIncomingRequest: (request) => {
    set((state) => ({
      incomingRequests: [request, ...state.incomingRequests],
    }));
  },

  removeRequest: (requestId) => {
    set((state) => ({
      incomingRequests: state.incomingRequests.filter((r) => r.id !== requestId),
    }));
  },

  respondToRequest: async (requestId, action) => {
    try {
      const response = await api.post(`/requests/${requestId}/respond`, { action });
      if (response.data.success) {
        get().removeRequest(requestId);
        return { success: true, data: response.data.data };
      }
      return { success: false, error: 'Failed to respond' };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },
}));
