import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Alert, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

const VIBE_OPTIONS = ['Open to chat', 'Just browsing', 'Busy'];

export default function ProfileScreen() {
  const { user, updateProfile, logout } = useAuthStore();
  const [bio, setBio] = useState(user?.bio || '');
  const [vibe, setVibe] = useState(user?.vibeStatus || 'Open to chat');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put('/users/me', { bio, vibeStatus: vibe });
      if (response.data.success) {
        updateProfile({ ...user, bio: response.data.data.bio, vibeStatus: response.data.data.vibeStatus });
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.name}>{user?.name}, {user?.age}</Text>
          <Text style={styles.gender}>{user?.gender}</Text>
        </View>

        <Text style={styles.sectionTitle}>Vibe Status</Text>
        <View style={styles.vibeContainer}>
          {VIBE_OPTIONS.map(v => (
            <TouchableOpacity 
              key={v}
              style={[styles.vibeButton, vibe === v && styles.vibeButtonActive]}
              onPress={() => setVibe(v)}
            >
              <Text style={[styles.vibeText, vibe === v && styles.vibeTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Bio</Text>
        <TextInput
          style={styles.bioInput}
          value={bio}
          onChangeText={setBio}
          multiline
          placeholder="Write a little about yourself"
        />

        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  infoCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  gender: { fontSize: 16, color: '#666', textTransform: 'capitalize' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  vibeContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 },
  vibeButton: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#ddd' },
  vibeButtonActive: { backgroundColor: '#e6e4ff', borderColor: '#6C63FF' },
  vibeText: { color: '#666' },
  vibeTextActive: { color: '#6C63FF', fontWeight: 'bold' },
  bioInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 16, height: 100, textAlignVertical: 'top', marginBottom: 24, fontSize: 16 },
  saveButton: { backgroundColor: '#6C63FF', padding: 16, borderRadius: 8, alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#ddd', marginVertical: 32 },
  logoutButton: { backgroundColor: '#fff5f5', padding: 16, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#feb2b2' },
  logoutButtonText: { color: '#c53030', fontSize: 16, fontWeight: 'bold' },
});
