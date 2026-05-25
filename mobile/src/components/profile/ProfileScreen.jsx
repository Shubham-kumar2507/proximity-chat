/**
 * ProfileScreen — Main profile screen orchestrator.
 *
 * Assembles all profile components into a single ScrollView.
 * Supports both "own profile" and "viewing another user" modes.
 * Manages bottom sheet refs and all profile edit actions.
 * Phase 2: adds TwoTruthsWidget, NeighborhoodBadge, VideoGlance,
 *          MyTitlesSheet, GlanceUploadSheet, GlanceTrimPreview,
 *          and confetti celebration.
 *
 * @module ProfileScreen
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PropTypes from 'prop-types';

// Phase 1 components
import ProfileHeader from './ProfileHeader';
import StatusBar24hr from './StatusBar24hr';
import InterestPills from './InterestPills';
import WidgetCanvas from './WidgetCanvas';
import HotTakeWidget from './HotTakeWidget';
import AnthemWidget from './AnthemWidget';
import MoodPickerSheet from './MoodPickerSheet';
import TagPickerSheet from './TagPickerSheet';

// Phase 2 components
import TwoTruthsWidget from './TwoTruthsWidget';
import TwoTruthsEditorSheet from './TwoTruthsEditorSheet';
import MyTitlesSheet from './MyTitlesSheet';
import GlanceUploadSheet from './GlanceUploadSheet';
import GlanceTrimPreview from './GlanceTrimPreview';

// Phase 3 components
import FavoriteSpotWidget from './FavoriteSpotWidget';
import SpotSearchSheet from './SpotSearchSheet';
import SpotConfirmScreen from './SpotConfirmScreen';
import ProfileAnalyticsTab from './ProfileAnalyticsTab';
import WidgetManagerSheet from './WidgetManagerSheet';
import DraggableWidgetCanvas from './DraggableWidgetCanvas';

import { useProfileStore } from '../../store/profileStore';
import { useAuthStore } from '../../store/authStore';
import profileApi from '../../services/profileApi';
import {
  getColors,
  spacing,
  typography,
  radius,
  profileTokens,
} from '../../constants/theme';
import STRINGS from '../../constants/strings';

// Confetti cannon — lazy load
let ConfettiCannon = null;
try {
  ConfettiCannon = require('react-native-confetti-cannon').default;
} catch (e) {
  // react-native-confetti-cannon not installed
}

/**
 * Profile screen component.
 *
 * When `route.params.userId` is provided, renders another user's profile.
 * Otherwise, renders the authenticated user's own profile.
 *
 * @param {Object} props
 * @param {Object} [props.route] - React Navigation route object
 * @param {Object} [props.navigation] - React Navigation navigation object
 * @returns {React.ReactElement}
 */
