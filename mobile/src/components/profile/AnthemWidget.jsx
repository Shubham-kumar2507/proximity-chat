/**
 * AnthemWidget — Music card showing the user's "anthem" song.
 *
 * Displays album art, song title, artist, and animated equalizer.
 * Background uses dominant color extraction from album art.
 * On own profile: long-press opens "Change Anthem" flow.
 * On others': tap opens the song in Spotify/Apple Music.
 *
 * @module AnthemWidget
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Pencil } from 'lucide-react-native';
import PropTypes from 'prop-types';
import {
  getColors,
  spacing,
  typography,
  radius,
  profileTokens,
  widgetShadow,
} from '../../constants/theme';
import STRINGS from '../../constants/strings';

// ─── Equalizer Bar Component ─────────────────────────────────────────
function EqualizerBar({ delay, color }) {
  const height = useSharedValue(6);

  useEffect(() => {
    height.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(20, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(6, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[styles.eqBar, { backgroundColor: color || '#FFFFFF' }, animStyle]}
    />
  );
}

EqualizerBar.propTypes = {
  delay: PropTypes.number.isRequired,
  color: PropTypes.string,
};

/**
 * Anthem (music) widget card.
 *
 * @param {Object} props
 * @param {Object|null} props.anthem - { title, artist, albumArt, externalUrl }
 * @param {boolean} props.isOwnProfile - Whether this is the user's own profile
 * @param {Function} [props.onSave] - Called with anthem data when changed
 * @param {Function} [props.onSearch] - Called with search query, returns results promise
 * @param {number} [props.animDelay] - Animation delay in ms
 * @returns {React.ReactElement}
 */
