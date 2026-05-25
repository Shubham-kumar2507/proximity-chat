/**
 * TwoTruthsWidget — Interactive Two Truths & a Lie game card.
 *
 * Displays 3 statements; viewers guess the lie. Shows aggregate
 * guess progress bars. On own profile, tapping opens the editor sheet.
 *
 * @module TwoTruthsWidget
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
  profileTokens,
  widgetShadow,
  NEON_PALETTE,
} from '../../constants/theme';
import STRINGS from '../../constants/strings';

// Try to import expo-haptics, gracefully degrade if not available
let Haptics = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  // expo-haptics not available
}

const OPTION_LABELS = ['A', 'B', 'C'];
const OPTION_COLORS = [NEON_PALETTE[3], NEON_PALETTE[1], NEON_PALETTE[0]]; // green, blue, pink

/**
 * Two Truths & a Lie widget card.
 *
 * @param {Object} props
 * @param {Object|null} props.twoTruths - { statements: string[], guessCounts: number[], totalGuesses: number }
 * @param {boolean} props.isOwnProfile - Whether this is the user's own profile
 * @param {string} [props.userName] - Profile owner's name (for chat prompt)
 * @param {Function} [props.onEdit] - Called when edit is requested (own profile)
 * @param {Function} [props.onGuessAndChat] - Called with { guessIndex, statement } to send icebreaker
 * @param {Function} [props.onQuietGuess] - Called with guessIndex for a silent guess
 * @param {number} [props.animDelay] - Animation delay in ms
 * @returns {React.ReactElement}
 */
