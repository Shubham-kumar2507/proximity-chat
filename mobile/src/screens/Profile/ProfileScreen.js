/**
 * Profile Screen route wrapper.
 *
 * Delegates to the new component-based ProfileScreen in components/profile/.
 * Wraps it with GestureHandlerRootView for @gorhom/bottom-sheet compatibility.
 */

import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ProfileScreenComponent from '../../components/profile/ProfileScreen';

/**
 * Screen-level wrapper for the Profile tab.
 * @param {Object} props - React Navigation screen props
 * @returns {React.ReactElement}
 */
export default function ProfileScreen(props) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ProfileScreenComponent {...props} />
    </GestureHandlerRootView>
  );
}
