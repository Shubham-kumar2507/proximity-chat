/**
 * Two Truths & a Lie Game Routes
 * GET  /users/:userId/truths-game  — fetch shuffled statements
 * POST /users/:userId/truths-game/guess — submit a guess
 *
 * @module routes/truthsGame
 */
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const prisma = require('../utils/prisma');
const redis = require('../utils/redis');

const GUESS_TTL = 86400; // 24 hours in seconds
const GUESS_PREFIX = 'guess:';

/**
 * GET /users/:userId/truths-game
 * Returns the 3 shuffled statements without revealing the lie.
 */
router.get('/:userId/truths-game', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const viewerId = req.user.id;

    if (viewerId === userId) {
      return res.status(400).json({ success: false, error: 'Cannot play your own game' });
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, twoTruths: true, truthsLieIndex: true, photoUrl: true },
    });

    if (!target || !target.twoTruths) {
      return res.status(404).json({ success: false, error: 'User has not set up Two Truths & a Lie' });
    }

    const twoTruths = typeof target.twoTruths === 'string'
      ? JSON.parse(target.twoTruths)
      : target.twoTruths;

    // Check 24h rate limit
    const redisKey = `${GUESS_PREFIX}${viewerId}:${userId}`;
    const locked = await redis.get(redisKey);

    // Also check DB for last guess
    const lastGuess = await prisma.truthsGameGuess.findFirst({
      where: { guesserId: viewerId, targetId: userId },
      orderBy: { guessedAt: 'desc' },
    });

    const lastGuessAt = lastGuess?.guessedAt || null;
    const now = Date.now();
    const gameLocked = locked || (lastGuessAt && (now - new Date(lastGuessAt).getTime()) < GUESS_TTL * 1000);

    // Build 3 statements in consistent order (truth1, truth2, lie — shuffled at setup)
    const statements = [
      { index: 0, text: twoTruths.truth1 || twoTruths.statements?.[0] || '' },
      { index: 1, text: twoTruths.truth2 || twoTruths.statements?.[1] || '' },
      { index: 2, text: twoTruths.lie || twoTruths.statements?.[2] || '' },
    ];

    res.json({
      success: true,
      data: {
        targetId: target.id,
        targetName: target.name,
        targetPhotoUrl: target.photoUrl,
        statements,
        gameLocked: !!gameLocked,
        lastGuessAt: lastGuessAt ? new Date(lastGuessAt).toISOString() : null,
        lastGuessCorrect: lastGuess?.correct || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /users/:userId/truths-game/guess
 * Submit a guess. Rate limited to 1 per 24h per guesser+target pair.
 */
router.post('/:userId/truths-game/guess', authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const viewerId = req.user.id;
    const { guessed_index } = req.body;

    if (viewerId === userId) {
      return res.status(400).json({ success: false, error: 'Cannot guess on your own game' });
    }

    if (guessed_index === undefined || guessed_index < 0 || guessed_index > 2) {
      return res.status(400).json({ success: false, error: 'guessed_index must be 0, 1, or 2' });
    }

    // Check rate limit
    const redisKey = `${GUESS_PREFIX}${viewerId}:${userId}`;
    const locked = await redis.get(redisKey);
    if (locked) {
      return res.status(429).json({ success: false, error: 'You can only guess once per 24 hours' });
    }

    // Get target's lie index
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, twoTruths: true, truthsLieIndex: true,
        photoUrl: true, fcmToken: true,
      },
    });

    if (!target || !target.twoTruths) {
      return res.status(404).json({ success: false, error: 'Game not available' });
    }

    // Determine the lie index.
    const twoTruths = typeof target.twoTruths === 'string'
      ? JSON.parse(target.twoTruths)
      : target.twoTruths;
      
    // If truthsLieIndex is explicitly set on the user model, use it.
    // Otherwise, check inside the twoTruths JSON object.
    const lieIndex = target.truthsLieIndex ?? twoTruths.lieIndex ?? 2;
    const correct = guessed_index === lieIndex;

    // Record guess
    await prisma.truthsGameGuess.create({
      data: {
        guesserId: viewerId,
        targetId: userId,
        guessedIndex: guessed_index,
        correct,
      },
    });

    // Set rate limit in Redis
    await redis.set(redisKey, '1', 'EX', GUESS_TTL);

    // Get guesser info for notifications
    const guesser = await prisma.user.findUnique({
      where: { id: viewerId },
      select: { name: true, photoUrl: true },
    });

    // Emit socket events for real-time notifications
    if (correct) {
      const { getSocketIO } = require('../socket/socketServer');
      const io = getSocketIO();

      if (io) {
        const twoTruths = typeof target.twoTruths === 'string'
          ? JSON.parse(target.twoTruths)
          : target.twoTruths;

        const statements = [
          twoTruths.truth1 || twoTruths.statements?.[0] || '',
          twoTruths.truth2 || twoTruths.statements?.[1] || '',
          twoTruths.lie || twoTruths.statements?.[2] || '',
        ];

        // Notify profile owner
        io.to(`user:${userId}`).emit('lie_guessed', {
          guesser_id: viewerId,
          guesser_name: guesser?.name || 'Someone',
          guesser_photo_url: guesser?.photoUrl || null,
          guesser_distance: '~nearby',
          guessed_statement: statements[guessed_index] || '',
        });

        // Confirm to guesser
        io.to(`user:${viewerId}`).emit('guess_confirmed', {
          target_id: userId,
          target_name: target.name,
          correct: true,
        });
      }
    }

    res.json({
      success: true,
      data: { correct },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