export default function AnthemWidget({
  anthem,
  isOwnProfile,
  onSave,
  onSearch,
  animDelay = 0,
}) {
  const colors = getColors();
  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ['70%'], []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [dominantColor, setDominantColor] = useState(colors.surfaceElevated);

  const [isSpotifyConnected, setIsSpotifyConnected] = useState(false);
  const [spotifySyncing, setSpotifySyncing] = useState(false);

  // Try to extract dominant color from album art
  useEffect(() => {
    if (!anthem?.albumArt) return;
    try {
      const ImageColors = require('react-native-image-colors');
      ImageColors.getColors(anthem.albumArt, {
        fallback: colors.surfaceElevated,
        cache: true,
        key: anthem.albumArt,
      }).then((result) => {
        const extracted =
          result.platform === 'android'
            ? result.dominant
            : result.background || result.primary;
        if (extracted) setDominantColor(extracted);
      }).catch(() => {});
    } catch (e) {
      // ignore
    }
  }, [anthem?.albumArt]);

  // Check Spotify status on mount (own profile only)
  useEffect(() => {
    if (!isOwnProfile) return;
    const checkSpotify = async () => {
      try {
        // dynamic import to avoid breaking if not used
        const { isSpotifyConnected } = require('../../services/spotifyAuth');
        const connected = await isSpotifyConnected();
        setIsSpotifyConnected(connected);
      } catch (e) {}
    };
    checkSpotify();
  }, [isOwnProfile]);

  const isEmpty = !anthem?.title;
  const isSpotifyLive = isOwnProfile ? isSpotifyConnected : (anthem?.source === 'spotify');

  const handlePress = () => {
    if (!isEmpty && !isOwnProfile && anthem?.externalUrl) {
      Linking.openURL(anthem.externalUrl).catch(() => {});
    }
  };

  const handleLongPress = () => {
    if (isOwnProfile) {
      setSearchQuery('');
      setSearchResults([]);
      sheetRef.current?.expand();
    }
  };

  const handleEmptyPress = () => {
    if (isOwnProfile) {
      setSearchQuery('');
      setSearchResults([]);
      sheetRef.current?.expand();
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !onSearch) return;
    setSearching(true);
    try {
      const results = await onSearch(searchQuery.trim());
      setSearchResults(results || []);
    } catch (e) {
      setSearchResults([]);
    }
    setSearching(false);
  };

  const handleSelect = (song) => {
    onSave?.(song);
    sheetRef.current?.close();
  };

  const handleConnectSpotify = async () => {
    try {
      setSpotifySyncing(true);
      const { connectSpotify } = require('../../services/spotifyAuth');
      const { syncAnthem } = require('../../services/spotifyApi');
      
      const result = await connectSpotify();
      if (result.success) {
        setIsSpotifyConnected(true);
        const newAnthem = await syncAnthem();
        if (newAnthem) {
          onSave?.(newAnthem);
        }
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setSpotifySyncing(false);
      sheetRef.current?.close();
    }
  };

  const handleDisconnectSpotify = async () => {
    try {
      const { disconnectSpotify } = require('../../services/spotifyAuth');
      await disconnectSpotify();
      setIsSpotifyConnected(false);
      sheetRef.current?.close();
    } catch (e) {}
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

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={[styles.resultItem, { borderBottomColor: colors.border }]}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
    >
      {item.albumArt && (
        <Image source={{ uri: item.albumArt }} style={styles.resultArt} />
      )}
      <View style={styles.resultInfo}>
        <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.resultArtist, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <Animated.View
        entering={FadeInUp.delay(animDelay).duration(300).springify()}
      >
        {isEmpty ? (
          /* ── Empty State ──────────────────── */
          <TouchableOpacity
            activeOpacity={isOwnProfile ? 0.85 : 1}
            onPress={handleEmptyPress}
          >
            <View
              style={[
                styles.emptyCard,
                { borderColor: colors.textMuted },
                widgetShadow,
              ]}
            >
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {STRINGS.ANTHEM_EMPTY_PROMPT}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          /* ── Filled State ─────────────────── */
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePress}
            onLongPress={handleLongPress}
            delayLongPress={500}
          >
            <View style={[styles.card, widgetShadow, { backgroundColor: dominantColor }]}>
              {/* Gradient overlay for readability */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />

              {/* Edit icon — own profile only */}
              {isOwnProfile && (
                <View style={styles.editIcon}>
                  <Pencil size={14} color="rgba(255,255,255,0.6)" />
                </View>
              )}

              {/* Live Spotify Badge */}
              {isSpotifyLive && (
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>{STRINGS.SPOTIFY_LIVE}</Text>
                </View>
              )}

              <View style={[styles.cardContent, isSpotifyLive && { marginTop: spacing.sm }]}>
                {/* Album Art */}
                <Image
                  source={
                    anthem.albumArt
                      ? { uri: anthem.albumArt }
                      : require('../../../assets/favicon.png')
                  }
                  style={styles.albumArt}
                />

                {/* Song Info */}
                <View style={styles.songInfo}>
                  <Text style={styles.onRepeatLabel}>
                    {STRINGS.ANTHEM_LABEL}
                  </Text>
                  <Text style={styles.songTitle} numberOfLines={1}>
                    {anthem.title}
                  </Text>
                  <Text style={styles.artistName} numberOfLines={1}>
                    {anthem.artist}
                  </Text>
                </View>

                {/* Equalizer */}
                <View style={styles.equalizer}>
                  <EqualizerBar delay={0} color="#1DB954" />
                  <EqualizerBar delay={200} color="#1DB954" />
                  <EqualizerBar delay={100} color="#1DB954" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* ── Change Anthem Sheet ─────────────── */}
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
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                {STRINGS.ANTHEM_SEARCH_TITLE}
              </Text>
            </View>

            {/* Spotify Integration Row */}
            <View style={styles.spotifyRow}>
              {isSpotifyConnected ? (
                <TouchableOpacity
                  style={[styles.spotifyBtn, { backgroundColor: colors.surfaceActive }]}
                  onPress={handleDisconnectSpotify}
                >
                  <Text style={[styles.spotifyBtnText, { color: colors.danger }]}>
                    {STRINGS.SPOTIFY_DISCONNECT}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.spotifyBtn, { backgroundColor: '#1DB954' }]}
                  onPress={handleConnectSpotify}
                  disabled={spotifySyncing}
                >
                  <Text style={styles.spotifyBtnText}>
                    {spotifySyncing ? STRINGS.SPOTIFY_CONNECTING : STRINGS.SPOTIFY_CONNECT}
                  </Text>
                </TouchableOpacity>
              )}
              
              {!isSpotifyConnected && (
                <View style={[styles.spotifyBtn, { backgroundColor: colors.surfaceActive, opacity: 0.5 }]}>
                  <Text style={[styles.spotifyBtnText, { color: colors.textSecondary }]}>
                    {STRINGS.SPOTIFY_APPLE_COMING_SOON}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                {STRINGS.SPOTIFY_MANUAL_OVERRIDE}
              </Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </View>

            <View style={styles.searchRow}>
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
                placeholder={STRINGS.ANTHEM_SEARCH_PLACEHOLDER}
                placeholderTextColor={colors.inputPlaceholder}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <TouchableOpacity
                style={[styles.searchBtn, { backgroundColor: colors.primary }]}
                onPress={handleSearch}
                disabled={searching}
              >
                <Text style={styles.searchBtnText}>
                  {searching ? '…' : '🔍'}
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={searchResults}
              keyExtractor={(item, index) => `${item.title}-${index}`}
              renderItem={renderSearchResult}
              ListEmptyComponent={
                <Text style={[styles.emptySearch, { color: colors.textMuted }]}>
                  {searching ? STRINGS.LOADING : 'Search for a song to set as your anthem'}
                </Text>
              }
              contentContainerStyle={styles.resultsList}
            />
          </View>
        </BottomSheet>
      )}
    </>
  );
}

