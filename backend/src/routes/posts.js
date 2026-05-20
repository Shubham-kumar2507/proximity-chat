const express = require('express');
const h3 = require('h3-js');
const multer = require('multer');
const prisma = require('../utils/prisma');
const redis = require('../utils/redis');
const { authMiddleware } = require('../middleware/auth');
const { profileRequired } = require('../middleware/profileRequired');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');
const { notifyPostInteraction } = require('../services/notificationService');
const { getSocketIO } = require('../socket/socketServer');

const router = express.Router();
const LOCATION_PREFIX = 'location:';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB for video
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpeg/png/gif/webp) and videos (mp4/mov) are allowed'));
    }
  },
});

function mapPost(post, viewerId) {
  return {
    id: post.id,
    content: post.content,
    topicTag: post.topicTag,
    mediaUrl: post.mediaUrl,
    mediaType: post.mediaType,
    visibility: post.visibility,
    radiusKm: post.radiusKm,
    createdAt: post.createdAt,
    user: {
      id: post.user.id,
      name: post.user.name,
      photoUrl: post.user.photoUrl,
    },
    likesCount: post._count.likes,
    commentsCount: post._count.comments,
    likedByMe: post.likes.some((like) => like.userId === viewerId),
  };
}

// Create post (with optional media upload)
router.post('/', authMiddleware, profileRequired, upload.single('media'), async (req, res, next) => {
  try {
    const { content, topicTag, visibility = 'public', radiusKm = null } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }
    if (content.length > 500) {
      return res.status(400).json({ success: false, error: 'Post cannot exceed 500 chars' });
    }
    if (!['public', 'proximity'].includes(visibility)) {
      return res.status(400).json({ success: false, error: 'Visibility must be public or proximity' });
    }

    let h3Index = null;
    let resolvedRadius = null;
    if (visibility === 'proximity') {
      const userLocationRaw = await redis.get(`${LOCATION_PREFIX}${req.user.id}`);
      if (!userLocationRaw) {
        return res.status(400).json({ success: false, error: 'Location is required for proximity posts' });
      }
      const userLocation = JSON.parse(userLocationRaw);
      h3Index = userLocation.h3Index;
      resolvedRadius = radiusKm ? parseFloat(radiusKm) : 0.5;
    }

    // Handle media upload
    let mediaUrl = null;
    let mediaType = null;
    if (req.file) {
      mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
      mediaUrl = await uploadToCloudinary(req.file.buffer, mediaType);
    }

    const post = await prisma.post.create({
      data: {
        userId: req.user.id,
        content: content.trim(),
        topicTag: topicTag || null,
        mediaUrl,
        mediaType,
        visibility,
        radiusKm: resolvedRadius,
        h3Index,
      },
      include: {
        user: { select: { id: true, name: true, photoUrl: true } },
        likes: true,
        _count: { select: { likes: true, comments: true } },
      },
    });
    res.json({ success: true, data: mapPost(post, req.user.id) });
  } catch (err) { next(err); }
});

// Feed with infinite scroll
router.get('/feed', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '30', 10), 50);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
    const viewerLocationRaw = await redis.get(`${LOCATION_PREFIX}${req.user.id}`);
    const viewerH3 = viewerLocationRaw ? JSON.parse(viewerLocationRaw).h3Index : null;

    const posts = await prisma.post.findMany({
      where: { deletedAt: null, user: { shadowBanned: false } },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit * 3,
      include: {
        user: { select: { id: true, name: true, photoUrl: true } },
        likes: { where: { userId: req.user.id }, select: { userId: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    const visiblePosts = posts.filter((post) => {
      if (post.visibility === 'public') return true;
      if (!viewerH3 || !post.h3Index || !post.radiusKm) return false;
      try {
        const distance = h3.gridDistance(viewerH3, post.h3Index);
        const maxK = Math.max(1, Math.ceil((post.radiusKm * 1000) / (174 * 2)));
        return distance <= maxK;
      } catch {
        return false;
      }
    });

    res.json({
      success: true,
      data: visiblePosts.slice(0, limit).map((post) => mapPost(post, req.user.id)),
    });
  } catch (err) { next(err); }
});

// Get single post
router.get('/:id', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, photoUrl: true } },
        likes: { where: { userId: req.user.id }, select: { userId: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    if (!post || post.deletedAt) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Proximity re-validation at read time
    if (post.visibility === 'proximity') {
      const viewerLocationRaw = await redis.get(`${LOCATION_PREFIX}${req.user.id}`);
      if (!viewerLocationRaw) {
        return res.status(403).json({ success: false, error: 'Post not available in your area' });
      }
      const viewerH3 = JSON.parse(viewerLocationRaw).h3Index;
      try {
        const distance = h3.gridDistance(viewerH3, post.h3Index);
        const maxK = Math.max(1, Math.ceil((post.radiusKm * 1000) / (174 * 2)));
        if (distance > maxK) {
          return res.status(403).json({ success: false, error: 'Post not available in your area' });
        }
      } catch {
        return res.status(403).json({ success: false, error: 'Post not available in your area' });
      }
    }

    res.json({ success: true, data: mapPost(post, req.user.id) });
  } catch (err) { next(err); }
});

