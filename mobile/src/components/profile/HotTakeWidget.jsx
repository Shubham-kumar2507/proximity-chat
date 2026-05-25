/**
 * HotTakeWidget — Bold opinion card with gradient background and reactions.
 *
 * Displays the user's hot take with a vivid gradient.
 * Supports agree/disagree reactions on others' profiles.
 * Editable on own profile.
 *
 * @module HotTakeWidget
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Pencil } from 'lucide-react-native';
import PropTypes from 'prop-types';
import {
  getColors,
  spacing,
  typography,
  radius,
  HOT_TAKE_GRADIENTS,
  profileTokens,
  widgetShadow,
} from '../../constants/theme';
import STRINGS from '../../constants/strings';

// Try to import expo-haptics, gracefully degrade if not available
let Haptics = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  // expo-haptics not available
}

/**
 * Hot Take Widget card.
 *
 * @param {Object} props
 * @param {Object|null} props.hotTake - { text, gradient, agreeCount, disagreeCount }
 * @param {boolean} props.isOwnProfile - Whether this is the user's own profile
 * @param {Function} [props.onSave] - Called with { text, gradient } when edited
 * @param {Function} [props.onReact] - Called with 'agree' or 'disagree'
 * @param {number} [props.animDelay] - Animation delay in ms
 * @returns {React.ReactElement}
 */
