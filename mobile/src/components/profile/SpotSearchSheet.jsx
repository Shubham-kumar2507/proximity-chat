/**
 * SpotSearchSheet — Place search bottom sheet for tagging a local spot.
 *
 * Search calls a server-side places autocomplete proxy.
 * Results: place name + category icon + neighborhood.
 * API keys never exposed on client.
 *
 * @module SpotSearchSheet
 */

import React, { useState, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ActivityIndicator } from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Search, MapPin } from 'lucide-react-native';
import PropTypes from 'prop-types';
import { getColors, spacing, typography, radius } from '../../constants/theme';
import STRINGS from '../../constants/strings';
import profileApi from '../../services/profileApi';

const CATEGORY_ICONS = { cafe:'☕', restaurant:'🍽️', bar:'🍺', park:'🌳', gym:'💪', bookstore:'📚', museum:'🏛️', theater:'🎭', music_venue:'🎵', gallery:'🎨', market:'🛒', beach:'🏖️', default:'📍' };
function getCategoryIcon(c) { if(!c) return '📍'; return CATEGORY_ICONS[c.toLowerCase().replace(/\s+/g,'_')]||'📍'; }

const SpotSearchSheet = forwardRef(function SpotSearchSheet({ onSelectSpot }, ref) {
  const colors = getColors();
  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ['75%'], []);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);

  useImperativeHandle(ref, () => ({
    expand: () => sheetRef.current?.expand(),
    close: () => sheetRef.current?.close(),
  }));

  const handleSearch = useCallback((text) => {
    setQuery(text);
    if (timer.current) clearTimeout(timer.current);
    if (!text.trim() || text.trim().length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try { const data = await profileApi.searchPlaces(text.trim()); setResults(data || []); }
      catch (e) { setResults([]); }
      setSearching(false);
    }, 350);
  }, []);

  const handleSelect = useCallback((place) => {
    onSelectSpot?.(place);
    sheetRef.current?.close();
    setQuery(''); setResults([]);
  }, [onSelectSpot]);

  const renderBackdrop = useCallback((props) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
  ), []);

  const renderResult = ({ item }) => (
    <TouchableOpacity style={[styles.resultItem, { borderBottomColor: colors.border }]} onPress={() => handleSelect(item)} activeOpacity={0.7}>
      <Text style={styles.resultIcon}>{getCategoryIcon(item.category)}</Text>
      <View style={styles.resultInfo}>
        <Text style={[styles.resultName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        {item.neighborhood && (
          <View style={styles.resultNeighborhood}>
            <MapPin size={11} color={colors.textMuted} />
            <Text style={[styles.resultArea, { color: colors.textMuted }]} numberOfLines={1}>{item.neighborhood}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.resultCat, { color: colors.textSecondary }]}>{item.category || 'Place'}</Text>
    </TouchableOpacity>
  );

  return (
    <BottomSheet ref={sheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose backgroundStyle={{ backgroundColor: colors.surface }} handleIndicatorStyle={{ backgroundColor: colors.textMuted }} backdropComponent={renderBackdrop}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{STRINGS.SPOT_SEARCH_TITLE}</Text>
        <View style={[styles.searchBox, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
          <Search size={18} color={colors.textMuted} />
          <TextInput style={[styles.searchInput, { color: colors.text }]} value={query} onChangeText={handleSearch} placeholder={STRINGS.SPOT_SEARCH_PLACEHOLDER} placeholderTextColor={colors.inputPlaceholder} returnKeyType="search" />
          {searching && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
        <FlatList data={results} keyExtractor={(item, i) => `${item.placeId||item.name}-${i}`} renderItem={renderResult}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>{searching ? STRINGS.LOADING : query.length >= 2 ? STRINGS.SPOT_NO_RESULTS : STRINGS.SPOT_SEARCH_HINT}</Text>}
          contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} />
      </View>
    </BottomSheet>
  );
});

SpotSearchSheet.propTypes = { onSelectSpot: PropTypes.func.isRequired };
export default SpotSearchSheet;

const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.lg },
  title: { ...typography.heading, marginBottom: spacing.md },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: spacing.sm, gap: spacing.sm, marginBottom: spacing.md },
  searchInput: { ...typography.body, flex: 1, paddingVertical: spacing.sm },
  list: { paddingBottom: spacing.xxl },
  resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, gap: spacing.sm },
  resultIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  resultInfo: { flex: 1 },
  resultName: { ...typography.bodyBold, marginBottom: 2 },
  resultNeighborhood: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  resultArea: { ...typography.captionSmall },
  resultCat: { ...typography.caption, textTransform: 'capitalize' },
  empty: { ...typography.body, textAlign: 'center', marginTop: spacing.xl },
});
