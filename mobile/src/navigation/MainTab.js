import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Radar, Bell, User, MessageCircle, Newspaper } from 'lucide-react-native';
import DiscoveryScreen from '../screens/Discovery/DiscoveryScreen';
import FeedScreen from '../screens/Feed/FeedScreen';
import RequestsScreen from '../screens/Requests/RequestsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ChatListScreen from '../screens/Chat/ChatListScreen';
import { useRequestStore } from '../store/requestStore';
import { useChatStore } from '../store/chatStore';

const Tab = createBottomTabNavigator();

export default function MainTab() {
  const { incomingRequests } = useRequestStore();
  const { unreadCount } = useChatStore();

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
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Newspaper color={color} size={size} />,
          title: 'Feed',
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
        name="ChatsList"
        component={ChatListScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : null,
          title: 'Chats',
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
