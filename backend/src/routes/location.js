const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { profileRequired } = require('../middleware/profileRequired');
const locationService = require('../services/locationService');

router.post('/update', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    const result = await locationService.updateLocation(req.user.id, latitude, longitude);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/nearby', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const result = await locationService.getNearbyUsers(req.user.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

module.exports = router;
