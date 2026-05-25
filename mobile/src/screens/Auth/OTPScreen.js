import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function OTPScreen({ route, navigation }) {
  const { email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef([]);
  const { login } = useAuthStore();

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const verifyCode = async (code) => {
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { email, otp: code });
      if (response.data.success) {
        const { accessToken, refreshToken, user, isNewUser } = response.data.data;
        await login({ accessToken, refreshToken }, user);

        if (isNewUser) {
          navigation.navigate('ProfileSetup');
        }
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = () => verifyCode(otp.join(''));

  const handleResend = async () => {
    try {
      await api.post('/auth/send-otp', { email });
      setCountdown(60);
      Alert.alert('Success', 'A new OTP has been sent to your email.');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  const handleChange = (text, index) => {
    const digits = text.replace(/\D/g, '');

    if (digits.length > 1) {
      const pasted = digits.slice(0, 6).split('');
      const newOtp = ['', '', '', '', '', ''];
      pasted.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtp(newOtp);
      const focusIndex = Math.min(pasted.length, 5);
      inputs.current[focusIndex]?.focus();
      if (pasted.length === 6) {
        verifyCode(pasted.join(''));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = digits;
    setOtp(newOtp);

    if (digits && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    if (index === 5 && digits) {
      const full = [...newOtp];
      full[5] = digits;
      if (full.every((d) => d)) {
        verifyCode(full.join(''));
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Verify Email</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to {email}</Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => inputs.current[index] = ref}
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={6}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
            />
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.resendButton} 
          onPress={handleResend}
          disabled={countdown > 0}
        >
          <Text style={[styles.resendText, countdown > 0 && styles.resendTextDisabled]}>
            {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    width: 48,
    height: 56,
    fontSize: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#a5a1ff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    alignItems: 'center',
  },
  resendText: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resendTextDisabled: {
    color: '#999',
  },
});
