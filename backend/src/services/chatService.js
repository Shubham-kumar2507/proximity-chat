const prisma = require('../utils/prisma');
const { containsCoordinates } = require('../utils/helpers');

async function getChatMessages(chatId, userId) {
  const participant = await prisma.chatParticipant.findFirst({
    where: { chatId, userId },
  });
  if (!participant) throw { status: 403, message: 'Not a participant' };

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      request: { select: { identityMode: true } },
      participants: {
        include: { user: { select: { id: true, name: true, photoUrl: true, gender: true } } },
      },
      messages: { orderBy: { createdAt: 'asc' }, take: 200 },
    },
  });
  if (!chat) throw { status: 404, message: 'Chat not found' };

  return {
    id: chat.id,
    isActive: chat.isActive,
    expiresAt: chat.expiresAt,
    identityMode: chat.request.identityMode,
    participants: chat.participants.map(p => ({
      userId: p.user.id,
      name: chat.request.identityMode === 'full' ? p.user.name : 'Anonymous',
      photoUrl: chat.request.identityMode === 'full' ? p.user.photoUrl : null,
      gender: p.user.gender,
    })),
    messages: chat.messages,
  };
}

async function saveMessage(chatId, senderId, content) {
  if (!content || content.trim().length === 0) {
    throw { status: 400, message: 'Message cannot be empty' };
  }
  if (containsCoordinates(content)) {
    throw { status: 400, message: 'Sharing location coordinates is not allowed' };
  }
  const participant = await prisma.chatParticipant.findFirst({
    where: { chatId, userId: senderId },
  });
  if (!participant) throw { status: 403, message: 'Not a participant' };

  const chat = await prisma.chat.findUnique({ where: { id: chatId } });
  if (!chat || !chat.isActive) throw { status: 400, message: 'Chat is no longer active' };
  if (new Date() > chat.expiresAt) throw { status: 400, message: 'Chat has expired' };

  const message = await prisma.message.create({
    data: { chatId, senderId, content: content.trim() },
  });
  return message;
}

async function getUserChats(userId) {
  const chats = await prisma.chatParticipant.findMany({
    where: { userId },
    include: {
      chat: {
        include: {
          request: { select: { identityMode: true } },
          participants: {
            include: { user: { select: { id: true, name: true, photoUrl: true, gender: true } } },
          },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      },
    },
  });
  return chats
    .filter(c => c.chat.isActive)
    .map(c => ({
      id: c.chat.id,
      expiresAt: c.chat.expiresAt,
      identityMode: c.chat.request.identityMode,
      participants: c.chat.participants.map(p => ({
        userId: p.user.id,
        name: c.chat.request.identityMode === 'full' ? p.user.name : 'Anonymous',
        gender: p.user.gender,
      })),
      lastMessage: c.chat.messages[0] || null,
    }));
}

module.exports = { getChatMessages, saveMessage, getUserChats };
