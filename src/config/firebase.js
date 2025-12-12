import {
  initializeApp
} from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  doc,
  getDoc,
  connectFirestoreEmulator
} from 'firebase/firestore';
import {
  getStorage,
  connectStorageEmulator
} from 'firebase/storage';
import {
  getFunctions,
  connectFunctionsEmulator
} from 'firebase/functions';
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

    // Force Demo Project ID in Development to ensure Emulator compatibility
    if (import.meta.env.DEV) {
      firebaseConfig.projectId = 'demo-test';
    }

    if (Object.values(firebaseConfig).some(v => !v)) {
      if (import.meta.env.MODE !== 'test') {
        console.error('Firebase configuration incomplete');
      }
      return null;
    }

    app = initializeApp(firebaseConfig);

    // Initialize services
    const auth = getAuth(app);

    let db;
    if (import.meta.env.DEV) {
      db = initializeFirestore(app, { experimentalForceLongPolling: true });
    } else {
      db = getFirestore(app);
    }

    const storage = getStorage(app);
    const functions = getFunctions(app);

    console.log('FIREBASE PROJECT ID:', firebaseConfig.projectId);

    // Connect to emulators in development
    if (import.meta.env.DEV) {
      console.log('🔧 Connecting to Firebase Emulators...');
      connectAuthEmulator(auth, 'http://127.0.0.1:9099');
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      // connectStorageEmulator(storage, '127.0.0.1', 9199); // Storage emulator not running
      connectFunctionsEmulator(functions, '127.0.0.1', 5001);
      console.log('✅ Connected to Emulators');
    }

  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
  return app;
};

const initializeAppCheckConfig = () => {
  const firebaseApp = initializeFirebase();
  if (firebaseApp && import.meta.env.MODE !== 'test') {
    // Skip App Check if using a demo project (Emulators)
    if (firebaseApp.options.projectId?.startsWith('demo-')) {
      console.log('⚠️ Skipping App Check initialization for demo project');
      return;
    }

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
