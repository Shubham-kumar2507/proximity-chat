const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const prisma = require('../utils/prisma');
const { calculateProfileCompleteness } = require('../utils/profileCompleteness');
const { validateRadiusKm } = require('../services/locationService');

const userSelect = {
  id: true,
  email: true,
  phone: true,
  name: true,
  age: true,
  gender: true,
  bio: true,
  photoUrl: true,
  interestTags: true,
  vibeStatus: true,
  isVerified: true,
  isPremium: true,
  profileCompleteness: true,
  discoveryRadiusKm: true,
  locationPaused: true,
  guidelinesAcceptedAt: true,
  positiveRatingCount: true,
  negativeRatingCount: true,
  createdAt: true,
};

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: userSelect });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.put('/me', authMiddleware, async (req, res, next) => {
  try {
    const { bio, vibeStatus, interestTags, discoveryRadiusKm, locationPaused } = req.body;
    const data = {};
    if (bio !== undefined) data.bio = bio;
    if (vibeStatus !== undefined) {
      const allowed = ['Open to chat', 'Just browsing', 'Busy'];
      if (!allowed.includes(vibeStatus)) {
        return res.status(400).json({ success: false, error: 'Invalid vibe status' });
      }
      data.vibeStatus = vibeStatus;
    }
    if (interestTags !== undefined) {
      const tags = Array.isArray(interestTags) ? interestTags : [];
      if (tags.length > 10) return res.status(400).json({ success: false, error: 'Max 10 interest tags' });
      data.interestTags = tags;
    }
    if (discoveryRadiusKm !== undefined) {
      data.discoveryRadiusKm = validateRadiusKm(req.user, discoveryRadiusKm);
    }
    if (locationPaused !== undefined) data.locationPaused = Boolean(locationPaused);

    const existing = await prisma.user.findUnique({ where: { id: req.user.id } });
    const merged = { ...existing, ...data };
    data.profileCompleteness = calculateProfileCompleteness(merged);

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: userSelect,
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.post('/fcm-token', authMiddleware, async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, error: 'Token is required' });
    await prisma.user.update({ where: { id: req.user.id }, data: { fcmToken: token } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Interest tag match score between current user and another user
router.get('/match-score/:userId', authMiddleware, async (req, res, next) => {
  try {
    const me = await prisma.user.findUnique({ where: { id: req.user.id }, select: { interestTags: true } });
    const other = await prisma.user.findUnique({ where: { id: req.params.userId }, select: { interestTags: true } });
    if (!other) return res.status(404).json({ success: false, error: 'User not found' });

    const myTags = new Set(me?.interestTags || []);
    const otherTags = other.interestTags || [];
    const intersection = otherTags.filter(t => myTags.has(t));
    const union = new Set([...(me?.interestTags || []), ...otherTags]);
    const score = union.size > 0 ? Math.round((intersection.length / union.size) * 100) : 0;

    res.json({ success: true, data: { score, commonTags: intersection } });
  } catch (err) { next(err); }
});

// GDPR: export all user data
router.get('/me/export', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const posts = await prisma.post.findMany({ where: { userId: req.user.id } });
    const reports = await prisma.report.findMany({ where: { reporterId: req.user.id } });
    const chats = await prisma.chatParticipant.findMany({
      where: { userId: req.user.id },
      include: { chat: { include: { messages: true } } },
    });
    res.json({
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        user,
        posts,
        reports,
        chatHistory: chats.map(c => ({
          chatId: c.chat.id,
          messages: c.chat.messages,
        })),
      },
    });
  } catch (err) { next(err); }
});

// GDPR: delete account
router.delete('/me', authMiddleware, async (req, res, next) => {
  try {
    // Cascade delete user data
    const userId = req.user.id;
    
    // Delete chat participants, messages in user's chats
    const participations = await prisma.chatParticipant.findMany({ where: { userId }, select: { chatId: true } });
    
    // Clean up blocks
    await prisma.block.deleteMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } });
    await prisma.report.deleteMany({ where: { reporterId: userId } });
    await prisma.postComment.deleteMany({ where: { userId } });
    await prisma.postLike.deleteMany({ where: { userId } });
    await prisma.post.deleteMany({ where: { userId } });
    await prisma.chatParticipant.deleteMany({ where: { userId } });
    await prisma.chatRequest.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } });
    await prisma.user.delete({ where: { id: userId } });
    
    res.json({ success: true, message: 'Account and all data permanently deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
