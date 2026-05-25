/**
 * TwoTruthsEditorSheet — Full edit sheet for Two Truths & a Lie.
 *
 * Shows 3 labelled text inputs (Truth 1, Truth 2, Lie), a shuffle
 * button to randomize display order, and a save CTA.
 *
 * @module TwoTruthsEditorSheet
 */

import React, { useState, useCallback, useMemo, forwardRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Shuffle } from 'lucide-react-native';
import PropTypes from 'prop-types';
import {
  getColors,
  spacing,
  typography,
  radius,
  profileTokens,
} from '../../constants/theme';
import STRINGS from '../../constants/strings';

/**
 * Bottom sheet for editing Two Truths & a Lie.
 *
 * @param {Object} props
 * @param {Object|null} props.currentData - { truth1, truth2, lie }
 * @param {Function} props.onSave - Called with { truth1, truth2, lie }
 * @param {React.Ref} ref - Bottom sheet ref
 * @returns {React.ReactElement}
 */
const TwoTruthsEditorSheet = forwardRef(({ currentData, onSave }, ref) => {
  const colors = getColors();
  const snapPoints = useMemo(() => ['72%'], []);
  const maxChars = profileTokens.twoTruthsMaxChars;

  const [truth1, setTruth1] = useState('');
  const [truth2, setTruth2] = useState('');
  const [lie, setLie] = useState('');

  // Sync with incoming data when the sheet opens
  useEffect(() => {
    if (currentData) {
      setTruth1(currentData.truth1 || '');
      setTruth2(currentData.truth2 || '');
      setLie(currentData.lie || '');
    }
  }, [currentData]);

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

  const handleShuffle = () => {
    // Randomize only the UI labels to show the user the shuffled feel;
    // actual shuffled order is computed server-side on save.
    const items = [truth1, truth2, lie];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    setTruth1(items[0]);
    setTruth2(items[1]);
    setLie(items[2]);
  };

  const handleSave = () => {
    if (!truth1.trim() || !truth2.trim() || !lie.trim()) return;
    onSave({
      truth1: truth1.trim(),
      truth2: truth2.trim(),
      lie: lie.trim(),
    });
    ref?.current?.close();
  };

  const canSave = truth1.trim() && truth2.trim() && lie.trim();

  /**
   * Renders a single labelled text input.
   */
  const renderInput = (label, value, setter, color) => (
    <View style={styles.inputGroup} key={label}>
      <View style={styles.inputHeader}>
        <View style={[styles.labelDot, { backgroundColor: color }]} />
        <Text style={[styles.inputLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.charCount, { color: colors.textMuted }]}>
          {STRINGS.TWO_TRUTHS_CHAR_LIMIT(value.length, maxChars)}
        </Text>
      </View>
      <TextInput
        style={[
          styles.textInput,
          {
            color: colors.text,
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
          },
        ]}
        value={value}
        onChangeText={(t) => setter(t.slice(0, maxChars))}
        placeholder={`Enter your ${label.toLowerCase()}…`}
        placeholderTextColor={colors.inputPlaceholder}
        maxLength={maxChars}
        multiline={false}
      />
    </View>
  );

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
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          {STRINGS.TWO_TRUTHS_EDIT_TITLE}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Enter two truths and one lie. Others will try to guess which is the lie!
        </Text>

        {renderInput(STRINGS.TWO_TRUTHS_TRUTH_1, truth1, setTruth1, '#43E97B')}
        {renderInput(STRINGS.TWO_TRUTHS_TRUTH_2, truth2, setTruth2, '#4FACFE')}
        {renderInput(STRINGS.TWO_TRUTHS_LIE, lie, setLie, '#FF2D7E')}

        {/* Shuffle Button */}
        <TouchableOpacity
          style={[styles.shuffleBtn, { borderColor: colors.border }]}
          onPress={handleShuffle}
          activeOpacity={0.7}
        >
          <Shuffle size={16} color={colors.primary} />
          <Text style={[styles.shuffleText, { color: colors.primary }]}>
            {STRINGS.TWO_TRUTHS_SHUFFLE}
          </Text>
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: canSave ? colors.primary : colors.surfaceActive },
          ]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.8}
        >
          <Text style={[styles.saveBtnText, { opacity: canSave ? 1 : 0.5 }]}>
            {STRINGS.SAVE}
          </Text>
        </TouchableOpacity>
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

TwoTruthsEditorSheet.displayName = 'TwoTruthsEditorSheet';

TwoTruthsEditorSheet.propTypes = {
  currentData: PropTypes.shape({
    truth1: PropTypes.string,
    truth2: PropTypes.string,
    lie: PropTypes.string,
  }),
  onSave: PropTypes.func.isRequired,
};

TwoTruthsEditorSheet.defaultProps = {
  currentData: null,
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.heading,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  labelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inputLabel: {
    ...typography.label,
    flex: 1,
  },
  charCount: {
    ...typography.captionSmall,
  },
  textInput: {
    ...typography.body,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    minHeight: 44,
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  shuffleText: {
    ...typography.buttonSmall,
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

export default TwoTruthsEditorSheet;
