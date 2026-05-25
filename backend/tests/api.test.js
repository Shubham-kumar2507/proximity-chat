const request = require('supertest');
const { app, server } = require('../src/index');
const prisma = require('../src/utils/prisma');
const redis = require('../src/utils/redis');

describe('Proximity Chat API Integration Tests', () => {
  let userToken;
  let userId;
  let mockEmail = 'test@example.com';

  beforeAll(async () => {
    // Clean database before tests
    await prisma.message.deleteMany();
    await prisma.chatParticipant.deleteMany();
    await prisma.chat.deleteMany();
    await prisma.chatRequest.deleteMany();
    await prisma.block.deleteMany();
    await prisma.report.deleteMany();
    await prisma.user.deleteMany();
    await redis.flushall();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await redis.quit();
    server.close();
  });

  describe('1. Auth Flow', () => {
    it('should send OTP', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ email: mockEmail })
        .timeout(15000);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should verify OTP and return JWT', async () => {
      // Get OTP from Redis
      const otp = await redis.get(`otp:${mockEmail}`);
      
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: mockEmail, otp });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.isNewUser).toBe(true);

      userToken = res.body.data.accessToken;
      userId = res.body.data.user.id;
    });

    it('should complete profile', async () => {
      const res = await request(app)
        .post('/api/auth/complete-profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test User',
          age: 25,
          gender: 'male',
          bio: 'Hello world'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test User');
      expect(res.body.data.isVerified).toBe(true);
    });
  });

  describe('2. Location Service', () => {
    it('should update location', async () => {
      const res = await request(app)
        .post('/api/location/update')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ latitude: 40.7128, longitude: -74.0060 });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.h3Index).toBeDefined();
    });

    it('should get nearby users', async () => {
      // Create another user nearby
      const user2 = await prisma.user.create({
        data: {
          email: 'nearby@test.com',
          name: 'Nearby User',
          age: 24,
          gender: 'female',
          isVerified: true
        }
      });

      // Update their location in Redis
      await request(app)
        .post('/api/location/update')
        .set('Authorization', `Bearer ${userToken}`) // Macking the call just to populate
        // But let's do it via the service or mocked auth for simplicity.
        // Actually, let's just use the service logic since we don't have user2 token.
      
      // Update manually via redis
      const { updateLocation } = require('../src/services/locationService');
      await updateLocation(user2.id, 40.7129, -74.0061); // Very close

      const res = await request(app)
        .get('/api/location/nearby')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].userId).toBe(user2.id);
    });
  });

  describe('3. Safety Features', () => {
    let blockUserToken;
    let blockUserId;

    beforeAll(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'block@test.com',
          name: 'Block User',
          age: 30,
          gender: 'male',
          isVerified: true
        }
      });
      blockUserId = user.id;
    });

    it('should block a user', async () => {
      const res = await request(app)
        .post('/api/safety/block')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ blockedId: blockUserId });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should get blocked users', async () => {
      const res = await request(app)
        .get('/api/safety/blocked')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].user.id).toBe(blockUserId);
    });
  });
});
