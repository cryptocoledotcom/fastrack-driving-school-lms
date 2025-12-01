import enrollmentServices from '../enrollmentServices.js';
import { ValidationError } from '../../errors/ApiError.js';
import { COURSE_IDS, ENROLLMENT_STATUS, PAYMENT_STATUS, ACCESS_STATUS } from '../../../constants/courses.js';

const firebaseFirestore = jest.mock('firebase/firestore', () => ({
  writeBatch: jest.fn(),
  serverTimestamp: jest.fn(() => ({ _type: 'serverTimestamp' })),
  doc: jest.fn(),
  increment: jest.fn()
}));

jest.mock('../../../config/firebase.js', () => ({
  db: {}
}));

jest.mock('../../validators/validators.js');

jest.mock('../../utils/timestampHelper.js', () => ({
  getFirestoreTimestamps: jest.fn(() => ({
    createdAt: 'mock-created',
    updatedAt: 'mock-updated'
  }))
}));

describe('enrollmentServices - Reset Functionality', () => {
  let mockUpdateDoc;
  let mockBatchUpdate;
  let mockBatchCommit;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUpdateDoc = jest.fn().mockResolvedValue(true);
    mockBatchUpdate = jest.fn();
    mockBatchCommit = jest.fn().mockResolvedValue(true);

    enrollmentServices.updateDoc = mockUpdateDoc;
    enrollmentServices.validate.validateUserId.mockImplementation(() => {});
    enrollmentServices.validate.validateCourseId.mockImplementation(() => {});
    enrollmentServices.log = jest.fn();
    enrollmentServices.logError = jest.fn();
  });

  describe('resetEnrollmentToPending()', () => {
    const userId = 'user123';
    const courseId = COURSE_IDS.ONLINE;

    describe('Input Validation', () => {
      it('should throw ValidationError for invalid userId', async () => {
        enrollmentServices.validate.validateUserId.mockImplementation(() => {
          throw new ValidationError('Invalid userId');
        });

        await expect(
          enrollmentServices.resetEnrollmentToPending('', courseId)
        ).rejects.toThrow(ValidationError);
      });

      it('should throw ValidationError for invalid courseId', async () => {
        enrollmentServices.validate.validateCourseId.mockImplementation(() => {
          throw new ValidationError('Invalid courseId');
        });

        await expect(
          enrollmentServices.resetEnrollmentToPending(userId, '')
        ).rejects.toThrow(ValidationError);
      });
    });

    describe('Reset Logic', () => {
      it('should reset single enrollment to PENDING_PAYMENT status', async () => {
        const result = await enrollmentServices.resetEnrollmentToPending(userId, courseId);

        expect(result.status).toBe(ENROLLMENT_STATUS.PENDING_PAYMENT);
        expect(result.paymentStatus).toBe(PAYMENT_STATUS.PENDING);
        expect(result.accessStatus).toBe(ACCESS_STATUS.LOCKED);
        expect(result.amountPaid).toBe(0);
      });

      it('should include updatedAt timestamp', async () => {
        const result = await enrollmentServices.resetEnrollmentToPending(userId, courseId);
        expect(result.updatedAt).toBeDefined();
      });

      it('should call updateDoc with correct path and data', async () => {
        await enrollmentServices.resetEnrollmentToPending(userId, courseId);

        expect(mockUpdateDoc).toHaveBeenCalledWith(
          `users/${userId}/courses`,
          courseId,
          expect.objectContaining({
            status: ENROLLMENT_STATUS.PENDING_PAYMENT,
            accessStatus: ACCESS_STATUS.LOCKED,
            paymentStatus: PAYMENT_STATUS.PENDING,
            amountPaid: 0
          })
        );
      });

      it('should clear payment info (amountPaid to 0)', async () => {
        const result = await enrollmentServices.resetEnrollmentToPending(userId, courseId);
        expect(result.amountPaid).toBe(0);
      });

      it('should set access status to LOCKED', async () => {
        const result = await enrollmentServices.resetEnrollmentToPending(userId, courseId);
        expect(result.accessStatus).toBe(ACCESS_STATUS.LOCKED);
      });

      it('should log successful reset', async () => {
        await enrollmentServices.resetEnrollmentToPending(userId, courseId);

        expect(enrollmentServices.log).toHaveBeenCalledWith(
          expect.stringContaining('Reset enrollment to pending')
        );
      });
    });

    describe('Error Handling', () => {
      it('should handle updateDoc errors gracefully', async () => {
        const error = new Error('Firestore error');
        mockUpdateDoc.mockRejectedValueOnce(error);

        await expect(
          enrollmentServices.resetEnrollmentToPending(userId, courseId)
        ).rejects.toThrow(error);

        expect(enrollmentServices.logError).toHaveBeenCalledWith(
          error,
          expect.objectContaining({
            method: 'resetEnrollmentToPending'
          })
        );
      });

      it('should rethrow errors after logging', async () => {
        const error = new Error('Database connection failed');
        mockUpdateDoc.mockRejectedValueOnce(error);

        await expect(
          enrollmentServices.resetEnrollmentToPending(userId, courseId)
        ).rejects.toThrow('Database connection failed');
      });
    });

    describe('Data Integrity', () => {
      it('should reset multiple enrollments independently', async () => {
        await enrollmentServices.resetEnrollmentToPending(userId, COURSE_IDS.ONLINE);
        await enrollmentServices.resetEnrollmentToPending(userId, COURSE_IDS.BEHIND_THE_WHEEL);

        expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
        expect(mockUpdateDoc).toHaveBeenNthCalledWith(
          1,
          `users/${userId}/courses`,
          COURSE_IDS.ONLINE,
          expect.any(Object)
        );
        expect(mockUpdateDoc).toHaveBeenNthCalledWith(
          2,
          `users/${userId}/courses`,
          COURSE_IDS.BEHIND_THE_WHEEL,
          expect.any(Object)
        );
      });

      it('should not modify other user data', async () => {
        const userId1 = 'user1';
        const userId2 = 'user2';

        await enrollmentServices.resetEnrollmentToPending(userId1, COURSE_IDS.ONLINE);
        await enrollmentServices.resetEnrollmentToPending(userId2, COURSE_IDS.ONLINE);

        const call1Path = mockUpdateDoc.mock.calls[0][0];
        const call2Path = mockUpdateDoc.mock.calls[1][0];

        expect(call1Path).toContain(userId1);
        expect(call2Path).toContain(userId2);
      });
    });

    describe('Race Conditions', () => {
      it('should handle concurrent reset calls on same enrollment', async () => {
        const promises = [
          enrollmentServices.resetEnrollmentToPending(userId, courseId),
          enrollmentServices.resetEnrollmentToPending(userId, courseId),
          enrollmentServices.resetEnrollmentToPending(userId, courseId)
        ];

        await Promise.all(promises);
        expect(mockUpdateDoc).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('resetUserEnrollmentsToPending()', () => {
    const userId = 'user123';

    beforeEach(() => {
      enrollmentServices.getUserEnrollments = jest.fn();
    });

    describe('Input Validation', () => {
      it('should throw ValidationError for invalid userId', async () => {
        enrollmentServices.validate.validateUserId.mockImplementation(() => {
          throw new ValidationError('Invalid userId');
        });

        await expect(
          enrollmentServices.resetUserEnrollmentsToPending('')
        ).rejects.toThrow(ValidationError);
      });
    });

    describe('Error Handling', () => {
      it('should handle getUserEnrollments errors', async () => {
        const error = new Error('Failed to fetch enrollments');
        enrollmentServices.getUserEnrollments.mockRejectedValue(error);

        await expect(
          enrollmentServices.resetUserEnrollmentsToPending(userId)
        ).rejects.toThrow(error);

        expect(enrollmentServices.logError).toHaveBeenCalled();
      });

      it('should rethrow caught errors', async () => {
        enrollmentServices.getUserEnrollments.mockRejectedValueOnce(
          new ValidationError('User not found')
        );

        await expect(
          enrollmentServices.resetUserEnrollmentsToPending(userId)
        ).rejects.toThrow(ValidationError);
      });

      it('should log errors with context', async () => {
        const error = new Error('Batch error');
        enrollmentServices.getUserEnrollments.mockRejectedValue(error);

        try {
          await enrollmentServices.resetUserEnrollmentsToPending(userId);
        } catch (e) {
          // Expected
        }

        expect(enrollmentServices.logError).toHaveBeenCalledWith(
          error,
          expect.objectContaining({
            method: 'resetUserEnrollmentsToPending',
            userId
          })
        );
      });
    });
  });

  describe('State Consistency', () => {
    const userId = 'user123';
    const courseId = COURSE_IDS.ONLINE;

    it('should return consistent state after reset', async () => {
      const result = await enrollmentServices.resetEnrollmentToPending(userId, courseId);

      expect(result).toEqual(expect.objectContaining({
        status: ENROLLMENT_STATUS.PENDING_PAYMENT,
        accessStatus: ACCESS_STATUS.LOCKED,
        paymentStatus: PAYMENT_STATUS.PENDING,
        amountPaid: 0
      }));
    });

    it('should not leak sensitive fields', async () => {
      const result = await enrollmentServices.resetEnrollmentToPending(userId, courseId);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('secretKey');
      expect(result).not.toHaveProperty('apiKey');
    });
  });
});
