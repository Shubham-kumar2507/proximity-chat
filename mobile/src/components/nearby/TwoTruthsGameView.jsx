/**
 * TwoTruthsGameView — Main game UI inside the expanded bottom sheet.
 * Handles the 4 states: IDLE, SELECTED, CORRECT, WRONG, plus LOCKED.
 *
 * @module components/nearby/TwoTruthsGameView
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import PropTypes from 'prop-types';
import { getColors, typography, spacing } from '../../constants/theme';
import useTwoTruthsGame, { GAME_STATE } from '../../hooks/useTwoTruthsGame';
import TwoTruthsOptionCard from './TwoTruthsOptionCard';

let ConfettiCannon = null;
try {
  ConfettiCannon = require('react-native-confetti-cannon').default;
} catch (e) {
  // Optional dependency
}

/**
 * @param {Object} props
 * @param {string} props.targetUserId - The user being guessed
 * @param {string} props.targetName - Name of the target user
 * @param {Function} props.onSendConnection - Called when guess is correct to send a special request
 * @param {Function} props.onViewProfile - Called to view full profile (wrong guess fallback)
 * @param {Function} props.onSendChatRequest - Called for normal chat request
 * @param {Function} props.onDismiss - Called to close game and return to sheet
 */
export default function TwoTruthsGameView({
  targetUserId,
  targetName,
  onSendConnection,
  onViewProfile,
  onSendChatRequest,
  onDismiss,
}) {
  const colors = getColors();
  const game = useTwoTruthsGame(targetUserId);

  useEffect(() => {
    if (game.gameState === GAME_STATE.CORRECT) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (game.gameState === GAME_STATE.WRONG) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [game.gameState]);

  const handleCardPress = (index) => {
    if (game.gameState === GAME_STATE.IDLE || game.gameState === GAME_STATE.SELECTED) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      game.selectOption(index);
    }
  };

  const renderCardState = (index) => {
    if (game.gameState === GAME_STATE.IDLE) return 'idle';
    if (game.gameState === GAME_STATE.SELECTED) {
      return game.selectedIndex === index ? 'selected' : 'dimmed';
    }
    if (game.gameState === GAME_STATE.CORRECT) {
      return game.selectedIndex === index ? 'correct' : 'truth';
    }
    if (game.gameState === GAME_STATE.WRONG) {
      return game.selectedIndex === index ? 'wrong' : 'dimmed';
    }
    return 'idle';
  };

  if (game.gameState === GAME_STATE.LOADING) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (game.gameState === GAME_STATE.LOCKED) {
    return (
      <Animated.View entering={FadeIn} style={styles.centerContainer}>
        <Text style={[styles.lockedTitle, { color: colors.text }]}>You already guessed today ⏳</Text>
        <Text style={[styles.lockedSubtitle, { color: colors.textMuted }]}>
          Try again tomorrow to see if you can spot the lie.
        </Text>
        <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.border }]} onPress={onDismiss}>
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Go Back</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (game.gameState === GAME_STATE.ERROR) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: colors.danger }}>Failed to load game.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {game.gameState === GAME_STATE.CORRECT && ConfettiCannon && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ConfettiCannon count={100} origin={{ x: -10, y: 0 }} fallSpeed={2500} fadeOut />
        </View>
      )}

      {/* Header Area */}
      <View style={styles.header}>
        {game.gameState === GAME_STATE.CORRECT ? (
          <Animated.View entering={FadeInDown}>
            <Text style={[styles.title, { color: colors.text }]}>You got it! 🎉</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>You found {targetName}'s lie</Text>
          </Animated.View>
        ) : game.gameState === GAME_STATE.WRONG ? (
          <Animated.View entering={FadeInDown}>
            <Text style={[styles.title, { color: colors.text }]}>Not quite! 😅</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Want to see their full profile for more clues?</Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown}>
            <Text style={[styles.title, { color: colors.text }]}>Which one is the lie? 🤔</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{targetName} dares you to find it</Text>
          </Animated.View>
        )}
      </View>

      {/* Cards List */}
      <View style={styles.cardsContainer}>
        {game.statements.map((stmt, i) => (
          <TwoTruthsOptionCard
            key={stmt.index}
            index={i}
            text={stmt.text}
            state={renderCardState(i)}
            onPress={handleCardPress}
            animDelay={i * 100}
          />
        ))}
      </View>

      {/* Action Area */}
      <View style={styles.actionArea}>
        {game.gameState === GAME_STATE.IDLE && (
          <Text style={[styles.helperText, { color: colors.textMuted }]}>
            Guess right and {targetName} gets notified instantly 🔔
          </Text>
        )}

        {game.gameState === GAME_STATE.SELECTED && (
          <Animated.View entering={ZoomIn.duration(300)}>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={game.confirmGuess}
              disabled={game.isSubmitting}
            >
              {game.isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Lock In My Guess 🔒</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.textButton} onPress={game.resetSelection} disabled={game.isSubmitting}>
              <Text style={[styles.textButtonText, { color: colors.textMuted }]}>Change my mind</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {game.gameState === GAME_STATE.CORRECT && (
          <Animated.View entering={FadeInDown.delay(200)}>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: '#10b981' }]}
              onPress={() => onSendConnection(game.statements[game.selectedIndex]?.text)}
            >
              <Text style={styles.primaryButtonText}>Send Connection Request 🤝</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.textButton} onPress={onDismiss}>
              <Text style={[styles.textButtonText, { color: colors.textMuted }]}>Maybe later</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {game.gameState === GAME_STATE.WRONG && (
          <Animated.View entering={FadeInDown.delay(200)}>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border }]}
              onPress={onViewProfile}
            >
              <Text style={[styles.primaryButtonText, { color: colors.text }]}>View Full Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={onSendChatRequest}>
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Send Chat Request Anyway</Text>
            </TouchableOpacity>
            <Text style={[styles.rateLimitText, { color: colors.textMuted }]}>Try again in 24h</Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

TwoTruthsGameView.propTypes = {
  targetUserId: PropTypes.string.isRequired,
  targetName: PropTypes.string.isRequired,
  onSendConnection: PropTypes.func.isRequired,
  onViewProfile: PropTypes.func.isRequired,
  onSendChatRequest: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...typography.heading,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  lockedTitle: {
    ...typography.heading,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  lockedSubtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  cardsContainer: {
    marginBottom: spacing.xl,
  },
  actionArea: {
    alignItems: 'center',
  },
  helperText: {
    ...typography.caption,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    ...typography.button,
    color: '#fff',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  secondaryButtonText: {
    ...typography.buttonSmall,
  },
  textButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  textButtonText: {
    ...typography.buttonSmall,
  },
  rateLimitText: {
    ...typography.captionSmall,
    marginTop: spacing.md,
  },
});
