/**
 * Zustand store for profile state management.
 * Manages own-profile data, viewed-profile data, and profile edits.
 * Phase 2: adds titles, two truths, glance state.
 */

import { create } from 'zustand';
import profileApi from '../services/profileApi';

export const useProfileStore = create((set, get) => ({
  // ── Own Profile ──────────────────────────────────────────────────
  profile: null,
  isLoading: false,
  error: null,

  // ── Viewed Profile (other user) ──────────────────────────────────
  viewedProfile: null,
  viewedLoading: false,

  // ── Titles (Phase 2) ─────────────────────────────────────────────
  titles: [],              // all titles with earned/locked + progress
  titlesLoading: false,
  newTitleUnlocked: null,  // set to title key when a new title is earned

  // ── Glance (Phase 2) ─────────────────────────────────────────────
  glanceUploading: false,

  /**
   * Fetch the authenticated user's own profile.
   */
  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await profileApi.fetchMyProfile();
      set({ profile: data, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  /**
   * Fetch another user's profile by ID.
   * @param {string} userId
   */
  fetchViewedProfile: async (userId) => {
    set({ viewedLoading: true });
    try {
      const data = await profileApi.fetchUserProfile(userId);
      set({ viewedProfile: data, viewedLoading: false });
    } catch (err) {
      set({ viewedProfile: null, viewedLoading: false });
    }
  },

  /**
   * Clear the viewed profile when navigating away.
   */
  clearViewedProfile: () => set({ viewedProfile: null }),

  /**
   * Update the 24h ephemeral status.
   * @param {string} text
   */
  setStatus: async (text) => {
    try {
      const data = await profileApi.updateStatus(text);
      const { profile } = get();
      set({ profile: { ...profile, status: data } });
    } catch (err) {
      console.warn('Failed to update status:', err.message);
    }
  },

  /**
   * Update mood preset.
   * @param {string} moodKey
   */
  setMood: async (moodKey) => {
    try {
      const data = await profileApi.updateMood(moodKey);
      const { profile } = get();
      set({ profile: { ...profile, mood: moodKey } });
    } catch (err) {
      console.warn('Failed to update mood:', err.message);
    }
  },

  /**
   * Update interests array.
   * @param {string[]} interests
   */
  setInterests: async (interests) => {
    try {
      await profileApi.updateInterests(interests);
      const { profile } = get();
      set({ profile: { ...profile, interests } });
    } catch (err) {
      console.warn('Failed to update interests:', err.message);
    }
  },

  /**
   * Update hot take.
   * @param {{ text: string, gradient: string }} hotTake
   */
  setHotTake: async (hotTake) => {
    try {
      await profileApi.updateHotTake(hotTake);
      const { profile } = get();
      set({ profile: { ...profile, hotTake } });
    } catch (err) {
      console.warn('Failed to update hot take:', err.message);
    }
  },

  /**
   * Update anthem.
   * @param {Object} anthem
   */
  setAnthem: async (anthem) => {
    try {
      await profileApi.updateAnthem(anthem);
      const { profile } = get();
      set({ profile: { ...profile, anthem } });
    } catch (err) {
      console.warn('Failed to update anthem:', err.message);
    }
  },

  /**
   * Update vibe status.
   * @param {string} vibeStatus
   */
  setVibeStatus: async (vibeStatus) => {
    try {
      await profileApi.updateMyProfile({ vibeStatus });
      const { profile } = get();
      set({ profile: { ...profile, vibeStatus } });
    } catch (err) {
      console.warn('Failed to update vibe status:', err.message);
    }
  },

  // ════════════════════════════════════════════════════════════════
  // Phase 2 — Two Truths & a Lie
  // ════════════════════════════════════════════════════════════════

  /**
   * Update own Two Truths & a Lie.
   * @param {Object} twoTruths - { truth1, truth2, lie }
   */
  setTwoTruths: async (twoTruths) => {
    try {
      const data = await profileApi.updateTwoTruths(twoTruths);
      const { profile } = get();
      set({ profile: { ...profile, twoTruths: data } });
    } catch (err) {
      console.warn('Failed to update two truths:', err.message);
    }
  },

  // ════════════════════════════════════════════════════════════════
  // Phase 2 — Neighborhood Titles
  // ════════════════════════════════════════════════════════════════

  /**
   * Fetch all titles for the current user.
   */
  fetchTitles: async () => {
    set({ titlesLoading: true });
    try {
      const data = await profileApi.fetchMyTitles();
      set({ titles: data.titles || data, titlesLoading: false });
    } catch (err) {
      set({ titlesLoading: false });
      console.warn('Failed to fetch titles:', err.message);
    }
  },

  /**
   * Pin a different earned title as the active one.
   * @param {string} titleKey
   */
  pinTitle: async (titleKey) => {
    try {
      await profileApi.setActiveTitle(titleKey);
      const { profile } = get();
      set({ profile: { ...profile, activeTitle: titleKey } });
    } catch (err) {
      console.warn('Failed to pin title:', err.message);
    }
  },

  /**
   * Clear the new-title-unlocked celebration flag.
   */
  clearNewTitleUnlocked: () => set({ newTitleUnlocked: null }),

  /**
   * Trigger new title celebration (called from socket/push).
   * @param {string} titleKey
   */
  triggerTitleCelebration: (titleKey) => set({ newTitleUnlocked: titleKey }),

  // ════════════════════════════════════════════════════════════════
  // Phase 2 — Video Glance
  // ════════════════════════════════════════════════════════════════

  /**
   * Upload a glance video.
   * @param {Object} videoFile - { uri, type, name }
   */
  uploadGlance: async (videoFile) => {
    set({ glanceUploading: true });
    try {
      const data = await profileApi.uploadGlance(videoFile);
      const { profile } = get();
      set({
        profile: { ...profile, glanceVideoUrl: data.glanceVideoUrl },
        glanceUploading: false,
      });
    } catch (err) {
      set({ glanceUploading: false });
      console.warn('Failed to upload glance:', err.message);
      throw err; // re-throw so the UI can show error
    }
  },

  /**
   * Remove the glance video.
   */
  removeGlance: async () => {
    try {
      await profileApi.removeGlance();
      const { profile } = get();
      set({ profile: { ...profile, glanceVideoUrl: null } });
    } catch (err) {
      console.warn('Failed to remove glance:', err.message);
    }
  },

  // ════════════════════════════════════════════════════════════════
  // Phase 3 — Favorite Local Spot
  // ════════════════════════════════════════════════════════════════

  setFavoriteSpot: async (spot) => {
    try {
      const data = await profileApi.updateFavoriteSpot(spot);
      const { profile } = get();
      set({ profile: { ...profile, favoriteSpot: data.favoriteSpot } });
    } catch (err) {
      console.warn('Failed to update favorite spot:', err.message);
    }
  },

  removeFavoriteSpot: async () => {
    try {
      await profileApi.removeFavoriteSpot();
      const { profile } = get();
      set({ profile: { ...profile, favoriteSpot: null } });
    } catch (err) {
      console.warn('Failed to remove favorite spot:', err.message);
    }
  },

  // ════════════════════════════════════════════════════════════════
  // Phase 3 — Widget Management
  // ════════════════════════════════════════════════════════════════

  setWidgetOrder: async (order) => {
    try {
      // Optimistic update
      const { profile } = get();
      set({ profile: { ...profile, widgetOrder: order } });
      await profileApi.updateWidgetOrder(order);
    } catch (err) {
      console.warn('Failed to update widget order:', err.message);
    }
  },

  setWidgetVisibility: async (key, isVisible) => {
    try {
      const { profile } = get();
      const current = profile?.widgetVisibility || {};
      const updated = { ...current, [key]: isVisible };
      // Optimistic update
      set({ profile: { ...profile, widgetVisibility: updated } });
      await profileApi.updateWidgetVisibility(updated);
    } catch (err) {
      console.warn('Failed to update widget visibility:', err.message);
    }
  },
}));

