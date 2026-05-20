require('dotenv').config();

const required = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET'];

function loadConfig() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const nodeEnv = process.env.NODE_ENV || 'development';

  return {
    port: parseInt(process.env.PORT || '4000', 10),
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    jwtSecret: process.env.JWT_SECRET,
    nodeEnv,
    isProduction: nodeEnv === 'production',
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@proximitychat.app',
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    },
    photodna: {
      apiKey: process.env.PHOTODNA_API_KEY || '',
      endpoint: process.env.PHOTODNA_ENDPOINT || '',
    },
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:8081,http://localhost:19006')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    allowedRadiusKm: [0.1, 0.3, 0.5, 1, 2, 5, 10],
    premiumRadiusKm: [2, 5, 10],
    defaultRadiusKm: 0.5,
  };
}

module.exports = loadConfig();
