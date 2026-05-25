import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, User } from 'lucide-react-native';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';

export default function ChatListScreen({ navigation }) {
  const { activeChats, fetchChats, isLoading } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchChats();
  }, []);

  const renderItem = ({ item }) => {
    const otherParticipant = item.participants.find(p => p.userId !== user?.id) || item.participants[0];
    const name = otherParticipant?.name || 'Anonymous';
    
    // Calculate time left
    const expiresAt = new Date(item.expiresAt).getTime();
    const hoursLeft = Math.max(0, Math.floor((expiresAt - Date.now()) / (1000 * 60 * 60)));
    const minsLeft = Math.max(0, Math.floor((expiresAt - Date.now()) / (1000 * 60))) % 60;

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('Chat', { chatId: item.id })}
      >
        <View style={styles.avatar}>
          <User size={24} color="#6C63FF" />
        </View>
        <View style={styles.info}>
          <View style={styles.headerRow}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.timer}>{hoursLeft}h {minsLeft}m left</Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage ? item.lastMessage.content : 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Chats</Text>
      </View>

      {activeChats.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <MessageCircle size={48} color="#ddd" />
          <Text style={styles.emptyText}>No active chats</Text>
          <Text style={styles.emptySubtext}>Send requests to people nearby to start chatting!</Text>
        </View>
      ) : (
        <FlatList
          data={activeChats}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchChats} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0efff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timer: {
    fontSize: 12,
    color: '#f56565',
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