AnthemWidget.propTypes = {
  anthem: PropTypes.shape({
    title: PropTypes.string,
    artist: PropTypes.string,
    albumArt: PropTypes.string,
    externalUrl: PropTypes.string,
  }),
  isOwnProfile: PropTypes.bool.isRequired,
  onSave: PropTypes.func,
  onSearch: PropTypes.func,
  animDelay: PropTypes.number,
};

AnthemWidget.defaultProps = {
  anthem: null,
  onSave: null,
  onSearch: null,
  animDelay: 0,
};

const styles = StyleSheet.create({
  card: {
    borderRadius: profileTokens.widgetRadius,
    overflow: 'hidden',
    minHeight: 100,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
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
    opacity: 0.6,
  },
  albumArt: {
    width: profileTokens.anthemArtSize,
    height: profileTokens.anthemArtSize,
    borderRadius: radius.sm,
  },
  songInfo: {
    flex: 1,
  },
  onRepeatLabel: {
    ...typography.captionSmall,
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  songTitle: {
    ...typography.subtitle,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  artistName: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
  },
  equalizer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 24,
  },
  eqBar: {
    width: 4,
    borderRadius: 2,
    minHeight: 4,
  },
  // ── Sheet Styles ──────────────────────
  sheetContent: {
    flex: 1,
    padding: spacing.lg,
  },
  sheetTitle: {
    ...typography.heading,
    marginBottom: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    ...typography.body,
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  searchBtn: {
    width: 48,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    fontSize: 20,
  },
  resultsList: {
    paddingBottom: spacing.xxl,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  resultArt: {
    width: 44,
    height: 44,
    borderRadius: radius.xs,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    ...typography.bodyBold,
    marginBottom: 2,
  },
  resultArtist: {
    ...typography.caption,
  },
  emptySearch: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  liveBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: '#1DB954',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    zIndex: 10,
  },
  liveBadgeText: {
    ...typography.captionSmall,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  spotifyRow: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  spotifyBtn: {
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotifyBtnText: {
    ...typography.buttonSmall,
    color: '#FFFFFF',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...typography.captionSmall,
    paddingHorizontal: spacing.sm,
  },
});
