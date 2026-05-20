const prisma = require('../utils/prisma');
const { getFirebaseAdmin } = require('../utils/firebase');

/**
 * Send push notification to a user by their userId.
 * @param {string} userId
 * @param {{title: string, body: string}} notification
 * @param {Record<string, string>} [data]
 */
async function sendPushToUser(userId, notification, data = {}) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });
    if (!user?.fcmToken) return;

    const admin = getFirebaseAdmin();
    await admin.messaging().send({
      token: user.fcmToken,
      notification,
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
    });
  } catch (err) {
    console.log(`FCM push to ${userId} failed:`, err.message);
  }
}

/**
 * Push: new message notification
 */
async function notifyNewMessage(recipientId, senderName, chatId) {
  await sendPushToUser(
    recipientId,
    { title: 'New message', body: `${senderName || 'Someone'} sent you a message` },
    { type: 'new_message', chatId }
  );
}

/**
 * Push: post interaction (like, comment, repost)
 */
async function notifyPostInteraction(recipientId, actorName, postId, interactionType) {
  const messages = {
    like: `${actorName} liked your post`,
    comment: `${actorName} commented on your post`,
    repost: `${actorName} reposted your post`,
  };
  await sendPushToUser(
    recipientId,
    { title: 'Post interaction', body: messages[interactionType] || 'Someone interacted with your post' },
    { type: 'post_interaction', postId, interactionType }
  );
}

/**
 * Push: request expiry warning
 */
async function notifyRequestExpiry(userId, requestId) {
  await sendPushToUser(
    userId,
    { title: 'Request expiring', body: 'Your chat request is about to expire' },
    { type: 'request_expiry', requestId }
  );
}

module.exports = {
  sendPushToUser,
  notifyNewMessage,
  notifyPostInteraction,
  notifyRequestExpiry,
};
