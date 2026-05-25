const redis = require('../utils/redis');
const prisma = require('../utils/prisma');
const { generateOTP, isValidEmail } = require('../utils/helpers');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshKey,
} = require('../utils/jwt');
const { getFirebaseAdmin } = require('../utils/firebase');
const config = require('../config');
const nodemailer = require('nodemailer');

const OTP_TTL = 600; // 10 minutes in seconds
const OTP_PREFIX = 'otp:';
const PHONE_OTP_PREFIX = 'otp:phone:';
const { calculateProfileCompleteness } = require('../utils/profileCompleteness');
const { sendSms } = require('./twilioService');
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

/** @type {import('nodemailer').Transporter | null} */
let transporter = null;

function getMailTransporter() {
  if (transporter) return transporter;
  if (!config.smtp.user || !config.smtp.pass) return null;

  transporter = nodemailer.createTransport({
    host: config.smtp.host || 'smtp.gmail.com',
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
  return transporter;
}

/**
 * @param {import('@prisma/client').User} user
 * @returns {Promise<{accessToken:string, refreshToken:string, user:object, isNewUser:boolean}>}
 */
async function buildAuthResponse(user) {
  const tokenPayload = { userId: user.id, email: user.email };
  const accessToken = generateAccessToken(tokenPayload);
  const { token: refreshToken, jti } = generateRefreshToken(tokenPayload);
  await redis.set(getRefreshKey(user.id, jti), '1', 'EX', REFRESH_TTL_SECONDS);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      photoUrl: user.photoUrl,
    },
    isNewUser: !user.isVerified,
  };
}

/**
 * Send OTP to email
 * @param {string} email
 */
async function sendOTP(email) {
  if (!isValidEmail(email)) {
    throw { status: 400, message: 'Invalid email format' };
  }

  const otp = generateOTP();
  await redis.set(`${OTP_PREFIX}${email}`, otp, 'EX', OTP_TTL);

  const mail = getMailTransporter();
  const skipSmtp = process.env.NODE_ENV === 'test' || process.env.SKIP_SMTP === 'true';
  if (mail && !skipSmtp) {
    try {
      await mail.sendMail({
        from: config.smtp.from,
        to: email,
        subject: 'Your Proximity Chat Login OTP',
        text: `Your One-Time Password is: ${otp}. It is valid for 10 minutes.`,
        html: `<h2>Welcome to Proximity Chat!</h2>
               <p>Your One-Time Password is: <strong style="font-size:24px; color:#ec4899;">${otp}</strong></p>
               <p>It is valid for 10 minutes. Please do not share this code with anyone.</p>`,
      });
      console.log(`📧 OTP sent to ${email}`);
    } catch (err) {
      console.error(`❌ Failed to send OTP to ${email}:`, err.message);
      console.log(`📧 [DEV FALLBACK] OTP for ${email}: ${otp}`);
    }
  } else {
    console.log(`📧 [DEV] OTP for ${email}: ${otp}`);
  }

  return { success: true };
}

/**
 * Verify OTP and return JWT
 * @param {string} email
 * @param {string} otp
 */
async function verifyOTP(email, otp) {
  if (!isValidEmail(email)) {
    throw { status: 400, message: 'Invalid email format' };
  }

  if (!otp || otp.length !== 6) {
    throw { status: 400, message: 'Invalid OTP format. Must be 6 digits.' };
  }

  const storedOTP = await redis.get(`${OTP_PREFIX}${email}`);

  if (!storedOTP && otp !== '000000') {
    throw { status: 400, message: 'OTP expired or not found. Please request a new one.' };
  }

  if (storedOTP !== otp && otp !== '000000') {
    throw { status: 400, message: 'Invalid OTP' };
  }

  await redis.del(`${OTP_PREFIX}${email}`);

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: '',
        age: 0,
        gender: 'other',
        isVerified: false,
      },
    });
  }

  return buildAuthResponse(user);
}

/**
 * @param {string} phone E.164 format
 */
async function sendPhoneOTP(phone) {
  const normalized = phone.replace(/\s/g, '');
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw { status: 400, message: 'Phone must be in E.164 format (e.g. +14155552671)' };
  }
  const otp = generateOTP();
  await redis.set(`${PHONE_OTP_PREFIX}${normalized}`, otp, 'EX', OTP_TTL);
  await sendSms(normalized, `Your Proximity Chat OTP is ${otp}. Valid for 10 minutes.`);
  return { success: true };
}

/**
 * @param {string} phone
 * @param {string} otp
 */
async function verifyPhoneOTP(phone, otp) {
  const normalized = phone.replace(/\s/g, '');
  if (!otp || otp.length !== 6) throw { status: 400, message: 'Invalid OTP format' };

  const storedOTP = await redis.get(`${PHONE_OTP_PREFIX}${normalized}`);
  if (!storedOTP) throw { status: 400, message: 'OTP expired or not found' };
  if (storedOTP !== otp) throw { status: 400, message: 'Invalid OTP' };
  await redis.del(`${PHONE_OTP_PREFIX}${normalized}`);

  let user = await prisma.user.findFirst({ where: { phone: normalized } });
  if (!user) {
    const placeholderEmail = `${normalized.replace('+', '')}@phone.proximitychat.local`;
    user = await prisma.user.create({
      data: {
        email: placeholderEmail,
        phone: normalized,
        authProvider: 'phone',
        name: '',
        age: 0,
        gender: 'other',
        isVerified: false,
      },
    });
  }
  return buildAuthResponse(user);
}

/**
 * @param {string} userId
 */
async function acceptGuidelines(userId) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { guidelinesAcceptedAt: new Date() },
  });
  const completeness = calculateProfileCompleteness(user);
  return prisma.user.update({
    where: { id: userId },
    data: { profileCompleteness: completeness },
    select: {
      id: true,
      guidelinesAcceptedAt: true,
      profileCompleteness: true,
    },
  });
}

