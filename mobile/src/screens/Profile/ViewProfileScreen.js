/**
 * ViewProfileScreen — Screen for viewing another user's profile.
 *
 * Same component as the Profile tab, but receives userId and distance
 * from navigation params.
 */

import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ProfileScreenComponent from '../../components/profile/ProfileScreen';

/**
 * Screen-level wrapper for viewing another user's profile.
 * Expects route.params.userId and optionally route.params.distance.
 *
 * @param {Object} props - React Navigation screen props
 * @returns {React.ReactElement}
 */
export default function ViewProfileScreen(props) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ProfileScreenComponent {...props} />
    </GestureHandlerRootView>
  );
}
