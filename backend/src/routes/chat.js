const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { profileRequired } = require('../middleware/profileRequired');
const chatService = require('../services/chatService');

// Get all user's active chats
router.get('/', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const result = await chatService.getUserChats(req.user.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Get chat messages
router.get('/:id/messages', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const result = await chatService.getChatMessages(req.params.id, req.user.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Save chat (opt-in before expiry)
router.post('/:id/save', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const result = await chatService.saveChat(req.params.id, req.user.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Reveal identity in anonymous chat
router.post('/:id/reveal', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const result = await chatService.revealIdentity(req.params.id, req.user.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Accept identity reveal
router.post('/:id/accept-reveal', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const result = await chatService.acceptReveal(req.params.id, req.user.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Post-chat rating
router.post('/:id/rate', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const { rating } = req.body; // 'positive' or 'negative'
    const result = await chatService.rateChatPartner(req.params.id, req.user.id, rating);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

module.exports = router;
