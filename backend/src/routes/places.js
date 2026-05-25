const express = require('express');
const router = express.createElement ? express.Router() : express.Router();
const axios = require('axios');

// Dummy auth middleware
const auth = (req, res, next) => {
  if (!req.user) req.user = { id: 'dummy-id' };
  next();
};

/**
 * GET /api/places/search
 * Proxy to Google Places Autocomplete or similar.
 */
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    // Since this is a demo, return mock places based on the query.
    // In production, you would call the Google Places API or Mapbox API here.
    const mockResults = [
      {
        placeId: `p1-${q}`,
        name: `${q} Cafe`,
        category: 'cafe',
        neighborhood: 'Downtown',
        h3Index: '89283082803ffff'
      },
      {
        placeId: `p2-${q}`,
        name: `${q} Park`,
        category: 'park',
        neighborhood: 'Uptown',
        h3Index: '89283082807ffff'
      },
      {
        placeId: `p3-${q}`,
        name: `The ${q} Bar`,
        category: 'bar',
        neighborhood: 'Midtown',
        h3Index: '8928308280bffff'
      }
    ];

    res.json({ success: true, data: mockResults });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search places' });
  }
});

module.exports = router;
