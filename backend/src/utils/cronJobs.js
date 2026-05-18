const cron = require('node-cron');
const prisma = require('./prisma');
const { getSocketIO } = require('../socket/socketServer');

/**
 * Initialize all cron jobs
 */
function initCronJobs() {
  // Expire pending chat requests every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
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
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const expiredChats = await prisma.chat.findMany({
        where: {
          isActive: true,
          expiresAt: { lte: now },
        },
        include: {
          participants: { select: { userId: true } },
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

          // Delete messages first (cascade), then mark chat inactive
          await prisma.message.deleteMany({ where: { chatId: chat.id } });
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

  console.log('⏰ Cron jobs initialized');
}

module.exports = { initCronJobs };
