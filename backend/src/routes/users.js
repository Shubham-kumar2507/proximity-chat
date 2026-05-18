const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const prisma = require('../utils/prisma');

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, name: true, age: true, gender: true,
        bio: true, photoUrl: true, vibeStatus: true, isVerified: true, createdAt: true,
      },
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.put('/me', authMiddleware, async (req, res, next) => {
  try {
    const { bio, vibeStatus } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { bio, vibeStatus },
      select: { id: true, bio: true, vibeStatus: true },
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.post('/fcm-token', authMiddleware, async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, error: 'Token is required' });
    await prisma.user.update({
      where: { id: req.user.id },
      data: { fcmToken: token },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
