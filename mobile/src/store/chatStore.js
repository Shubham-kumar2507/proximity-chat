import { create } from 'zustand';
import api from '../services/api';

export const useChatStore = create((set, get) => ({
  activeChats: [],
  messages: {}, // { chatId: [messages] }
  isLoading: false,
  error: null,

  unreadCount: 0,
  
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  clearUnread: () => set({ unreadCount: 0 }),

  fetchChats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/chat');
      if (response.data.success) {
        set({ activeChats: response.data.data });
      }
    } catch (error) {
      set({ error: error.response?.data?.error || error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMessages: async (chatId) => {
    try {
      const response = await api.get(`/chat/${chatId}/messages`);
      if (response.data.success) {
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: response.data.data.messages,
          },
        }));
        return response.data.data;
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error.message);
    }
  },

  addMessage: (chatId, message) => {
    set((state) => {
      let chatMessages = state.messages[chatId] || [];
      if (chatMessages.some((m) => m.id === message.id)) return state;

      if (!String(message.id).startsWith('temp-')) {
        chatMessages = chatMessages.filter(
          (m) =>
            !(
              String(m.id).startsWith('temp-') &&
              m.senderId === message.senderId &&
              m.content === message.content
            )
        );
      }

      return {
        messages: {
          ...state.messages,
          [chatId]: [...chatMessages, message],
        },
      };
    });
  },

  addChat: (chat) => {
    set((state) => {
      // Check if chat already exists
      const exists = state.activeChats.find((c) => c.id === chat.chatId);
      if (exists) return state;

      return {
        activeChats: [
          {
            id: chat.chatId,
            expiresAt: chat.expiresAt,
            identityMode: chat.identityMode,
            participants: chat.participants,
            lastMessage: null,
          },
          ...state.activeChats,
        ],
      };
    });
  },

  removeChat: (chatId) => {
    set((state) => ({
      activeChats: state.activeChats.filter((c) => c.id !== chatId),
    }));
  },
}));
