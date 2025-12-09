function createMockFirestore() {
  return {
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
  };
}

function createMockDocumentSnapshot(data, exists = true) {
  return {
    exists: exists,
    data: vi.fn(() => data),
    get: vi.fn((field) => data[field]),
    id: 'mock-doc-id',
    ref: {
      parent: {
        id: 'mock-collection'
      }
    }
  };
}

function createMockAuth() {
  return {
    createUser: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    listUsers: vi.fn(),
  };
}

module.exports = {
  createMockFirestore,
  createMockDocumentSnapshot,
  createMockAuth,
};
