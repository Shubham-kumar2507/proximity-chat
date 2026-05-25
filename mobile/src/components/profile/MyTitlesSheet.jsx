/**
 * MyTitlesSheet — Bottom sheet showing all titles with progress.
 *
 * Displays earned titles (with earned dates and a "pin" option) and
 * locked titles (greyed out with progress bars toward earning).
 *
 * @module MyTitlesSheet
 */

import React, { useCallback, useMemo, forwardRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Check } from 'lucide-react-native';
import PropTypes from 'prop-types';
import {
  getColors,
  spacing,
  typography,
  radius,
  NEIGHBORHOOD_TITLES,
} from '../../constants/theme';
import STRINGS from '../../constants/strings';

/**
 * Format a date string for display.
 * @param {string} dateStr - ISO date string
 * @returns {string} formatted date
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Bottom sheet showing all neighborhood titles with progress.
 *
 * @param {Object} props
 * @param {Array} props.titles - Array of { key, earned, earnedAt, progress }
 * @param {string|null} props.activeTitle - Currently pinned title key
 * @param {Function} props.onPin - Called with titleKey to set as active
 * @param {React.Ref} ref - Bottom sheet ref
 * @returns {React.ReactElement}
 */
const MyTitlesSheet = forwardRef(({ titles, activeTitle, onPin }, ref) => {
  const colors = getColors();
  const snapPoints = useMemo(() => ['70%'], []);

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

  // Merge server data with preset definitions
  const enrichedTitles = NEIGHBORHOOD_TITLES.map((preset) => {
    const serverData = (titles || []).find((t) => t.key === preset.key);
    return {
      ...preset,
      earned: serverData?.earned || false,
      earnedAt: serverData?.earnedAt || null,
      progress: serverData?.progress || 0, // 0–1
    };
  });

  const earnedTitles = enrichedTitles.filter((t) => t.earned);
  const lockedTitles = enrichedTitles.filter((t) => !t.earned);

  const renderTitleRow = (title, isLocked) => {
    const isActive = activeTitle === title.key;
    return (
      <View
        key={title.key}
        style={[
          styles.titleRow,
          {
            backgroundColor: isLocked
              ? colors.surfaceElevated + '80'
              : colors.surfaceElevated,
            borderColor: isActive ? title.color : colors.border,
            opacity: isLocked ? 0.6 : 1,
          },
        ]}
      >
        <View style={styles.titleInfo}>
          <Text style={[styles.titleEmoji, isLocked && styles.locked]}>
            {title.emoji}
          </Text>
          <View style={styles.titleDetails}>
            <Text
              style={[
                styles.titleLabel,
                { color: isLocked ? colors.textMuted : title.color },
              ]}
            >
              {title.label}
            </Text>
            {title.earned && title.earnedAt && (
              <Text style={[styles.earnedDate, { color: colors.textMuted }]}>
                {STRINGS.TITLES_EARNED_ON(formatDate(title.earnedAt))}
              </Text>
            )}
            {isLocked && (
              <View style={styles.progressRow}>
                <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: title.color,
                        width: `${Math.round(title.progress * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressPct, { color: colors.textMuted }]}>
                  {Math.round(title.progress * 100)}%
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Pin Button — earned titles only */}
        {title.earned && (
          <TouchableOpacity
            style={[
              styles.pinBtn,
              {
                backgroundColor: isActive ? title.color : 'transparent',
                borderColor: isActive ? title.color : colors.border,
              },
            ]}
            onPress={() => onPin(title.key)}
            disabled={isActive}
            activeOpacity={0.7}
          >
            {isActive ? (
              <Check size={14} color="#FFFFFF" />
            ) : (
              <Text style={[styles.pinText, { color: colors.textSecondary }]}>
                {STRINGS.TITLES_PIN}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
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
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sheetTitle, { color: colors.text }]}>
          {STRINGS.TITLES_SHEET_TITLE}
        </Text>

        {/* Earned section */}
        {earnedTitles.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              {STRINGS.TITLES_EARNED}
            </Text>
            {earnedTitles.map((t) => renderTitleRow(t, false))}
          </>
        )}

        {/* Locked section */}
        {lockedTitles.length > 0 && (
          <>
            <Text
              style={[
                styles.sectionLabel,
                { color: colors.textMuted, marginTop: spacing.md },
              ]}
            >
              {STRINGS.TITLES_LOCKED}
            </Text>
            {lockedTitles.map((t) => renderTitleRow(t, true))}
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

MyTitlesSheet.displayName = 'MyTitlesSheet';

MyTitlesSheet.propTypes = {
  titles: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      earned: PropTypes.bool,
      earnedAt: PropTypes.string,
      progress: PropTypes.number,
    })
  ),
  activeTitle: PropTypes.string,
  onPin: PropTypes.func.isRequired,
};

MyTitlesSheet.defaultProps = {
  titles: [],
  activeTitle: null,
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sheetTitle: {
    ...typography.heading,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.captionSmall,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  titleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  titleEmoji: {
    fontSize: 24,
  },
  locked: {
    opacity: 0.5,
  },
  titleDetails: {
    flex: 1,
  },
  titleLabel: {
    ...typography.bodyBold,
    marginBottom: 2,
  },
  earnedDate: {
    ...typography.captionSmall,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressPct: {
    fontSize: 10,
    width: 32,
    textAlign: 'right',
  },
  pinBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinText: {
    ...typography.captionSmall,
  },
});

export default MyTitlesSheet;
