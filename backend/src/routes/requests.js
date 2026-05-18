const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { profileRequired } = require('../middleware/profileRequired');
const { sendRequest } = require('../services/requestService');
const { respondToRequest, getIncomingRequests } = require('../services/requestRespondService');

router.post('/send', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const result = await sendRequest(req.user.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/:id/respond', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const { action } = req.body;
    const result = await respondToRequest(req.user.id, req.params.id, action);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/incoming', authMiddleware, profileRequired, async (req, res, next) => {
  try {
    const result = await getIncomingRequests(req.user.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

module.exports = router;
