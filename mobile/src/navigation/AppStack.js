import React, { useEffect, useCallback } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert } from 'react-native';
import MainTab from './MainTab';
import ChatScreen from '../screens/Chat/ChatScreen';
import ViewProfileScreen from '../screens/Profile/ViewProfileScreen';
import socketService from '../services/socket';
import { useChatStore } from '../store/chatStore';
import { useRequestStore } from '../store/requestStore';
import { navigate } from './RootNavigation';
import CorrectGuessToast from '../components/nearby/CorrectGuessToast';

const Stack = createNativeStackNavigator();

export default function AppStack() {
  const { addChat, fetchChats } = useChatStore();
  const { fetchIncoming } = useRequestStore();

  const onChatCreated = useCallback((chat) => {
    addChat(chat);
    Alert.alert(
      'Request Accepted!',
      'Someone accepted your chat request.',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Chat Now', onPress: () => navigate('Chat', { chatId: chat.chatId }) },
      ]
    );
  }, [addChat]);

  const onRequestIncoming = useCallback((req) => {
    fetchIncoming();
    Alert.alert(
      'New Request!',
      req.title || 'Someone wants to chat!',
      [
        { text: 'Ignore', style: 'cancel' },
        { text: 'View', onPress: () => navigate('MainTabs', { screen: 'Requests' }) },
      ]
    );
  }, [fetchIncoming]);

  const onChatNotification = useCallback((payload) => {
    useChatStore.getState().incrementUnread();
    useChatStore.getState().addMessage(payload.chatId, payload);
    useChatStore.getState().fetchChats();
  }, []);

  useEffect(() => {
    fetchChats();
    fetchIncoming();

    const setup = async () => {
      try {
        await socketService.connect();
        socketService.on('chat:created', onChatCreated);
        socketService.on('request:incoming', onRequestIncoming);
        socketService.on('chat:notification', onChatNotification);
      } catch (err) {
        console.error('Global socket setup failed', err);
      }
    };
    setup();

    return () => {
      socketService.off('chat:created', onChatCreated);
      socketService.off('request:incoming', onRequestIncoming);
      socketService.off('chat:notification', onChatNotification);
    };
  }, [fetchChats, fetchIncoming, onChatCreated, onRequestIncoming, onChatNotification]);

  return (
    <>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTab} />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: true, title: 'Chat' }}
      />
      <Stack.Screen
        name="ViewProfile"
        component={ViewProfileScreen}
        options={{ headerShown: true, title: 'Profile', headerTransparent: true, headerTintColor: '#fff' }}
      />
    </Stack.Navigator>
    <CorrectGuessToast />
    </>
  );
}
