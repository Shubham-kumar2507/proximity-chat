import { create } from 'zustand';
import api from '../services/api';

export const usePostStore = create((set, get) => ({
  feed: [],
  isLoading: false,
  isPosting: false,
  error: null,

  fetchFeed: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/posts/feed');
      if (response.data.success) {
        set({ feed: response.data.data });
      }
    } catch (error) {
      set({ error: error.response?.data?.error || error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  createPost: async (payload) => {
    set({ isPosting: true });
    try {
      const response = await api.post('/posts', payload);
      if (response.data.success) {
        set((state) => ({ feed: [response.data.data, ...state.feed] }));
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || error.message };
    } finally {
      set({ isPosting: false });
    }
  },

  toggleLike: async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/like`);
      if (response.data.success) {
        const { liked, likesCount } = response.data.data;
        set((state) => ({
          feed: state.feed.map((post) =>
            post.id === postId ? { ...post, likedByMe: liked, likesCount } : post
          ),
        }));
      }
    } catch {
      // noop
    }
  },
}));
