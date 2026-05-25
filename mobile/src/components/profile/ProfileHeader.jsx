/**
 * ProfileHeader — Photo + name + distance + vibe status pill.
 *
 * Renders the profile photo wrapped by MoodGradientRing,
 * display name + age, neighborhood badge, distance badge, and vibe status.
 * All elements stagger-animate on mount.
 * Phase 2: adds NeighborhoodBadge and VideoGlance support.
 *
 * @module ProfileHeader
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Pencil } from 'lucide-react-native';
import PropTypes from 'prop-types';
import MoodGradientRing from './MoodGradientRing';
import NeighborhoodBadge from './NeighborhoodBadge';
import {
  getColors,
  spacing,
  typography,
  radius,
  profileTokens,
} from '../../constants/theme';
import STRINGS from '../../constants/strings';

const VIBE_COLORS = {
  'Open to chat': '#43E97B',
  'Just browsing': '#FFD93D',
  'Busy': '#FF6B35',
};

/**
 * Profile header component.
 *
 * @param {Object} props
 * @param {Object} props.user - User data object
 * @param {boolean} props.isOwnProfile - Whether viewing own profile
 * @param {number|null} [props.distance] - Distance in meters (other user)
 * @param {Function} [props.onEditPress] - Edit button handler
 * @param {Function} [props.onRingPress] - Mood ring tap handler
 * @returns {React.ReactElement}
 */
export default function ProfileHeader({
  user,
  isOwnProfile,
  distance,
  onEditPress,
  onRingPress,
  onPhotoLongPress,
  onTitlePress,
}) {
  const colors = getColors();
  const stagger = profileTokens.animStagger;
  const vibeStatus = user?.vibeStatus || STRINGS.VIBE_OPEN;
  const vibeColor = VIBE_COLORS[vibeStatus] || colors.textSecondary;

  return (
    <View style={styles.container}>
      {/* Edit pencil — own profile only */}
      {isOwnProfile && (
        <Animated.View
          entering={FadeInUp.delay(0).duration(400).springify()}
          style={styles.editButtonWrapper}
        >
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.surfaceElevated }]}
            onPress={onEditPress}
            activeOpacity={0.7}
          >
            <Pencil size={18} color={colors.primary} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Profile Photo with Mood Ring */}
      <Animated.View
        entering={FadeInUp.delay(stagger * 0).duration(500).springify()}
        style={styles.photoWrapper}
      >
        <TouchableOpacity
          activeOpacity={0.95}
          onLongPress={isOwnProfile ? onPhotoLongPress : undefined}
          delayLongPress={500}
          disabled={!isOwnProfile}
        >
          <MoodGradientRing
            photoUri={user?.profilePhoto || user?.avatar}
            moodKey={user?.mood || 'chill'}
            isOwnProfile={isOwnProfile}
            onRingPress={onRingPress}
            glanceVideoUrl={user?.glanceVideoUrl}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Display Name + Age */}
      <Animated.View
        entering={FadeInUp.delay(stagger * 1).duration(500).springify()}
      >
        <Text style={[styles.name, { color: colors.text }]}>
          {user?.name || 'Unknown'}{user?.age ? `, ${user.age}` : ''}
        </Text>
      </Animated.View>

      {/* Neighborhood Title Badge (Phase 2) */}
      {user?.activeTitle && (
        <Animated.View
          entering={FadeInUp.delay(stagger * 1.5).duration(500).springify()}
        >
          <NeighborhoodBadge
            titleKey={user.activeTitle}
            isOwnProfile={isOwnProfile}
            onPress={onTitlePress}
          />
        </Animated.View>
      )}

      {/* Distance Badge — other profiles only */}
      {!isOwnProfile && distance != null && (
        <Animated.View
          entering={FadeInUp.delay(stagger * 2).duration(500).springify()}
        >
          <View style={[styles.distanceBadge, { backgroundColor: colors.primarySurface }]}>
            <Text style={[styles.distanceText, { color: colors.primary }]}>
              {STRINGS.DISTANCE_AWAY(distance)}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Vibe Status Pill */}
      <Animated.View
        entering={FadeInUp.delay(stagger * (distance != null && !isOwnProfile ? 3 : 2)).duration(500).springify()}
      >
        <View
          style={[
            styles.vibePill,
            {
              backgroundColor: vibeColor + '1A', // 10% opacity
              borderColor: vibeColor,
            },
          ]}
        >
          <View style={[styles.vibeDot, { backgroundColor: vibeColor }]} />
          <Text style={[styles.vibeText, { color: vibeColor }]}>
            {vibeStatus}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

ProfileHeader.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    age: PropTypes.number,
    profilePhoto: PropTypes.string,
    avatar: PropTypes.string,
    mood: PropTypes.string,
    vibeStatus: PropTypes.string,
    activeTitle: PropTypes.string,
    glanceVideoUrl: PropTypes.string,
  }),
  isOwnProfile: PropTypes.bool.isRequired,
  distance: PropTypes.number,
  onEditPress: PropTypes.func,
  onRingPress: PropTypes.func,
  onPhotoLongPress: PropTypes.func,
  onTitlePress: PropTypes.func,
};

ProfileHeader.defaultProps = {
  user: null,
  distance: null,
  onEditPress: null,
  onRingPress: null,
  onPhotoLongPress: null,
  onTitlePress: null,
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    position: 'relative',
  },
  editButtonWrapper: {
    position: 'absolute',
    top: spacing.sm,
    right: 0,
    zIndex: 10,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoWrapper: {
    marginBottom: spacing.md,
  },
  name: {
    ...typography.heading,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  distanceBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
    alignSelf: 'center',
  },
  distanceText: {
    ...typography.captionSmall,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  vibePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    gap: spacing.xs,
  },
  vibeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  vibeText: {
    ...typography.caption,
  },
});
