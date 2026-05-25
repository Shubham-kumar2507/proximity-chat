/**
 * TagPickerSheet — Bottom sheet for adding/managing interest tags.
 *
 * Shows a searchable list of preset interests plus free-type.
 * Enforces a max of 10 tags with shake animation on exceed.
 *
 * @module TagPickerSheet
 */

import React, { useState, useCallback, useMemo, forwardRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import PropTypes from 'prop-types';
import { getColors, spacing, typography, radius, NEON_PALETTE, profileTokens } from '../../constants/theme';
import STRINGS from '../../constants/strings';

/** Preset interest tags */
const PRESET_TAGS = [
  'Night Drives', 'Street Photography', 'Indie Rock', 'Rooftop Sunsets',
  'Thrift Stores', 'Coffee Culture', 'Vinyl Records', 'Skateboarding',
  'Film Photography', 'Jazz Bars', 'Urban Exploring', 'Live Music',
  'Board Games', 'Craft Beer', 'Hiking', 'Food Trucks',
  'Anime', 'Tattoo Art', 'Plant Parenting', 'Yoga',
  'Poetry Slams', 'Rock Climbing', 'Art Galleries', 'Podcasts',
  'Cycling', 'Co-working', 'K-Pop', 'Vintage Fashion',
  'Open Mics', 'Sunset Chasing', 'Graffiti Art', 'Minimalism',
  'Cooking', 'Dance Parties', 'Book Clubs', 'Beach Bonfires',
];

/**
 * Bottom sheet for picking interest tags.
 *
 * @param {Object} props
 * @param {string[]} props.currentInterests - Current interest tags
 * @param {Function} props.onDone - Called with the updated interests array
 * @param {React.Ref} ref - Bottom sheet ref
 * @returns {React.ReactElement}
 */
const TagPickerSheet = forwardRef(({ currentInterests, onDone }, ref) => {
  const colors = getColors();
  const snapPoints = useMemo(() => ['70%'], []);
  const [selected, setSelected] = useState([...currentInterests]);
  const [searchQuery, setSearchQuery] = useState('');
  const shakeX = useSharedValue(0);

  // Sync state when currentInterests prop changes
  useEffect(() => {
    setSelected([...currentInterests]);
  }, [currentInterests]);

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

  const filteredTags = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return PRESET_TAGS;
    const matching = PRESET_TAGS.filter((t) => t.toLowerCase().includes(q));
    // If no exact match, allow free-type
    const exactMatch = PRESET_TAGS.some((t) => t.toLowerCase() === q);
    if (!exactMatch && q.length > 0) {
      matching.push(searchQuery.trim());
    }
    return matching;
  }, [searchQuery]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }),
      withTiming(6, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const toggleTag = (tag) => {
    if (selected.includes(tag)) {
      setSelected(selected.filter((t) => t !== tag));
    } else {
      if (selected.length >= profileTokens.maxInterests) {
        triggerShake();
        return;
      }
      setSelected([...selected, tag]);
    }
  };

  const handleDone = () => {
    onDone(selected);
    ref?.current?.close();
  };

  const renderTag = ({ item, index }) => {
    const isSelected = selected.includes(item);
    const neonColor = NEON_PALETTE[index % NEON_PALETTE.length];
    return (
      <TouchableOpacity
        style={[
          styles.tagItem,
          {
            borderColor: isSelected ? neonColor : colors.border,
            backgroundColor: isSelected ? neonColor + '1A' : 'transparent',
          },
        ]}
        onPress={() => toggleTag(item)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.tagItemText,
            { color: isSelected ? neonColor : colors.textSecondary },
          ]}
        >
          {isSelected ? '✓ ' : ''}{item}
        </Text>
      </TouchableOpacity>
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
      <Animated.View style={[styles.content, shakeStyle]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {STRINGS.INTERESTS_TITLE}
          </Text>
          <Text style={[styles.counter, { color: colors.textMuted }]}>
            {selected.length}/{profileTokens.maxInterests}
          </Text>
        </View>

        <TextInput
          style={[
            styles.searchInput,
            {
              color: colors.text,
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
            },
          ]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={STRINGS.INTERESTS_SEARCH_PLACEHOLDER}
          placeholderTextColor={colors.inputPlaceholder}
        />

        <FlatList
          data={filteredTags}
          keyExtractor={(item) => item}
          renderItem={renderTag}
          numColumns={2}
          columnWrapperStyle={styles.tagRow}
          contentContainerStyle={styles.tagList}
          showsVerticalScrollIndicator={false}
        />

        <TouchableOpacity
          style={[styles.doneButton, { backgroundColor: colors.primary }]}
          onPress={handleDone}
        >
          <Text style={styles.doneText}>{STRINGS.INTERESTS_DONE}</Text>
        </TouchableOpacity>
      </Animated.View>
    </BottomSheet>
  );
});

TagPickerSheet.displayName = 'TagPickerSheet';

TagPickerSheet.propTypes = {
  currentInterests: PropTypes.arrayOf(PropTypes.string),
  onDone: PropTypes.func.isRequired,
};

TagPickerSheet.defaultProps = {
  currentInterests: [],
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading,
  },
  counter: {
    ...typography.caption,
  },
  searchInput: {
    ...typography.body,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  tagList: {
    paddingBottom: spacing.md,
  },
  tagRow: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tagItem: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  tagItemText: {
    ...typography.caption,
  },
  doneButton: {
    padding: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  doneText: {
    ...typography.button,
    color: '#FFFFFF',
  },
});

export default TagPickerSheet;
