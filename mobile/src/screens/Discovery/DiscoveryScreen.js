import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, SafeAreaView, Alert } from 'react-native';
import * as Location from 'expo-location';
import { User, ShieldAlert } from 'lucide-react-native';
import { useLocationStore } from '../../store/locationStore';
import SendRequestModal from './SendRequestModal';

export default function DiscoveryScreen() {
  const { nearbyUsers, isLoading, fetchNearby, updateLocation } = useLocationStore();
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    setupLocation();
  }, []);

  const setupLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required to find nearby users.');
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      await updateLocation(location.coords.latitude, location.coords.coords.longitude);
      fetchNearby();
    } catch (error) {
      console.log('Error getting location:', error);
    }
  };

  useEffect(() => {
    // Poll for nearby users every 60 seconds
    const interval = setInterval(() => {
      fetchNearby();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleUserPress = (user) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleUserPress(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>{item.distance}</Text>
        </View>
        <Text style={styles.vibeStatus}>{item.vibeStatus}</Text>
      </View>
      
      <View style={styles.cardBody}>
        <User size={32} color="#6C63FF" style={styles.icon} />
        <View>
          <Text style={styles.demographics}>{item.gender.charAt(0).toUpperCase() + item.gender.slice(1)}, {item.age}</Text>
          {item.bio && <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby</Text>
      </View>
      
      {nearbyUsers.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Radar size={48} color="#ddd" />
          <Text style={styles.emptyText}>No users found nearby</Text>
          <Text style={styles.emptySubtext}>Try again later or move to a different area</Text>
        </View>
      ) : (
        <FlatList
          data={nearbyUsers}
          keyExtractor={(item) => item.userId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchNearby} />
          }
        />
      )}

      {selectedUser && (
        <SendRequestModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          receiver={selectedUser}
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
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  distanceBadge: {
    backgroundColor: '#e6e4ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  distanceText: {
    color: '#6C63FF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  vibeStatus: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 16,
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 24,
  },
  demographics: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bio: {
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