// Toggle like (with push notification + WebSocket)
router.post('/:id/like', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id }, select: { id: true, userId: true } });
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });

    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId: req.params.id, userId: req.user.id } },
    });
    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.postLike.create({ data: { postId: req.params.id, userId: req.user.id } });
      // Push notification to post owner
      if (post.userId !== req.user.id) {
        notifyPostInteraction(post.userId, req.user.name, post.id, 'like').catch(() => {});
      }
    }

    const likesCount = await prisma.postLike.count({ where: { postId: req.params.id } });

    // Real-time engagement update via WebSocket
    const io = getSocketIO();
    if (io) {
      io.emit('post:engagement', { postId: req.params.id, likesCount });
    }

    res.json({ success: true, data: { liked: !existing, likesCount } });
  } catch (err) { next(err); }
});

// Create comment (with push notification)
router.post('/:id/comments', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const { content, parentId } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Comment is required' });
    }

    // Enforce 2-level threading: parentId must be a top-level comment
    if (parentId) {
      const parent = await prisma.postComment.findUnique({ where: { id: parentId }, select: { parentId: true } });
      if (!parent) return res.status(404).json({ success: false, error: 'Parent comment not found' });
      if (parent.parentId) return res.status(400).json({ success: false, error: 'Can only reply to top-level comments' });
    }

    const comment = await prisma.postComment.create({
      data: {
        postId: req.params.id,
        userId: req.user.id,
        content: content.trim(),
        parentId: parentId || null,
      },
      include: {
        user: { select: { id: true, name: true, photoUrl: true } },
        replies: {
          include: { user: { select: { id: true, name: true, photoUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Push notification to post owner
    const post = await prisma.post.findUnique({ where: { id: req.params.id }, select: { userId: true } });
    if (post && post.userId !== req.user.id) {
      notifyPostInteraction(post.userId, req.user.name, req.params.id, 'comment').catch(() => {});
    }

    // Real-time comment count update
    const commentsCount = await prisma.postComment.count({ where: { postId: req.params.id } });
    const io = getSocketIO();
    if (io) {
      io.emit('post:engagement', { postId: req.params.id, commentsCount });
    }

    res.json({ success: true, data: comment });
  } catch (err) { next(err); }
});

// Get comments with 2-level thread structure
router.get('/:id/comments', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const comments = await prisma.postComment.findMany({
      where: { postId: req.params.id, parentId: null },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, photoUrl: true } },
        replies: {
          include: { user: { select: { id: true, name: true, photoUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    res.json({ success: true, data: comments });
  } catch (err) { next(err); }
});

// Delete post with CDN purge within 60 seconds
router.delete('/:id', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
    if (post.userId !== req.user.id) return res.status(403).json({ success: false, error: 'Not authorized' });

    // Soft delete
    await prisma.post.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });

    // CDN purge: delete media from Cloudinary if exists
    if (post.mediaUrl) {
      deleteFromCloudinary(post.mediaUrl).catch((err) => console.error('Cloudinary delete failed:', err.message));
    }

    res.json({ success: true, message: 'Post deleted' });
  } catch (err) { next(err); }
});

// Repost (share with optional quote)
router.post('/:id/repost', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const { quote } = req.body;
    const original = await prisma.post.findUnique({
      where: { id: req.params.id },
      select: { id: true, content: true, userId: true, user: { select: { name: true } } },
    });
    if (!original) return res.status(404).json({ success: false, error: 'Post not found' });

    const repostContent = quote
      ? `${quote.trim()}\n\n↪ Repost from @${original.user.name}: "${original.content.substring(0, 200)}"`
      : `↪ Repost from @${original.user.name}: "${original.content.substring(0, 300)}"`;

    const repost = await prisma.post.create({
      data: {
        userId: req.user.id,
        content: repostContent,
        topicTag: null,
        visibility: 'public',
      },
      include: {
        user: { select: { id: true, name: true, photoUrl: true } },
        likes: true,
        _count: { select: { likes: true, comments: true } },
      },
    });

    // Notify original poster
    if (original.userId !== req.user.id) {
      notifyPostInteraction(original.userId, req.user.name, original.id, 'repost').catch(() => {});
    }

    res.json({ success: true, data: mapPost(repost, req.user.id) });
  } catch (err) { next(err); }
});

module.exports = router;
