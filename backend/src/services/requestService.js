const prisma = require('../utils/prisma');
const redis = require('../utils/redis');
const { getFirebaseAdmin } = require('../utils/firebase');
const { getAgeRange } = require('../utils/helpers');
const { getSocketIO } = require('../socket/socketServer');

const LOCATION_PREFIX = 'location:';

async function sendRequest(senderId, data) {
  const { receiverId, identityMode, message, topicTag } = data;
  const allowedModes = ['full', 'semi', 'anonymous'];
  if (!identityMode || !allowedModes.includes(identityMode)) {
    throw { status: 400, message: 'Identity mode must be one of: full, semi, anonymous' };
  }
  if (!message || message.trim().length === 0) {
    throw { status: 400, message: 'Icebreaker message is required' };
  }
  if (message.length > 100) {
    throw { status: 400, message: 'Icebreaker message must be 100 characters or less' };
  }
  if (topicTag && !['music', 'hangout', 'networking', 'general'].includes(topicTag)) {
    throw { status: 400, message: 'Invalid topic tag' };
  }
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true, fcmToken: true, name: true, shadowBanned: true },
  });
  if (!receiver) throw { status: 404, message: 'User not found' };

  const receiverLoc = await redis.get(`${LOCATION_PREFIX}${receiverId}`);
  if (!receiverLoc) throw { status: 400, message: 'User is no longer nearby' };
  const senderLoc = await redis.get(`${LOCATION_PREFIX}${senderId}`);
  if (!senderLoc) throw { status: 400, message: 'Your location is not set' };

  const existing = await prisma.chatRequest.findFirst({
    where: {
      OR: [
        { senderId, receiverId, status: 'pending' },
        { senderId: receiverId, receiverId: senderId, status: 'pending' },
      ],
    },
  });
  if (existing) throw { status: 400, message: 'A pending request already exists' };

  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: senderId, blockedId: receiverId },
        { blockerId: receiverId, blockedId: senderId },
      ],
    },
  });
  if (blocked) throw { status: 400, message: 'Cannot send request to this user' };

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const chatRequest = await prisma.chatRequest.create({
    data: { senderId, receiverId, identityMode, message: message.trim(), topicTag: topicTag || 'general', expiresAt },
    include: { sender: { select: { id: true, name: true, age: true, gender: true, photoUrl: true } } },
  });

  let notif = {};
  if (identityMode === 'full') {
    notif = { title: `${chatRequest.sender.name} wants to chat!`, body: message };
  } else if (identityMode === 'semi') {
    notif = { title: 'Someone nearby wants to chat!', body: message };
  } else {
    notif = { title: 'Someone nearby wants to chat', body: 'New anonymous chat request' };
  }

  const io = getSocketIO();
  if (io) {
    io.to(`user:${receiverId}`).emit('request:incoming', {
      requestId: chatRequest.id, identityMode, message: chatRequest.message,
      topicTag: chatRequest.topicTag, expiresAt: chatRequest.expiresAt, ...notif,
    });
  }

  if (receiver.fcmToken) {
    try {
      const admin = getFirebaseAdmin();
      await admin.messaging().send({
        token: receiver.fcmToken,
        notification: { title: notif.title, body: notif.body },
        data: { type: 'chat_request', requestId: chatRequest.id },
      });
    } catch (err) { console.log('FCM failed:', err.message); }
  }

  return chatRequest;
}

module.exports = { sendRequest };
