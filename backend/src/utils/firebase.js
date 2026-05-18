const admin = require('firebase-admin');

let firebaseApp = null;

function getFirebaseAdmin() {
  if (firebaseApp) return admin;

  try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
      });
    } else {
      // Initialize without credentials for development
      firebaseApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'proximity-chat-dev',
      });
      console.log('⚠️  Firebase initialized without credentials (dev mode)');
    }
  } catch (err) {
    if (err.code === 'app/duplicate-app') {
      firebaseApp = admin.app();
    } else {
      console.error('Firebase init error:', err.message);
      // Return a mock admin for development without Firebase
      return createMockAdmin();
    }
  }

  return admin;
}

function createMockAdmin() {
  return {
    auth: () => ({
      generateEmailVerificationLink: async (email) => {
        console.log(`[MOCK] Would send verification to ${email}`);
        return `https://mock-verification.com?email=${email}`;
      },
      verifyIdToken: async (token) => {
        return { uid: 'mock-uid', email: 'mock@test.com' };
      },
    }),
    messaging: () => ({
      send: async (message) => {
        console.log('[MOCK] Would send FCM:', JSON.stringify(message).substring(0, 100));
        return 'mock-message-id';
      },
    }),
    storage: () => ({
      bucket: () => ({
        upload: async (filePath) => {
          console.log(`[MOCK] Would upload ${filePath}`);
          return [{ publicUrl: () => 'https://mock-storage.com/photo.jpg' }];
        },
        file: (name) => ({
          getSignedUrl: async () => ['https://mock-storage.com/signed-url'],
          createWriteStream: () => {
            const { PassThrough } = require('stream');
            const stream = new PassThrough();
            stream.on('finish', () => {});
            return stream;
          },
          makePublic: async () => {},
        }),
      }),
    }),
  };
}

module.exports = { getFirebaseAdmin };
