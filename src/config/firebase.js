import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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

export const auth = getAuthInstance();
export const db = getDbInstance();
export const storage = getStorageInstance();

export const getApp = () => initializeFirebase();

export default { auth, db, storage };
