import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Radar, Bell, User } from 'lucide-react-native';
import DiscoveryScreen from '../screens/Discovery/DiscoveryScreen';
import RequestsScreen from '../screens/Requests/RequestsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import { useRequestStore } from '../store/requestStore';

const Tab = createBottomTabNavigator();

export default function MainTab() {
  const { incomingRequests } = useRequestStore();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Discovery"
        component={DiscoveryScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Radar color={color} size={size} />,
          title: 'Nearby',
        }}
      />
      <Tab.Screen
        name="Requests"
        component={RequestsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
          tabBarBadge: incomingRequests.length > 0 ? incomingRequests.length : null,
          title: 'Requests',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}
