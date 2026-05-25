/**
 * GlanceTrimPreview — Video trim & preview screen for Glance uploads.
 *
 * Shows a circular preview of the selected video with playback controls.
 * If the video is longer than 3 seconds, provides a simple trim interface.
 * Uses expo-av for playback preview.
 *
 * @module GlanceTrimPreview
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import PropTypes from 'prop-types';
import {
  getColors,
  spacing,
  typography,
  radius,
  profileTokens,
} from '../../constants/theme';
import STRINGS from '../../constants/strings';

// Lazy-load expo-av
let VideoComponent = null;
let ResizeMode = null;
try {
  const av = require('expo-av');
  VideoComponent = av.Video;
  ResizeMode = av.ResizeMode;
} catch (e) {
  // expo-av not available
}

const MAX_DURATION_MS = profileTokens.glanceMaxDuration * 1000;

/**
 * Trim & preview modal for glance videos.
 *
 * @param {Object} props
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {string|null} props.videoUri - URI of the video to preview
 * @param {number} [props.videoDuration] - Duration in ms
 * @param {Function} props.onConfirm - Called with { uri, startMs, endMs }
 * @param {Function} props.onCancel - Called when user dismisses
 * @returns {React.ReactElement}
 */
export default function GlanceTrimPreview({
  visible,
  videoUri,
  videoDuration,
  onConfirm,
  onCancel,
}) {
  const colors = getColors();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(
    Math.min(videoDuration || MAX_DURATION_MS, MAX_DURATION_MS)
  );
  const [isLoading, setIsLoading] = useState(true);

  const needsTrim = (videoDuration || 0) > MAX_DURATION_MS;

  // Reset state when video changes
  useEffect(() => {
    setTrimStart(0);
    setTrimEnd(Math.min(videoDuration || MAX_DURATION_MS, MAX_DURATION_MS));
    setIsPlaying(true);
    setIsLoading(true);
  }, [videoUri, videoDuration]);

  const handlePlaybackStatusUpdate = useCallback(
    (status) => {
      if (status.isLoaded) {
        setIsLoading(false);
        setCurrentPosition(status.positionMillis || 0);

        // Loop within trim bounds
        if (status.positionMillis >= trimEnd) {
          videoRef.current?.setPositionAsync(trimStart);
        }
      }
    },
    [trimStart, trimEnd]
  );

  const handleConfirm = () => {
    onConfirm?.({
      uri: videoUri,
      startMs: trimStart,
      endMs: trimEnd,
    });
  };

  /**
   * Simple trim slider — move the 3s window within the full video.
   */
  const handleTrimSlide = (direction) => {
    const step = 500; // 500ms steps
    if (direction === 'left') {
      const newStart = Math.max(0, trimStart - step);
      setTrimStart(newStart);
      setTrimEnd(newStart + MAX_DURATION_MS);
    } else {
      const maxStart = (videoDuration || MAX_DURATION_MS) - MAX_DURATION_MS;
      const newStart = Math.min(maxStart, trimStart + step);
      setTrimStart(newStart);
      setTrimEnd(newStart + MAX_DURATION_MS);
    }
    // Seek to new trim start
    videoRef.current?.setPositionAsync(trimStart);
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${seconds}.${tenths}s`;
  };

  if (!VideoComponent || !videoUri) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}
    >
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {STRINGS.GLANCE_TRIM_TITLE}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Video Preview */}
        <View style={styles.previewContainer}>
          <View style={styles.circularPreview}>
            {isLoading && (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={StyleSheet.absoluteFill}
              />
            )}
            <VideoComponent
              ref={videoRef}
              source={{ uri: videoUri }}
              style={styles.video}
              resizeMode={ResizeMode?.COVER || 'cover'}
              isLooping
              isMuted
              shouldPlay={isPlaying}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              useNativeControls={false}
            />
          </View>

          {/* Duration indicator */}
          <Text style={[styles.durationText, { color: colors.textSecondary }]}>
            {formatTime(currentPosition - trimStart)} / {formatTime(trimEnd - trimStart)}
          </Text>
        </View>

        {/* Trim Controls — only if video needs trimming */}
        {needsTrim && (
          <View style={styles.trimContainer}>
            <Text style={[styles.trimLabel, { color: colors.textSecondary }]}>
              Select 3-second window
            </Text>
            <View style={styles.trimControls}>
              <TouchableOpacity
                style={[styles.trimBtn, { backgroundColor: colors.surfaceElevated }]}
                onPress={() => handleTrimSlide('left')}
                disabled={trimStart <= 0}
              >
                <Text style={[styles.trimBtnText, { color: colors.text }]}>◀ Earlier</Text>
              </TouchableOpacity>

              <Text style={[styles.trimRange, { color: colors.primary }]}>
                {formatTime(trimStart)} – {formatTime(trimEnd)}
              </Text>

              <TouchableOpacity
                style={[styles.trimBtn, { backgroundColor: colors.surfaceElevated }]}
                onPress={() => handleTrimSlide('right')}
                disabled={trimEnd >= (videoDuration || MAX_DURATION_MS)}
              >
                <Text style={[styles.trimBtnText, { color: colors.text }]}>Later ▶</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.cancelBtn, { borderColor: colors.border }]}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
              {STRINGS.CANCEL}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmBtnText}>{STRINGS.GLANCE_CONFIRM}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

GlanceTrimPreview.propTypes = {
  visible: PropTypes.bool.isRequired,
  videoUri: PropTypes.string,
  videoDuration: PropTypes.number,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

GlanceTrimPreview.defaultProps = {
  videoUri: null,
  videoDuration: 0,
};

const { photoSize } = profileTokens;
const previewSize = photoSize * 1.6;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.heading,
  },
  previewContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  circularPreview: {
    width: previewSize,
    height: previewSize,
    borderRadius: previewSize / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: previewSize,
    height: previewSize,
  },
  durationText: {
    ...typography.caption,
  },
  trimContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  trimLabel: {
    ...typography.captionSmall,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  trimControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  trimBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  trimBtnText: {
    ...typography.captionSmall,
  },
  trimRange: {
    ...typography.bodyBold,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: {
    ...typography.buttonSmall,
  },
  confirmBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  confirmBtnText: {
    ...typography.button,
    color: '#FFFFFF',
  },
});
