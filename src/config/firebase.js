import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

let app;
let authInstance;
let dbInstance;
let storageInstance;
let initialized = false;

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
      if (process.env.NODE_ENV !== 'test') {
        console.error('Firebase configuration incomplete');
      }
      return null;
    }

    app = initializeApp(firebaseConfig);
    initialized = true;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
  return app;
};

const createLazyProxy = (getter) => {
  return new Proxy({}, {
    get(target, prop) {
      const instance = getter();
      if (!instance) return undefined;
      return instance[prop];
    },
    has(target, prop) {
      const instance = getter();
      if (!instance) return false;
      return prop in instance;
    },
    ownKeys(target) {
      const instance = getter();
      if (!instance) return [];
      return Object.keys(instance);
    },
    getOwnPropertyDescriptor(target, prop) {
      const instance = getter();
      if (!instance) return;
      return Object.getOwnPropertyDescriptor(instance, prop);
    }
  });
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

export const auth = createLazyProxy(getAuthInstance);
export const db = createLazyProxy(getDbInstance);
export const storage = createLazyProxy(getStorageInstance);

export const getApp = () => initializeFirebase();

export default { auth, db, storage };