const prisma = require('../utils/prisma');
const { containsCoordinates, getAgeRange } = require('../utils/helpers');
const { getSocketIO } = require('../socket/socketServer');
const { notifyNewMessage } = require('./notificationService');

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
        include: { user: { select: { id: true, name: true, photoUrl: true, gender: true, age: true } } },
      },
      messages: { orderBy: { createdAt: 'asc' }, take: 200 },
    },
  });
  if (!chat) throw { status: 404, message: 'Chat not found' };

  // Mark messages as read when fetching
  await prisma.message.updateMany({
    where: { chatId, senderId: { not: userId }, readAt: null },
    data: { readAt: new Date() },
  });

  // Update lastReadAt for participant
  await prisma.chatParticipant.updateMany({
    where: { chatId, userId },
    data: { lastReadAt: new Date() },
  });

  return {
    id: chat.id,
    isActive: chat.isActive,
    expiresAt: chat.expiresAt,
    identityRevealed: chat.identityRevealed,
    identityMode: chat.request.identityMode,
    participants: chat.participants.map((p) => {
      const mode = chat.identityRevealed ? 'full' : chat.request.identityMode;
      let name = 'Someone nearby';
      if (mode === 'full') name = p.user.name;
      if (mode === 'semi') name = `${p.user.gender}, ${getAgeRange(p.user.age)}`;
      return {
        userId: p.user.id,
        name,
        photoUrl: mode === 'full' ? p.user.photoUrl : null,
        gender: p.user.gender,
        savedChat: p.savedChat,
      };
    }),
    messages: chat.messages.map((m) => ({
      id: m.id,
      chatId: m.chatId,
      senderId: m.senderId,
      content: m.content,
      deliveredAt: m.deliveredAt,
      readAt: m.readAt,
      createdAt: m.createdAt,
    })),
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
    data: { chatId, senderId, content: content.trim(), deliveredAt: new Date() },
  });

  // Send push notification to the other participant
  const otherParticipant = await prisma.chatParticipant.findFirst({
    where: { chatId, userId: { not: senderId } },
    include: { user: { select: { name: true } } },
  });
  if (otherParticipant) {
    const sender = await prisma.user.findUnique({ where: { id: senderId }, select: { name: true } });
    notifyNewMessage(otherParticipant.userId, sender?.name, chatId).catch(() => {});
  }

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
    .filter(c => c.chat.isActive || c.savedChat)
    .map(c => ({
      id: c.chat.id,
      expiresAt: c.chat.expiresAt,
      identityMode: c.chat.request.identityMode,
      identityRevealed: c.chat.identityRevealed,
      isActive: c.chat.isActive,
      savedChat: c.savedChat,
      participants: c.chat.participants.map(p => ({
        userId: p.user.id,
        name: (c.chat.identityRevealed || c.chat.request.identityMode === 'full') ? p.user.name : 'Anonymous',
        gender: p.user.gender,
        photoUrl: (c.chat.identityRevealed || c.chat.request.identityMode === 'full') ? p.user.photoUrl : null,
      })),
      lastMessage: c.chat.messages[0] || null,
    }));
}

/**
 * Save chat opt-in (prevents auto-delete on expiry)
 */
async function saveChat(chatId, userId) {
  const participant = await prisma.chatParticipant.findFirst({ where: { chatId, userId } });
  if (!participant) throw { status: 403, message: 'Not a participant' };

  await prisma.chatParticipant.update({
    where: { id: participant.id },
    data: { savedChat: true },
  });

  const io = getSocketIO();
  if (io) {
    io.to(`chat:${chatId}`).emit('chat:saved', { chatId, userId });
  }

  return { saved: true };
}

/**
 * Sender offers to reveal identity
 */
async function revealIdentity(chatId, userId) {
  const participant = await prisma.chatParticipant.findFirst({ where: { chatId, userId } });
  if (!participant) throw { status: 403, message: 'Not a participant' };

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { request: { select: { identityMode: true } } },
  });
  if (!chat) throw { status: 404, message: 'Chat not found' };
  if (chat.request.identityMode === 'full') throw { status: 400, message: 'Identity already visible' };
  if (chat.identityRevealed) throw { status: 400, message: 'Identity already revealed' };

  const io = getSocketIO();
  if (io) {
    const otherParticipant = await prisma.chatParticipant.findFirst({
      where: { chatId, userId: { not: userId } },
    });
    if (otherParticipant) {
      io.to(`user:${otherParticipant.userId}`).emit('chat:reveal-offer', { chatId, fromUserId: userId });
    }
  }

  return { offered: true };
}

/**
 * Receiver consents to identity reveal
 */
async function acceptReveal(chatId, userId) {
  const participant = await prisma.chatParticipant.findFirst({ where: { chatId, userId } });
  if (!participant) throw { status: 403, message: 'Not a participant' };

  const chat = await prisma.chat.update({
    where: { id: chatId },
    data: { identityRevealed: true },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, photoUrl: true, gender: true, age: true } } },
      },
    },
  });

  const io = getSocketIO();
  if (io) {
    const revealed = chat.participants.map(p => ({
      userId: p.user.id,
      name: p.user.name,
      photoUrl: p.user.photoUrl,
      gender: p.user.gender,
    }));
    io.to(`chat:${chatId}`).emit('chat:revealed', { chatId, participants: revealed });
  }

  return { revealed: true };
}

/**
 * Post-chat rating: thumbs up / thumbs down
 */
async function rateChatPartner(chatId, userId, rating) {
  if (!['positive', 'negative'].includes(rating)) {
    throw { status: 400, message: 'Rating must be positive or negative' };
  }

  const participant = await prisma.chatParticipant.findFirst({ where: { chatId, userId } });
  if (!participant) throw { status: 403, message: 'Not a participant' };

  const otherParticipant = await prisma.chatParticipant.findFirst({
    where: { chatId, userId: { not: userId } },
  });
  if (!otherParticipant) throw { status: 400, message: 'Other participant not found' };

  const updateField = rating === 'positive' ? 'positiveRatingCount' : 'negativeRatingCount';
  await prisma.user.update({
    where: { id: otherParticipant.userId },
    data: { [updateField]: { increment: 1 } },
  });

  return { rated: true, rating };
}

module.exports = { getChatMessages, saveMessage, getUserChats, saveChat, revealIdentity, acceptReveal, rateChatPartner };
