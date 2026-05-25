/**
 * FavoriteSpotWidget — Local spot card (Widget Slot 4).
 *
 * Displays the user's tagged favorite local spot with:
 *   - Place name & category icon
 *   - Neighborhood name
 *   - Static map thumbnail (non-interactive, H3 cell center)
 *   - Mutual spot banner via WebSocket
 *
 * Privacy: No GPS coordinates shown. Map is zoomed to H3 cell level.
 *
 * @module FavoriteSpotWidget
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { MapPin, Pencil } from 'lucide-react-native';
import PropTypes from 'prop-types';
import {
  getColors,
  spacing,
  typography,
  radius,
  profileTokens,
  widgetShadow,
} from '../../constants/theme';
import STRINGS from '../../constants/strings';
import socketService from '../../services/socket';

/** Category icon map */
const CATEGORY_ICONS = {
  cafe: '☕',
  restaurant: '🍽️',
  bar: '🍺',
  park: '🌳',
  gym: '💪',
  bookstore: '📚',
  museum: '🏛️',
  theater: '🎭',
  music_venue: '🎵',
  gallery: '🎨',
  market: '🛒',
  beach: '🏖️',
  temple: '🛕',
  library: '📖',
  default: '📍',
};

/**
 * Get the emoji icon for a place category.
 * @param {string} category
 * @returns {string}
 */
function getCategoryIcon(category) {
  if (!category) return CATEGORY_ICONS.default;
  const key = category.toLowerCase().replace(/\s+/g, '_');
  return CATEGORY_ICONS[key] || CATEGORY_ICONS.default;
}

/**
 * FavoriteSpotWidget component.
 *
 * @param {Object} props
 * @param {Object|null} props.spot - { name, category, neighborhood, mapThumbnailUrl }
 * @param {boolean} props.isOwnProfile - Whether this is the user's own profile
 * @param {string|null} [props.viewedUserId] - ID of the viewed user (for mutual check)
 * @param {Function} [props.onTagSpot] - Called when user taps to tag a spot
 * @param {Function} [props.onChangeSpot] - Called when user wants to change spot
 * @param {number} [props.animDelay] - Animation delay in ms
 * @returns {React.ReactElement}
 */
export default function FavoriteSpotWidget({
  spot,
  isOwnProfile,
  viewedUserId,
  onTagSpot,
  onChangeSpot,
  animDelay = 0,
}) {
  const colors = getColors();
  const [isMutualSpot, setIsMutualSpot] = useState(false);

  // Listen for mutual spot reveal via WebSocket
  useEffect(() => {
    if (isOwnProfile || !viewedUserId || !spot) return;

    const handleMutualSpot = (data) => {
      if (data.userId === viewedUserId) {
        setIsMutualSpot(true);
      }
    };

    socketService.on('spot:mutual', handleMutualSpot);

    // Emit a check request when viewing another profile
    socketService.emit('spot:check-mutual', { viewedUserId });

    return () => {
      socketService.off('spot:mutual', handleMutualSpot);
      setIsMutualSpot(false);
    };
  }, [viewedUserId, isOwnProfile, spot]);

  const isEmpty = !spot?.name;

  const handlePress = () => {
    if (isOwnProfile) {
      if (isEmpty) {
        onTagSpot?.();
      } else {
        onChangeSpot?.();
      }
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(animDelay).duration(300).springify()}
    >
      {isEmpty ? (
        /* ── Empty State ──────────────────────── */
        <TouchableOpacity
          activeOpacity={isOwnProfile ? 0.85 : 1}
          onPress={handlePress}
        >
          <View
            style={[
              styles.emptyCard,
              { borderColor: colors.textMuted },
              widgetShadow,
            ]}
          >
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {STRINGS.SPOT_EMPTY_PROMPT}
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        /* ── Filled State ─────────────────────── */
        <TouchableOpacity
          activeOpacity={isOwnProfile ? 0.85 : 1}
          onPress={handlePress}
          onLongPress={isOwnProfile ? handlePress : undefined}
          delayLongPress={500}
        >
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surfaceElevated },
              widgetShadow,
            ]}
          >
            {/* Edit icon — own profile only */}
            {isOwnProfile && (
              <View style={styles.editIcon}>
                <Pencil size={14} color={colors.textMuted} />
              </View>
            )}

            {/* Map Thumbnail */}
            {spot.mapThumbnailUrl && (
              <View style={styles.mapContainer}>
                <Image
                  source={{ uri: spot.mapThumbnailUrl }}
                  style={styles.mapImage}
                  resizeMode="cover"
                />
                {/* Subtle overlay for text readability */}
                <View style={[styles.mapOverlay, { backgroundColor: colors.overlay }]} />
              </View>
            )}

            {/* Spot Info */}
            <View style={styles.infoSection}>
              <View style={styles.categoryRow}>
                <Text style={styles.categoryIcon}>
                  {getCategoryIcon(spot.category)}
                </Text>
                <Text
                  style={[styles.spotLabel, { color: colors.textSecondary }]}
                >
                  {STRINGS.SPOT_LABEL}
                </Text>
              </View>

              <Text
                style={[styles.spotName, { color: colors.text }]}
                numberOfLines={1}
              >
                {spot.name}
              </Text>

              {spot.neighborhood && (
                <View style={styles.neighborhoodRow}>
                  <MapPin size={12} color={colors.textMuted} />
                  <Text
                    style={[styles.neighborhood, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    {spot.neighborhood}
                  </Text>
                </View>
              )}
            </View>

            {/* Mutual Spot Banner */}
            {isMutualSpot && (
              <Animated.View
                entering={FadeInUp.duration(400).springify()}
                style={[
                  styles.mutualBanner,
                  {
                    backgroundColor: colors.primarySurface,
                    borderColor: colors.primary + '40',
                  },
                ]}
              >
                <Text style={[styles.mutualText, { color: colors.primary }]}>
                  {STRINGS.SPOT_MUTUAL}
                </Text>
              </Animated.View>
            )}
          </View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

FavoriteSpotWidget.propTypes = {
  spot: PropTypes.shape({
    name: PropTypes.string,
    category: PropTypes.string,
    neighborhood: PropTypes.string,
    mapThumbnailUrl: PropTypes.string,
  }),
  isOwnProfile: PropTypes.bool.isRequired,
  viewedUserId: PropTypes.string,
  onTagSpot: PropTypes.func,
  onChangeSpot: PropTypes.func,
  animDelay: PropTypes.number,
};

FavoriteSpotWidget.defaultProps = {
  spot: null,
  viewedUserId: null,
  onTagSpot: null,
  onChangeSpot: null,
  animDelay: 0,
};

const styles = StyleSheet.create({
  card: {
    borderRadius: profileTokens.widgetRadius,
    overflow: 'hidden',
  },
  emptyCard: {
    borderRadius: profileTokens.widgetRadius,
    padding: spacing.lg,
    minHeight: 100,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.subtitle,
    textAlign: 'center',
  },
  editIcon: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 10,
    opacity: 0.6,
  },
  mapContainer: {
    height: 100,
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  infoSection: {
    padding: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  categoryIcon: {
    fontSize: 16,
  },
  spotLabel: {
    ...typography.captionSmall,
    textTransform: 'uppercase',
  },
  spotName: {
    ...typography.subtitle,
    marginBottom: spacing.xs,
  },
  neighborhoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  neighborhood: {
    ...typography.caption,
  },
  mutualBanner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  mutualText: {
    ...typography.caption,
    fontWeight: '600',
  },
});
