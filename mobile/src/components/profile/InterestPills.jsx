/**
 * InterestPills — Horizontally wrapping row of neon-outlined pill tags.
 *
 * Each pill cycles through the neon palette. On own profile, a "+ Add"
 * pill opens the tag picker. On others' profile, matching interests glow.
 *
 * @module InterestPills
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import PropTypes from 'prop-types';
import {
  getColors,
  spacing,
  typography,
  radius,
  NEON_PALETTE,
  profileTokens,
} from '../../constants/theme';
import STRINGS from '../../constants/strings';

/**
 * Interest pills row.
 *
 * @param {Object} props
 * @param {string[]} props.interests - Array of interest labels
 * @param {boolean} props.isOwnProfile - Whether this is the user's own profile
 * @param {string[]} [props.viewerInterests] - Viewer's own interests (for match highlighting)
 * @param {Function} [props.onAddPress] - Called when the "+ Add" pill is tapped
 * @returns {React.ReactElement}
 */
export default function InterestPills({
  interests,
  isOwnProfile,
  viewerInterests,
  onAddPress,
}) {
  const colors = getColors();
  const matchSet = new Set(
    (viewerInterests || []).map((i) => i.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {interests.map((interest, index) => {
        const neonColor = NEON_PALETTE[index % NEON_PALETTE.length];
        const isMatch =
          !isOwnProfile && matchSet.has(interest.toLowerCase());

        return (
          <Animated.View
            key={interest}
            entering={ZoomIn.delay(index * profileTokens.pillStagger)
              .duration(300)
              .springify()}
          >
            <View
              style={[
                styles.pill,
                {
                  borderColor: neonColor,
                  backgroundColor: neonColor + '1A',
                },
                isMatch && styles.pillMatch,
                isMatch && {
                  shadowColor: '#FFFFFF',
                },
              ]}
            >
              <Text style={[styles.pillText, { color: neonColor }]}>
                {interest}
              </Text>
            </View>
            {isMatch && (
              <Text style={[styles.matchLabel, { color: colors.textSecondary }]}>
                {STRINGS.INTERESTS_MATCH}
              </Text>
            )}
          </Animated.View>
        );
      })}

      {/* Add button — own profile only */}
      {isOwnProfile && (
        <Animated.View
          entering={ZoomIn.delay(interests.length * profileTokens.pillStagger)
            .duration(300)
            .springify()}
        >
          <TouchableOpacity
            style={[
              styles.pill,
              styles.addPill,
              { borderColor: colors.primary, backgroundColor: colors.primarySurface },
            ]}
            onPress={onAddPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, { color: colors.primary }]}>
              {STRINGS.INTERESTS_ADD}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

InterestPills.propTypes = {
  interests: PropTypes.arrayOf(PropTypes.string),
  isOwnProfile: PropTypes.bool.isRequired,
  viewerInterests: PropTypes.arrayOf(PropTypes.string),
  onAddPress: PropTypes.func,
};

InterestPills.defaultProps = {
  interests: [],
  viewerInterests: [],
  onAddPress: null,
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  pill: {
    height: profileTokens.pillHeight,
    paddingHorizontal: profileTokens.pillPaddingH,
    borderRadius: radius.pill,
    borderWidth: profileTokens.pillBorderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    ...typography.caption,
  },
  pillMatch: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  matchLabel: {
    ...typography.captionSmall,
    textAlign: 'center',
    marginTop: 2,
    fontSize: 9,
  },
  addPill: {
    borderStyle: 'dashed',
  },
});
