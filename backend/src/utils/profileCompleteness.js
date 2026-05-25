/**
 * Calculate profile completeness score (0-100).
 * @param {object} user
 * @returns {number}
 */
function calculateProfileCompleteness(user) {
  let score = 0;
  if (user.name && user.name.trim().length > 0) score += 20;
  if (user.age && user.age >= 18) score += 20;
  if (user.gender) score += 10;
  if (user.bio && user.bio.trim().length > 0) score += 15;
  if (user.photoUrl) score += 15;
  if (user.interestTags && user.interestTags.length >= 5) score += 10;
  if (user.guidelinesAcceptedAt) score += 10;
  return Math.min(100, score);
}

module.exports = { calculateProfileCompleteness };
