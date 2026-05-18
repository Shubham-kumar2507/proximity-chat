const prisma = require('../utils/prisma');
const { getAgeRange } = require('../utils/helpers');
const { getSocketIO } = require('../socket/socketServer');
const { getFirebaseAdmin } = require('../utils/firebase');

async function respondToRequest(userId, requestId, action) {
  const allowed = ['accept', 'decline', 'report'];
  if (!allowed.includes(action)) throw { status: 400, message: 'Invalid action' };

  const req = await prisma.chatRequest.findUnique({
    where: { id: requestId },
    include: {
      sender: { select: { id: true, name: true, fcmToken: true, reportCount: true } },
      receiver: { select: { id: true } },
    },
  });
  if (!req) throw { status: 404, message: 'Request not found' };
  if (req.receiverId !== userId) throw { status: 403, message: 'Not your request' };
  if (req.status !== 'pending') throw { status: 400, message: `Already ${req.status}` };
  if (new Date() > req.expiresAt) {
    await prisma.chatRequest.update({ where: { id: requestId }, data: { status: 'expired' } });
    throw { status: 400, message: 'Request expired' };
  }

  const io = getSocketIO();

  if (action === 'accept') {
    const chatExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const [updated, chat] = await prisma.$transaction([
      prisma.chatRequest.update({ where: { id: requestId }, data: { status: 'accepted' } }),
      prisma.chat.create({
        data: {
          requestId, expiresAt: chatExpiry,
          participants: { create: [{ userId: req.senderId }, { userId: req.receiverId }] },
        },
        include: {
          participants: { include: { user: { select: { id: true, name: true, photoUrl: true, gender: true, age: true } } } },
          request: { select: { identityMode: true } },
        },
      }),
    ]);
    if (io) {
      const payload = {
        chatId: chat.id, requestId: chat.requestId, identityMode: chat.request.identityMode,
        expiresAt: chat.expiresAt,
        participants: chat.participants.map(p => ({
          userId: p.user.id,
          name: chat.request.identityMode === 'full' ? p.user.name : undefined,
          gender: p.user.gender,
          photoUrl: chat.request.identityMode === 'full' ? p.user.photoUrl : undefined,
        })),
      };
      io.to(`user:${req.senderId}`).emit('chat:created', payload);
      io.to(`user:${req.receiverId}`).emit('chat:created', payload);
    }
    if (req.sender.fcmToken) {
      try {
        const admin = getFirebaseAdmin();
        await admin.messaging().send({
          token: req.sender.fcmToken,
          notification: { title: 'Request accepted!', body: 'Start chatting now!' },
          data: { type: 'chat_accepted', chatId: chat.id },
        });
      } catch (e) { console.log('FCM error:', e.message); }
    }
    return { chat, request: updated };
  }

  if (action === 'decline') {
    const updated = await prisma.chatRequest.update({ where: { id: requestId }, data: { status: 'declined' } });
    if (io) io.to(`user:${req.senderId}`).emit('request:declined', { requestId });
    return { request: updated };
  }

  if (action === 'report') {
    const [updated, report, sender] = await prisma.$transaction([
      prisma.chatRequest.update({ where: { id: requestId }, data: { status: 'declined' } }),
      prisma.report.create({ data: { reporterId: userId, reportedId: req.senderId, reason: 'inappropriate' } }),
      prisma.user.update({ where: { id: req.senderId }, data: { reportCount: { increment: 1 } } }),
    ]);
    if (sender.reportCount >= 3) {
      await prisma.user.update({ where: { id: req.senderId }, data: { shadowBanned: true } });
    }
    return { request: updated, report };
  }
}

async function getIncomingRequests(userId) {
  const requests = await prisma.chatRequest.findMany({
    where: { receiverId: userId, status: 'pending', expiresAt: { gt: new Date() } },
    include: { sender: { select: { id: true, name: true, age: true, gender: true, photoUrl: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return requests.map(r => {
    const base = { id: r.id, identityMode: r.identityMode, message: r.message, topicTag: r.topicTag, expiresAt: r.expiresAt, createdAt: r.createdAt };
    if (r.identityMode === 'full') return { ...base, sender: { id: r.sender.id, name: r.sender.name, age: r.sender.age, gender: r.sender.gender, photoUrl: r.sender.photoUrl } };
    if (r.identityMode === 'semi') return { ...base, sender: { gender: r.sender.gender, ageRange: getAgeRange(r.sender.age) } };
    return { ...base, sender: { gender: r.sender.gender, label: 'Someone nearby' } };
  });
}

module.exports = { respondToRequest, getIncomingRequests };
