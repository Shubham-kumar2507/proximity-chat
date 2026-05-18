const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { profileRequired } = require('../middleware/profileRequired');
const chatService = require('../services/chatService');

router.get('/', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const result = await chatService.getUserChats(req.user.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/:id/messages', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const result = await chatService.getChatMessages(req.params.id, req.user.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

module.exports = router;
