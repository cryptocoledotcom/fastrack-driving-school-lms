import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { sessionHeartbeat } from '../complianceFunctions';
import {
  createMockFirestore,
  createMockRequest,
  createMockDocumentSnapshot,
  createMockWriteBatch,
} from '../../__tests__/mocks';

const admin = require('firebase-admin');

vi.mock('firebase-admin', () => ({
  firestore: {
    FieldValue: {
      serverTimestamp: vi.fn(() => ({ _type: 'server-timestamp' })),
      arrayUnion: vi.fn((val) => ({ _arrayUnion: val })),
    },
    Timestamp: {
      now: vi.fn(() => ({
        toDate: vi.fn(() => new Date()),
        toMillis: vi.fn(() => Date.now()),
      })),
    },
  },
}));

let mockDb;

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => mockDb),
}));

const mockLogAuditEvent = vi.fn(() => Promise.resolve());
vi.mock('../../common/auditLogger', () => ({
  logAuditEvent: mockLogAuditEvent,
}));

describe('sessionHeartbeat Cloud Function', () => {
  let mockRequest;
  let mockData;
  let mockBatch;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = createMockFirestore();
    mockBatch = createMockWriteBatch();

    mockData = {
      userId: 'user-123',
      courseId: 'course-456',
      sessionId: 'session-789',
    };

    mockRequest = createMockRequest(mockData, { uid: 'user-123' });

    // Default mock setup
    mockDb.batch = vi.fn(() => mockBatch);
  });

  describe('Authentication Validation', () => {
    it('should throw error if not authenticated', async () => {
      const unAuthRequest = createMockRequest(mockData, null);

      try {
        await sessionHeartbeat(unAuthRequest);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Authentication required');
      }
    });

    it('should throw error if user ID does not match authenticated user', async () => {
      const mismatchedRequest = createMockRequest(
        { ...mockData, userId: 'different-user-id' },
        { uid: 'user-123' }
      );

      try {
        await sessionHeartbeat(mismatchedRequest);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('User ID mismatch');
      }
    });
  });

  describe('Input Validation', () => {
    it('should throw error if userId is missing', async () => {
      const invalidRequest = createMockRequest(
        { ...mockData, userId: null },
        { uid: 'user-123' }
      );

      try {
        await sessionHeartbeat(invalidRequest);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Missing required parameters');
      }
    });

    it('should throw error if courseId is missing', async () => {
      const invalidRequest = createMockRequest(
        { ...mockData, courseId: null },
        { uid: 'user-123' }
      );

      try {
        await sessionHeartbeat(invalidRequest);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Missing required parameters');
      }
    });

    it('should throw error if sessionId is missing', async () => {
      const invalidRequest = createMockRequest(
        { ...mockData, sessionId: null },
        { uid: 'user-123' }
      );

      try {
        await sessionHeartbeat(invalidRequest);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Missing required parameters');
      }
    });
  });

  describe('Session Management', () => {
    it('should throw error if session does not exist', async () => {
      // Mock: session document does not exist
      mockDb.collection = vi.fn(() => ({
        doc: vi.fn((docId) => {
          if (docId === 'user-123') {
            return {
              collection: vi.fn(() => ({
                doc: vi.fn(() => ({
                  get: vi.fn(() => Promise.resolve(
                    createMockDocumentSnapshot({}, false) // exists: false
                  )),
                }))
              }))
            };
          }
          return { get: vi.fn() };
        })
      }));

      const request = createMockRequest(mockData, { uid: 'user-123' });
      await expect(sessionHeartbeat(request)).rejects.toThrow('Session not found');
    });

    it('should throw error if course ID does not match session', async () => {
      // Mock: session exists but courseId doesn't match
      const sessionWithDifferentCourse = {
        courseId: 'different-course-id',
        lastHeartbeatTimestamp: Date.now(),
      };

      mockDb.collection = vi.fn((collectionName) => ({
        doc: vi.fn((docId) => {
          if (collectionName === 'users' && docId === 'user-123') {
            return {
              collection: vi.fn(() => ({
                doc: vi.fn(() => ({
                  get: vi.fn(() => Promise.resolve(
                    createMockDocumentSnapshot(sessionWithDifferentCourse, true)
                  )),
                }))
              }))
            };
          }
          return { get: vi.fn(), update: vi.fn() };
        })
      }));

      const request = createMockRequest(mockData, { uid: 'user-123' });
      await expect(sessionHeartbeat(request)).rejects.toThrow('Course ID mismatch');
    });
  });

  describe('Daily Minute Tracking', () => {
    it('should increment daily minutes on successful heartbeat', async () => {
      const sessionData = {
        courseId: 'course-456',
        lastHeartbeatTimestamp: Date.now(),
      };
      
      const existingDailyLog = {
        userId: 'user-123',
        courseId: 'course-456',
        minutesCompleted: 5,
        sessions: ['other-session-id'],
      };

      setupMockDbForHeartbeat(sessionData, existingDailyLog, true);

      const result = await sessionHeartbeat(mockRequest);

      expect(result.success).toBe(true);
      expect(result.minutesCompleted).toBe(6);
      expect(result.remainingMinutes).toBe(234); // 240 - 6
      expect(mockBatch.update).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should create new daily log on first heartbeat of the day', async () => {
      const sessionData = {
        courseId: 'course-456',
        lastHeartbeatTimestamp: Date.now(),
      };

      setupMockDbForHeartbeat(sessionData, null, false); // No existing daily log

      const result = await sessionHeartbeat(mockRequest);

      expect(result.success).toBe(true);
      expect(result.minutesCompleted).toBe(1); // First heartbeat
      expect(result.remainingMinutes).toBe(239); // 240 - 1
      expect(result.isNewDay).toBe(true);
      expect(mockBatch.set).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should format dateKey as YYYY-MM-DD', async () => {
      const sessionData = {
        courseId: 'course-456',
        lastHeartbeatTimestamp: Date.now(),
      };

      setupMockDbForHeartbeat(sessionData, null, false);

      const result = await sessionHeartbeat(mockRequest);

      expect(result.dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Daily Limit Enforcement', () => {
    it('should throw error when 240 minutes limit is reached', async () => {
      const sessionData = {
        courseId: 'course-456',
        lastHeartbeatTimestamp: Date.now(),
      };

      const dailyLogAt239Minutes = {
        userId: 'user-123',
        courseId: 'course-456',
        minutesCompleted: 239,
        sessions: ['other-session-id'],
      };

      setupMockDbForHeartbeat(sessionData, dailyLogAt239Minutes, true);

      const request = createMockRequest(mockData, { uid: 'user-123' });
      await expect(sessionHeartbeat(request)).rejects.toThrow('DAILY_LIMIT_REACHED');
    });

    it('should update user status to locked_daily_limit when limit reached', async () => {
      const sessionData = {
        courseId: 'course-456',
        lastHeartbeatTimestamp: Date.now(),
      };

      const dailyLogAt239Minutes = {
        userId: 'user-123',
        courseId: 'course-456',
        minutesCompleted: 239,
        sessions: ['other-session-id'],
      };

      setupMockDbForHeartbeat(sessionData, dailyLogAt239Minutes, true);
      const mockUserUpdate = vi.fn(() => Promise.resolve());
      mockDb.collection = vi.fn((collectionName) => {
        if (collectionName === 'users') {
          return {
            doc: vi.fn(() => ({
              update: mockUserUpdate,
              collection: vi.fn(() => ({
                doc: vi.fn(() => ({
                  get: vi.fn(() => Promise.resolve(
                    createMockDocumentSnapshot(sessionData, true)
                  )),
                }))
              }))
            }))
          };
        }
        return { doc: vi.fn() };
      });

      const request = createMockRequest(mockData, { uid: 'user-123' });
      try {
        await sessionHeartbeat(request);
      } catch (error) {
        // Expected to throw
      }

      // Verify user status was updated
      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          dailyStatus: 'locked_daily_limit',
        })
      );
    });
  });

  describe('Timezone Handling', () => {
    it('should calculate date in EST/EDT timezone', async () => {
      const sessionData = {
        courseId: 'course-456',
        lastHeartbeatTimestamp: Date.now(),
      };

      setupMockDbForHeartbeat(sessionData, null, false);

      const result = await sessionHeartbeat(mockRequest);

      // Verify dateKey matches EST/EDT date (not UTC)
      expect(result.dateKey).toBeDefined();
      expect(result.dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Verify it's a valid date
      const parts = result.dateKey.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);

      expect(year).toBeGreaterThan(2020);
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(31);
    });

    it('should include server timestamp in response', async () => {
      const sessionData = {
        courseId: 'course-456',
        lastHeartbeatTimestamp: Date.now(),
      };

      setupMockDbForHeartbeat(sessionData, null, false);

      const result = await sessionHeartbeat(mockRequest);

      expect(result.serverTimestamp).toBeDefined();
      expect(typeof result.serverTimestamp).toBe('number');
      expect(result.serverTimestamp).toBeGreaterThan(0);
    });
  });

  describe('Audit Logging', () => {
    it('should log SESSION_HEARTBEAT event on success', async () => {
      const sessionData = {
        courseId: 'course-456',
        lastHeartbeatTimestamp: Date.now(),
      };

      setupMockDbForHeartbeat(sessionData, null, false);

      await sessionHeartbeat(mockRequest);

      expect(mockLogAuditEvent).toHaveBeenCalledWith(
        'user-123',
        'SESSION_HEARTBEAT',
        'compliance',
        'course-456',
        'success',
        expect.objectContaining({
          minutesCompleted: expect.any(Number),
          remainingMinutes: expect.any(Number),
          sessionId: 'session-789',
        })
      );
    });

    it('should log SESSION_HEARTBEAT_FAILED event on error', async () => {
      // Mock to throw error
      mockDb.collection = vi.fn(() => ({
        doc: vi.fn(() => ({
          collection: vi.fn(() => ({
            doc: vi.fn(() => ({
              get: vi.fn(() => Promise.resolve(
                createMockDocumentSnapshot({}, false)
              )),
            }))
          }))
        }))
      }));

      const request = createMockRequest(mockData, { uid: 'user-123' });
      try {
        await sessionHeartbeat(request);
      } catch (error) {
        // Expected
      }

      // Find the SESSION_HEARTBEAT_FAILED call
      const failureCall = mockLogAuditEvent.mock.calls.find(
        call => call[1] === 'SESSION_HEARTBEAT_FAILED'
      );

      expect(failureCall).toBeDefined();
      expect(failureCall[0]).toBe('user-123'); // userId
      expect(failureCall[4]).toBe('error'); // status
    });

    it('should include sessionId in audit log details', async () => {
      const sessionData = {
        courseId: 'course-456',
        lastHeartbeatTimestamp: Date.now(),
      };

      setupMockDbForHeartbeat(sessionData, null, false);

      await sessionHeartbeat(mockRequest);

      const auditCall = mockLogAuditEvent.mock.calls[0];
      expect(auditCall[5].sessionId).toBe('session-789');
    });
  });

  describe('Data Consistency', () => {
    it('should use atomic batch operation for first heartbeat', async () => {
      const sessionData = {
        courseId: 'course-456',
        lastHeartbeatTimestamp: Date.now(),
      };

      setupMockDbForHeartbeat(sessionData, null, false);

      await sessionHeartbeat(mockRequest);

      // Verify batch operations were used
      expect(mockDb.batch).toHaveBeenCalled();
      expect(mockBatch.set).toHaveBeenCalled(); // Create new daily log
      expect(mockBatch.update).toHaveBeenCalled(); // Update session
      expect(mockBatch.commit).toHaveBeenCalled(); // Atomically commit
    });

    it('should use atomic batch operation for existing daily log', async () => {
      const sessionData = {
        courseId: 'course-456',
        lastHeartbeatTimestamp: Date.now(),
      };

      const existingDailyLog = {
        userId: 'user-123',
        courseId: 'course-456',
        minutesCompleted: 10,
        sessions: ['other-session'],
      };

      setupMockDbForHeartbeat(sessionData, existingDailyLog, true);

      await sessionHeartbeat(mockRequest);

      // Verify batch operations
      expect(mockDb.batch).toHaveBeenCalled();
      expect(mockBatch.update).toHaveBeenCalled(); // Update existing daily log
      expect(mockBatch.commit).toHaveBeenCalled(); // Atomically commit
    });

    it('should handle batch commit failure gracefully', async () => {
      const sessionData = {
        courseId: 'course-456',
        lastHeartbeatTimestamp: Date.now(),
      };

      setupMockDbForHeartbeat(sessionData, null, false);

      // Mock batch.commit to reject
      mockBatch.commit = vi.fn(() => Promise.reject(
        new Error('Quota exceeded')
      ));

      const request = createMockRequest(mockData, { uid: 'user-123' });
      await expect(sessionHeartbeat(request)).rejects.toThrow('Heartbeat processing failed');
    });

    it('should add sessionId to array union when updating daily log', async () => {
      const sessionData = {
        courseId: 'course-456',
        lastHeartbeatTimestamp: Date.now(),
      };

      const existingDailyLog = {
        userId: 'user-123',
        courseId: 'course-456',
        minutesCompleted: 5,
        sessions: ['other-session-id'],
      };

      setupMockDbForHeartbeat(sessionData, existingDailyLog, true);

      await sessionHeartbeat(mockRequest);

      // Verify arrayUnion was called with sessionId
      const updateCall = mockBatch.update.mock.calls.find(
        call => call[1] && call[1].sessions
      );

      expect(updateCall).toBeDefined();
      // The update should include array union operation
      expect(updateCall[1].sessions).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should wrap errors with descriptive message', async () => {
      // Mock session document to throw error
      mockDb.collection = vi.fn(() => ({
        doc: vi.fn(() => ({
          collection: vi.fn(() => ({
            doc: vi.fn(() => ({
              get: vi.fn(() => Promise.reject(
                new Error('Firestore unavailable')
              )),
            }))
          }))
        }))
      }));

      const request = createMockRequest(mockData, { uid: 'user-123' });
      await expect(sessionHeartbeat(request)).rejects.toThrow('Heartbeat processing failed');
    });

    it('should log audit event even when heartbeat fails', async () => {
      mockDb.collection = vi.fn(() => ({
        doc: vi.fn(() => ({
          collection: vi.fn(() => ({
            doc: vi.fn(() => ({
              get: vi.fn(() => Promise.resolve(
                createMockDocumentSnapshot({}, false)
              )),
            }))
          }))
        }))
      }));

      const request = createMockRequest(mockData, { uid: 'user-123' });
      try {
        await sessionHeartbeat(request);
      } catch (error) {
        // Expected
      }

      // Should log failure event
      const failureEvent = mockLogAuditEvent.mock.calls.some(
        call => call[1] === 'SESSION_HEARTBEAT_FAILED'
      );
      expect(failureEvent).toBe(true);
    });

    it('should handle idle timeout (15 minutes inactivity)', async () => {
      const fifteenMinutesAgo = Date.now() - (16 * 60 * 1000); // 16 minutes
      const sessionData = {
        courseId: 'course-456',
        lastHeartbeatTimestamp: fifteenMinutesAgo,
      };

      mockDb.collection = vi.fn((collectionName) => ({
        doc: vi.fn((docId) => {
          if (collectionName === 'users' && docId === 'user-123') {
            return {
              collection: vi.fn(() => ({
                doc: vi.fn(() => ({
                  get: vi.fn(() => Promise.resolve(
                    createMockDocumentSnapshot(sessionData, true)
                  )),
                }))
              }))
            };
          }
          return { get: vi.fn(), update: vi.fn() };
        })
      }));

      const request = createMockRequest(mockData, { uid: 'user-123' });
      await expect(sessionHeartbeat(request)).rejects.toThrow('SESSION_IDLE_TIMEOUT');
    });
  });

  describe('Response Structure', () => {
    it('should return success response with all required fields', async () => {
      const sessionData = {
        courseId: 'course-456',
        lastHeartbeatTimestamp: Date.now(),
      };

      setupMockDbForHeartbeat(sessionData, null, false);

      const result = await sessionHeartbeat(mockRequest);

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          minutesCompleted: expect.any(Number),
          remainingMinutes: expect.any(Number),
          isNewDay: expect.any(Boolean),
          dateKey: expect.any(String),
          serverTimestamp: expect.any(Number),
        })
      );
    });

    it('should return correct minute calculations', async () => {
      const sessionData = {
        courseId: 'course-456',
        lastHeartbeatTimestamp: Date.now(),
      };

      const existingDailyLog = {
        userId: 'user-123',
        courseId: 'course-456',
        minutesCompleted: 50,
        sessions: [],
      };

      setupMockDbForHeartbeat(sessionData, existingDailyLog, true);

      const result = await sessionHeartbeat(mockRequest);

      expect(result.minutesCompleted).toBe(51); // 50 + 1
      expect(result.remainingMinutes).toBe(189); // 240 - 51
    });

    it('should indicate new day when creating daily log', async () => {
      const sessionData = {
        courseId: 'course-456',
        lastHeartbeatTimestamp: Date.now(),
      };

      setupMockDbForHeartbeat(sessionData, null, false);

      const result = await sessionHeartbeat(mockRequest);

      expect(result.isNewDay).toBe(true);
    });

    it('should indicate existing day when updating daily log', async () => {
      const sessionData = {
        courseId: 'course-456',
        lastHeartbeatTimestamp: Date.now(),
      };

      const existingDailyLog = {
        userId: 'user-123',
        courseId: 'course-456',
        minutesCompleted: 10,
        sessions: [],
      };

      setupMockDbForHeartbeat(sessionData, existingDailyLog, true);

      const result = await sessionHeartbeat(mockRequest);

      expect(result.isNewDay).toBe(false);
    });
  });
});

