import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { User, Radar } from 'lucide-react-native';
import { useLocationStore } from '../../store/locationStore';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import NearbyProfileOverviewSheet from '../../components/nearby/NearbyProfileOverviewSheet';
import SendRequestModal from './SendRequestModal';

const DiscoveryCard = ({ item, isConnected, onUserPress, onAvatarPress }) => {
  const connected = isConnected(item.userId);
  const displayName = connected ? item.name : `${item.gender.charAt(0).toUpperCase() + item.gender.slice(1)}, ${item.age}`;
  
  const scale = useSharedValue(1);
  
  const handleAvatarTap = () => {
    scale.value = withSequence(
      withTiming(1.08, { duration: 150 }),
      withTiming(1, { duration: 250 })
    );
    setTimeout(() => onAvatarPress(item), 400);
  };

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <TouchableOpacity style={styles.card} onPress={() => onUserPress(item)}>
      <View style={styles.cardHeader}>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>{item.distance}</Text>
        </View>
        <Text style={[styles.vibeStatus, connected && { color: '#6C63FF', fontWeight: 'bold' }]}>
          {connected ? '⭐ Connected' : item.vibeStatus}
        </Text>
      </View>
      
      <View style={styles.cardBody}>
        <TouchableOpacity onPress={handleAvatarTap} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Animated.View style={[animStyle, styles.avatarWrapper]}>
            {connected && item.photoUrl ? (
              <Image source={{ uri: item.photoUrl }} style={styles.avatarImage} />
            ) : (
              <User size={32} color={connected ? '#fff' : '#6C63FF'} style={[styles.icon, connected && { backgroundColor: '#6C63FF' }]} />
            )}
          </Animated.View>
        </TouchableOpacity>
        <View>
          <Text style={styles.demographics}>{displayName}</Text>
          {item.bio && <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function DiscoveryScreen() {
  const { nearbyUsers, isLoading, fetchNearby, updateLocation, radiusKm, setRadiusKm } = useLocationStore();
  const { activeChats, fetchChats } = useChatStore();
  const { user: authUser } = useAuthStore();
  const navigation = useNavigation();

  const [selectedSheetUser, setSelectedSheetUser] = useState(null);
  const sheetRef = useRef(null);
  
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestReceiver, setRequestReceiver] = useState(null);
  const [specialRequestPayload, setSpecialRequestPayload] = useState(null);

  const RADIUS_OPTIONS = [
    { km: 0.1, label: '100m' },
    { km: 0.5, label: '500m' },
    { km: 1, label: '1km' },
    { km: 5, label: '5km' },
  ];

  useEffect(() => {
    setupLocation();
    fetchChats();
  }, [radiusKm]);

  const setupLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required to find nearby users.');
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      await updateLocation(location.coords.latitude, location.coords.longitude);
      fetchNearby();
    } catch (error) {
      console.log('Error getting location:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchNearby, 60000);
    return () => clearInterval(interval);
  }, [radiusKm]);

  const handleUserPress = (user) => {
    navigation.navigate('ViewProfile', { userId: user.userId, distance: user.distance });
  };

  const handleAvatarPress = (user) => {
    setSelectedSheetUser(user);
    sheetRef.current?.snapToIndex(0);
  };

  const isConnected = (userId) => {
    return activeChats.some(chat => chat.participants.some(p => p.userId === userId));
  };

  const renderItem = ({ item }) => (
    <DiscoveryCard 
      item={item} 
      isConnected={isConnected} 
      onUserPress={handleUserPress} 
      onAvatarPress={handleAvatarPress} 
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nearby</Text>
        <View style={styles.rangeSelector}>
          {RADIUS_OPTIONS.map(({ km, label }) => (
            <TouchableOpacity
              key={km}
              style={[styles.rangeBtn, radiusKm === km && styles.rangeBtnActive]}
              onPress={() => setRadiusKm(km)}
            >
              <Text style={[styles.rangeText, radiusKm === km && styles.rangeTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {nearbyUsers.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Radar size={48} color="#ddd" />
          <Text style={styles.emptyText}>No users found nearby</Text>
          <Text style={styles.emptySubtext}>Try again later or expand your search range</Text>
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

      <NearbyProfileOverviewSheet
        ref={sheetRef}
        user={selectedSheetUser}
        viewerInterests={authUser?.interestTags || []}
        onSendChatRequest={(u) => {
          setRequestReceiver(u);
          setSpecialRequestPayload(null);
          setRequestModalVisible(true);
        }}
        onViewProfile={(u) => {
          navigation.navigate('ViewProfile', { userId: u.userId || u.id, distance: u.distance });
        }}
        onSendConnection={(u, guessedStatement) => {
          setRequestReceiver(u);
          setSpecialRequestPayload({ 
            topicTag: 'truths_game', 
            defaultMessage: `I found your lie! "${guessedStatement}" 😏` 
          });
          setRequestModalVisible(true);
        }}
      />

      {requestReceiver && (
        <SendRequestModal
          visible={requestModalVisible}
          onClose={() => {
            setRequestModalVisible(false);
            setRequestReceiver(null);
          }}
          receiver={requestReceiver}
          initialTopic={specialRequestPayload?.topicTag}
          initialMessage={specialRequestPayload?.defaultMessage}
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
    marginBottom: 12,
  },
  rangeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  rangeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  rangeBtnActive: {
    backgroundColor: '#6C63FF',
  },
  rangeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  rangeTextActive: {
    color: '#fff',
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
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
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
