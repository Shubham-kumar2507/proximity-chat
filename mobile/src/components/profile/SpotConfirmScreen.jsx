/**
 * SpotConfirmScreen — Confirmation before saving a tagged local spot.
 *
 * Shows: place name, category icon, neighborhood.
 * "Tag [Place Name] as your spot?" with Confirm / Cancel buttons.
 * Rendered as a modal overlay.
 *
 * @module SpotConfirmScreen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { MapPin } from 'lucide-react-native';
import PropTypes from 'prop-types';
import { getColors, spacing, typography, radius, widgetShadow } from '../../constants/theme';
import STRINGS from '../../constants/strings';

const CATEGORY_ICONS = { cafe:'☕', restaurant:'🍽️', bar:'🍺', park:'🌳', gym:'💪', bookstore:'📚', museum:'🏛️', default:'📍' };
function getCategoryIcon(c) { if(!c) return '📍'; return CATEGORY_ICONS[c.toLowerCase().replace(/\s+/g,'_')]||'📍'; }

/**
 * @param {Object} props
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Object|null} props.place - { name, category, neighborhood }
 * @param {Function} props.onConfirm - Called when user confirms
 * @param {Function} props.onCancel - Called when user cancels
 * @returns {React.ReactElement}
 */
export default function SpotConfirmScreen({ visible, place, onConfirm, onCancel }) {
  const colors = getColors();
  if (!place) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <Animated.View entering={FadeIn.duration(200)} style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <Animated.View entering={SlideInDown.duration(400).springify()} style={[styles.card, { backgroundColor: colors.surface }, widgetShadow]}>
          {/* Category Icon */}
          <View style={[styles.iconCircle, { backgroundColor: colors.primarySurface }]}>
            <Text style={styles.iconText}>{getCategoryIcon(place.category)}</Text>
          </View>

          {/* Confirm Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            {STRINGS.SPOT_CONFIRM_TITLE}
          </Text>

          {/* Place Name */}
          <Text style={[styles.placeName, { color: colors.text }]} numberOfLines={2}>
            {place.name}
          </Text>

          {/* Neighborhood */}
          {place.neighborhood && (
            <View style={styles.neighborhoodRow}>
              <MapPin size={13} color={colors.textMuted} />
              <Text style={[styles.neighborhood, { color: colors.textMuted }]}>{place.neighborhood}</Text>
            </View>
          )}

          {/* Category */}
          <Text style={[styles.category, { color: colors.textSecondary }]}>
            {place.category || 'Place'}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onCancel} activeOpacity={0.7}>
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{STRINGS.CANCEL}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} activeOpacity={0.9} style={{ flex: 1 }}>
              <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmBtn}>
                <Text style={styles.confirmText}>{STRINGS.SPOT_CONFIRM_BTN}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

SpotConfirmScreen.propTypes = {
  visible: PropTypes.bool.isRequired,
  place: PropTypes.shape({ name: PropTypes.string, category: PropTypes.string, neighborhood: PropTypes.string }),
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

SpotConfirmScreen.defaultProps = { place: null };

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { width: '100%', maxWidth: 340, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center' },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  iconText: { fontSize: 28 },
  title: { ...typography.subtitle, marginBottom: spacing.sm, textAlign: 'center' },
  placeName: { ...typography.heading, textAlign: 'center', marginBottom: spacing.xs },
  neighborhoodRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  neighborhood: { ...typography.caption },
  category: { ...typography.captionSmall, textTransform: 'capitalize', marginBottom: spacing.lg },
  buttonRow: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: radius.sm, paddingVertical: spacing.md, alignItems: 'center' },
  cancelText: { ...typography.buttonSmall },
  confirmBtn: { paddingVertical: spacing.md, borderRadius: radius.sm, alignItems: 'center' },
  confirmText: { ...typography.button, color: '#FFFFFF' },
});
