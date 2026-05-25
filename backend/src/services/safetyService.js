const prisma = require('../utils/prisma');
const { getSocketIO } = require('../socket/socketServer');
const { applyReportModeration } = require('../utils/moderation');

async function reportUser(reporterId, reportedId, reason) {
  const allowedReasons = ['inappropriate', 'spam', 'harassment', 'other'];
  if (!allowedReasons.includes(reason)) {
    throw { status: 400, message: 'Invalid reason' };
  }
  if (reporterId === reportedId) throw { status: 400, message: 'Cannot report yourself' };

  const reported = await prisma.user.findUnique({ where: { id: reportedId } });
  if (!reported) throw { status: 404, message: 'User not found' };

  const [report, user] = await prisma.$transaction([
    prisma.report.create({ data: { reporterId, reportedId, reason } }),
    prisma.user.update({ where: { id: reportedId }, data: { reportCount: { increment: 1 } } }),
  ]);

  await applyReportModeration(reportedId, user.reportCount);

  return report;
}

async function blockUser(blockerId, blockedId) {
  if (blockerId === blockedId) throw { status: 400, message: 'Cannot block yourself' };

  const blocked = await prisma.user.findUnique({ where: { id: blockedId } });
  if (!blocked) throw { status: 404, message: 'User not found' };

  const existing = await prisma.block.findFirst({
    where: { blockerId, blockedId },
  });
  if (existing) throw { status: 400, message: 'User already blocked' };

  const block = await prisma.block.create({ data: { blockerId, blockedId } });

  // End any active chats between these users
  const sharedChats = await prisma.chat.findMany({
    where: {
      isActive: true,
      AND: [
        { participants: { some: { userId: blockerId } } },
        { participants: { some: { userId: blockedId } } },
      ],
    },
    include: { participants: { select: { userId: true } } },
  });

  const io = getSocketIO();
  for (const chat of sharedChats) {
    await prisma.chat.update({ where: { id: chat.id }, data: { isActive: false } });
    if (io) {
      io.to(`chat:${chat.id}`).emit('chat:ended', { chatId: chat.id, reason: 'blocked' });
    }
  }

  return block;
}

async function getBlockedUsers(userId) {
  const blocks = await prisma.block.findMany({
    where: { blockerId: userId },
    include: { blocked: { select: { id: true, name: true, gender: true, photoUrl: true } } },
  });
  return blocks.map((b) => ({ id: b.id, user: b.blocked, createdAt: b.createdAt }));
}

async function unblockUser(blockerId, blockIdOrUserId) {
  const block = await prisma.block.findFirst({
    where: {
      blockerId,
      OR: [{ id: blockIdOrUserId }, { blockedId: blockIdOrUserId }],
    },
  });
  if (!block) throw { status: 404, message: 'Block not found' };
  await prisma.block.delete({ where: { id: block.id } });
  return { success: true };
}

module.exports = { reportUser, blockUser, getBlockedUsers, unblockUser };
