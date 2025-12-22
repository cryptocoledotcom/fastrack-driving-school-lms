const {
  createMockFirestore,
  createMockDocumentSnapshot,
} = require('../../__tests__/mocks');
const { generateCertificate } = require('../certificateFunctions');
const { setDb } = require('../../common/firebaseUtils');

vi.mock('firebase-functions/v2/https', () => ({
  onCall: vi.fn((handler) => {
    const fn = typeof handler === 'function' ? handler : handler.fn;
    fn.run = fn;
    return fn;
  }),
}));

describe('Certificate Functions', () => {
  let mockContext;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      auth: { uid: 'user-123' },
      rawRequest: {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' }
      }
    };
  });

  describe('generateCertificate', () => {
    it('should throw error if user not authenticated', async () => {
      const data = {
        userId: 'user-123',
        courseId: 'course-456'
      };

      try {
        await generateCertificate.run(data, { auth: null });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Authentication required');
      }
    });

    it('should throw error if userId missing', async () => {
      const data = { courseId: 'course-456' };

      try {
        await generateCertificate.run(data, mockContext);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Missing required parameters');
      }
    });

    it('should throw error if courseId missing', async () => {
      const data = { userId: 'user-123' };

      try {
        await generateCertificate.run(data, mockContext);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Missing required parameters');
      }
    });

    it('should throw error if enrollment not found', async () => {
      const mockDb = createMockFirestore();
      mockDb.collection = vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve(
            createMockDocumentSnapshot({}, false)
          )),
        }))
      }));
      setDb(mockDb);

      const data = {
        userId: 'user-123',
        courseId: 'course-456'
      };

      try {
        await generateCertificate.run(data, mockContext);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Enrollment not found');
      }
    });

    it('should throw error if payment not completed', async () => {
      const mockDb = createMockFirestore();
      mockDb.collection = vi.fn((collName) => {
        if (collName === 'enrollments') {
          return {
            doc: vi.fn(() => ({
              get: vi.fn(() => Promise.resolve(
                createMockDocumentSnapshot({
                  paymentStatus: 'pending',
                  userName: 'Test User'
                }, true)
              )),
            }))
          };
        }
        return { doc: vi.fn() };
      });
      setDb(mockDb);

      const data = {
        userId: 'user-123',
        courseId: 'course-456'
      };

      try {
        await generateCertificate.run(data, mockContext);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Payment not completed');
      }
    });

    it('should throw error if course not found', async () => {
      const mockDb = createMockFirestore();
      mockDb.collection = vi.fn((collName) => {
        if (collName === 'enrollments') {
          return {
            doc: vi.fn(() => ({
              get: vi.fn(() => Promise.resolve(
                createMockDocumentSnapshot({
                  paymentStatus: 'completed',
                  userName: 'Test User'
                }, true)
              )),
            }))
          };
        }
        if (collName === 'courses') {
          return {
            doc: vi.fn(() => ({
              get: vi.fn(() => Promise.resolve(
                createMockDocumentSnapshot({}, false)
              )),
            }))
          };
        }
        return { doc: vi.fn(), add: vi.fn() };
      });
      setDb(mockDb);

      const data = {
        userId: 'user-123',
        courseId: 'course-456'
      };

      try {
        await generateCertificate.run(data, mockContext);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Course not found');
      }
    });

    it('should generate certificate successfully', async () => {
      const mockDb = createMockFirestore();
      mockDb.collection = vi.fn((collName) => {
        if (collName === 'enrollments') {
          return {
            doc: vi.fn(() => ({
              get: vi.fn(() => Promise.resolve(
                createMockDocumentSnapshot({
                  paymentStatus: 'completed',
                  userName: 'John Doe'
                }, true)
              )),
            }))
          };
        }
        if (collName === 'courses') {
          return {
            doc: vi.fn(() => ({
              get: vi.fn(() => Promise.resolve(
                createMockDocumentSnapshot({
                  title: 'Test Course'
                }, true)
              )),
            }))
          };
        }
        if (collName === 'certificates') {
          return {
            add: vi.fn(() => Promise.resolve({ id: 'cert-123' }))
          };
        }
        return { doc: vi.fn(), add: vi.fn() };
      });
      setDb(mockDb);

      const data = {
        userId: 'user-123',
        courseId: 'course-456'
      };

      const result = await generateCertificate.run(data, mockContext);
      expect(result.success).toBe(true);
      expect(result.certificateId).toBe('cert-123');
      expect(result.message).toContain('generated successfully');
    });

    it('should return certificate when generated', async () => {
      const mockDb = createMockFirestore();
      mockDb.collection = vi.fn((collName) => {
        if (collName === 'enrollments') {
          return {
            doc: vi.fn(() => ({
              get: vi.fn(() => Promise.resolve(
                createMockDocumentSnapshot({
                  paymentStatus: 'completed',
                  userName: 'John Doe'
                }, true)
              )),
            }))
          };
        }
        if (collName === 'courses') {
          return {
            doc: vi.fn(() => ({
              get: vi.fn(() => Promise.resolve(
                createMockDocumentSnapshot({
                  title: 'Test Course'
                }, true)
              )),
            }))
          };
        }
        if (collName === 'certificates') {
          return {
            add: vi.fn(() => Promise.resolve({ id: 'cert-123' }))
          };
        }
        return { doc: vi.fn(), add: vi.fn() };
      });
      setDb(mockDb);

      const data = {
        userId: 'user-123',
        courseId: 'course-456'
      };

      const result = await generateCertificate.run(data, mockContext);
      expect(result.success).toBe(true);
      expect(result.certificateId).toBeDefined();
    });
  });
});
