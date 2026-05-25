import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flag, Ban } from 'lucide-react-native';
import socketService from '../../services/socket';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function ChatScreen({ route, navigation }) {
  const { chatId } = route.params;
  const { messages, fetchMessages, addMessage, clearUnread } = useChatStore();
  const { user } = useAuthStore();
  const [inputText, setInputText] = useState('');
  const [chatDetails, setChatDetails] = useState(null);
  const flatListRef = useRef();

  const chatMessages = messages[chatId] || [];

  useEffect(() => {
    clearUnread();
    loadChat();
    
    const setupSocket = async () => {
      try {
        await socketService.connect();
        socketService.emit('chat:join', { chatId });

        socketService.on('chat:message', (msg) => {
          addMessage(chatId, msg);
        });

        socketService.on('chat:expired', () => {
          Alert.alert('Chat Ended', 'This chat has reached its 24-hour limit.');
          navigation.goBack();
        });
      } catch (err) {
        console.error('Socket setup failed:', err);
      }
    };
    
    setupSocket();

    return () => {
      socketService.emit('chat:leave', { chatId });
      socketService.off('chat:message');
      socketService.off('chat:expired');
    };
  }, [chatId]);

  const loadChat = async () => {
    const data = await fetchMessages(chatId);
    if (data) setChatDetails(data);
  };

  const handleSend = () => {
    const content = inputText.trim();
    if (!content) return;

    if (content.match(/[-+]?\d{1,3}\.\d{4,},\s*[-+]?\d{1,3}\.\d{4,}/)) {
      Alert.alert('Blocked', 'Sharing exact coordinates is not allowed for safety reasons.');
      return;
    }

    const optimistic = {
      id: `temp-${Date.now()}`,
      chatId,
      senderId: user.id,
      content,
      createdAt: new Date().toISOString(),
    };
    addMessage(chatId, optimistic);
    setInputText('');

    socketService.emit('chat:message', { chatId, content }, (response) => {
      if (response && !response.success) {
        Alert.alert('Error', response.error || 'Failed to send message');
      }
    });
  };

  const handleReport = () => {
    const otherUser = chatDetails?.participants.find(p => p.userId !== user.id);
    if (!otherUser) return;

    Alert.alert('Report User', 'Are you sure you want to report this user?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Report', 
        style: 'destructive',
        onPress: async () => {
          await api.post('/safety/report', { reportedId: otherUser.userId, reason: 'inappropriate' });
          Alert.alert('Success', 'User reported. Thank you for keeping the community safe.');
        }
      }
    ]);
  };

  const handleBlock = () => {
    const otherUser = chatDetails?.participants.find(p => p.userId !== user.id);
    if (!otherUser) return;

    Alert.alert('Block User', 'This will end the chat and prevent future contact.', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Block', 
        style: 'destructive',
        onPress: async () => {
          await api.post('/safety/block', { blockedId: otherUser.userId });
          navigation.goBack();
        }
      }
    ]);
  };

  React.useLayoutEffect(() => {
    const otherUser = chatDetails?.participants.find(p => p.userId !== user.id);
    const title = otherUser?.name || 'Loading...';

    navigation.setOptions({
      title,
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={handleReport} style={{ marginRight: 16 }}>
            <Flag color="#f56565" size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleBlock} style={{ marginRight: 8 }}>
            <Ban color="#333" size={20} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, chatDetails]);

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user.id;
    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {chatDetails?.isActive === false && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>This chat has ended</Text>
        </View>
      )}
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={chatDetails?.isActive !== false}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!inputText.trim() || chatDetails?.isActive === false) && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim() || chatDetails?.isActive === false || !chatDetails}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  banner: { backgroundColor: '#fee2e2', padding: 12, alignItems: 'center' },
  bannerText: { color: '#991b1b', fontWeight: 'bold' },
  list: { padding: 16 },
  messageWrapper: { marginBottom: 12, flexDirection: 'row' },
  messageWrapperMe: { justifyContent: 'flex-end' },
  messageWrapperOther: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  messageBubbleMe: { backgroundColor: '#6C63FF', borderBottomRightRadius: 4 },
  messageBubbleOther: { backgroundColor: '#f1f5f9', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 16 },
  messageTextMe: { color: '#fff' },
  messageTextOther: { color: '#333' },
  inputContainer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center', backgroundColor: '#fff' },
  input: { flex: 1, backgroundColor: '#f8f9fa', borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 16, maxHeight: 100 },
  sendButton: { marginLeft: 12, backgroundColor: '#6C63FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  sendButtonDisabled: { backgroundColor: '#a5a1ff' },
  sendButtonText: { color: '#fff', fontWeight: 'bold' },
});