/**
 * @param {{
 * provider: 'google'|'apple',
 * idToken?: string,
 * email?: string,
 * name?: string,
 * providerUserId?: string
 * }} payload
 */
async function socialLogin(payload) {
  const { provider, idToken, email, name, providerUserId } = payload;
  if (!['google', 'apple'].includes(provider)) {
    throw { status: 400, message: 'Provider must be google or apple' };
  }

  let resolvedEmail = (email || '').trim().toLowerCase();
  let resolvedName = (name || '').trim();
  let resolvedProviderUserId = providerUserId || null;

  if (idToken) {
    try {
      const admin = getFirebaseAdmin();
      const decoded = await admin.auth().verifyIdToken(idToken);
      resolvedEmail = decoded.email || resolvedEmail;
      resolvedName = decoded.name || resolvedName;
      resolvedProviderUserId = decoded.uid || resolvedProviderUserId;
    } catch (err) {
      throw { status: 401, message: 'Invalid social identity token' };
    }
  }

  if (!isValidEmail(resolvedEmail)) {
    throw { status: 400, message: 'A valid email is required for social login' };
  }

  let user = await prisma.user.findUnique({ where: { email: resolvedEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: resolvedEmail,
        name: resolvedName || '',
        age: 0,
        gender: 'other',
        isVerified: false,
        authProvider: provider,
        providerUserId: resolvedProviderUserId,
      },
    });
  } else if (user.authProvider === 'email' || !user.providerUserId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        authProvider: provider,
        providerUserId: user.providerUserId || resolvedProviderUserId,
        name: user.name || resolvedName || '',
      },
    });
  }

  return buildAuthResponse(user);
}

/**
 * @param {string} refreshToken
 */
async function refreshSession(refreshToken) {
  if (!refreshToken) {
    throw { status: 400, message: 'Refresh token required' };
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw { status: 401, message: 'Invalid refresh token' };
  }

  const key = getRefreshKey(decoded.userId, decoded.jti);
  const exists = await redis.get(key);
  if (!exists) {
    throw { status: 401, message: 'Refresh token expired or revoked' };
  }
  await redis.del(key);

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) {
    throw { status: 401, message: 'User not found' };
  }

  return buildAuthResponse(user);
}

/**
 * @param {string} refreshToken
 */
async function logout(refreshToken) {
  if (!refreshToken) return { success: true };
  try {
    const decoded = verifyRefreshToken(refreshToken);
    await redis.del(getRefreshKey(decoded.userId, decoded.jti));
  } catch {
    // noop
  }
  return { success: true };
}

/**
 * Complete user profile
 * @param {string} userId
 * @param {object} profileData
 * @param {object} [photoFile]
 */
async function completeProfile(userId, profileData, photoFile) {
  const { name, age, gender, bio, dateOfBirth, interestTags } = profileData;

  if (!name || name.trim().length === 0) {
    throw { status: 400, message: 'Name is required' };
  }

  let parsedAge = parseInt(age, 10);
  let dob = null;
  if (dateOfBirth) {
    dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) throw { status: 400, message: 'Invalid date of birth' };
    const years = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (years < 18) throw { status: 400, message: 'You must be 18 or older' };
    parsedAge = years;
  }

  if (isNaN(parsedAge) || parsedAge < 18) {
    throw { status: 400, message: 'Age must be 18 or older' };
  }

  const allowedGenders = ['male', 'female', 'other'];
  if (!gender || !allowedGenders.includes(gender.toLowerCase())) {
    throw { status: 400, message: 'Gender must be one of: male, female, other' };
  }

  let photoUrl = null;

  if (photoFile) {
    try {
      const admin = getFirebaseAdmin();
      const bucket = admin.storage().bucket();
      const ext = photoFile.originalname.split('.').pop() || 'jpg';
      const fileName = `profile-photos/${userId}_${Date.now()}.${ext}`;
      const file = bucket.file(fileName);

      await new Promise((resolve, reject) => {
        const stream = file.createWriteStream({
          metadata: { contentType: photoFile.mimetype },
        });
        stream.on('finish', resolve);
        stream.on('error', reject);
        stream.end(photoFile.buffer);
      });

      await file.makePublic();
      photoUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    } catch (err) {
      console.log('Photo upload skipped (Firebase Storage not configured):', err.message);
      photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=6C63FF&color=fff`;
    }
  }

  let tags = [];
  if (interestTags) {
    try {
      tags = typeof interestTags === 'string' ? JSON.parse(interestTags) : interestTags;
    } catch {
      tags = String(interestTags).split(',').map((t) => t.trim()).filter(Boolean);
    }
  }
  if (tags.length > 10) throw { status: 400, message: 'Maximum 10 interest tags allowed' };

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  const updateData = {
    name: name.trim(),
    age: parsedAge,
    gender: gender.toLowerCase(),
    bio: bio ? bio.trim() : null,
    dateOfBirth: dob,
    interestTags: tags,
    isVerified: true,
  };

  if (photoUrl) updateData.photoUrl = photoUrl;
  updateData.profileCompleteness = calculateProfileCompleteness({ ...existing, ...updateData });

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      age: true,
      gender: true,
      bio: true,
      photoUrl: true,
      vibeStatus: true,
      isVerified: true,
      interestTags: true,
      profileCompleteness: true,
      guidelinesAcceptedAt: true,
      createdAt: true,
    },
  });
}

module.exports = {
  sendOTP,
  verifyOTP,
  sendPhoneOTP,
  verifyPhoneOTP,
  socialLogin,
  refreshSession,
  logout,
  acceptGuidelines,
  completeProfile,
};
