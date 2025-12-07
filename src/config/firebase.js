import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = '550e8400-e29b-41d4-a716-446655440000';
}

let app;
let authInstance;
let dbInstance;
let storageInstance;

const initializeFirebase = () => {
  if (app) return app;

  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

    if (Object.values(firebaseConfig).some(v => !v)) {
      if (import.meta.env.MODE !== 'test') {
        console.error('Firebase configuration incomplete');
      }
      return null;
    }

    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
  return app;
};

const initializeAppCheckConfig = () => {
  const firebaseApp = initializeFirebase();
  if (firebaseApp && import.meta.env.MODE !== 'test') {
    const siteKey = import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY;
    if (siteKey) {
      try {
        const appCheck = initializeAppCheck(firebaseApp, {
          provider: new ReCaptchaV3Provider(siteKey),
          isTokenAutoRefreshEnabled: true
        });
        
        if (import.meta.env.DEV) {
          console.log('✓ Firebase App Check initialized with ReCaptcha provider');
        }
      } catch (error) {
        console.error('Failed to initialize App Check:', error);
      }
    } else if (import.meta.env.MODE === 'development') {
      console.warn('Firebase App Check site key not configured');
    }
  }
};

const getAuthInstance = () => {
  if (!authInstance) {
    const firebaseApp = initializeFirebase();
    if (firebaseApp) {
      authInstance = getAuth(firebaseApp);
    }
  }
  return authInstance;
};

const getDbInstance = () => {
  if (!dbInstance) {
    const firebaseApp = initializeFirebase();
    if (firebaseApp) {
      dbInstance = getFirestore(firebaseApp);
    }
  }
  return dbInstance;
};

const getStorageInstance = () => {
  if (!storageInstance) {
    const firebaseApp = initializeFirebase();
    if (firebaseApp) {
      storageInstance = getStorage(firebaseApp);
    }
  }
  return storageInstance;
};

initializeFirebase();
initializeAppCheckConfig();

export const auth = getAuthInstance();
export const db = getDbInstance();
export const storage = getStorageInstance();

export const getApp = () => initializeFirebase();

export default { auth, db, storage };
