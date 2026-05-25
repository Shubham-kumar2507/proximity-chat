/**
 * NearbyProfileOverviewSheet — Bottom sheet triggered from avatar tap.
 * Displays profile overview and embeds TwoTruthsGameView.
 *
 * @module components/nearby/NearbyProfileOverviewSheet
 */
import React, { forwardRef, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BottomSheet, BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import PropTypes from 'prop-types';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { getColors, typography, spacing, radius } from '../../constants/theme';

import OverviewHeader from './OverviewHeader';
import OverviewInterestPills from './OverviewInterestPills';
import OverviewAnthemCompact from './OverviewAnthemCompact';
import TwoTruthsGameView from './TwoTruthsGameView';

const NearbyProfileOverviewSheet = forwardRef(({ 
  user, 
  viewerInterests = [], 
  onSendChatRequest, 
  onViewProfile,
  onSendConnection 
}, ref) => {
  const colors = getColors();
  const snapPoints = useMemo(() => ['65%', '92%'], []);
  const [isPlayingGame, setIsPlayingGame] = useState(false);

  // Close sheet helper
  const handleClose = useCallback(() => {
    ref.current?.close();
    setIsPlayingGame(false);
  }, [ref]);

  // Expand to game
  const handlePlayGame = useCallback(() => {
    setIsPlayingGame(true);
    ref.current?.snapToIndex(1); // Snap to 92%
  }, [ref]);

  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
      />
    ),
    []
  );

  const renderBackground = useCallback(
    () => (
      <BlurView 
        intensity={80} 
        tint="dark" 
        style={[StyleSheet.absoluteFill, styles.blurBackground]} 
      />
    ),
    []
  );

  if (!user) return null;

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundComponent={renderBackground}
      handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
      enablePanDownToClose
      onClose={() => setIsPlayingGame(false)}
    >
      <View style={styles.contentContainer}>
        {/* Fixed Header */}
        <OverviewHeader user={user} onClose={handleClose} animDelay={0} />

        {isPlayingGame ? (
          /* FULL GAME VIEW */
          <TwoTruthsGameView
            targetUserId={user.userId || user.id}
            targetName={user.name}
            onSendConnection={(payload) => {
              handleClose();
              onSendConnection?.(user, payload);
            }}
            onViewProfile={() => {
              handleClose();
              onViewProfile?.(user);
            }}
            onSendChatRequest={() => {
              handleClose();
              onSendChatRequest?.(user);
            }}
            onDismiss={() => {
              setIsPlayingGame(false);
              ref.current?.snapToIndex(0);
            }}
          />
        ) : (
          /* OVERVIEW SHEET CONTENT */
          <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
            
            {/* Status Section */}
            {user.status && (
              <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.statusContainer}>
                <Text style={[styles.statusText, { color: colors.textInverse }]}>
                  {user.status}
                </Text>
              </Animated.View>
            )}

            {/* Interest Pills */}
            <OverviewInterestPills 
              interests={user.interests || []} 
              viewerInterests={viewerInterests} 
              animDelay={160} 
            />

            {/* Anthem */}
            <OverviewAnthemCompact 
              anthem={user.anthem} 
              animDelay={240} 
            />

            {/* Two Truths Teaser */}
            {user.twoTruths && (
              <Animated.View entering={FadeInDown.delay(320).springify()} layout={Layout.springify()} style={styles.teaserContainer}>
                <View style={[styles.teaserCard, { backgroundColor: colors.primarySurface, borderColor: colors.primary }]}>
                  <Text style={[styles.teaserTitle, { color: colors.primary }]}>🎮 Play Two Truths & a Lie</Text>
                  <Text style={[styles.teaserSubtitle, { color: colors.text }]}>Guess {user.name}'s lie to unlock a connection</Text>
                  <TouchableOpacity 
                    style={[styles.teaserButton, { backgroundColor: colors.primary }]}
                    onPress={handlePlayGame}
                  >
                    <Text style={styles.teaserButtonText}>Play Now →</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {/* Action Buttons */}
            <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  handleClose();
                  onSendChatRequest?.(user);
                }}
              >
                <Text style={styles.primaryButtonText}>Send Chat Request</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => {
                  handleClose();
                  onViewProfile?.(user);
                }}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>View Full Profile</Text>
              </TouchableOpacity>
            </Animated.View>

          </BottomSheetScrollView>
        )}
      </View>
    </BottomSheet>
  );
});

NearbyProfileOverviewSheet.displayName = 'NearbyProfileOverviewSheet';

NearbyProfileOverviewSheet.propTypes = {
  user: PropTypes.object,
  viewerInterests: PropTypes.array,
  onSendChatRequest: PropTypes.func,
  onViewProfile: PropTypes.func,
  onSendConnection: PropTypes.func,
};

const styles = StyleSheet.create({
  blurBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  contentContainer: {
    flex: 1,
    paddingTop: spacing.md,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  statusContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: radius.md,
  },
  statusText: {
    ...typography.bodyBold,
    fontStyle: 'italic',
  },
  teaserContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  teaserCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  teaserTitle: {
    ...typography.label,
    marginBottom: 4,
  },
  teaserSubtitle: {
    ...typography.body,
    marginBottom: spacing.md,
  },
  teaserButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  teaserButtonText: {
    ...typography.buttonSmall,
    color: '#fff',
  },
  actionRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.button,
    color: '#fff',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    ...typography.button,
  },
});

export default NearbyProfileOverviewSheet;
