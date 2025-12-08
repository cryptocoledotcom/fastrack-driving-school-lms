import { vi } from 'vitest';

export const createMockFirebaseAdmin = () => ({
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
});

export const createMockDocumentSnapshot = (data, exists = true) => ({
  exists: () => exists,
  data: () => data,
  get: (field) => data?.[field],
  ref: {
    id: 'mock-doc-id',
    parent: {
      id: 'mock-collection-id',
    },
  },
  id: 'mock-doc-id',
});

export const createMockQuerySnapshot = (docs = []) => ({
  empty: docs.length === 0,
  size: docs.length,
  docs: docs,
  forEach: (callback) => docs.forEach(callback),
  docChanges: vi.fn(() => []),
});

export const createMockDocumentReference = () => ({
  id: 'mock-doc-id',
  parent: {
    id: 'mock-collection-id',
  },
  collection: vi.fn(() => ({
    doc: vi.fn(() => createMockDocumentReference()),
  })),
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  batch: vi.fn(),
});

export const createMockCollectionReference = () => ({
  doc: vi.fn(() => createMockDocumentReference()),
  add: vi.fn(),
  query: vi.fn(),
  where: vi.fn(function() { return this; }),
  orderBy: vi.fn(function() { return this; }),
  limit: vi.fn(function() { return this; }),
  offset: vi.fn(function() { return this; }),
  get: vi.fn(),
});

export const createMockWriteBatch = () => ({
  set: vi.fn(function() { return this; }),
  update: vi.fn(function() { return this; }),
  delete: vi.fn(function() { return this; }),
  commit: vi.fn(() => Promise.resolve()),
});

export const createMockFirestore = () => ({
  collection: vi.fn(() => createMockCollectionReference()),
  doc: vi.fn(() => createMockDocumentReference()),
  batch: vi.fn(() => createMockWriteBatch()),
  runTransaction: vi.fn((callback) => callback({ 
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
  Timestamp: {
    now: vi.fn(() => ({
      toDate: vi.fn(() => new Date()),
      toMillis: vi.fn(() => Date.now()),
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0,
    })),
  },
  FieldValue: {
    serverTimestamp: vi.fn(() => ({ _type: 'server-timestamp' })),
    arrayUnion: vi.fn((val) => ({ _arrayUnion: val })),
  },
});

export const createMockAuth = () => ({
  createUser: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  setCustomUserClaims: vi.fn(),
});

export const createMockRequest = (data = {}, auth = null) => ({
  data,
  auth,
  rawRequest: {
    headers: {
      'content-type': 'application/json',
    },
  },
});
