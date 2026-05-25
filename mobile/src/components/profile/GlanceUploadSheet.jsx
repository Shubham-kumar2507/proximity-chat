/**
 * GlanceUploadSheet — Bottom sheet for uploading profile media.
 *
 * Provides 3 options:
 * 1. Upload Photo (static profile image)
 * 2. Record Glance (3s) — opens device camera
 * 3. Upload Video Glance — picks video from library
 *
 * Enforces 10MB client-side file size limit for videos.
 *
 * @module GlanceUploadSheet
 */

import React, { useCallback, useMemo, forwardRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Camera, Upload, Video } from 'lucide-react-native';
import PropTypes from 'prop-types';
import {
  getColors,
  spacing,
  typography,
  radius,
  profileTokens,
} from '../../constants/theme';
import STRINGS from '../../constants/strings';

// Lazy-load image picker
let ImagePicker = null;
try {
  ImagePicker = require('expo-image-picker');
} catch (e) {
  // expo-image-picker not available
}

// Lazy-load camera
let ExpoCamera = null;
try {
  ExpoCamera = require('expo-camera');
} catch (e) {
  // expo-camera not available
}

const MAX_FILE_BYTES = profileTokens.glanceMaxFileSize * 1024 * 1024; // 10MB

/**
 * Bottom sheet for profile media upload options.
 *
 * @param {Object} props
 * @param {Function} props.onPhotoSelected - Called with { uri, type, name }
 * @param {Function} props.onVideoSelected - Called with { uri, type, name, duration }
 * @param {Function} props.onRecordPress - Called to open the camera recording flow
 * @param {React.Ref} ref - Bottom sheet ref
 * @returns {React.ReactElement}
 */
const GlanceUploadSheet = forwardRef(
  ({ onPhotoSelected, onVideoSelected, onRecordPress }, ref) => {
    const colors = getColors();
    const snapPoints = useMemo(() => ['35%'], []);

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

    /**
     * Handle photo upload from library.
     */
    const handleUploadPhoto = async () => {
      if (!ImagePicker) {
        Alert.alert('Error', 'Image picker is not available');
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please grant photo library access.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        onPhotoSelected?.({
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: asset.fileName || 'photo.jpg',
        });
        ref?.current?.close();
      }
    };

    /**
     * Handle video upload from library.
     */
    const handleUploadVideo = async () => {
      if (!ImagePicker) {
        Alert.alert('Error', 'Image picker is not available');
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please grant photo library access.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        videoMaxDuration: profileTokens.glanceMaxDuration,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];

        // Client-side file size check
        if (asset.fileSize && asset.fileSize > MAX_FILE_BYTES) {
          Alert.alert('Too Large', STRINGS.GLANCE_FILE_TOO_LARGE);
          return;
        }

        onVideoSelected?.({
          uri: asset.uri,
          type: asset.mimeType || 'video/mp4',
          name: asset.fileName || 'glance.mp4',
          duration: asset.duration || 0,
        });
        ref?.current?.close();
      }
    };

    /**
     * Handle camera recording.
     */
    const handleRecord = async () => {
      if (!ExpoCamera) {
        Alert.alert('Error', 'Camera is not available');
        return;
      }

      const permission = await ExpoCamera.Camera?.requestCameraPermissionsAsync?.();
      if (permission && !permission.granted) {
        Alert.alert('Permission Required', 'Please grant camera access.');
        return;
      }

      onRecordPress?.();
      ref?.current?.close();
    };

    const OPTIONS = [
      {
        key: 'photo',
        icon: Upload,
        label: STRINGS.GLANCE_UPLOAD_PHOTO,
        onPress: handleUploadPhoto,
        color: '#4FACFE',
      },
      {
        key: 'record',
        icon: Camera,
        label: STRINGS.GLANCE_RECORD,
        onPress: handleRecord,
        color: '#FF2D7E',
      },
      {
        key: 'video',
        icon: Video,
        label: STRINGS.GLANCE_UPLOAD_VIDEO,
        onPress: handleUploadVideo,
        color: '#43E97B',
      },
    ];

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
        backdropComponent={renderBackdrop}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>
            {STRINGS.GLANCE_UPLOAD_TITLE}
          </Text>

          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.optionRow, { backgroundColor: colors.surfaceElevated }]}
                onPress={opt.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: opt.color + '1A' }]}>
                  <Icon size={20} color={opt.color} />
                </View>
                <Text style={[styles.optionLabel, { color: colors.text }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheet>
    );
  }
);

GlanceUploadSheet.displayName = 'GlanceUploadSheet';

GlanceUploadSheet.propTypes = {
  onPhotoSelected: PropTypes.func,
  onVideoSelected: PropTypes.func,
  onRecordPress: PropTypes.func,
};

GlanceUploadSheet.defaultProps = {
  onPhotoSelected: null,
  onVideoSelected: null,
  onRecordPress: null,
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  title: {
    ...typography.heading,
    marginBottom: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    ...typography.bodyBold,
  },
});

export default GlanceUploadSheet;
