/**
 * MoodPickerSheet — Bottom sheet for selecting a mood gradient preset.
 *
 * Shows 6 mood options as colored circles with labels.
 * Uses @gorhom/bottom-sheet for the sheet component.
 *
 * @module MoodPickerSheet
 */

import React, { useCallback, useMemo, forwardRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import PropTypes from 'prop-types';
import { MOOD_PRESETS, getColors, spacing, typography, radius } from '../../constants/theme';
import STRINGS from '../../constants/strings';

/**
 * Bottom sheet for picking a mood gradient.
 *
 * @param {Object} props
 * @param {string} props.currentMood - Currently selected mood key
 * @param {Function} props.onSelect - Called with the selected mood key
 * @param {React.Ref} ref - Bottom sheet ref
 * @returns {React.ReactElement}
 */
const MoodPickerSheet = forwardRef(({ currentMood, onSelect }, ref) => {
  const colors = getColors();
  const snapPoints = useMemo(() => ['40%'], []);

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

  const handleSelect = (key) => {
    onSelect(key);
    ref?.current?.close();
  };

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
      backdropComponent={renderBackdrop}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          {STRINGS.MOOD_PICKER_TITLE}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {STRINGS.MOOD_PICKER_SUBTITLE}
        </Text>

        <View style={styles.grid}>
          {MOOD_PRESETS.map((mood) => {
            const isSelected = currentMood === mood.key;
            return (
              <TouchableOpacity
                key={mood.key}
                style={styles.moodItem}
                onPress={() => handleSelect(mood.key)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.moodCircleOuter,
                    isSelected && {
                      borderColor: colors.primary,
                      borderWidth: 2,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={mood.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.moodCircle}
                  />
                </View>
                <Text style={[styles.moodEmoji]}>{mood.emoji}</Text>
                <Text
                  style={[
                    styles.moodLabel,
                    { color: isSelected ? colors.text : colors.textSecondary },
                    isSelected && { fontWeight: '700' },
                  ]}
                >
                  {mood.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </BottomSheet>
  );
});

MoodPickerSheet.displayName = 'MoodPickerSheet';

MoodPickerSheet.propTypes = {
  currentMood: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};

MoodPickerSheet.defaultProps = {
  currentMood: 'chill',
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...typography.heading,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  moodItem: {
    alignItems: 'center',
    width: 80,
  },
  moodCircleOuter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: spacing.xs,
  },
  moodCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  moodEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  moodLabel: {
    ...typography.captionSmall,
    textAlign: 'center',
  },
});

export default MoodPickerSheet;