export default function ProfileScreen({ route, navigation }) {
  const colors = getColors();
  const insets = useSafeAreaInsets();

  // ── Route params ─────────────────────────────────────────────────
  const viewedUserId = route?.params?.userId || null;
  const viewedDistance = route?.params?.distance || null;

  // ── Stores ───────────────────────────────────────────────────────
  const { user: authUser, updateProfile, logout } = useAuthStore();
  const {
    profile,
    viewedProfile,
    isLoading,
    fetchProfile,
    fetchViewedProfile,
    clearViewedProfile,
    setStatus,
    setMood,
    setInterests,
    setHotTake,
    setAnthem,
    // Phase 2
    setTwoTruths,
    titles,
    fetchTitles,
    pinTitle,
    newTitleUnlocked,
    clearNewTitleUnlocked,
    uploadGlance,
    glanceUploading,
    // Phase 3
    setFavoriteSpot,
    removeFavoriteSpot,
    setWidgetOrder,
    setWidgetVisibility,
  } = useProfileStore();

  // ── Determine own vs. other ──────────────────────────────────────
  const isOwnProfile = !viewedUserId;
  const displayUser = isOwnProfile ? (profile || authUser) : viewedProfile;

  // ── Bottom Sheet Refs ────────────────────────────────────────────
  const moodSheetRef = useRef(null);
  const tagSheetRef = useRef(null);
  const twoTruthsEditorRef = useRef(null);  // Phase 2
  const titlesSheetRef = useRef(null);       // Phase 2
  const glanceSheetRef = useRef(null);       // Phase 2
  const confettiRef = useRef(null);          // Phase 2
  const spotSearchRef = useRef(null);        // Phase 3
  const widgetManagerRef = useRef(null);     // Phase 3

  // ── Local State ──────────────────────────────────────────────────
  const [glanceTrimVisible, setGlanceTrimVisible] = useState(false);
  const [pendingGlanceVideo, setPendingGlanceVideo] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // Phase 3: 'profile' | 'stats'
  const [spotConfirmVisible, setSpotConfirmVisible] = useState(false);
  const [pendingSpot, setPendingSpot] = useState(null);

  // ── Data Fetching ────────────────────────────────────────────────
  useEffect(() => {
    if (isOwnProfile) {
      fetchProfile();
      fetchTitles(); // Phase 2
    } else {
      fetchViewedProfile(viewedUserId);
    }
    return () => {
      if (!isOwnProfile) clearViewedProfile();
    };
  }, [viewedUserId]);

  // ── Confetti on new title unlock (Phase 2) ───────────────────────
  useEffect(() => {
    if (newTitleUnlocked && confettiRef.current) {
      confettiRef.current.start();
      const timer = setTimeout(() => {
        clearNewTitleUnlocked();
      }, profileTokens.confettiDuration);
      return () => clearTimeout(timer);
    }
  }, [newTitleUnlocked]);

  // ── Handlers (Phase 1 & 3 Profile Level) ────────────────────────
  const handleEditPress = () => {
    // In Phase 3, this opens the Widget Manager instead of generic profile edit
    if (isOwnProfile) {
      widgetManagerRef.current?.expand();
    }
  };

  const handleRingPress = () => {
    moodSheetRef.current?.expand();
  };

  const handleMoodSelect = useCallback(
    (moodKey) => {
      setMood(moodKey);
    },
    [setMood]
  );

  const handleStatusUpdate = useCallback(
    (text) => {
      setStatus(text);
    },
    [setStatus]
  );

  const handleAddInterests = () => {
    tagSheetRef.current?.expand();
  };

  const handleInterestsDone = useCallback(
    (interests) => {
      setInterests(interests);
    },
    [setInterests]
  );

  const handleHotTakeSave = useCallback(
    (hotTake) => {
      setHotTake(hotTake);
    },
    [setHotTake]
  );

  const handleHotTakeReact = useCallback(
    async (reaction) => {
      if (!viewedUserId) return;
      try {
        await profileApi.reactToHotTake(viewedUserId, reaction);
        fetchViewedProfile(viewedUserId);
      } catch (e) {
        console.warn('Reaction failed:', e.message);
      }
    },
    [viewedUserId]
  );

  const handleAnthemSave = useCallback(
    (anthem) => {
      setAnthem(anthem);
    },
    [setAnthem]
  );

  const handleAnthemSearch = useCallback(async (query) => {
    try {
      return await profileApi.searchSongs(query);
    } catch (e) {
      return [];
    }
  }, []);

  const handleSendRequest = async () => {
    if (!viewedUserId) return;
    try {
      await profileApi.sendChatRequest(viewedUserId);
      Alert.alert('Done', STRINGS.CHAT_REQUEST_SENT);
    } catch (e) {
      Alert.alert('Error', STRINGS.ERROR_GENERIC);
    }
  };

  const handleLogout = () => {
    Alert.alert(STRINGS.SIGN_OUT, STRINGS.SIGN_OUT_CONFIRM, [
      { text: STRINGS.CANCEL, style: 'cancel' },
      { text: STRINGS.SIGN_OUT, style: 'destructive', onPress: logout },
    ]);
  };

  // ── Handlers (Phase 2 — Two Truths) ─────────────────────────────
  const handleTwoTruthsEdit = () => {
    twoTruthsEditorRef.current?.expand();
  };

  const handleTwoTruthsSave = useCallback(
    (data) => {
      setTwoTruths(data);
    },
    [setTwoTruths]
  );

  const handleGuessAndChat = useCallback(
    async ({ guessIndex, statement }) => {
      if (!viewedUserId) return;
      try {
        await profileApi.submitTwoTruthsGuess(viewedUserId, guessIndex);
        const icebreaker = STRINGS.TWO_TRUTHS_ICEBREAKER(statement);
        await profileApi.sendChatRequest(viewedUserId, icebreaker);
        Alert.alert('Sent!', 'Your guess and chat request have been sent.');
      } catch (e) {
        Alert.alert('Error', STRINGS.ERROR_GENERIC);
      }
    },
    [viewedUserId]
  );

  const handleQuietGuess = useCallback(
    async (guessIndex) => {
      if (!viewedUserId) return;
      try {
        await profileApi.submitTwoTruthsGuess(viewedUserId, guessIndex);
      } catch (e) {
        console.warn('Quiet guess failed:', e.message);
      }
    },
    [viewedUserId]
  );

  // ── Handlers (Phase 2 — Titles) ─────────────────────────────────
  const handleTitlePress = () => {
    titlesSheetRef.current?.expand();
  };

  const handlePinTitle = useCallback(
    (titleKey) => {
      pinTitle(titleKey);
    },
    [pinTitle]
  );

  // ── Handlers (Phase 2 — Glance) ─────────────────────────────────
  const handlePhotoLongPress = () => {
    glanceSheetRef.current?.expand();
  };

  const handlePhotoSelected = useCallback(
    async (file) => {
      try {
        await profileApi.updateMyProfile({ profilePhoto: file.uri });
        fetchProfile();
      } catch (e) {
        Alert.alert('Error', STRINGS.ERROR_GENERIC);
      }
    },
    [fetchProfile]
  );

  const handleVideoSelected = useCallback((videoFile) => {
    setPendingGlanceVideo(videoFile);
    // If video needs trimming (> 3s), show trim preview
    if (videoFile.duration && videoFile.duration > profileTokens.glanceMaxDuration * 1000) {
      setGlanceTrimVisible(true);
    } else {
      // Direct upload
      handleGlanceConfirm({ uri: videoFile.uri, startMs: 0, endMs: videoFile.duration || 3000 });
    }
  }, []);

  const handleRecordPress = useCallback(() => {
    // In Phase 2, this opens the camera for recording
    // For now, we open the video picker as a fallback
    Alert.alert(
      STRINGS.GLANCE_RECORD,
      'Camera recording will use expo-camera. Opening video picker as fallback.'
    );
  }, []);

  const handleGlanceConfirm = useCallback(
    async ({ uri }) => {
      setGlanceTrimVisible(false);
      try {
        await uploadGlance({
          uri,
          type: 'video/mp4',
          name: 'glance.mp4',
        });
      } catch (e) {
        Alert.alert('Error', STRINGS.ERROR_GENERIC);
      }
      setPendingGlanceVideo(null);
    },
    [uploadGlance]
  );

  const handleGlanceTrimCancel = useCallback(() => {
    setGlanceTrimVisible(false);
    setPendingGlanceVideo(null);
  }, []);

  // ── Handlers (Phase 3 — Favorite Spot & Widgets) ──────────────
  const handleTagSpot = () => {
    spotSearchRef.current?.expand();
  };

  const handleChangeSpot = () => {
    Alert.alert(STRINGS.SPOT_LABEL, 'What would you like to do?', [
      { text: STRINGS.SPOT_CHANGE, onPress: () => spotSearchRef.current?.expand() },
      { text: STRINGS.SPOT_REMOVE, style: 'destructive', onPress: removeFavoriteSpot },
      { text: STRINGS.CANCEL, style: 'cancel' },
    ]);
  };

  const handleSpotSelected = (place) => {
    setPendingSpot(place);
    setSpotConfirmVisible(true);
  };

  const handleSpotConfirm = () => {
    if (pendingSpot) {
      setFavoriteSpot(pendingSpot);
    }
    setSpotConfirmVisible(false);
    setPendingSpot(null);
  };

  const handleSpotCancel = () => {
    setSpotConfirmVisible(false);
    setPendingSpot(null);
  };

  const handleWidgetReorder = useCallback((order) => {
    setWidgetOrder(order);
  }, [setWidgetOrder]);

  const handleWidgetVisibilityToggle = useCallback((key, isVisible) => {
    setWidgetVisibility(key, isVisible);
  }, [setWidgetVisibility]);

  // ── Render ───────────────────────────────────────────────────────
  if (!displayUser) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>
          {STRINGS.LOADING}
        </Text>
      </View>
    );
  }

  const viewerInterests = isOwnProfile ? [] : (profile?.interests || authUser?.interests || []);

  const renderTabs = () => {
    if (!isOwnProfile) return null;
    return (
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' ? { color: colors.primary } : { color: colors.textMuted }]}>
            {STRINGS.ANALYTICS_PROFILE_TAB}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' ? { color: colors.primary } : { color: colors.textMuted }]}>
            {STRINGS.ANALYTICS_TAB}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Tab Switcher */}
      {renderTabs()}

      {activeTab === 'stats' ? (
        <ProfileAnalyticsTab />
      ) : (
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: spacing.sm },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 24h Status Bar */}
        <View style={styles.section}>
          <StatusBar24hr
            status={displayUser.status}
            isOwnProfile={isOwnProfile}
            onStatusUpdate={handleStatusUpdate}
            animDelay={0}
          />
        </View>

        {/* Profile Header (Phase 2: now with badge + glance support) */}
        <ProfileHeader
          user={displayUser}
          isOwnProfile={isOwnProfile}
          distance={viewedDistance}
          onEditPress={handleEditPress}
          onRingPress={handleRingPress}
          onPhotoLongPress={handlePhotoLongPress}
          onTitlePress={handleTitlePress}
        />

        {/* Interest Pills */}
        <View style={styles.section}>
          <InterestPills
            interests={displayUser.interests || []}
            isOwnProfile={isOwnProfile}
            viewerInterests={viewerInterests}
            onAddPress={handleAddInterests}
          />
        </View>

        {/* Widget Canvas — Phase 3 Draggable */}
        <DraggableWidgetCanvas
          isOwnProfile={isOwnProfile}
          widgetOrder={displayUser.widgetOrder}
          widgetVisibility={displayUser.widgetVisibility}
          onReorder={handleWidgetReorder}
        >
          {/* 0. Hot Take Widget (Phase 1) */}
          <HotTakeWidget
            hotTake={displayUser.hotTake}
            isOwnProfile={isOwnProfile}
            onSave={handleHotTakeSave}
            onReact={handleHotTakeReact}
            animDelay={300}
          />

          {/* 1. Two Truths & a Lie Widget (Phase 2) */}
          <TwoTruthsWidget
            twoTruths={displayUser.twoTruths}
            isOwnProfile={isOwnProfile}
            userName={displayUser.name}
            onEdit={handleTwoTruthsEdit}
            onGuessAndChat={handleGuessAndChat}
            onQuietGuess={handleQuietGuess}
            animDelay={400}
          />

          {/* 2. Anthem Widget (Phase 1) */}
          <AnthemWidget
            anthem={displayUser.anthem}
            isOwnProfile={isOwnProfile}
            onSave={handleAnthemSave}
            onSearch={handleAnthemSearch}
            animDelay={500}
          />

          {/* 3. Favorite Spot Widget (Phase 3) */}
          <FavoriteSpotWidget
            spot={displayUser.favoriteSpot}
            isOwnProfile={isOwnProfile}
            viewedUserId={viewedUserId}
            onTagSpot={handleTagSpot}
            onChangeSpot={handleChangeSpot}
            animDelay={600}
          />
        </DraggableWidgetCanvas>

        {/* Sign Out — own profile only */}
        {isOwnProfile && (
          <View style={styles.logoutSection}>
            <TouchableOpacity
              style={[styles.logoutButton, { borderColor: colors.danger + '40' }]}
              onPress={handleLogout}
            >
              <Text style={[styles.logoutText, { color: colors.danger }]}>
                {STRINGS.SIGN_OUT}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      )}

      {/* CTA Button — viewing others only */}
      {!isOwnProfile && (
        <View
          style={[
            styles.ctaContainer,
            { paddingBottom: insets.bottom + spacing.sm },
          ]}
        >
          <TouchableOpacity onPress={handleSendRequest} activeOpacity={0.9}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>{STRINGS.SEND_CHAT_REQUEST}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Bottom Sheets ─────────────────────── */}
      {isOwnProfile && (
        <>
          <MoodPickerSheet
            ref={moodSheetRef}
            currentMood={displayUser.mood || 'chill'}
            onSelect={handleMoodSelect}
          />
          <TagPickerSheet
            ref={tagSheetRef}
            currentInterests={displayUser.interests || []}
            onDone={handleInterestsDone}
          />
          {/* Phase 2 sheets */}
          <TwoTruthsEditorSheet
            ref={twoTruthsEditorRef}
            currentData={displayUser.twoTruths ? {
              truth1: displayUser.twoTruths.truth1 || '',
              truth2: displayUser.twoTruths.truth2 || '',
              lie: displayUser.twoTruths.lie || '',
            } : null}
            onSave={handleTwoTruthsSave}
          />
          <MyTitlesSheet
            ref={titlesSheetRef}
            titles={titles}
            activeTitle={displayUser.activeTitle}
            onPin={handlePinTitle}
          />
          <GlanceUploadSheet
            ref={glanceSheetRef}
            onPhotoSelected={handlePhotoSelected}
            onVideoSelected={handleVideoSelected}
            onRecordPress={handleRecordPress}
          />
          {/* Phase 3 sheets */}
          <SpotSearchSheet
            ref={spotSearchRef}
            onSelectSpot={handleSpotSelected}
          />
          <WidgetManagerSheet
            ref={widgetManagerRef}
            visibility={displayUser.widgetVisibility}
            onToggle={handleWidgetVisibilityToggle}
          />
        </>
      )}

      {/* ── Spot Confirm Screen (Phase 3) ─────── */}
      <SpotConfirmScreen
        visible={spotConfirmVisible}
        place={pendingSpot}
        onConfirm={handleSpotConfirm}
        onCancel={handleSpotCancel}
      />

      {/* ── Glance Trim Preview Modal (Phase 2) ────── */}
      <GlanceTrimPreview
        visible={glanceTrimVisible}
        videoUri={pendingGlanceVideo?.uri}
        videoDuration={pendingGlanceVideo?.duration}
        onConfirm={handleGlanceConfirm}
        onCancel={handleGlanceTrimCancel}
      />

      {/* ── Confetti Celebration (Phase 2) ───────────── */}
      {ConfettiCannon && newTitleUnlocked && (
        <ConfettiCannon
          ref={confettiRef}
          count={80}
          origin={{ x: -10, y: 0 }}
          autoStart
          fadeOut
          fallSpeed={2500}
          explosionSpeed={350}
        />
      )}
    </View>
  );
}

ProfileScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      userId: PropTypes.string,
      distance: PropTypes.number,
    }),
  }),
  navigation: PropTypes.object,
};

ProfileScreen.defaultProps = {
  route: { params: {} },
  navigation: null,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 120,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    ...typography.buttonSmall,
  },
  section: {
    marginBottom: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
  },
  logoutSection: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  logoutButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  logoutText: {
    ...typography.buttonSmall,
  },
  // ── CTA ──────────────────────────────────
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  ctaButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    ...typography.button,
    color: '#FFFFFF',
  },
});
