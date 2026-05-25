/**
 * MoodGradientRing — Animated gradient border around the profile photo.
 *
 * Renders a continuously rotating ring using Reanimated 3.
 * Supports 6 mood presets; tapping opens MoodPickerSheet on own profile.
 *
 * @module MoodGradientRing
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import PropTypes from 'prop-types';
import { MOOD_PRESETS, profileTokens, getColors } from '../../constants/theme';
import VideoGlance from './VideoGlance';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

/**
 * Animated gradient ring surrounding the profile photo.
 *
 * @param {Object} props
 * @param {string} props.photoUri - URI of the profile photo
 * @param {string} props.moodKey - Key matching one of the MOOD_PRESETS
 * @param {boolean} props.isOwnProfile - Whether this is the user's own profile
 * @param {Function} [props.onRingPress] - Called when ring is tapped (own profile)
 * @returns {React.ReactElement}
 */
export default function MoodGradientRing({ photoUri, moodKey, isOwnProfile, onRingPress, glanceVideoUrl }) {
  const colors = getColors();
  const rotation = useSharedValue(0);

  // Find current mood or default to chill
  const mood = MOOD_PRESETS.find((m) => m.key === moodKey) || MOOD_PRESETS[2];

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1, // infinite
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const ringContent = (
    <View style={styles.container}>
      {/* Rotating gradient ring */}
      <Animated.View style={[styles.ringOuter, animatedStyle]}>
        <LinearGradient
          colors={mood.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientRing}
        />
      </Animated.View>

      {/* Photo / Video Glance mask */}
      <View style={[styles.photoContainer, { backgroundColor: colors.background }]}>
        {glanceVideoUrl ? (
          <VideoGlance
            videoUri={glanceVideoUrl}
            photoUri={photoUri}
            isScreenFocused={true}
          />
        ) : (
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
    </View>
  );

  if (isOwnProfile && onRingPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onRingPress}>
        {ringContent}
      </TouchableOpacity>
    );
  }

  return ringContent;
}

MoodGradientRing.propTypes = {
  photoUri: PropTypes.string,
  moodKey: PropTypes.string,
  isOwnProfile: PropTypes.bool.isRequired,
  onRingPress: PropTypes.func,
  glanceVideoUrl: PropTypes.string,
};

MoodGradientRing.defaultProps = {
  moodKey: 'chill',
  photoUri: null,
  onRingPress: null,
  glanceVideoUrl: null,
};

const { photoSize, ringSize, ringStroke } = profileTokens;

const styles = StyleSheet.create({
  container: {
    width: ringSize,
    height: ringSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    position: 'absolute',
    width: ringSize,
    height: ringSize,
    borderRadius: ringSize / 2,
    overflow: 'hidden',
  },
  gradientRing: {
    flex: 1,
    borderRadius: ringSize / 2,
  },
  photoContainer: {
    width: photoSize + ringStroke * 2,
    height: photoSize + ringStroke * 2,
    borderRadius: (photoSize + ringStroke * 2) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: photoSize,
    height: photoSize,
    borderRadius: photoSize / 2,
  },
});
