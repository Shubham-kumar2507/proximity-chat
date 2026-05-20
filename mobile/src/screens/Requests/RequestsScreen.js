import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, RefreshControl, Alert } from 'react-native';
import { useRequestStore } from '../../store/requestStore';
import { useChatStore } from '../../store/chatStore';

export default function RequestsScreen({ navigation }) {
  const { incomingRequests, fetchIncoming, isLoading, respondToRequest } = useRequestStore();
  const { fetchChats } = useChatStore();
  const [timeNow, setTimeNow] = useState(Date.now());

  useEffect(() => {
    fetchIncoming();
    const interval = setInterval(() => setTimeNow(Date.now()), 60000); // Update timers every minute
    return () => clearInterval(interval);
  }, []);

  const handleRespond = async (requestId, action) => {
    const result = await respondToRequest(requestId, action);
    if (result.success && action === 'accept') {
      fetchChats(); // Refresh chat list
      navigation.navigate('Chat', { chatId: result.data.chat.id });
    }
  };

  const confirmReport = (requestId) => {
    Alert.alert(
      'Report User',
      'Are you sure you want to report this user? This will also decline their request.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report', style: 'destructive', onPress: () => handleRespond(requestId, 'report') }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const expiresAt = new Date(item.expiresAt).getTime();
    const minsLeft = Math.max(0, Math.floor((expiresAt - timeNow) / 60000));

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.senderInfo}>
            {item.identityMode === 'full' 
              ? `${item.sender.name}, ${item.sender.age}` 
              : item.identityMode === 'semi'
                ? `${item.sender.gender}, ${item.sender.ageRange}`
                : item.sender.label}
          </Text>
          <Text style={styles.timer}>{minsLeft}m left</Text>
        </View>

        <View style={styles.topicBadge}>
          <Text style={styles.topicText}>
            {item.topicTag === 'music' ? '🎵 Music' : 
             item.topicTag === 'hangout' ? '☕ Hangout' : 
             item.topicTag === 'networking' ? '💼 Networking' :
             item.topicTag === 'gaming' ? '🎮 Gaming' :
             item.topicTag === 'travel' ? '✈️ Travel' :
             item.topicTag === 'other' ? '🔮 Other' : '💬 General'}
          </Text>
        </View>

        <Text style={styles.message}>"{item.message}"</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleRespond(item.id, 'accept')}>
            <Text style={styles.acceptText}>✅ Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={() => handleRespond(item.id, 'decline')}>
            <Text style={styles.declineText}>❌ Not Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.busyBtn]} onPress={() => handleRespond(item.id, 'decline')}>
            <Text style={styles.busyText}>⏰ Busy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.reportBtn]} onPress={() => confirmReport(item.id)}>
            <Text style={styles.reportText}>🚩</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerTitle}>
        <Text style={styles.title}>Incoming Requests</Text>
      </View>

      {incomingRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No pending requests</Text>
        </View>
      ) : (
        <FlatList
          data={incomingRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchIncoming} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerTitle: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  senderInfo: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  timer: { fontSize: 12, color: '#f56565', fontWeight: 'bold' },
  topicBadge: { alignSelf: 'flex-start', backgroundColor: '#e6e4ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 12 },
  topicText: { fontSize: 12, color: '#6C63FF', fontWeight: '600' },
  message: { fontSize: 16, color: '#444', fontStyle: 'italic', marginBottom: 20 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, marginHorizontal: 4 },
  acceptBtn: { backgroundColor: '#e6fffa' },
  acceptText: { color: '#2b6cb0', fontWeight: 'bold' },
  declineBtn: { backgroundColor: '#fff5f5' },
  declineText: { color: '#c53030', fontWeight: 'bold' },
  reportBtn: { backgroundColor: '#edf2f7' },
  reportText: { color: '#4a5568', fontWeight: 'bold' },
  busyBtn: { backgroundColor: '#fef3c7' },
  busyText: { color: '#92400e', fontWeight: 'bold' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999' },
});
