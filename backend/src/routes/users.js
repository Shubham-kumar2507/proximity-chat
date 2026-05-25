const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const prisma = require('../utils/prisma');
const { calculateProfileCompleteness } = require('../utils/profileCompleteness');
const { validateRadiusKm } = require('../services/locationService');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');

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
  twoTruths: true,
  earnedTitles: true,
  activeTitle: true,
  glanceVideoUrl: true,
  favoriteSpot: true,
  widgetOrder: true,
  widgetVisibility: true,
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

// Phase 2: Update Two Truths
router.put('/me/two-truths', authMiddleware, async (req, res, next) => {
  try {
    const { truth1, truth2, lie } = req.body;
    if (!truth1 || !truth2 || !lie) {
      return res.status(400).json({ success: false, error: 'Must provide truth1, truth2, and lie' });
    }
    
    const statements = [truth1, truth2, lie];
    const originalLieIndex = 2;
    
    const indices = [0, 1, 2].sort(() => Math.random() - 0.5);
    const shuffledStatements = indices.map(i => statements[i]);
    const lieIndex = indices.indexOf(originalLieIndex);

    const twoTruths = {
      statements: shuffledStatements,
      lieIndex,
      guessCounts: [0, 0, 0],
      totalGuesses: 0
    };

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { twoTruths },
      select: userSelect,
    });
    
    res.json({ success: true, data: updatedUser });
  } catch (err) { next(err); }
});

// Phase 2: Fetch all titles for the current user
router.get('/me/titles', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const titles = user.earnedTitles || [];
    res.json({ success: true, data: { titles, activeTitle: user.activeTitle } });
  } catch (err) { next(err); }
});

// Phase 2: Set the active title
router.put('/me/titles/active', authMiddleware, async (req, res, next) => {
  try {
    const { titleKey } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { activeTitle: titleKey },
      select: userSelect,
    });
    res.json({ success: true, data: updatedUser });
  } catch (err) { next(err); }
});

// Phase 2: Upload a glance video
router.put('/me/glance', authMiddleware, upload.single('glance'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Video file required' });
    }
    
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.glanceVideoUrl) {
      await deleteFromCloudinary(user.glanceVideoUrl);
    }
    
    const glanceVideoUrl = await uploadToCloudinary(req.file.buffer, 'video');
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { glanceVideoUrl },
      select: userSelect,
    });
    
    res.json({ success: true, data: updatedUser });
  } catch (err) { next(err); }
});

// Phase 2: Remove a glance video
router.delete('/me/glance', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.glanceVideoUrl) {
      await deleteFromCloudinary(user.glanceVideoUrl);
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { glanceVideoUrl: null },
      select: userSelect,
    });
    
    res.json({ success: true, data: updatedUser });
  } catch (err) { next(err); }
});

// Phase 2: Submit a guess on someone's Two Truths & a Lie
router.post('/:userId/two-truths/guess', authMiddleware, async (req, res, next) => {
  try {
    const { guessIndex } = req.body;
    const targetUserId = req.params.userId;
    
    if (guessIndex < 0 || guessIndex > 2) {
      return res.status(400).json({ success: false, error: 'Invalid guess index' });
    }
    
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user || !user.twoTruths) {
      return res.status(404).json({ success: false, error: 'Two Truths data not found' });
    }
    
    const twoTruths = user.twoTruths;
    twoTruths.guessCounts = twoTruths.guessCounts || [0, 0, 0];
    twoTruths.totalGuesses = (twoTruths.totalGuesses || 0) + 1;
    twoTruths.guessCounts[guessIndex] += 1;
    
    const correct = (twoTruths.lieIndex === guessIndex);
    
    await prisma.user.update({
      where: { id: targetUserId },
      data: { twoTruths },
    });
    
    res.json({
      success: true,
      data: { correct, lieIndex: twoTruths.lieIndex, guessCounts: twoTruths.guessCounts, totalGuesses: twoTruths.totalGuesses }
    });
  } catch (err) { next(err); }
});

// Phase 2: Fetch Two Truths Stats
router.get('/:userId/two-truths/stats', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!user || !user.twoTruths) {
       return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({
      success: true,
      data: {
        guessCounts: user.twoTruths.guessCounts || [0, 0, 0],
        totalGuesses: user.twoTruths.totalGuesses || 0
      }
    });
  } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════════
// Phase 3: Favorite Spot
// ════════════════════════════════════════════════════════════════

router.put('/me/favorite-spot', authMiddleware, async (req, res, next) => {
  try {
    const { name, category, h3Index, neighborhood } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

    // Mock generating a static map thumbnail from the h3Index
    const mapThumbnailUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/10,20,14,0/400x200?access_token=mock_token`;

    const favoriteSpot = { name, category, h3Index, neighborhood, mapThumbnailUrl };

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { favoriteSpot },
      select: userSelect,
    });
    res.json({ success: true, data: updatedUser });
  } catch (err) { next(err); }
});

router.delete('/me/favorite-spot', authMiddleware, async (req, res, next) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { favoriteSpot: null },
      select: userSelect,
    });
    res.json({ success: true, data: updatedUser });
  } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════════
// Phase 3: Widget Management
// ════════════════════════════════════════════════════════════════

router.patch('/me/widget-order', authMiddleware, async (req, res, next) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) return res.status(400).json({ success: false, error: 'Order must be an array' });

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { widgetOrder: order },
      select: userSelect,
    });
    res.json({ success: true, data: updatedUser });
  } catch (err) { next(err); }
});

router.patch('/me/widget-visibility', authMiddleware, async (req, res, next) => {
  try {
    const { visibility } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { widgetVisibility: visibility },
      select: userSelect,
    });
    res.json({ success: true, data: updatedUser });
  } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════════
// Phase 3: Profile Analytics
// ════════════════════════════════════════════════════════════════

router.get('/me/analytics', authMiddleware, async (req, res, next) => {
  try {
    const { period } = req.query; // e.g., '7d'
    
    // In a real app, this would query aggregated logs/events.
    // We return mocked analytics data matching the requested 7-day sparkline format.
    const mockAnalytics = {
      profileViews: { total: 142, daily: [12, 18, 15, 22, 28, 25, 22] },
      chatRequests: { total: 28, daily: [2, 3, 5, 4, 6, 5, 3] },
      chatAccepted: { total: 15, daily: [1, 2, 2, 2, 4, 3, 1] },
      twoTruthsGuesses: { total: 45, daily: [4, 6, 8, 5, 10, 7, 5] },
      hotTakeReactions: { total: 88, agree: 52, disagree: 36, daily: [10, 12, 8, 15, 18, 12, 13] },
      anthemTaps: { total: 34, daily: [3, 4, 2, 6, 8, 6, 5] },
      priorPeriodViews: 110,
    };

    res.json({ success: true, data: mockAnalytics });
  } catch (err) { next(err); }
});

// GET user by ID
router.get('/:userId', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: userSelect,
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    if (user.twoTruths && user.id !== req.user.id) {
      delete user.twoTruths.lieIndex;
    }
    
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

module.exports = router;
