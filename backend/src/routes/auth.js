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
    await authService.sendOTP(email);
    res.json({ success: true });
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

router.post('/social-login', authRateLimiter, async (req, res, next) => {
  try {
    const result = await authService.socialLogin(req.body || {});
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshSession(refreshToken);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.logout(refreshToken);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/send-phone-otp', authRateLimiter, async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, error: 'Phone is required' });
    await authService.sendPhoneOTP(phone);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/verify-phone-otp', authRateLimiter, async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ success: false, error: 'Phone and OTP required' });
    const result = await authService.verifyPhoneOTP(phone, otp);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/accept-guidelines', authMiddleware, async (req, res, next) => {
  try {
    const result = await authService.acceptGuidelines(req.user.id);
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
