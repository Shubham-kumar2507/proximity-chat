/**
 * ConnectionRequestBadge — 'Lie Detective' badge for special requests.
 *
 * @module components/nearby/ConnectionRequestBadge
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getColors, typography, radius } from '../../constants/theme';

export default function ConnectionRequestBadge() {
  const colors = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: colors.accent + '20', borderColor: colors.accent }]}>
      <Text style={[styles.text, { color: colors.accent }]}>🎭 Lie Detective</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginBottom: 8,
  },
  text: {
    ...typography.captionSmall,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
