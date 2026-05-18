import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert } from 'react-native';
import api from '../../services/api';

const TOPICS = [
  { id: 'music', label: '🎵 Music' },
  { id: 'hangout', label: '☕ Hangout' },
  { id: 'networking', label: '💼 Networking' },
  { id: 'general', label: '💬 General' },
];

const MODES = [
  { id: 'full', label: 'Full Identity', desc: 'Shows your name, photo, and age' },
  { id: 'semi', label: 'Semi-Anonymous', desc: 'Shows only gender and age range' },
  { id: 'anonymous', label: 'Anonymous', desc: 'Shows only your gender' },
];

export default function SendRequestModal({ visible, onClose, receiver }) {
  const [identityMode, setIdentityMode] = useState('semi');
  const [message, setMessage] = useState('');
  const [topicTag, setTopicTag] = useState('general');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please write a short message');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/requests/send', {
        receiverId: receiver.userId,
        identityMode,
        message: message.trim(),
        topicTag,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Chat request sent!');
        onClose();
        setMessage('');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Send Chat Request</Text>

          <Text style={styles.label}>Identity Mode</Text>
          <View style={styles.modeContainer}>
            {MODES.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={[styles.modeButton, identityMode === mode.id && styles.modeButtonActive]}
                onPress={() => setIdentityMode(mode.id)}
              >
                <Text style={[styles.modeLabel, identityMode === mode.id && styles.modeLabelActive]}>
                  {mode.label}
                </Text>
                <Text style={[styles.modeDesc, identityMode === mode.id && styles.modeDescActive]}>
                  {mode.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Topic</Text>
          <View style={styles.topicContainer}>
            {TOPICS.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={[styles.topicButton, topicTag === topic.id && styles.topicButtonActive]}
                onPress={() => setTopicTag(topic.id)}
              >
                <Text style={[styles.topicText, topicTag === topic.id && styles.topicTextActive]}>
                  {topic.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.messageHeader}>
            <Text style={styles.label}>Message</Text>
            <Text style={styles.charCount}>{message.length}/100</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Say hi..."
            value={message}
            onChangeText={setMessage}
            maxLength={100}
            multiline
            numberOfLines={2}
          />

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sendButton, loading && styles.sendButtonDisabled]} 
              onPress={handleSend}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Send</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  modeContainer: {
    marginBottom: 24,
  },
  modeButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  modeButtonActive: {
    borderColor: '#6C63FF',
    backgroundColor: '#f0efff',
  },
  modeLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  modeLabelActive: {
    color: '#6C63FF',
  },
  modeDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  modeDescActive: {
    color: '#4b45b2',
  },
  topicContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  topicButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  topicButtonActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  topicText: {
    color: '#666',
  },
  topicTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sendButton: {
    flex: 2,
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#a5a1ff',
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