export default function TwoTruthsWidget({
  twoTruths,
  isOwnProfile,
  userName,
  onEdit,
  onGuessAndChat,
  onQuietGuess,
  animDelay = 0,
}) {
  const colors = getColors();
  const guessSheetRef = useRef(null);
  const guessSnapPoints = useMemo(() => ['38%'], []);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [hasGuessed, setHasGuessed] = useState(false);

  const isEmpty = !twoTruths?.statements || twoTruths.statements.length < 3;

  const handleOptionPress = async (index) => {
    if (isOwnProfile || hasGuessed) return;

    // Haptic pulse
    if (Haptics) {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) { /* noop */ }
    }

    setSelectedIndex(index);
    guessSheetRef.current?.expand();
  };

  const handleSendGuess = () => {
    if (selectedIndex === null) return;
    setHasGuessed(true);
    onGuessAndChat?.({
      guessIndex: selectedIndex,
      statement: twoTruths.statements[selectedIndex],
    });
    guessSheetRef.current?.close();
  };

  const handleQuietGuess = () => {
    if (selectedIndex === null) return;
    setHasGuessed(true);
    onQuietGuess?.(selectedIndex);
    guessSheetRef.current?.close();
  };

  const handleWidgetPress = () => {
    if (isOwnProfile) {
      onEdit?.();
    }
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

  /**
   * Calculate guess percentage for an option.
   */
  const getGuessPercent = (index) => {
    if (!twoTruths?.guessCounts || !twoTruths.totalGuesses) return 0;
    return Math.round(
      ((twoTruths.guessCounts[index] || 0) / twoTruths.totalGuesses) * 100
    );
  };

  return (
    <>
      <Animated.View
        entering={FadeInUp.delay(animDelay).duration(300).springify()}
      >
        <TouchableOpacity
          activeOpacity={isOwnProfile ? 0.85 : 1}
          onPress={handleWidgetPress}
          disabled={!isOwnProfile && !isEmpty}
        >
          {isEmpty ? (
            /* ── Empty State ──────────────────── */
            <View
              style={[
                styles.emptyCard,
                { borderColor: colors.textMuted },
                widgetShadow,
              ]}
            >
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {STRINGS.TWO_TRUTHS_EMPTY_PROMPT}
              </Text>
            </View>
          ) : (
            /* ── Filled State ─────────────────── */
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
                widgetShadow,
              ]}
            >
              {/* Edit icon — own profile only */}
              {isOwnProfile && (
                <View style={styles.editIcon}>
                  <Pencil size={14} color={colors.textMuted} />
                </View>
              )}

              {/* Header */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {STRINGS.TWO_TRUTHS_LABEL}
              </Text>

              {/* Statement Options */}
              {twoTruths.statements.map((statement, index) => {
                const isSelected = selectedIndex === index && hasGuessed;
                const optionColor = OPTION_COLORS[index];
                const guessPercent = getGuessPercent(index);

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionRow,
                      {
                        backgroundColor: isSelected
                          ? optionColor + '1A'
                          : colors.surfaceElevated,
                        borderColor: isSelected
                          ? optionColor
                          : colors.border,
                      },
                    ]}
                    onPress={() => handleOptionPress(index)}
                    disabled={isOwnProfile || hasGuessed}
                    activeOpacity={0.7}
                  >
                    {/* Letter label */}
                    <View
                      style={[
                        styles.letterBadge,
                        { backgroundColor: optionColor + '26' },
                      ]}
                    >
                      <Text style={[styles.letterText, { color: optionColor }]}>
                        {OPTION_LABELS[index]}
                      </Text>
                    </View>

                    {/* Statement text */}
                    <View style={styles.statementContainer}>
                      <Text
                        style={[styles.statementText, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {statement}
                      </Text>

                      {/* "Your guess" label */}
                      {isSelected && (
                        <Text style={[styles.yourGuess, { color: optionColor }]}>
                          {STRINGS.TWO_TRUTHS_YOUR_GUESS}
                        </Text>
                      )}
                    </View>

                    {/* Progress bar — shows after someone has guessed */}
                    {hasGuessed && twoTruths.totalGuesses > 0 && (
                      <View style={styles.progressContainer}>
                        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                backgroundColor: optionColor,
                                width: `${guessPercent}%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
                          {STRINGS.TWO_TRUTHS_GUESSED(guessPercent)}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* ── Guess Confirmation Sheet ───────────── */}
      {!isOwnProfile && (
        <BottomSheet
          ref={guessSheetRef}
          index={-1}
          snapPoints={guessSnapPoints}
          enablePanDownToClose
          backgroundStyle={{ backgroundColor: colors.surface }}
          handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
          backdropComponent={renderBackdrop}
        >
          <View style={styles.sheetContent}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {STRINGS.TWO_TRUTHS_GUESS_TITLE}
            </Text>
            <Text style={[styles.sheetBody, { color: colors.textSecondary }]}>
              {STRINGS.TWO_TRUTHS_GUESS_BODY(userName || 'them')}
            </Text>

            {/* Selected statement preview */}
            {selectedIndex !== null && twoTruths?.statements && (
              <View style={[styles.previewPill, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.previewText, { color: colors.text }]} numberOfLines={1}>
                  "{twoTruths.statements[selectedIndex]}"
                </Text>
              </View>
            )}

            {/* CTA Buttons */}
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={handleSendGuess}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>
                {STRINGS.TWO_TRUTHS_SEND_GUESS}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.border }]}
              onPress={handleQuietGuess}
              activeOpacity={0.7}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>
                {STRINGS.TWO_TRUTHS_QUIET_GUESS}
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>
      )}
    </>
  );
}

TwoTruthsWidget.propTypes = {
  twoTruths: PropTypes.shape({
    statements: PropTypes.arrayOf(PropTypes.string),
    guessCounts: PropTypes.arrayOf(PropTypes.number),
    totalGuesses: PropTypes.number,
  }),
  isOwnProfile: PropTypes.bool.isRequired,
  userName: PropTypes.string,
  onEdit: PropTypes.func,
  onGuessAndChat: PropTypes.func,
  onQuietGuess: PropTypes.func,
  animDelay: PropTypes.number,
};

TwoTruthsWidget.defaultProps = {
  twoTruths: null,
  userName: null,
  onEdit: null,
  onGuessAndChat: null,
  onQuietGuess: null,
  animDelay: 0,
};

const styles = StyleSheet.create({
  card: {
    borderRadius: profileTokens.widgetRadius,
    padding: spacing.md,
    borderWidth: 1,
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
  },
  label: {
    ...typography.captionSmall,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  letterBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    ...typography.bodyBold,
  },
  statementContainer: {
    flex: 1,
  },
  statementText: {
    ...typography.body,
    lineHeight: 20,
  },
  yourGuess: {
    ...typography.captionSmall,
    marginTop: 2,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 4,
    left: 44,
    right: spacing.sm,
  },
  progressTrack: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  progressLabel: {
    fontSize: 9,
    marginTop: 1,
  },
  // ── Sheet Styles ──────────────────────
  sheetContent: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  sheetTitle: {
    ...typography.heading,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  sheetBody: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  previewPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    maxWidth: '90%',
  },
  previewText: {
    ...typography.caption,
    fontStyle: 'italic',
  },
  primaryBtn: {
    width: '100%',
    padding: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryBtnText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    width: '100%',
    padding: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryBtnText: {
    ...typography.buttonSmall,
  },
});
