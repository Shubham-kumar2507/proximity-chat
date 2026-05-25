/**
 * Spotify API calls — fetch top tracks, currently playing, etc.
 *
 * All calls go through the backend proxy to avoid exposing
 * Spotify tokens or API details on the client.
 *
 * @module spotifyApi
 */

import api from './api';

/**
 * Fetch the user's current top track (short-term).
 * Backend fetches from Spotify: /me/top/tracks?limit=1&time_range=short_term
 *
 * @returns {Promise<Object|null>} { title, artist, albumArt, externalUrl } or null
 */
export async function fetchTopTrack() {
  try {
    const response = await api.get('/spotify/top-track');
    return response.data.data;
  } catch (e) {
    console.warn('Failed to fetch Spotify top track:', e.message);
    return null;
  }
}

/**
 * Get the current Spotify connection status from the backend.
 *
 * @returns {Promise<Object>} { connected: boolean, lastSynced: string|null }
 */
export async function getConnectionStatus() {
  try {
    const response = await api.get('/spotify/status');
    return response.data.data;
  } catch (e) {
    return { connected: false, lastSynced: null };
  }
}

/**
 * Manually trigger anthem sync from Spotify.
 *
 * @returns {Promise<Object|null>} Updated anthem data
 */
export async function syncAnthem() {
  try {
    const response = await api.post('/spotify/sync-anthem');
    return response.data.data;
  } catch (e) {
    console.warn('Failed to sync anthem:', e.message);
    return null;
  }
}

/**
 * Pin a specific song as the anthem (manual override).
 * This prevents auto-update from Spotify.
 *
 * @param {Object} anthem - { title, artist, albumArt, externalUrl }
 * @returns {Promise<Object>} Updated anthem data
 */
export async function pinAnthem(anthem) {
  try {
    const response = await api.post('/spotify/pin-anthem', anthem);
    return response.data.data;
  } catch (e) {
    console.warn('Failed to pin anthem:', e.message);
    throw e;
  }
}

export default {
  fetchTopTrack,
  getConnectionStatus,
  syncAnthem,
  pinAnthem,
};
