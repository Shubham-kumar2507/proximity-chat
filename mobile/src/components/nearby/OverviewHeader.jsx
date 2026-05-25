/**
 * OverviewHeader — Header row for the Nearby Profile Overview Sheet.
 * Displays photo, name, age, distance, and vibe status.
 *
 * @module components/nearby/OverviewHeader
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { X, MapPin, User } from 'lucide-react-native';
import PropTypes from 'prop-types';
import { getColors, typography, spacing, radius } from '../../constants/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

/**
 * @param {Object} props
 * @param {Object} props.user - The user object
 * @param {Function} props.onClose - Close button handler
 * @param {number} props.animDelay - Entrance animation delay
 */
export default function OverviewHeader({ user, onClose, animDelay = 0 }) {
  const colors = getColors();

  const displayName = user.name || `${user.gender?.charAt(0).toUpperCase() + user.gender?.slice(1)}, ${user.age}`;

  return (
    <Animated.View 
      entering={FadeInDown.delay(animDelay).springify()} 
      style={styles.container}
    >
      {user.photoUrl ? (
        <Image 
          source={{ uri: user.photoUrl }} 
          style={styles.avatar} 
        />
      ) : (
        <View style={styles.avatarFallback}>
          <User size={32} color={colors.primary} />
        </View>
      )}
      
      <View style={styles.infoContainer}>
        <Text style={[styles.nameText, { color: colors.text }]} numberOfLines={1}>
          {displayName}
        </Text>
        
        <View style={styles.badgesRow}>
          <View style={[styles.badge, { backgroundColor: colors.primarySurface }]}>
            <MapPin size={12} color={colors.primary} />
            <Text style={[styles.badgeText, { color: colors.primary }]}>{user.distance}</Text>
          </View>
          
          {user.vibeStatus && (
            <View style={[styles.badge, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.badgeText, { color: colors.textMuted }]}>{user.vibeStatus}</Text>
            </View>
          )}
        </View>

        {user.activeTitle && (
          <Text style={[styles.titleText, { color: colors.accent }]} numberOfLines={1}>
            {user.activeTitle}
          </Text>
        )}
      </View>

      <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.surfaceElevated }]} onPress={onClose}>
        <X size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

OverviewHeader.propTypes = {
  user: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  animDelay: PropTypes.number,
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: spacing.md,
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: spacing.md,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameText: {
    ...typography.heading,
    marginBottom: spacing.xs,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 4,
  },
  badgeText: {
    ...typography.captionSmall,
  },
  titleText: {
    ...typography.caption,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: spacing.sm,
  },
});
