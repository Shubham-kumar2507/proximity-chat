const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');
const authService = require('../services/authService');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.post('/send-otp', authRateLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
    const result = await authService.sendOTP(email);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/verify-otp', authRateLimiter, async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, error: 'Email and OTP required' });
    const result = await authService.verifyOTP(email, otp);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/complete-profile', authMiddleware, upload.single('photo'), async (req, res, next) => {
  try {
    const result = await authService.completeProfile(req.user.id, req.body, req.file);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

module.exports = router;
