/**
 * TwoTruthsOptionCard — Individual statement card for the game.
 * Supports idle, selected, dimmed, correct, and wrong states.
 *
 * @module components/nearby/TwoTruthsOptionCard
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInRight, useAnimatedStyle, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import PropTypes from 'prop-types';
import { getColors, radius, spacing, typography } from '../../constants/theme';

const LABELS = ['A', 'B', 'C'];
const LABEL_COLORS = ['#FF2D7E', '#4FACFE', '#43E97B'];

/**
 * @param {Object} props
 * @param {number} props.index - Card index (0, 1, 2)
 * @param {string} props.text - Statement text
 * @param {string} props.state - 'idle' | 'selected' | 'dimmed' | 'correct' | 'wrong'
 * @param {Function} props.onPress - Tap handler
 * @param {number} [props.animDelay] - Entrance animation delay in ms
 */
export default function TwoTruthsOptionCard({ index, text, state, onPress, animDelay = 0 }) {
  const colors = getColors();

  const isSelected = state === 'selected';
  const isDimmed = state === 'dimmed';
  const isCorrect = state === 'correct';
  const isWrong = state === 'wrong';

  const cardStyle = [
    styles.card,
    { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' },
    isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '33' },
    isDimmed && { opacity: 0.4 },
    isCorrect && { borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.15)' },
    isWrong && { borderColor: '#FF4444', backgroundColor: 'rgba(255,68,68,0.15)' },
  ];

  return (
    <Animated.View entering={FadeInRight.delay(animDelay).duration(400).springify()}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress?.(index)}
        disabled={isCorrect || isWrong || isDimmed}
        style={cardStyle}
      >
        <View style={[styles.labelCircle, { backgroundColor: LABEL_COLORS[index] + '30' }]}>
          <Text style={[styles.labelText, { color: LABEL_COLORS[index] }]}>
            {LABELS[index]}
          </Text>
        </View>
        <Text style={[styles.statementText, { color: colors.text }]} numberOfLines={2}>
          {text}
        </Text>
        {isCorrect && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🎭 This was the lie!</Text>
          </View>
        )}
        {isWrong && (
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { color: '#FF4444' }]}>✗ Not the lie</Text>
          </View>
        )}
        {state === 'truth' && (
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { color: '#10b981' }]}>✓ Truth</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

TwoTruthsOptionCard.propTypes = {
  index: PropTypes.number.isRequired,
  text: PropTypes.string.isRequired,
  state: PropTypes.oneOf(['idle', 'selected', 'dimmed', 'correct', 'wrong', 'truth']).isRequired,
  onPress: PropTypes.func,
  animDelay: PropTypes.number,
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  labelCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  labelText: {
    fontSize: 16,
    fontWeight: '800',
  },
  statementText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
  },
  badge: {
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
});
