import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/authStore';
import AuthStack from './AuthStack';
import AppStack from './AppStack';

export default function AppNavigator() {
  const { isAuthenticated, isProfileComplete, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  // User must be authenticated AND have completed their profile to see the main app
  if (isAuthenticated && isProfileComplete) {
    return <AppStack />;
  }

  return <AuthStack />;
}
