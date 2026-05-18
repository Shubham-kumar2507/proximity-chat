/**
 * Profile required middleware - ensures user has completed profile setup
 * Returns 403 if user.isVerified is false
 */
function profileRequired(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      error: 'Profile setup required. Please complete your profile first.',
    });
  }

  next();
}

module.exports = { profileRequired };
