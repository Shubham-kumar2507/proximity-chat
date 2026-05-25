/**
 * NeighborhoodBadge — Earned title badge with shimmer animation.
 *
 * Displays the user's active neighborhood title as a pill-shaped badge
 * under their name. Features a left-to-right shimmer highlight sweep
 * using Reanimated 3, looping every 2 seconds.
 *
 * On own profile: tapping opens MyTitlesSheet.
 * On others' profile: long-press shows a tooltip explaining the title.
 *
 * @module NeighborhoodBadge
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import PropTypes from 'prop-types';
import {
  getColors,
  spacing,
  typography,
  radius,
  profileTokens,
  NEIGHBORHOOD_TITLES,
} from '../../constants/theme';
import STRINGS from '../../constants/strings';

/**
 * Map of title keys to earning criteria descriptions.
 */
const TITLE_DESCRIPTIONS = {
  downtown_regular: '20+ sessions in a city-center zone',
  coffee_connoisseur: '10+ sessions near café-tagged locations',
  midnight_roamer: '15+ sessions between 11pm – 4am',
  connector: '25+ accepted chat requests sent',
  quick_responder: 'Avg chat response < 2 min (over 10+)',
  local_legend: '50+ positive chat ratings received',
};

/**
 * Neighborhood title badge component.
 *
 * @param {Object} props
 * @param {string|null} props.titleKey - Key of the active title
 * @param {boolean} props.isOwnProfile - Whether viewing own profile
 * @param {Function} [props.onPress] - Called when badge is tapped (own profile)
 * @returns {React.ReactElement|null}
 */
export default function NeighborhoodBadge({ titleKey, isOwnProfile, onPress }) {
  const colors = getColors();
  const shimmerPosition = useSharedValue(-1);

  const titleData = NEIGHBORHOOD_TITLES.find((t) => t.key === titleKey);

  // Start shimmer animation
  useEffect(() => {
    shimmerPosition.value = withRepeat(
      withTiming(1, {
        duration: profileTokens.shimmerDuration,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shimmerPosition.value * 160 },
    ],
    opacity: 0.25,
  }));

  if (!titleData) return null;

  const handleLongPress = () => {
    if (!isOwnProfile) {
      const description = TITLE_DESCRIPTIONS[titleKey] || '';
      Alert.alert(
        `${titleData.emoji} ${titleData.label}`,
        `${STRINGS.TITLES_TOOLTIP_PREFIX} ${description}`
      );
    }
  };

  const handlePress = () => {
    if (isOwnProfile && onPress) {
      onPress();
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(500)}>
      <TouchableOpacity
        activeOpacity={isOwnProfile ? 0.8 : 0.95}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={400}
      >
        <View
          style={[
            styles.badge,
            {
              backgroundColor: titleData.color + '1A',
              borderColor: titleData.color + '40',
            },
          ]}
        >
          {/* Shimmer overlay */}
          <Animated.View style={[styles.shimmer, shimmerStyle]}>
            <LinearGradient
              colors={['transparent', titleData.color + '30', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.shimmerGradient}
            />
          </Animated.View>

          <Text style={styles.emoji}>{titleData.emoji}</Text>
          <Text style={[styles.titleText, { color: titleData.color }]}>
            {titleData.label}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

NeighborhoodBadge.propTypes = {
  titleKey: PropTypes.string,
  isOwnProfile: PropTypes.bool.isRequired,
  onPress: PropTypes.func,
};

NeighborhoodBadge.defaultProps = {
  titleKey: null,
  onPress: null,
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    height: profileTokens.badgeHeight,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    gap: spacing.xs,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    left: -60,
  },
  shimmerGradient: {
    flex: 1,
  },
  emoji: {
    fontSize: 14,
  },
  titleText: {
    ...typography.captionSmall,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
