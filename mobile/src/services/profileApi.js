/**
 * Profile-specific API helpers.
 * All profile-related network calls go through these functions.
 * Uses the shared axios instance from services/api.js.
 */

import api from '../services/api';

/**
 * Fetch the current user's full profile.
 * @returns {Promise<Object>} user profile data
 */
export async function fetchMyProfile() {
  const response = await api.get('/users/me');
  return response.data.data;
}

/**
 * Fetch another user's profile by ID.
 * @param {string} userId - The user ID to fetch
 * @returns {Promise<Object>} user profile data
 */
export async function fetchUserProfile(userId) {
  const response = await api.get(`/users/${userId}`);
  return response.data.data;
}

/**
 * Update the current user's profile fields.
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} updated profile data
 */
export async function updateMyProfile(updates) {
  const response = await api.put('/users/me', updates);
  return response.data.data;
}

/**
 * Update the 24-hour ephemeral status.
 * @param {string} text - Status text (max 60 chars)
 * @returns {Promise<Object>} updated status object { text, createdAt }
 */
export async function updateStatus(text) {
  const response = await api.put('/users/me/status', { text });
  return response.data.data;
}

/**
 * Update the user's mood preset.
 * @param {string} moodKey - One of: energetic, excited, chill, calm, focused, lowkey
 * @returns {Promise<Object>} updated profile
 */
export async function updateMood(moodKey) {
  const response = await api.put('/users/me', { mood: moodKey });
  return response.data.data;
}

/**
 * Update the user's interest tags.
 * @param {string[]} interests - Array of interest strings (max 10)
 * @returns {Promise<Object>} updated profile
 */
export async function updateInterests(interests) {
  const response = await api.put('/users/me', { interests });
  return response.data.data;
}

/**
 * Update the hot take text and gradient.
 * @param {Object} hotTake - { text: string, gradient: string }
 * @returns {Promise<Object>} updated profile
 */
export async function updateHotTake(hotTake) {
  const response = await api.put('/users/me', { hotTake });
  return response.data.data;
}

/**
 * React to someone's hot take.
 * @param {string} userId - Profile owner ID
 * @param {'agree'|'disagree'} reaction - Reaction type
 * @returns {Promise<Object>} updated reaction counts
 */
export async function reactToHotTake(userId, reaction) {
  const response = await api.post(`/users/${userId}/hot-take/react`, { reaction });
  return response.data.data;
}

/**
 * Update the anthem (song) info.
 * @param {Object} anthem - { title, artist, albumArt, externalUrl }
 * @returns {Promise<Object>} updated profile
 */
export async function updateAnthem(anthem) {
  const response = await api.put('/users/me', { anthem });
  return response.data.data;
}

/**
 * Search songs via MusicBrainz / Last.fm proxy.
 * @param {string} query - Search query string
 * @returns {Promise<Array>} search results
 */
export async function searchSongs(query) {
  const response = await api.get('/music/search', { params: { q: query } });
  return response.data.data;
}

/**
 * Send a chat request to another user.
 * @param {string} userId - Target user ID
 * @param {string} [message] - Optional icebreaker message
 * @returns {Promise<Object>} request data
 */
export async function sendChatRequest(userId, message) {
  const body = { recipientId: userId };
  if (message) body.message = message;
  const response = await api.post('/requests', body);
  return response.data.data;
}

// ════════════════════════════════════════════════════════════════════
// Phase 2 — Two Truths & a Lie
// ════════════════════════════════════════════════════════════════════

/**
 * Update the user's Two Truths & a Lie.
 * @param {Object} twoTruths - { truth1: string, truth2: string, lie: string }
 * @returns {Promise<Object>} updated data with shuffled statements array
 */
export async function updateTwoTruths(twoTruths) {
  const response = await api.put('/users/me/two-truths', twoTruths);
  return response.data.data;
}

/**
 * Submit a guess on someone's Two Truths & a Lie.
 * The lie index is NEVER returned before guessing.
 * @param {string} userId - Profile owner ID
 * @param {number} guessIndex - Index of the statement guessed as the lie (0–2)
 * @returns {Promise<Object>} { correct: boolean, guessCounts: number[] }
 */
export async function submitTwoTruthsGuess(userId, guessIndex) {
  const response = await api.post(`/users/${userId}/two-truths/guess`, { guessIndex });
  return response.data.data;
}

/**
 * Fetch aggregate guess counts for a user's Two Truths.
 * @param {string} userId - Profile owner ID
 * @returns {Promise<Object>} { guessCounts: [n0, n1, n2], totalGuesses: number }
 */
