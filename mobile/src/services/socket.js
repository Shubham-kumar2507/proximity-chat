import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getDefaultSocketUrl() {
  if (Platform.OS === 'web') return 'http://localhost:4000';
  const hostUri = Constants.expoConfig?.hostUri || '';
  const host = hostUri.split(':')[0];
  if (host) return `http://${host}:4000`;
  return 'http://localhost:4000';
}

const DEFAULT_SOCKET = getDefaultSocketUrl();
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || DEFAULT_SOCKET;

class SocketService {
  socket = null;

  async connect() {
    if (this.socket?.connected) return;

    const token = await AsyncStorage.getItem('accessToken');
    if (!token) throw new Error('No token');

    return new Promise((resolve, reject) => {
      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
      });

      const onConnect = () => {
        this.socket.off('connect_error', onError);
        resolve();
      };

      const onError = (error) => {
        this.socket.off('connect', onConnect);
        reject(error);
      };

      this.socket.once('connect', onConnect);
      this.socket.once('connect_error', onError);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event, data, callback) {
    if (!this.socket?.connected) return;
    this.socket.emit(event, data, callback);
  }

  on(event, callback) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }
}

export default new SocketService();
