const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { profileRequired } = require('../middleware/profileRequired');
const locationService = require('../services/locationService');
const prisma = require('../utils/prisma');

router.post('/update', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const result = await locationService.updateLocation(req.user.id, lat, lng);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/nearby', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { discoveryRadiusKm: true, isPremium: true },
    });
    const requested = req.query.radius ? parseFloat(req.query.radius) : user.discoveryRadiusKm;
    const radius = locationService.validateRadiusKm(user, requested);
    const result = await locationService.getNearbyUsers(req.user.id, radius);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/group-nearby', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const result = await locationService.getGroupNearby(req.user.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

module.exports = router;
