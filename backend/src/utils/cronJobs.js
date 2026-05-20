const cron = require('node-cron');
const prisma = require('./prisma');
const { getSocketIO } = require('../socket/socketServer');
const { notifyRequestExpiry } = require('../services/notificationService');

/**
 * Initialize all cron jobs
 */
function initCronJobs() {
  // Expire pending chat requests every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Notify requests about to expire (2 minutes warning)
      const soonExpiring = await prisma.chatRequest.findMany({
        where: {
          status: 'pending',
          expiresAt: { gt: now, lte: new Date(now.getTime() + 2 * 60 * 1000) },
        },
        select: { id: true, senderId: true, receiverId: true },
      });
      for (const req of soonExpiring) {
        notifyRequestExpiry(req.receiverId, req.id).catch(() => {});
      }

      const expiredRequests = await prisma.chatRequest.findMany({
        where: {
          status: 'pending',
          expiresAt: { lte: now },
        },
        select: { id: true, senderId: true, receiverId: true },
      });

      if (expiredRequests.length > 0) {
        await prisma.chatRequest.updateMany({
          where: {
            status: 'pending',
            expiresAt: { lte: now },
          },
          data: { status: 'expired' },
        });

        // Notify users via socket
        const io = getSocketIO();
        if (io) {
          expiredRequests.forEach((req) => {
            io.to(`user:${req.senderId}`).emit('request:expired', { requestId: req.id });
            io.to(`user:${req.receiverId}`).emit('request:expired', { requestId: req.id });
          });
        }

        console.log(`⏰ Expired ${expiredRequests.length} chat requests`);
      }
    } catch (err) {
      console.error('Cron: expire requests error:', err.message);
    }
  });

  // Expire chats that have passed their 24hr window - check every minute
  // Respects savedChat flag: don't delete messages if either participant saved
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const expiredChats = await prisma.chat.findMany({
        where: {
          isActive: true,
          expiresAt: { lte: now },
        },
        include: {
          participants: { select: { userId: true, savedChat: true } },
        },
      });

      if (expiredChats.length > 0) {
        const io = getSocketIO();

        for (const chat of expiredChats) {
          // Notify participants before deletion
          if (io) {
            chat.participants.forEach((p) => {
              io.to(`user:${p.userId}`).emit('chat:expired', { chatId: chat.id });
            });
            io.to(`chat:${chat.id}`).emit('chat:expired', { chatId: chat.id });
          }

          // Check if anyone saved the chat
          const anySaved = chat.participants.some(p => p.savedChat);

          if (!anySaved) {
            // Delete messages if nobody saved
            await prisma.message.deleteMany({ where: { chatId: chat.id } });
          }

          // Mark chat inactive regardless
          await prisma.chat.update({
            where: { id: chat.id },
            data: { isActive: false },
          });
        }

        console.log(`⏰ Expired ${expiredChats.length} chats`);
      }
    } catch (err) {
      console.error('Cron: expire chats error:', err.message);
    }
  });

  // Permanently delete soft-deleted posts older than 60 seconds (CDN purge window)
  cron.schedule('* * * * *', async () => {
    try {
      const cutoff = new Date(Date.now() - 60 * 1000);
      const deletedPosts = await prisma.post.findMany({
        where: { deletedAt: { lte: cutoff } },
        select: { id: true },
      });

      if (deletedPosts.length > 0) {
        // Delete related data first
        const postIds = deletedPosts.map(p => p.id);
        await prisma.postComment.deleteMany({ where: { postId: { in: postIds } } });
        await prisma.postLike.deleteMany({ where: { postId: { in: postIds } } });
        await prisma.post.deleteMany({ where: { id: { in: postIds } } });
        console.log(`🗑️  Hard-deleted ${deletedPosts.length} posts`);
      }
    } catch (err) {
      console.error('Cron: hard-delete posts error:', err.message);
    }
  });

  console.log('⏰ Cron jobs initialized');
}

module.exports = { initCronJobs };