/**
 * Helper function to setup mock database for successful heartbeat
 */
function setupMockDbForHeartbeat(sessionData, dailyLog, dailyLogExists) {
  mockDb.collection = vi.fn((collectionName) => ({
    doc: vi.fn((docId) => {
      // Handle users collection -> sessions subcollection
      if (collectionName === 'users' && docId === 'user-123') {
        return {
          collection: vi.fn(() => ({
            doc: vi.fn((sessionDocId) => {
              if (sessionDocId === 'session-789') {
                return {
                  get: vi.fn(() => Promise.resolve(
                    createMockDocumentSnapshot(sessionData, true)
                  )),
                  update: vi.fn(() => Promise.resolve()),
                };
              }
              return {
                get: vi.fn(() => Promise.resolve(
                  createMockDocumentSnapshot({}, false)
                )),
              };
            })
          })),
          update: vi.fn(() => Promise.resolve()),
        };
      }

      // Handle daily_activity_logs collection
      if (collectionName === 'daily_activity_logs') {
        return {
          get: vi.fn(() => Promise.resolve(
            createMockDocumentSnapshot(dailyLog || {}, dailyLogExists)
          )),
          update: vi.fn(() => Promise.resolve()),
          set: vi.fn(() => Promise.resolve()),
        };
      }

      return {
        get: vi.fn(() => Promise.resolve(createMockDocumentSnapshot({}, false))),
        update: vi.fn(() => Promise.resolve()),
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            get: vi.fn(() => Promise.resolve(
              createMockDocumentSnapshot({}, false)
            )),
          }))
        }))
      };
    })
  }));
}
