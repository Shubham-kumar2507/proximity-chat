const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { profileRequired } = require('../middleware/profileRequired');
const safetyService = require('../services/safetyService');

router.post('/report', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const { reportedId, reason } = req.body;
    const result = await safetyService.reportUser(req.user.id, reportedId, reason);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/block', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const { blockedId } = req.body;
    const result = await safetyService.blockUser(req.user.id, blockedId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/blocked', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const result = await safetyService.getBlockedUsers(req.user.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.delete('/block/:id', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const result = await safetyService.unblockUser(req.user.id, req.params.id);
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