export default function HotTakeWidget({
  hotTake,
  isOwnProfile,
  onSave,
  onReact,
  animDelay = 0,
}) {
  const colors = getColors();
  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ['55%'], []);
  const [editText, setEditText] = useState(hotTake?.text || '');
  const [editGradient, setEditGradient] = useState(hotTake?.gradient || 'A');

  const currentGradient = HOT_TAKE_GRADIENTS.find(
    (g) => g.key === (hotTake?.gradient || 'A')
  ) || HOT_TAKE_GRADIENTS[0];

  const editGradientObj = HOT_TAKE_GRADIENTS.find(
    (g) => g.key === editGradient
  ) || HOT_TAKE_GRADIENTS[0];

  const isEmpty = !hotTake?.text;

  const handlePress = () => {
    if (isOwnProfile) {
      setEditText(hotTake?.text || '');
      setEditGradient(hotTake?.gradient || 'A');
      sheetRef.current?.expand();
    }
  };

  const handleSave = () => {
    if (onSave && editText.trim()) {
      onSave({ text: editText.trim(), gradient: editGradient });
    }
    sheetRef.current?.close();
  };

  const handleReaction = async (type) => {
    if (isOwnProfile) return;
    if (Haptics) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Haptics not available on this platform
      }
    }
    onReact?.(type);
  };

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const maxChars = profileTokens.hotTakeMaxChars;

  return (
    <>
      <Animated.View
        entering={FadeInUp.delay(animDelay).duration(300).springify()}
      >
        <TouchableOpacity
          activeOpacity={isOwnProfile ? 0.85 : 1}
          onPress={handlePress}
        >
          {isEmpty ? (
            /* ── Empty State ──────────────────────── */
            <View
              style={[
                styles.emptyCard,
                { borderColor: colors.textMuted },
                widgetShadow,
              ]}
            >
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {STRINGS.HOT_TAKE_EMPTY_PROMPT}
              </Text>
            </View>
          ) : (
            /* ── Filled State ─────────────────────── */
            <LinearGradient
              colors={currentGradient.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.card, widgetShadow]}
            >
              {/* Edit icon — own profile only */}
              {isOwnProfile && (
                <View style={styles.editIcon}>
                  <Pencil size={14} color="rgba(255,255,255,0.6)" />
                </View>
              )}

              <Text style={styles.label}>{STRINGS.HOT_TAKE_LABEL}</Text>
              <Text style={styles.mainText}>{hotTake.text}</Text>

              {/* Reaction Row */}
              <View style={styles.reactionRow}>
                <TouchableOpacity
                  style={styles.reactionBtn}
                  onPress={() => handleReaction('agree')}
                  disabled={isOwnProfile}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reactionEmoji}>{STRINGS.HOT_TAKE_AGREE}</Text>
                  <Text style={styles.reactionCount}>
                    {hotTake?.agreeCount || 0}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reactionBtn}
                  onPress={() => handleReaction('disagree')}
                  disabled={isOwnProfile}
                  activeOpacity={0.7}
                >
                  <Text style={styles.reactionEmoji}>{STRINGS.HOT_TAKE_DISAGREE}</Text>
                  <Text style={styles.reactionCount}>
                    {hotTake?.disagreeCount || 0}
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* ── Edit Sheet ─────────────────────────── */}
      {isOwnProfile && (
        <BottomSheet
          ref={sheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backgroundStyle={{ backgroundColor: colors.surface }}
          handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
          backdropComponent={renderBackdrop}
        >
          <View style={styles.sheetContent}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {STRINGS.HOT_TAKE_EDIT_TITLE}
            </Text>

            {/* Preview */}
            <LinearGradient
              colors={editGradientObj.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewCard}
            >
              <Text style={styles.label}>{STRINGS.HOT_TAKE_LABEL}</Text>
              <Text style={[styles.mainText, { minHeight: 40 }]}>
                {editText || '…'}
              </Text>
            </LinearGradient>

            {/* Text Input */}
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.inputBackground,
                },
              ]}
              value={editText}
              onChangeText={(t) => setEditText(t.slice(0, maxChars))}
              placeholder="Type your hot take…"
              placeholderTextColor={colors.textMuted}
              maxLength={maxChars}
              multiline
            />
            <Text style={[styles.charLimit, { color: colors.textMuted }]}>
              {STRINGS.HOT_TAKE_CHAR_LIMIT(editText.length, maxChars)}
            </Text>

            {/* Gradient Picker */}
            <View style={styles.gradientPicker}>
              {HOT_TAKE_GRADIENTS.map((g) => (
                <TouchableOpacity
                  key={g.key}
                  onPress={() => setEditGradient(g.key)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={g.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.gradientOption,
                      editGradient === g.key && {
                        borderWidth: 3,
                        borderColor: '#FFFFFF',
                      },
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={!editText.trim()}
            >
              <Text style={styles.saveBtnText}>{STRINGS.HOT_TAKE_SAVE}</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>
      )}
    </>
  );
}

HotTakeWidget.propTypes = {
  hotTake: PropTypes.shape({
    text: PropTypes.string,
    gradient: PropTypes.string,
    agreeCount: PropTypes.number,
    disagreeCount: PropTypes.number,
  }),
  isOwnProfile: PropTypes.bool.isRequired,
  onSave: PropTypes.func,
  onReact: PropTypes.func,
  animDelay: PropTypes.number,
};

HotTakeWidget.defaultProps = {
  hotTake: null,
  onSave: null,
  onReact: null,
  animDelay: 0,
};

const styles = StyleSheet.create({
  card: {
    borderRadius: profileTokens.widgetRadius,
    padding: spacing.lg,
    minHeight: 140,
  },
  emptyCard: {
    borderRadius: profileTokens.widgetRadius,
    padding: spacing.lg,
    minHeight: 120,
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
    opacity: 0.6,
  },
  label: {
    ...typography.captionSmall,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  mainText: {
    ...typography.title,
    color: '#FFFFFF',
    lineHeight: 32,
  },
  reactionRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    gap: spacing.xs,
  },
  reactionEmoji: {
    fontSize: 18,
  },
  reactionCount: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.9)',
  },
  // ── Sheet Styles ──────────────────────
  sheetContent: {
    padding: spacing.lg,
  },
  sheetTitle: {
    ...typography.heading,
    marginBottom: spacing.md,
  },
  previewCard: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  textInput: {
    ...typography.body,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.xs,
  },
  charLimit: {
    ...typography.captionSmall,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  gradientPicker: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  gradientOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  saveBtn: {
    padding: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  saveBtnText: {
    ...typography.button,
    color: '#FFFFFF',
  },
});