export async function fetchTwoTruthsStats(userId) {
  const response = await api.get(`/users/${userId}/two-truths/stats`);
  return response.data.data;
}

// ════════════════════════════════════════════════════════════════════
// Phase 2 — Neighborhood Titles
// ════════════════════════════════════════════════════════════════════

/**
 * Fetch all titles for the current user (earned + locked with progress).
 * @returns {Promise<Object>} { titles: Array<{ key, earned, earnedAt, progress }> }
 */
export async function fetchMyTitles() {
  const response = await api.get('/users/me/titles');
  return response.data.data;
}

/**
 * Set the active (displayed) title.
 * @param {string} titleKey - Key of the title to pin
 * @returns {Promise<Object>} updated profile
 */
export async function setActiveTitle(titleKey) {
  const response = await api.put('/users/me/titles/active', { titleKey });
  return response.data.data;
}

// ════════════════════════════════════════════════════════════════════
// Phase 2 — Video Glance
// ════════════════════════════════════════════════════════════════════

/**
 * Upload a glance video. Uses multipart/form-data.
 * @param {Object} videoFile - { uri, type, name } from image-picker or camera
 * @returns {Promise<Object>} { glanceVideoUrl: string }
 */
export async function uploadGlance(videoFile) {
  const formData = new FormData();
  formData.append('glance', {
    uri: videoFile.uri,
    type: videoFile.type || 'video/mp4',
    name: videoFile.name || 'glance.mp4',
  });
  const response = await api.put('/users/me/glance', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000, // longer timeout for video upload
  });
  return response.data.data;
}

/**
 * Remove the glance video (revert to static photo).
 * @returns {Promise<Object>} updated profile
 */
export async function removeGlance() {
  const response = await api.delete('/users/me/glance');
  return response.data.data;
}

// ════════════════════════════════════════════════════════════════════
// Phase 3 — Favorite Local Spot & Places
// ════════════════════════════════════════════════════════════════════

/**
 * Search places for tagging a favorite spot.
 * Calls backend proxy to avoid exposing API keys on client.
 * @param {string} query
 * @returns {Promise<Array>}
 */
export async function searchPlaces(query) {
  const response = await api.get('/places/search', { params: { q: query } });
  return response.data.data;
}

/**
 * Update the user's favorite spot.
 * @param {Object} spot - { name, category, h3Index, neighborhood } (no raw coordinates)
 * @returns {Promise<Object>}
 */
export async function updateFavoriteSpot(spot) {
  const response = await api.put('/users/me/favorite-spot', spot);
  return response.data.data;
}

/**
 * Remove the user's favorite spot.
 * @returns {Promise<Object>}
 */
export async function removeFavoriteSpot() {
  const response = await api.delete('/users/me/favorite-spot');
  return response.data.data;
}

// ════════════════════════════════════════════════════════════════════
// Phase 3 — Widget Management
// ════════════════════════════════════════════════════════════════════

/**
 * Update the order of widgets on the canvas.
 * @param {number[]} order - Array of indices [0, 1, 2, 3]
 * @returns {Promise<Object>}
 */
export async function updateWidgetOrder(order) {
  const response = await api.patch('/users/me/widget-order', { order });
  return response.data.data;
}

/**
 * Update the visibility of widgets.
 * @param {Object} visibility - { hotTake: bool, twoTruths: bool, anthem: bool, favoriteSpot: bool }
 * @returns {Promise<Object>}
 */
export async function updateWidgetVisibility(visibility) {
  const response = await api.patch('/users/me/widget-visibility', { visibility });
  return response.data.data;
}

// ════════════════════════════════════════════════════════════════════
// Phase 3 — Profile Analytics
// ════════════════════════════════════════════════════════════════════

/**
 * Fetch profile analytics (views, chat requests, guesses, etc).
 * @param {string} period - e.g., '7d'
 * @returns {Promise<Object>}
 */
export async function fetchAnalytics(period = '7d') {
  const response = await api.get('/users/me/analytics', { params: { period } });
  return response.data.data;
}

export default {
  fetchMyProfile,
  fetchUserProfile,
  updateMyProfile,
  updateStatus,
  updateMood,
  updateInterests,
  updateHotTake,
  reactToHotTake,
  updateAnthem,
  searchSongs,
  sendChatRequest,
  // Phase 2
  updateTwoTruths,
  submitTwoTruthsGuess,
  fetchTwoTruthsStats,
  fetchMyTitles,
  setActiveTitle,
  uploadGlance,
  removeGlance,
  // Phase 3
  searchPlaces,
  updateFavoriteSpot,
  removeFavoriteSpot,
  updateWidgetOrder,
  updateWidgetVisibility,
  fetchAnalytics,
};
