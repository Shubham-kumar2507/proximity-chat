const h3 = require('h3-js');
const redis = require('../utils/redis');
const prisma = require('../utils/prisma');
const config = require('../config');
const { getFuzzyDistance, getAgeRange } = require('../utils/helpers');

const LOCATION_PREFIX = 'location:';
const LOCATION_TTL = 300; // 5 minutes - offline grace period
const H3_RESOLUTION = 9; // ~174m hexagons
const K_RING_RADIUS = 2; // covers ~500m

/**
 * Update user's location in Redis
 */
async function updateLocation(userId, latitude, longitude) {
  const lat = typeof latitude === 'number' ? latitude : parseFloat(latitude);
  const lng = typeof longitude === 'number' ? longitude : parseFloat(longitude);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw { status: 400, message: 'Invalid coordinates' };
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw { status: 400, message: 'Coordinates out of range' };
  }

  const h3Index = h3.latLngToCell(lat, lng, H3_RESOLUTION);

  const previousRaw = await redis.get(`${LOCATION_PREFIX}${userId}`);
  if (previousRaw) {
    try {
      const previous = JSON.parse(previousRaw);
      if (previous.h3Index && previous.h3Index !== h3Index) {
        await redis.srem(`h3:${previous.h3Index}`, userId);
      }
    } catch {
      // ignore corrupt cache entries
    }
  }

  const locationData = JSON.stringify({
    h3Index,
    lat,
    lng,
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
function validateRadiusKm(user, requestedKm) {
  const radius = parseFloat(requestedKm) || config.defaultRadiusKm;
  if (!config.allowedRadiusKm.includes(radius)) {
    throw { status: 400, message: `Radius must be one of: ${config.allowedRadiusKm.join(', ')}km` };
  }
  if (config.premiumRadiusKm.includes(radius) && !user.isPremium) {
    throw { status: 403, message: 'Premium subscription required for this radius' };
  }
  return radius;
}

async function getNearbyUsers(userId, maxDistanceKm = 0.5) {
  const viewer = await prisma.user.findUnique({
    where: { id: userId },
    select: { locationPaused: true, isPremium: true, discoveryRadiusKm: true },
  });
  if (viewer?.locationPaused) {
    throw { status: 400, message: 'Location is paused. Disable invisible mode to discover users.' };
  }
  // Get requesting user's location
  const userLocationRaw = await redis.get(`${LOCATION_PREFIX}${userId}`);
  if (!userLocationRaw) {
    throw { status: 400, message: 'Your location is not set. Please enable location services.' };
  }

  const userLocation = JSON.parse(userLocationRaw);
  const userH3 = userLocation.h3Index;

  // Calculate k-ring based on requested distance
  // H3 res 9 edge length is ~174m. K-ring 1 gives ~348m radius.
  const kRingRadius = Math.max(1, Math.ceil((maxDistanceKm * 1000) / (174 * 2)));

  // Get k-ring neighbors
  const nearbyH3Cells = h3.gridDisk(userH3, kRingRadius);

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
      locationPaused: false,
    },
    select: {
      id: true,
      name: true,
      age: true,
      gender: true,
      bio: true,
      photoUrl: true,
      vibeStatus: true,
      interestTags: true,
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
        interestTags: user.interestTags,
        ageRange: getAgeRange(user.age),
        distance,
      };
    });

  return nearbyUsers;
}

/**
 * Surface group nearby event when 5+ users within 500m.
 * @param {string} userId
 */
async function getGroupNearby(userId) {
  const nearby = await getNearbyUsers(userId, 0.5);
  return {
    active: nearby.length >= 5,
    count: nearby.length,
    label: nearby.length >= 5 ? 'Group Nearby' : null,
  };
}

module.exports = { updateLocation, getNearbyUsers, getGroupNearby, validateRadiusKm };
