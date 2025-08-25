// Firebase client initialization
// Reads config from NEXT_PUBLIC_ environment variables.
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableNetwork } from 'firebase/firestore';

// Build Firebase config from environment variables
function buildFirebaseConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Validate that all required config values are present
  const missingKeys = Object.entries(config)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    console.error('Missing Firebase environment variables:', missingKeys);
    throw new Error(`Missing Firebase configuration: ${missingKeys.join(', ')}`);
  }

  console.log('Firebase config loaded successfully:', {
    projectId: config.projectId,
    authDomain: config.authDomain,
  });

  return config;
}

const firebaseConfig = buildFirebaseConfig();

export function getFirebaseApp() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

export const app = getFirebaseApp();
export const auth = getAuth(app);

// Initialize Firestore with better error handling
export const db = getFirestore(app);

// Enable offline persistence (this helps with the "client is offline" error)
if (typeof window !== 'undefined') {
  // Only run on client side
  enableNetwork(db).catch((error) => {
    console.warn('Failed to enable Firestore network:', error);
  });
}

export const googleProvider = new GoogleAuthProvider();
