import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EmailScreen from '../screens/Auth/EmailScreen';
import OTPScreen from '../screens/Auth/OTPScreen';
import ProfileSetupScreen from '../screens/Auth/ProfileSetupScreen';
import SocialLoginScreen from '../screens/Auth/SocialLoginScreen';

const Stack = createNativeStackNavigator();

export default function AuthStack({ initialRouteName = 'Email' }) {
  return (
    <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Email" component={EmailScreen} />
      <Stack.Screen name="SocialLogin" component={SocialLoginScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
}
