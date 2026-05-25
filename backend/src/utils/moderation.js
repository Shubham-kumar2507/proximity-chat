const prisma = require('./prisma');

/**
 * Apply shadowban / moderation queue based on report count.
 * @param {string} userId
 * @param {number} reportCount
 */
async function applyReportModeration(userId, reportCount) {
  const updates = {};
  if (reportCount >= 7) updates.moderationQueue = true;
  if (reportCount >= 3) updates.shadowBanned = true;
  if (Object.keys(updates).length === 0) return;
  await prisma.user.update({ where: { id: userId }, data: updates });
}

module.exports = { applyReportModeration };
