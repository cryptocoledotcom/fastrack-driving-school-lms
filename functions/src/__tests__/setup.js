import { vi } from 'vitest';

process.on('unhandledRejection', (reason) => {
  if (reason && reason.message && reason.message.includes('Could not load the default credentials')) {
    return;
  }
});

process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: 'test-project',
  storageBucket: 'test-bucket.appspot.com',
  databaseURL: 'https://test-project.firebaseio.com',
});

process.env.SENTRY_DSN = 'https://test:test@sentry.io/test';
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
process.env.CORS_ORIGINS = 'http://localhost:3000,https://fastrackdrive.com';

const createMockFirestore = () => ({
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      collection: vi.fn(function() { return this; }),
    })),
    add: vi.fn(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    get: vi.fn(),
  })),
  doc: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    collection: vi.fn(function() { return this; }),
  })),
  batch: vi.fn(() => ({
    set: vi.fn(function() { return this; }),
    update: vi.fn(function() { return this; }),
    delete: vi.fn(function() { return this; }),
    commit: vi.fn(() => Promise.resolve()),
  })),
  runTransaction: vi.fn((callback) => callback({
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
});

let mockDb = createMockFirestore();

const createDefaultAuth = () => ({
  createUser: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  listUsers: vi.fn(),
});

vi.mock('firebase-admin', () => ({
  initializeApp: vi.fn(),
  firestore: {
    FieldValue: {
      serverTimestamp: vi.fn(() => ({ _type: 'server-timestamp' })),
      arrayUnion: vi.fn((val) => ({ _arrayUnion: val })),
      arrayRemove: vi.fn((val) => ({ _arrayRemove: val })),
      delete: vi.fn(() => ({ _delete: true })),
      increment: vi.fn((val) => ({ _increment: val })),
    },
    Timestamp: {
      now: vi.fn(() => ({
        toDate: vi.fn(() => new Date()),
        toMillis: vi.fn(() => Date.now()),
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
      })),
      fromDate: vi.fn((date) => ({
        toDate: vi.fn(() => date),
        toMillis: vi.fn(() => date.getTime()),
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
      })),
    },
  },
  auth: vi.fn(createDefaultAuth),
}));

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => mockDb),
}));

let mockAuth = createDefaultAuth();

vi.mock('../common/firebaseUtils', () => ({
  getDb: vi.fn(() => mockDb),
  setDb: vi.fn((db) => { mockDb = db; }),
  resetDb: vi.fn(() => { mockDb = createMockFirestore(); }),
  getAuth: vi.fn(() => mockAuth),
  setAuth: vi.fn((auth) => { mockAuth = auth; }),
  resetAuth: vi.fn(() => { mockAuth = createDefaultAuth(); }),
}));

vi.mock('stripe', () => {
  return vi.fn(() => ({
    checkout: {
      sessions: {
        create: vi.fn(() => Promise.resolve({
          id: 'cs_test_123',
          payment_status: 'unpaid',
          status: 'open',
        })),
      },
    },
    paymentIntents: {
      create: vi.fn(() => Promise.resolve({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        status: 'requires_payment_method',
      })),
      retrieve: vi.fn(() => Promise.resolve({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        status: 'requires_payment_method',
      })),
    },
    webhooks: {
      constructEvent: vi.fn((_body, _sig, _secret) => ({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_test_123' } },
      })),
    },
  }));
});

vi.mock('@google-cloud/logging', () => {
  return {
    Logging: vi.fn(() => ({
      log: vi.fn(() => ({
        entry: vi.fn(() => ({})),
        write: vi.fn(() => Promise.resolve()),
      })),
    })),
  };
});
