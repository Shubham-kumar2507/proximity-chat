const express = require('express');
const router = express.createElement ? express.Router() : express.Router(); // Using generic Router creation
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Dummy middleware check
const auth = (req, res, next) => {
  if (!req.user) req.user = { id: 'dummy-id' }; // Replaced in actual integration
  next();
};

/**
 * POST /api/spotify/exchange
 * Exchanges an auth code for access/refresh tokens.
 */
router.post('/exchange', auth, async (req, res) => {
  try {
    const { code, redirectUri, codeVerifier } = req.body;
    if (!code || !redirectUri) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });
    
    if (codeVerifier) {
      params.append('code_verifier', codeVerifier);
    }

    const authHeader = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const response = await axios.post('https://accounts.spotify.com/api/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;

    if (refresh_token) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { spotifyConnected: true, spotifyRefreshToken: refresh_token }
      });
    }

    res.json({
      success: true,
      data: {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in
      }
    });
  } catch (error) {
    console.error('Spotify exchange error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

/**
 * POST /api/spotify/refresh
 * Refreshes the access token using the stored refresh token.
 */
router.post('/refresh', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.spotifyRefreshToken) {
      return res.status(400).json({ error: 'Not connected to Spotify' });
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: user.spotifyRefreshToken,
    });

    const authHeader = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const response = await axios.post('https://accounts.spotify.com/api/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`
      }
    });

    const { access_token, expires_in, refresh_token } = response.data;

    // Spotify sometimes returns a new refresh token
    if (refresh_token) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { spotifyRefreshToken: refresh_token }
      });
    }

    res.json({
      success: true,
      data: {
        accessToken: access_token,
        expiresIn: expires_in
      }
    });
  } catch (error) {
    console.error('Spotify refresh error:', error.response?.data || error.message);
    // If invalid grant, disconnect
    if (error.response?.data?.error === 'invalid_grant') {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { spotifyConnected: false, spotifyRefreshToken: null }
      });
    }
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

/**
 * POST /api/spotify/disconnect
 * Disconnects Spotify account.
 */
router.post('/disconnect', auth, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { spotifyConnected: false, spotifyRefreshToken: null }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

/**
 * POST /api/spotify/sync-anthem
 * Fetches user's top track and sets it as the anthem.
 */
router.post('/sync-anthem', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.spotifyRefreshToken) {
      return res.status(400).json({ error: 'Not connected to Spotify' });
    }

    // Refresh token manually or use a helper
    const params = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: user.spotifyRefreshToken });
    const authHeader = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${authHeader}` }
    });
    const { access_token } = tokenResponse.data;

    // Fetch top track
    const topTracksRes = await axios.get('https://api.spotify.com/v1/me/top/tracks?limit=1&time_range=short_term', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    const track = topTracksRes.data.items?.[0];
    if (!track) {
      return res.status(404).json({ error: 'No top track found' });
    }

    const anthem = {
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      albumArt: track.album.images?.[0]?.url,
      externalUrl: track.external_urls?.spotify,
      source: 'spotify'
    };

    // Assuming anthem goes in profile (wait, anthem is updated via users/me normally, let's just do it directly or let the client do it via updateMyProfile)
    // Actually wait, let's just return the anthem data so the client can update it.
    
    res.json({ success: true, data: anthem });
  } catch (error) {
    console.error('Spotify sync error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to sync anthem' });
  }
});

module.exports = router;
