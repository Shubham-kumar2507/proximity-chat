/**
 * CorrectGuessToast — In-app notification when someone guesses your lie.
 * Listens to socket events and slides down from the top.
 *
 * @module components/nearby/CorrectGuessToast
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User } from 'lucide-react-native';
import socketService from '../../services/socket';
import { getColors, typography, spacing, radius, shadows } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

export default function CorrectGuessToast() {
  const [toastData, setToastData] = useState(null);
  const translateY = useSharedValue(-150);
  const opacity = useSharedValue(0);
  const insets = useSafeAreaInsets();
  const colors = getColors();

  useEffect(() => {
    const handleLieGuessed = (payload) => {
      setToastData(payload);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Animate in
      translateY.value = withSpring(insets.top + spacing.md, { damping: 12, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 300 });

      // Auto dismiss after 8s
      setTimeout(() => {
        dismissToast();
      }, 8000);
    };

    socketService.on('lie_guessed', handleLieGuessed);

    return () => {
      socketService.off('lie_guessed', handleLieGuessed);
    };
  }, [insets.top]);

  const dismissToast = () => {
    translateY.value = withTiming(-150, { duration: 300 }, () => {
      runOnJS(setToastData)(null);
    });
    opacity.value = withTiming(0, { duration: 300 });
  };

  const handleConnect = () => {
    // Implement connect logic or navigate to request screen
    dismissToast();
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!toastData) return null;

  return (
    <Animated.View style={[styles.container, animStyle, { backgroundColor: colors.surfaceElevated, shadowColor: colors.primary }]}>
      <View style={styles.content}>
        {toastData.guesser_photo_url ? (
          <Image 
            source={{ uri: toastData.guesser_photo_url }} 
            style={styles.avatar} 
          />
        ) : (
          <View style={styles.avatarFallback}>
            <User size={24} color={colors.primary} />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            {toastData.guesser_name} guessed your lie! 🎯
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={2}>
            "{toastData.guessed_statement}"
          </Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primarySurface }]} onPress={handleConnect}>
          <Text style={[styles.btnText, { color: colors.primary }]}>Connect 🤝</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={dismissToast}>
          <Text style={[styles.btnText, { color: colors.textMuted }]}>Ignore</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: spacing.lg,
    right: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 9999,
    ...shadows.glow,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.bodyBold,
  },
  subtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  btnText: {
    ...typography.buttonSmall,
  },
});
