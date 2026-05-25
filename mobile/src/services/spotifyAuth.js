/**
 * Spotify PKCE OAuth flow helpers.
 *
 * Uses expo-auth-session + expo-web-browser for Spotify authorization.
 * Implements PKCE (Proof Key for Code Exchange) flow — no client secret on device.
 *
 * @module spotifyAuth
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// Ensure browser redirect completes
WebBrowser.maybeCompleteAuthSession();

const SPOTIFY_CLIENT_ID = '___SPOTIFY_CLIENT_ID___'; // Replaced at build time via env
const SPOTIFY_SCOPES = ['user-top-read', 'user-read-currently-playing'];

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

const STORAGE_KEYS = {
  accessToken: 'spotify_access_token',
  refreshToken: 'spotify_refresh_token',
  expiresAt: 'spotify_expires_at',
  connected: 'spotify_connected',
};

/**
 * Generate the redirect URI for the current platform.
 * @returns {string}
 */
export function getRedirectUri() {
  return AuthSession.makeRedirectUri({
    scheme: 'proximitychat',
    path: 'spotify-callback',
  });
}

/**
 * Initiate Spotify PKCE OAuth flow.
 * Opens the browser for user authorization.
 *
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function connectSpotify() {
  try {
    const redirectUri = getRedirectUri();

    const request = new AuthSession.AuthRequest({
      clientId: SPOTIFY_CLIENT_ID,
      scopes: SPOTIFY_SCOPES,
      redirectUri,
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
    });

    const result = await request.promptAsync(discovery);

    if (result.type !== 'success' || !result.params?.code) {
      return { success: false, error: 'Authorization cancelled or failed' };
    }

    // Exchange auth code for tokens via backend (keeps client_secret secure)
    const response = await api.post('/spotify/exchange', {
      code: result.params.code,
      redirectUri,
      codeVerifier: request.codeVerifier,
    });

    const tokenData = response.data.data;

    // Store tokens locally
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.accessToken, tokenData.accessToken],
      [STORAGE_KEYS.refreshToken, tokenData.refreshToken || ''],
      [STORAGE_KEYS.expiresAt, String(Date.now() + (tokenData.expiresIn || 3600) * 1000)],
      [STORAGE_KEYS.connected, 'true'],
    ]);

    return { success: true };
  } catch (error) {
    console.warn('Spotify connect failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Disconnect Spotify — revoke tokens, clear local storage.
 *
 * @returns {Promise<void>}
 */
export async function disconnectSpotify() {
  try {
    await api.post('/spotify/disconnect');
  } catch (e) {
    console.warn('Spotify disconnect API call failed:', e.message);
  }
  await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
}

/**
 * Check if Spotify is connected.
 *
 * @returns {Promise<boolean>}
 */
export async function isSpotifyConnected() {
  const connected = await AsyncStorage.getItem(STORAGE_KEYS.connected);
  return connected === 'true';
}

/**
 * Get a valid Spotify access token (auto-refreshes if expired).
 *
 * @returns {Promise<string|null>}
 */
export async function getSpotifyToken() {
  const connected = await AsyncStorage.getItem(STORAGE_KEYS.connected);
  if (connected !== 'true') return null;

  const expiresAt = parseInt(await AsyncStorage.getItem(STORAGE_KEYS.expiresAt) || '0', 10);

  if (Date.now() < expiresAt - 60000) {
    // Token still valid (with 1 min buffer)
    return AsyncStorage.getItem(STORAGE_KEYS.accessToken);
  }

  // Refresh via backend
  try {
    const response = await api.post('/spotify/refresh');
    const tokenData = response.data.data;

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.accessToken, tokenData.accessToken],
      [STORAGE_KEYS.expiresAt, String(Date.now() + (tokenData.expiresIn || 3600) * 1000)],
    ]);

    return tokenData.accessToken;
  } catch (e) {
    console.warn('Spotify token refresh failed:', e.message);
    await disconnectSpotify();
    return null;
  }
}

export default {
  connectSpotify,
  disconnectSpotify,
  isSpotifyConnected,
  getSpotifyToken,
  getRedirectUri,
};
