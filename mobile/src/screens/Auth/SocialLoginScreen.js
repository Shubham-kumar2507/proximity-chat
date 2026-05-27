import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function SocialLoginScreen({ route, navigation }) {
  const { provider } = route.params;
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const title = useMemo(() => {
    if (provider === 'google') return 'Continue with Google';
    return 'Continue with Apple';
  }, [provider]);

  const handleContinue = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/social-login', {
        provider,
        email: email.trim().toLowerCase(),
        name: name.trim(),
      });
      const { accessToken, refreshToken, user, isNewUser } = response.data.data;
      await login({ accessToken, refreshToken }, user);
      if (isNewUser) {
        navigation.navigate('ProfileSetup');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Social login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Enter your social account email to continue.</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Display name (optional)"
          value={name}
          onChangeText={setName}
        />

        <TouchableOpacity style={styles.button} onPress={handleContinue} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#222', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#444', marginBottom: 24, textAlign: 'center', fontStyle: 'italic' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    marginTop: 4,
    backgroundColor: '#10B981', // Changed to vibrant Emerald Green
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16, textTransform: 'uppercase' },
});
