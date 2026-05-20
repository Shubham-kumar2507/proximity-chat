require('dotenv').config();

process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5432/proximitychat';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';
process.env.NODE_ENV = 'test';
process.env.SKIP_SMTP = 'true';
