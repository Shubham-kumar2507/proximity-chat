const h3 = require('h3-js');
const redis = require('../utils/redis');
const prisma = require('../utils/prisma');
const { getFuzzyDistance } = require('../utils/helpers');

const LOCATION_PREFIX = 'location:';
const LOCATION_TTL = 90; // 90 seconds
const H3_RESOLUTION = 9; // ~174m hexagons
const K_RING_RADIUS = 2; // covers ~500m

/**
 * Update user's location in Redis
 */
async function updateLocation(userId, latitude, longitude) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw { status: 400, message: 'Invalid coordinates' };
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw { status: 400, message: 'Coordinates out of range' };
  }

  const h3Index = h3.latLngToCell(latitude, longitude, H3_RESOLUTION);

  const locationData = JSON.stringify({
    h3Index,
    lat: latitude,
    lng: longitude,
    timestamp: Date.now(),
    userId,
  });

  // Store in Redis with TTL - never in PostgreSQL
  await redis.set(`${LOCATION_PREFIX}${userId}`, locationData, 'EX', LOCATION_TTL);

  // Also maintain a set of users per H3 cell for efficient lookup
  await redis.sadd(`h3:${h3Index}`, userId);
  await redis.expire(`h3:${h3Index}`, LOCATION_TTL);

  return { h3Index };
}

/**
 * Get nearby users using H3 k-ring
 */
async function getNearbyUsers(userId) {
  // Get requesting user's location
  const userLocationRaw = await redis.get(`${LOCATION_PREFIX}${userId}`);
  if (!userLocationRaw) {
    throw { status: 400, message: 'Your location is not set. Please enable location services.' };
  }

  const userLocation = JSON.parse(userLocationRaw);
  const userH3 = userLocation.h3Index;

  // Get k-ring neighbors (covers ~500m at resolution 9, k=2)
  const nearbyH3Cells = h3.gridDisk(userH3, K_RING_RADIUS);

  // Get all user IDs in nearby cells
  const pipeline = redis.pipeline();
  nearbyH3Cells.forEach((cell) => {
    pipeline.smembers(`h3:${cell}`);
  });
  const cellResults = await pipeline.exec();

  const nearbyUserIds = new Set();
  cellResults.forEach(([err, members]) => {
    if (!err && members) {
      members.forEach((id) => nearbyUserIds.add(id));
    }
  });

  // Remove self
  nearbyUserIds.delete(userId);

  if (nearbyUserIds.size === 0) {
    return [];
  }

  // Get blocked users (both directions)
  const [blockedByMe, blockedMe] = await Promise.all([
    prisma.block.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    }),
    prisma.block.findMany({
      where: { blockedId: userId },
      select: { blockerId: true },
    }),
  ]);

  const blockedIds = new Set([
    ...blockedByMe.map((b) => b.blockedId),
    ...blockedMe.map((b) => b.blockerId),
  ]);

  // Get shadow-banned users
  const shadowBannedUsers = await prisma.user.findMany({
    where: {
      id: { in: Array.from(nearbyUserIds) },
      shadowBanned: true,
    },
    select: { id: true },
  });
  const shadowBannedIds = new Set(shadowBannedUsers.map((u) => u.id));

  // Filter out blocked and shadow-banned users
  const filteredUserIds = Array.from(nearbyUserIds).filter(
    (id) => !blockedIds.has(id) && !shadowBannedIds.has(id)
  );

  if (filteredUserIds.length === 0) {
    return [];
  }

  // Get user details and their locations
  const users = await prisma.user.findMany({
    where: {
      id: { in: filteredUserIds },
      isVerified: true,
    },
    select: {
      id: true,
      name: true,
      age: true,
      gender: true,
      bio: true,
      photoUrl: true,
      vibeStatus: true,
    },
  });

  // Get location data for distance calculation
  const locationPipeline = redis.pipeline();
  filteredUserIds.forEach((id) => {
    locationPipeline.get(`${LOCATION_PREFIX}${id}`);
  });
  const locationResults = await locationPipeline.exec();

  const locationMap = {};
  filteredUserIds.forEach((id, index) => {
    const [err, data] = locationResults[index];
    if (!err && data) {
      locationMap[id] = JSON.parse(data);
    }
  });

  // Build response with fuzzy distances - NO exact coordinates
  const nearbyUsers = users
    .filter((user) => locationMap[user.id])
    .map((user) => {
      const otherLocation = locationMap[user.id];
      let distance = '~500m';
      try {
        distance = getFuzzyDistance(userH3, otherLocation.h3Index);
      } catch (e) {
        distance = '~500m';
      }

      return {
        userId: user.id,
        name: user.name,
        age: user.age,
        gender: user.gender,
        bio: user.bio,
        photoUrl: user.photoUrl,
        vibeStatus: user.vibeStatus,
        distance,
      };
    });

  return nearbyUsers;
}

module.exports = { updateLocation, getNearbyUsers };
