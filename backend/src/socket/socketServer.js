const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../utils/prisma');
const chatService = require('../services/chatService');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication error: No token'));
      const decoded = verifyAccessToken(token);
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) return next(new Error('Authentication error: User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.id}`);
    socket.join(`user:${socket.user.id}`);

    // Join a chat room
    socket.on('chat:join', async (data, callback) => {
      try {
        const { chatId } = data;
        const participant = await prisma.chatParticipant.findFirst({
          where: { chatId, userId: socket.user.id },
        });
        if (!participant) return callback?.({ success: false, error: 'Not a participant' });
        socket.join(`chat:${chatId}`);
        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Send message
    socket.on('chat:message', async (data, callback) => {
      try {
        const { chatId, content } = data;
        const message = await chatService.saveMessage(chatId, socket.user.id, content);
        
        const payload = {
          id: message.id,
          chatId,
          senderId: socket.user.id,
          content: message.content,
          deliveredAt: message.deliveredAt,
          readAt: null,
          createdAt: message.createdAt,
        };

        io.to(`chat:${chatId}`).emit('chat:message', payload);

        // Notify the other user globally for unread badges
        const participants = await prisma.chatParticipant.findMany({ where: { chatId } });
        const other = participants.find(p => p.userId !== socket.user.id);
        if (other) {
          io.to(`user:${other.userId}`).emit('chat:notification', payload);
        }

        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Typing indicator
    socket.on('chat:typing', (data) => {
      const { chatId, isTyping } = data;
      socket.to(`chat:${chatId}`).emit('chat:typing', {
        userId: socket.user.id,
        isTyping: isTyping !== false,
      });
    });

    // Mark messages as read (read receipts)
    socket.on('chat:read', async (data) => {
      try {
        const { chatId, messageIds } = data;
        if (!messageIds || messageIds.length === 0) return;

        await prisma.message.updateMany({
          where: {
            id: { in: messageIds },
            chatId,
            senderId: { not: socket.user.id },
            readAt: null,
          },
          data: { readAt: new Date() },
        });

        // Update participant's lastReadAt
        await prisma.chatParticipant.updateMany({
          where: { chatId, userId: socket.user.id },
          data: { lastReadAt: new Date() },
        });

        // Notify sender that messages were read
        socket.to(`chat:${chatId}`).emit('chat:read-receipt', {
          chatId,
          messageIds,
          readBy: socket.user.id,
          readAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Read receipt error:', err.message);
      }
    });

    // Message delivered acknowledgment
    socket.on('chat:delivered', async (data) => {
      try {
        const { chatId, messageIds } = data;
        if (!messageIds || messageIds.length === 0) return;

        await prisma.message.updateMany({
          where: {
            id: { in: messageIds },
            chatId,
            senderId: { not: socket.user.id },
            deliveredAt: null,
          },
          data: { deliveredAt: new Date() },
        });

        socket.to(`chat:${chatId}`).emit('chat:delivered-receipt', {
          chatId,
          messageIds,
          deliveredAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Delivery receipt error:', err.message);
      }
    });

    // Leave chat room
    socket.on('chat:leave', (data) => {
      const { chatId } = data;
      socket.leave(`chat:${chatId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.user.id}`);
    });
  });
}

function getSocketIO() { return io; }

module.exports = { initSocket, getSocketIO };
