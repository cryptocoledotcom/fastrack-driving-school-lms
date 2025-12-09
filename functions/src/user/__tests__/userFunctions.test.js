const {
  createMockFirestore,
  createMockAuth,
} = require('../../__tests__/mocks');

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

const { createUser } = require('../userFunctions');
const { setDb, setAuth } = require('../../common/firebaseUtils');

describe('User Functions', () => {
  let mockContext;
  let mockDb;
  let mockAuth;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = createMockFirestore();
    mockAuth = createMockAuth();

    setDb(mockDb);
    setAuth(mockAuth);

    mockContext = {
      auth: { uid: 'admin-user-123' },
      rawRequest: {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' }
      }
    };

    mockAuth.createUser = vi.fn().mockResolvedValue({
      uid: 'new-user-123',
      email: 'test@example.com',
      displayName: 'Test User'
    });

    mockDb.collection = vi.fn(() => ({
      doc: vi.fn(() => ({
        set: vi.fn(() => Promise.resolve()),
        get: vi.fn(() => Promise.resolve({
          exists: true,
          data: () => ({
            uid: 'new-user-123',
            email: 'test@example.com',
            displayName: 'Test User',
            role: 'student',
            status: 'active'
          })
        }))
      })),
      add: vi.fn(() => Promise.resolve({ id: 'audit-123' }))
    }));
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

    it.skip('should create user with default role of student', async () => {
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

    it.skip('should create user with custom role', async () => {
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

    it.skip('should call Firebase auth.createUser with correct parameters', async () => {
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

    it.skip('should save user document to Firestore', async () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
        role: 'student'
      };

      const setMock = vi.fn(() => Promise.resolve());
      mockDb.collection = vi.fn(() => ({
        doc: vi.fn(() => ({
          set: setMock,
          get: vi.fn(() => Promise.resolve({
            exists: true,
            data: () => ({
              uid: 'new-user-123',
              email: 'test@example.com',
              displayName: 'Test User',
              role: 'student',
              status: 'active'
            })
          }))
        }))
      }));

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

    it.skip('should include createdAt timestamp', async () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User'
      };

      const setMock = vi.fn(() => Promise.resolve());
      mockDb.collection = vi.fn(() => ({
        doc: vi.fn(() => ({
          set: setMock,
          get: vi.fn(() => Promise.resolve({
            exists: true,
            data: () => ({})
          }))
        }))
      }));

      await createUser.run(data, mockContext);
      const callArgs = setMock.mock.calls[0][0];
      expect(callArgs.createdAt).toBeDefined();
    });

    it('should log audit event on user creation', async () => {
      const { logAuditEvent } = await import('../../common/auditLogger');
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
