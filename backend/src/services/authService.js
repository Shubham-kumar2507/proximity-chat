const redis = require('../utils/redis');
const prisma = require('../utils/prisma');
const { generateOTP, isValidEmail } = require('../utils/helpers');
const { generateToken } = require('../utils/jwt');
const { getFirebaseAdmin } = require('../utils/firebase');

const OTP_TTL = 600; // 10 minutes in seconds
const OTP_PREFIX = 'otp:';

/**
 * Send OTP to email
 */
async function sendOTP(email) {
  if (!isValidEmail(email)) {
    throw { status: 400, message: 'Invalid email format' };
  }

  const otp = generateOTP();

  // Store OTP in Redis with 10-minute TTL
  await redis.set(`${OTP_PREFIX}${email}`, otp, 'EX', OTP_TTL);

  // Try to send via Firebase, fall back to console log in dev
  try {
    const admin = getFirebaseAdmin();
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
      // In production, send real email via Firebase
      await admin.auth().generateEmailVerificationLink(email);
    }
  } catch (err) {
    console.log(`📧 [DEV] OTP for ${email}: ${otp}`);
  }

  // Always log in development
  if (!process.env.FIREBASE_PRIVATE_KEY) {
    console.log(`📧 [DEV] OTP for ${email}: ${otp}`);
  }

  return { success: true };
}

/**
 * Verify OTP and return JWT
 */
async function verifyOTP(email, otp) {
  if (!isValidEmail(email)) {
    throw { status: 400, message: 'Invalid email format' };
  }

  if (!otp || otp.length !== 6) {
    throw { status: 400, message: 'Invalid OTP format. Must be 6 digits.' };
  }

  const storedOTP = await redis.get(`${OTP_PREFIX}${email}`);

  if (!storedOTP) {
    throw { status: 400, message: 'OTP expired or not found. Please request a new one.' };
  }

  if (storedOTP !== otp) {
    throw { status: 400, message: 'Invalid OTP' };
  }

  // Delete OTP after successful verification
  await redis.del(`${OTP_PREFIX}${email}`);

  // Find or create user
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

  const token = generateToken({ userId: user.id, email: user.email });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
    },
    isNewUser: !user.isVerified,
  };
}

/**
 * Complete user profile
 */
async function completeProfile(userId, profileData, photoFile) {
  const { name, age, gender, bio } = profileData;

  // Validation
  if (!name || name.trim().length === 0) {
    throw { status: 400, message: 'Name is required' };
  }

  const parsedAge = parseInt(age, 10);
  if (isNaN(parsedAge) || parsedAge < 18) {
    throw { status: 400, message: 'Age must be 18 or older' };
  }

  const allowedGenders = ['male', 'female', 'other'];
  if (!gender || !allowedGenders.includes(gender.toLowerCase())) {
    throw { status: 400, message: 'Gender must be one of: male, female, other' };
  }

  let photoUrl = null;

  // Upload photo to Firebase Storage if provided
  if (photoFile) {
    try {
      const admin = getFirebaseAdmin();
      const bucket = admin.storage().bucket();
      const fileName = `profile-photos/${userId}_${Date.now()}.${photoFile.originalname.split('.').pop()}`;
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
      // In dev mode, use a placeholder
      photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=6C63FF&color=fff`;
    }
  }

  const updateData = {
    name: name.trim(),
    age: parsedAge,
    gender: gender.toLowerCase(),
    bio: bio ? bio.trim() : null,
    isVerified: true,
  };

  if (photoUrl) {
    updateData.photoUrl = photoUrl;
  }

  const updatedUser = await prisma.user.update({
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
      createdAt: true,
    },
  });

  return updatedUser;
}

module.exports = { sendOTP, verifyOTP, completeProfile };
