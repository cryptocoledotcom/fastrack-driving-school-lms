/* eslint-disable import/order */
const {
  createMockFirestore,
  createMockAuth,
} = require('../../__tests__/mocks');

vi.mock('google-auth-library', () => {
  return {
    GoogleAuth: vi.fn().mockImplementation(() => ({
      getClient: vi.fn().mockResolvedValue({}),
      getApplicationDefault: vi.fn().mockResolvedValue({})
    }))
  };
});

// 2. Mock firebase-admin with deeply nested auth/credential structures
vi.mock('firebase-admin', () => {
  const mockAuth = {
    getUser: vi.fn(),
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    setCustomUserClaims: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  };

  return {
    initializeApp: vi.fn(),
    credential: {
      cert: vi.fn(),
      applicationDefault: vi.fn(),
    },
    firestore: () => ({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          set: vi.fn(),
          get: vi.fn(),
          update: vi.fn(),
        })),
        add: vi.fn(),
      })),
    }),
    auth: () => mockAuth,
  };
});

// 3. Mock other dependencies
vi.mock('firebase-functions/v2/https', () => ({
  onCall: vi.fn((handler) => {
    const fn = typeof handler === 'function' ? handler : handler.fn;
    fn.run = fn;
    return fn;
  }),
}));

vi.mock('../../common/auditLogger', () => ({
  logAuditEvent: vi.fn(() => Promise.resolve()),
}));

const userFunctions = require('../userFunctions');
const firebaseUtils = require('../../common/firebaseUtils');
const { createUser } = userFunctions;







describe('User Functions', () => {
  let mockContext;
  let mockDb;
  let mockAuth;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create new mock instances
    mockDb = createMockFirestore();
    mockAuth = createMockAuth();

    // Context mock
    mockContext = {
      auth: { uid: 'admin-user-123' },
      rawRequest: {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' }
      }
    };

    // Inject mocks via global override (bypass module cache issues)
    global.TEST_FIREBASE_UTILS = {
      getDb: vi.fn(() => mockDb),
      getAuth: vi.fn(() => mockAuth),
    };
    global.TEST_AUDIT_LOGGER = {
      logAuditEvent: vi.fn(() => Promise.resolve()),
    };


    /* 
     * Note: We still use setDb/setAuth for local test instance, 
     * but global override ensures source code picks it up.
     */
    firebaseUtils.setDb(mockDb);
    firebaseUtils.setAuth(mockAuth);
    mockAuth.createUser = vi.fn().mockResolvedValue({
      uid: 'new-user-123',
      email: 'test@example.com',
      displayName: 'Test User'
    });

    // Setup basic firestore mock responses
    const setMock = vi.fn(() => Promise.resolve());
    const getMock = vi.fn(() => Promise.resolve({
      exists: true,
      data: () => ({
        uid: 'new-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'student',
        status: 'active'
      })
    }));

    mockDb.collection = vi.fn(() => ({
      doc: vi.fn(() => ({
        set: setMock,
        get: getMock,
        update: vi.fn(() => Promise.resolve())
      })),
      add: vi.fn(() => Promise.resolve({ id: 'audit-123' }))
    }));
  });

  afterEach(() => {
    delete global.TEST_FIREBASE_UTILS;
    delete global.TEST_AUDIT_LOGGER;
    // resetDb/resetAuth called implicitly by beforeEach or test environment normally, but good to clean manually if shared state
    firebaseUtils.resetDb();
    firebaseUtils.resetAuth();
  });

  describe('createUser', () => {
    it('should throw error if email missing', async () => {
      const data = {
        password: 'password123',
        displayName: 'Test User'
      };

      try {
        await createUser.run(data, mockContext);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Missing required fields');
      }
    });

    it('should throw error if password missing', async () => {
      const data = {
        email: 'test@example.com',
        displayName: 'Test User'
      };

      try {
        await createUser.run(data, mockContext);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Missing required fields');
      }
    });

    it('should throw error if displayName missing', async () => {
      const data = {
        email: 'test@example.com',
        password: 'password123'
      };

      try {
        await createUser.run(data, mockContext);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Missing required fields');
      }
    });

    it('should create user with default role of student', async () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User'
      };

      const result = await createUser.run(data, mockContext);
      expect(result.success).toBe(true);
      expect(result.uid).toBe('new-user-123');
      expect(result.message).toContain('successfully');
    });

    it('should create user with custom role', async () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
        role: 'instructor'
      };

      const result = await createUser.run(data, mockContext);
      expect(result.success).toBe(true);
      expect(result.uid).toBe('new-user-123');
    });

    it('should call Firebase auth.createUser with correct parameters', async () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User'
      };

      await createUser.run(data, mockContext);
      expect(mockAuth.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          password: 'password123',
          displayName: 'Test User'
        })
      );
    });

    it('should save user document to Firestore', async () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
        role: 'student'
      };

      // Mock setup is done in beforeEach, but we can spy/check call args from mockDb
      const setMock = mockDb.collection().doc().set;

      await createUser.run(data, mockContext);
      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: 'new-user-123',
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'student',
          status: 'active'
        })
      );
    });

    it('should include createdAt timestamp', async () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User'
      };

      const setMock = mockDb.collection().doc().set;
      // We must spy on the mocked method being returned.
      // Since collection() returns new object defined in beforeEach, we should capture it there?
      // No, setMock is a spy.

      await createUser.run(data, mockContext);

      // Check spy calls
      expect(setMock).toHaveBeenCalled();
      const callArgs = setMock.mock.calls[0][0];
      expect(callArgs.createdAt).toBeDefined();
    });

    it('should log audit event on user creation', async () => {
      /* 
       * We are importing the mocked module here.
       * Since resetModules() is used, this import gets the fresh mock (or the mock factory result).
       */
      /* 
       * We are importing the mocked module here.
       * Since resetModules() is used, this import gets the fresh mock (or the mock factory result).
       */
      // const { logAuditEvent } = await import('../../common/auditLogger');
      // Use the global spy
      const { logAuditEvent } = global.TEST_AUDIT_LOGGER;
      const data = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
        role: 'instructor'
      };

      await createUser.run(data, mockContext);
      expect(logAuditEvent).toHaveBeenCalled();
    });

    it('should handle auth creation errors', async () => {
      mockAuth.createUser = vi.fn().mockRejectedValue(
        new Error('Email already exists')
      );

      const data = {
        email: 'existing@example.com',
        password: 'password123',
        displayName: 'Test User'
      };

      try {
        await createUser.run(data, mockContext);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Failed to create user');
      }
    });

    it('should return user document in response', async () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User'
      };

      const result = await createUser.run(data, mockContext);
      expect(result.success).toBe(true);
      expect(result.uid).toBeDefined();
      expect(result.message).toBeDefined();
    });
  });
});
