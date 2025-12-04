import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('src/config/firebase', () => ({
  default: {},
  auth: {},
  db: {},
  storage: {},
}), { esmock: true });

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  setPersistence: vi.fn(),
  browserLocalPersistence: { type: 'LOCAL' },
  connectAuthEmulator: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn().mockReturnValue({}),
  query: vi.fn().mockReturnValue({}),
  where: vi.fn().mockReturnValue({}),
  orderBy: vi.fn().mockReturnValue({}),
  limit: vi.fn().mockReturnValue({}),
  startAfter: vi.fn().mockReturnValue({}),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  getDoc: vi.fn().mockResolvedValue({}),
  setDoc: vi.fn().mockResolvedValue(undefined),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  doc: vi.fn().mockReturnValue({}),
  writeBatch: vi.fn(() => ({
    set: vi.fn().mockReturnValue({}),
    update: vi.fn().mockReturnValue({}),
    delete: vi.fn().mockReturnValue({}),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
  addDoc: vi.fn().mockResolvedValue({ id: 'mock-id' }),
  onSnapshot: vi.fn().mockReturnValue(() => {}),
  getCountFromServer: vi.fn().mockResolvedValue({ data: () => ({ count: 0 }) }),
  serverTimestamp: vi.fn(() => ({ _type: 'timestamp' })),
  Timestamp: {
    now: vi.fn(() => ({ toDate: vi.fn() })),
    fromDate: vi.fn((date) => ({ toDate: vi.fn(() => date) })),
  },
  FieldValue: {
    serverTimestamp: vi.fn(() => ({ _type: 'timestamp' })),
    increment: vi.fn((value) => ({ _type: 'increment', value })),
    arrayUnion: vi.fn((values) => ({ _type: 'arrayUnion', values })),
    arrayRemove: vi.fn((values) => ({ _type: 'arrayRemove', values })),
    delete: vi.fn(() => ({ _type: 'delete' })),
  },
  FieldPath: {
    documentId: vi.fn(() => '__name__'),
  },
  connectFirestoreEmulator: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
  listAll: vi.fn(),
  connectStorageEmulator: vi.fn(),
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn(() => vi.fn()),
  connectFunctionsEmulator: vi.fn(),
}));

vi.mock('src/services/loggingService', () => {
  const mockLogger = {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    log: vi.fn(),
  };
  return {
    default: mockLogger,
    ...mockLogger,
  };
}, { esmock: true });

const noop = () => {};

global.jest = {
  mock: vi.mock,
  unmock: vi.unmock,
  clearAllMocks: vi.clearAllMocks,
  resetAllMocks: vi.resetAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
  fn: vi.fn,
  spyOn: vi.spyOn,
  mocked: vi.mocked,
  clearAllTimers: vi.clearAllTimers,
  useFakeTimers: vi.useFakeTimers,
  useRealTimers: vi.useRealTimers,
  advanceTimersByTime: vi.advanceTimersByTime,
  runAllTimers: vi.runAllTimers,
  advanceTimersByTimeAsync: noop,
  runOnlyPendingTimers: noop,
  runOnlyPendingTimersAsync: noop,
  runAllTimersAsync: noop,
  clearAllTimers: vi.clearAllTimers,
  setSystemTime: vi.setSystemTime,
  getRealSystemTime: vi.getRealSystemTime,
};

if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

if (typeof global.crypto === 'undefined') {
  global.crypto = require('crypto').webcrypto;
}

if (typeof global.ReadableStream === 'undefined') {
  const { Readable } = require('stream');
  global.ReadableStream = Readable;
}
