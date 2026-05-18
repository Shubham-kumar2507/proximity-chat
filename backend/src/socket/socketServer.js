const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwt');
const prisma = require('../utils/prisma');
const chatService = require('../services/chatService');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication error: No token'));
      const decoded = verifyToken(token);
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

    socket.on('chat:join', async (data, callback) => {
      try {
        const { chatId } = data;
        const participant = await prisma.chatParticipant.findFirst({
          where: { chatId, userId: socket.user.id },
        });
        if (!participant) return callback({ success: false, error: 'Not a participant' });
        socket.join(`chat:${chatId}`);
        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('chat:message', async (data, callback) => {
      try {
        const { chatId, content } = data;
        const message = await chatService.saveMessage(chatId, socket.user.id, content);
        io.to(`chat:${chatId}`).emit('chat:message', {
          id: message.id, chatId, senderId: socket.user.id, content: message.content, createdAt: message.createdAt,
        });
        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('chat:typing', (data) => {
      const { chatId } = data;
      socket.to(`chat:${chatId}`).emit('chat:typing', { userId: socket.user.id });
    });

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
