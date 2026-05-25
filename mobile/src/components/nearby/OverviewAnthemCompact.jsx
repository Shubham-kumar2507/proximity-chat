/**
 * OverviewAnthemCompact — Compact version of Anthem Widget.
 *
 * @module components/nearby/OverviewAnthemCompact
 */
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Music } from 'lucide-react-native';
import PropTypes from 'prop-types';
import { getColors, typography, spacing, radius } from '../../constants/theme';

export default function OverviewAnthemCompact({ anthem, animDelay = 0 }) {
  const colors = getColors();

  if (!anthem) return null;

  const handlePress = () => {
    if (anthem.url) Linking.openURL(anthem.url).catch(() => {});
  };

  return (
    <Animated.View 
      entering={FadeInDown.delay(animDelay).springify()} 
      style={styles.container}
    >
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Profile Anthem</Text>
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colors.surfaceElevated }]} 
        activeOpacity={0.8}
        onPress={handlePress}
      >
        <Image 
          source={{ uri: anthem.albumArt }} 
          style={styles.albumArt} 
        />
        <View style={styles.textContainer}>
          <Text style={[styles.songTitle, { color: colors.text }]} numberOfLines={1}>
            {anthem.name}
          </Text>
          <Text style={[styles.artistName, { color: colors.textMuted }]} numberOfLines={1}>
            {anthem.artist}
          </Text>
        </View>
        <View style={[styles.iconBox, { backgroundColor: colors.primarySurface }]}>
          <Music size={16} color={colors.primary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

OverviewAnthemCompact.propTypes = {
  anthem: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    artist: PropTypes.string,
    albumArt: PropTypes.string,
    url: PropTypes.string,
  }),
  animDelay: PropTypes.number,
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  albumArt: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  songTitle: {
    ...typography.bodyBold,
    fontSize: 15,
    marginBottom: 2,
  },
  artistName: {
    ...typography.caption,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
});
