import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Globe, MapPin } from 'lucide-react-native';
import { usePostStore } from '../../store/postStore';

export default function FeedScreen() {
  const { feed, isLoading, isPosting, fetchFeed, createPost, toggleLike } = usePostStore();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');

  useEffect(() => {
    fetchFeed();
  }, []);

  const handlePost = async () => {
    if (!content.trim()) return;
    const result = await createPost({
      content: content.trim(),
      visibility,
      radiusKm: visibility === 'proximity' ? 0.5 : null,
    });
    if (!result.success) {
      Alert.alert('Post failed', result.error || 'Unable to create post');
      return;
    }
    setContent('');
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.author}>{item.user.name || 'Anonymous'}</Text>
        <View style={styles.visibilityBadge}>
          {item.visibility === 'public' ? <Globe size={12} color="#4b5563" /> : <MapPin size={12} color="#4b5563" />}
          <Text style={styles.visibilityText}>
            {item.visibility === 'public' ? 'Public' : `${item.radiusKm || 0.5}km`}
          </Text>
        </View>
      </View>
      <Text style={styles.content}>{item.content}</Text>
      <TouchableOpacity style={styles.likeBtn} onPress={() => toggleLike(item.id)}>
        <Heart size={16} color={item.likedByMe ? '#ef4444' : '#6b7280'} />
        <Text style={[styles.likeText, item.likedByMe && styles.likeTextActive]}>{item.likesCount}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.composer}>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Share something nearby..."
          multiline
          style={styles.input}
          maxLength={500}
        />
        <View style={styles.rowBetween}>
          <View style={styles.segment}>
            <TouchableOpacity
              style={[styles.segmentBtn, visibility === 'public' && styles.segmentBtnActive]}
              onPress={() => setVisibility('public')}
            >
              <Text style={[styles.segmentText, visibility === 'public' && styles.segmentTextActive]}>Public</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, visibility === 'proximity' && styles.segmentBtnActive]}
              onPress={() => setVisibility('proximity')}
            >
              <Text style={[styles.segmentText, visibility === 'proximity' && styles.segmentTextActive]}>Proximity</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.postBtn} onPress={handlePost} disabled={isPosting}>
            <Text style={styles.postBtnText}>{isPosting ? 'Posting...' : 'Post'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchFeed} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  composer: { backgroundColor: '#fff', padding: 14, borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  input: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  segment: { flexDirection: 'row', gap: 8 },
  segmentBtn: { borderWidth: 1, borderColor: '#ddd', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  segmentBtnActive: { borderColor: '#6C63FF', backgroundColor: '#eef0ff' },
  segmentText: { color: '#4b5563', fontSize: 12, fontWeight: '600' },
  segmentTextActive: { color: '#4f46e5' },
  postBtn: { backgroundColor: '#6C63FF', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  postBtnText: { color: '#fff', fontWeight: '700' },
  list: { padding: 12, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  author: { fontWeight: '700', color: '#111827', marginBottom: 8 },
  content: { color: '#111827', marginBottom: 10, lineHeight: 20 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  likeText: { color: '#6b7280', fontWeight: '600' },
  likeTextActive: { color: '#ef4444' },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  visibilityText: { fontSize: 11, color: '#4b5563', fontWeight: '600' },
});
