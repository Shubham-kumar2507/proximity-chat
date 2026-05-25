/**
 * WidgetManagerSheet — Show/hide widget toggles.
 *
 * Allows the user to toggle visibility of each widget on their public profile.
 * Hidden widgets don't show on public profile but data is preserved.
 *
 * @module WidgetManagerSheet
 */

import React, { useState, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import PropTypes from 'prop-types';
import { getColors, spacing, typography, radius } from '../../constants/theme';
import STRINGS from '../../constants/strings';

const WIDGET_DEFS = [
  { key: 'hotTake', icon: '🔥', label: 'Hot Take' },
  { key: 'twoTruths', icon: '🎮', label: 'Two Truths & a Lie' },
  { key: 'anthem', icon: '🎵', label: 'Anthem' },
  { key: 'favoriteSpot', icon: '📍', label: 'Favorite Local Spot' },
];

/**
 * @param {Object} props
 * @param {Object} props.visibility - { hotTake: bool, twoTruths: bool, anthem: bool, favoriteSpot: bool }
 * @param {Function} props.onToggle - Called with (widgetKey, newValue)
 * @param {React.Ref} ref
 */
const WidgetManagerSheet = forwardRef(function WidgetManagerSheet({ visibility, onToggle }, ref) {
  const colors = getColors();
  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ['45%'], []);

  useImperativeHandle(ref, () => ({
    expand: () => sheetRef.current?.expand(),
    close: () => sheetRef.current?.close(),
  }));

  const renderBackdrop = useCallback((props) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
  ), []);

  return (
    <BottomSheet ref={sheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose backgroundStyle={{ backgroundColor: colors.surface }} handleIndicatorStyle={{ backgroundColor: colors.textMuted }} backdropComponent={renderBackdrop}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{STRINGS.WIDGET_MANAGER_TITLE}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{STRINGS.WIDGET_MANAGER_SUBTITLE}</Text>

        {WIDGET_DEFS.map((widget) => (
          <View key={widget.key} style={[styles.row, { borderBottomColor: colors.border }]}>
            <View style={styles.rowLeft}>
              <Text style={styles.widgetIcon}>{widget.icon}</Text>
              <Text style={[styles.widgetLabel, { color: colors.text }]}>{widget.label}</Text>
            </View>
            <Switch
              value={visibility?.[widget.key] !== false}
              onValueChange={(val) => onToggle?.(widget.key, val)}
              trackColor={{ false: colors.surfaceActive, true: colors.primary + '60' }}
              thumbColor={visibility?.[widget.key] !== false ? colors.primary : colors.textMuted}
            />
          </View>
        ))}
      </View>
    </BottomSheet>
  );
});

WidgetManagerSheet.propTypes = {
  visibility: PropTypes.object,
  onToggle: PropTypes.func.isRequired,
};

WidgetManagerSheet.defaultProps = { visibility: {} };

export default WidgetManagerSheet;

const styles = StyleSheet.create({
  content: { padding: spacing.lg },
  title: { ...typography.heading, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, marginBottom: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  widgetIcon: { fontSize: 20 },
  widgetLabel: { ...typography.body },
});
