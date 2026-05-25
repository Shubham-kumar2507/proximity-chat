/**
 * StatusBar24hr — Ephemeral 24-hour status card.
 *
 * Displays an expressive status text above the profile photo.
 * Shows a countdown to auto-reset. On own profile, tapping opens
 * an inline text editor.
 *
 * @module StatusBar24hr
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  FadeInUp,
} from 'react-native-reanimated';
import PropTypes from 'prop-types';
import { getColors, spacing, typography, radius, profileTokens } from '../../constants/theme';
import STRINGS from '../../constants/strings';

/**
 * Calculate remaining time from createdAt (24h window).
 * @param {string|null} createdAt - ISO timestamp
 * @returns {{ hours: number, minutes: number, expired: boolean }}
 */
function getTimeRemaining(createdAt) {
  if (!createdAt) return { hours: 0, minutes: 0, expired: true };
  const created = new Date(createdAt).getTime();
  const expiresAt = created + 24 * 60 * 60 * 1000;
  const now = Date.now();
  const remaining = expiresAt - now;
  if (remaining <= 0) return { hours: 0, minutes: 0, expired: true };
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  return { hours, minutes, expired: false };
}

/**
 * 24-hour ephemeral status card.
 *
 * @param {Object} props
 * @param {Object|null} props.status - { text: string, createdAt: string }
 * @param {boolean} props.isOwnProfile - Whether this is the user's own profile
 * @param {Function} [props.onStatusUpdate] - Called with new status text
 * @param {number} [props.animDelay] - Animation delay in ms
 * @returns {React.ReactElement}
 */
export default function StatusBar24hr({ status, isOwnProfile, onStatusUpdate, animDelay = 0 }) {
  const colors = getColors();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(status?.createdAt));

  // Update countdown every minute
  useEffect(() => {
    if (!status?.createdAt) return;
    const tick = () => setTimeLeft(getTimeRemaining(status.createdAt));
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [status?.createdAt]);

  const handleTap = () => {
    if (!isOwnProfile) return;
    setEditText(status?.text || '');
    setIsEditing(true);
  };

  const handleSubmit = () => {
    if (editText.trim() && onStatusUpdate) {
      onStatusUpdate(editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditText('');
  };

  const hasStatus = status?.text && !timeLeft.expired;
  const charCount = editText.length;
  const maxChars = profileTokens.statusBarMaxChars;

  return (
    <Animated.View entering={FadeInUp.delay(animDelay).duration(400).springify()}>
      <TouchableOpacity
        activeOpacity={isOwnProfile ? 0.8 : 1}
        onPress={handleTap}
        disabled={!isOwnProfile}
      >
        <LinearGradient
          colors={[
            colors.surfaceElevated,
            colors.surface,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, { borderColor: colors.border }]}
        >
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
                value={editText}
                onChangeText={(t) => setEditText(t.slice(0, maxChars))}
                placeholder={STRINGS.STATUS_PLACEHOLDER}
                placeholderTextColor={colors.textMuted}
                maxLength={maxChars}
                multiline={false}
                autoFocus
              />
              <View style={styles.editRow}>
                <Text style={[styles.charCount, { color: colors.textMuted }]}>
                  {STRINGS.STATUS_CHAR_LIMIT(charCount, maxChars)}
                </Text>
                <View style={styles.editActions}>
                  <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
                    <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                      {STRINGS.CANCEL}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmit}
                    style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                    disabled={charCount === 0}
                  >
                    <Text style={styles.submitText}>{STRINGS.STATUS_SET_BUTTON}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : hasStatus ? (
            <View>
              <Text style={[styles.statusText, { color: colors.text }]}>
                "{status.text}"
              </Text>
              <Text style={[styles.countdown, { color: colors.textMuted }]}>
                {STRINGS.STATUS_RESETS_IN(timeLeft.hours, timeLeft.minutes)}
              </Text>
            </View>
          ) : (
            <Text style={[styles.placeholder, { color: colors.textMuted }]}>
              {isOwnProfile ? STRINGS.STATUS_PLACEHOLDER : ''}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

StatusBar24hr.propTypes = {
  status: PropTypes.shape({
    text: PropTypes.string,
    createdAt: PropTypes.string,
  }),
  isOwnProfile: PropTypes.bool.isRequired,
  onStatusUpdate: PropTypes.func,
  animDelay: PropTypes.number,
};

StatusBar24hr.defaultProps = {
  status: null,
  onStatusUpdate: null,
  animDelay: 0,
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  statusText: {
    ...typography.subtitle,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  countdown: {
    ...typography.captionSmall,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  placeholder: {
    ...typography.body,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },
  editContainer: {
    gap: spacing.sm,
  },
  editInput: {
    ...typography.body,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    minHeight: 44,
  },
  editRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    ...typography.captionSmall,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelText: {
    ...typography.buttonSmall,
  },
  submitBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  submitText: {
    ...typography.buttonSmall,
    color: '#FFFFFF',
  },
});
