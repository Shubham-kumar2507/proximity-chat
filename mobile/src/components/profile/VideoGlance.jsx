/**
 * VideoGlance — Circular looping 3-second video profile component.
 *
 * Replaces the static profile photo with a silently looping video
 * clipped to a circle. Auto-plays when in focus, pauses when not.
 * Falls back to static photo on error or timeout.
 *
 * Shows a small "▶ Glance" label bottom-right of the circular frame.
 *
 * @module VideoGlance
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, AppState } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import PropTypes from 'prop-types';
import { getColors, profileTokens, spacing, typography, radius } from '../../constants/theme';
import STRINGS from '../../constants/strings';

// Lazy-load expo-av — gracefully degrade if not installed
let Video = null;
let ResizeMode = null;
try {
  const av = require('expo-av');
  Video = av.Video;
  ResizeMode = av.ResizeMode;
} catch (e) {
  // expo-av not available
}

/**
 * Circular looping video glance component.
 *
 * @param {Object} props
 * @param {string|null} props.videoUri - URI of the glance video
 * @param {string|null} props.photoUri - Fallback static photo URI
 * @param {boolean} props.isScreenFocused - Whether the profile screen is in focus
 * @returns {React.ReactElement}
 */
export default function VideoGlance({ videoUri, photoUri, isScreenFocused }) {
  const colors = getColors();
  const videoRef = useRef(null);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const appState = useRef(AppState.currentState);
  const [appActive, setAppActive] = useState(true);

  // Track app state (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppActive(nextState === 'active');
      appState.current = nextState;
    });
    return () => subscription?.remove();
  }, []);

  // Play/pause based on focus and app state
  useEffect(() => {
    if (!videoRef.current || !Video) return;

    const shouldPlay = isScreenFocused && appActive && !hasError && isLoaded;
    if (shouldPlay) {
      videoRef.current.playAsync?.().catch(() => {});
    } else {
      videoRef.current.pauseAsync?.().catch(() => {});
    }
  }, [isScreenFocused, appActive, hasError, isLoaded]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(false);
  }, []);

  // Shimmer for loading state
  const shimmerOpacity = useSharedValue(0.3);
  useEffect(() => {
    shimmerOpacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));

  const showVideo = videoUri && Video && !hasError;
  const { photoSize } = profileTokens;

  return (
    <View style={styles.container}>
      {showVideo ? (
        <>
          {/* Video player clipped to circle */}
          <View style={[styles.videoMask, { backgroundColor: colors.background }]}>
            {!isLoaded && (
              <Animated.View
                style={[
                  styles.shimmerPlaceholder,
                  { backgroundColor: colors.shimmer },
                  shimmerStyle,
                ]}
              />
            )}
            <Video
              ref={videoRef}
              source={{ uri: videoUri }}
              style={styles.video}
              resizeMode={ResizeMode?.COVER || 'cover'}
              isLooping
              isMuted
              shouldPlay={isScreenFocused && appActive}
              onLoad={handleLoad}
              onError={handleError}
              useNativeControls={false}
            />
          </View>

          {/* Glance label */}
          <View style={[styles.glanceLabel, { backgroundColor: colors.surface + 'CC' }]}>
            <Text style={[styles.glanceLabelText, { color: colors.text }]}>
              {STRINGS.GLANCE_LABEL}
            </Text>
          </View>
        </>
      ) : (
        /* Static photo fallback */
        <Image
          source={
            photoUri
              ? { uri: photoUri }
              : require('../../../assets/favicon.png')
          }
          style={styles.photo}
        />
      )}
    </View>
  );
}

VideoGlance.propTypes = {
  videoUri: PropTypes.string,
  photoUri: PropTypes.string,
  isScreenFocused: PropTypes.bool,
};

VideoGlance.defaultProps = {
  videoUri: null,
  photoUri: null,
  isScreenFocused: true,
};

const { photoSize } = profileTokens;

const styles = StyleSheet.create({
  container: {
    width: photoSize,
    height: photoSize,
    borderRadius: photoSize / 2,
    overflow: 'hidden',
    position: 'relative',
  },
  videoMask: {
    width: photoSize,
    height: photoSize,
    borderRadius: photoSize / 2,
    overflow: 'hidden',
  },
  video: {
    width: photoSize,
    height: photoSize,
  },
  shimmerPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: photoSize / 2,
  },
  photo: {
    width: photoSize,
    height: photoSize,
    borderRadius: photoSize / 2,
  },
  glanceLabel: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  glanceLabelText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
