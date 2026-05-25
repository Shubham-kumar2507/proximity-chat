/**
 * OverviewInterestPills — Compact interest pills for the sheet.
 * Highlights pills that match the viewer's own interests.
 *
 * @module components/nearby/OverviewInterestPills
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import PropTypes from 'prop-types';
import { getColors, typography, spacing, radius } from '../../constants/theme';

export default function OverviewInterestPills({ interests, viewerInterests = [], animDelay = 0 }) {
  const colors = getColors();
  
  if (!interests || interests.length === 0) return null;

  const MAX_PILLS = 8;
  const displayedPills = interests.slice(0, MAX_PILLS);
  const overflowCount = interests.length - MAX_PILLS;

  return (
    <Animated.View 
      entering={FadeInDown.delay(animDelay).springify()} 
      style={styles.container}
    >
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Interests</Text>
      <View style={styles.pillsWrapper}>
        {displayedPills.map((interest, idx) => {
          const isMatch = viewerInterests.includes(interest);
          return (
            <View 
              key={`${interest}-${idx}`} 
              style={[
                styles.pill, 
                { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                isMatch && { borderColor: colors.primary, backgroundColor: colors.primarySurface }
              ]}
            >
              {isMatch && <Text style={[styles.matchIcon, { color: colors.primary }]}>✓</Text>}
              <Text style={[styles.pillText, { color: isMatch ? colors.primary : colors.textMuted }]}>
                {interest}
              </Text>
            </View>
          );
        })}
        {overflowCount > 0 && (
          <View style={[styles.pill, { backgroundColor: 'transparent', borderColor: colors.border, borderStyle: 'dashed' }]}>
            <Text style={[styles.pillText, { color: colors.textMuted }]}>+{overflowCount} more</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

OverviewInterestPills.propTypes = {
  interests: PropTypes.arrayOf(PropTypes.string).isRequired,
  viewerInterests: PropTypes.arrayOf(PropTypes.string),
  animDelay: PropTypes.number,
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  matchIcon: {
    fontSize: 12,
    fontWeight: '800',
    marginRight: 4,
  },
  pillText: {
    ...typography.bodyBold,
    fontSize: 13,
  },
});
