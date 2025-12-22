import { vi } from 'vitest';

import enrollmentServices from '../enrollmentServices.js';
import { COURSE_IDS, ENROLLMENT_STATUS, PAYMENT_STATUS, ACCESS_STATUS } from '../../../constants/courses.js';

describe('enrollmentServices.checkCourseAccess()', () => {
  let mockGetEnrollment;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEnrollment = vi.spyOn(enrollmentServices, 'getEnrollment');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('No Enrollment Found', () => {
    it('should return hasAccess: false when no enrollment', async () => {
      mockGetEnrollment.mockResolvedValue(null);

      const result = await enrollmentServices.checkCourseAccess('user123', COURSE_IDS.ONLINE);

      expect(result).toEqual({
        hasAccess: false,
        reason: 'No enrollment found'
      });
    });
  });

  describe('Access Check', () => {
    it('should return hasAccess: true for unlocked and active enrollment', async () => {
      mockGetEnrollment.mockResolvedValue({
        id: COURSE_IDS.ONLINE,
        accessStatus: ACCESS_STATUS.UNLOCKED,
        status: ENROLLMENT_STATUS.ACTIVE,
        paymentStatus: PAYMENT_STATUS.COMPLETED
      });

      const result = await enrollmentServices.checkCourseAccess('user123', COURSE_IDS.ONLINE);

      expect(result).toEqual({
        hasAccess: true,
        accessStatus: ACCESS_STATUS.UNLOCKED,
        enrollmentStatus: ENROLLMENT_STATUS.ACTIVE,
        paymentStatus: PAYMENT_STATUS.COMPLETED
      });
    });

    it('should return hasAccess: false if locked', async () => {
      mockGetEnrollment.mockResolvedValue({
        id: COURSE_IDS.ONLINE,
        accessStatus: ACCESS_STATUS.LOCKED,
        status: ENROLLMENT_STATUS.ACTIVE,
        paymentStatus: PAYMENT_STATUS.PENDING
      });

      const result = await enrollmentServices.checkCourseAccess('user123', COURSE_IDS.ONLINE);

      expect(result.hasAccess).toBe(false);
      expect(result.accessStatus).toBe(ACCESS_STATUS.LOCKED);
    });

    it('should return hasAccess: false if enrollment not active', async () => {
      mockGetEnrollment.mockResolvedValue({
        id: COURSE_IDS.ONLINE,
        accessStatus: ACCESS_STATUS.UNLOCKED,
        status: ENROLLMENT_STATUS.PENDING_PAYMENT,
        paymentStatus: PAYMENT_STATUS.PENDING
      });

      const result = await enrollmentServices.checkCourseAccess('user123', COURSE_IDS.ONLINE);

      expect(result.hasAccess).toBe(false);
      expect(result.enrollmentStatus).toBe(ENROLLMENT_STATUS.PENDING_PAYMENT);
    });

    it('should return hasAccess: false even if unlocked but not active', async () => {
      mockGetEnrollment.mockResolvedValue({
        id: COURSE_IDS.ONLINE,
        accessStatus: ACCESS_STATUS.UNLOCKED,
        status: ENROLLMENT_STATUS.PENDING_PAYMENT,
        paymentStatus: PAYMENT_STATUS.PENDING
      });

      const result = await enrollmentServices.checkCourseAccess('user123', COURSE_IDS.ONLINE);

      expect(result.hasAccess).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should rethrow caught errors', async () => {
      mockGetEnrollment.mockRejectedValue(new Error('Firebase error'));

      await expect(
        enrollmentServices.checkCourseAccess('user123', COURSE_IDS.ONLINE)
      ).rejects.toThrow('Firebase error');
    });

    it('should log error with context', async () => {
      const error = new Error('Test error');
      mockGetEnrollment.mockRejectedValue(error);
      const logErrorSpy = vi.spyOn(enrollmentServices, 'logError');

      try {
        await enrollmentServices.checkCourseAccess('user123', COURSE_IDS.ONLINE);
      } catch {
        // Expected
      }

      expect(logErrorSpy).toHaveBeenCalledWith(error, expect.objectContaining({
        method: 'checkCourseAccess',
        userId: 'user123',
        courseId: COURSE_IDS.ONLINE
      }));
    });
  });

  describe('Response Structure', () => {
    it('should always return object with hasAccess property', async () => {
      mockGetEnrollment.mockResolvedValue(null);
      const result = await enrollmentServices.checkCourseAccess('user123', COURSE_IDS.ONLINE);
      
      expect(result).toHaveProperty('hasAccess');
      expect(typeof result.hasAccess).toBe('boolean');
    });

    it('should include all status fields in response', async () => {
      mockGetEnrollment.mockResolvedValue({
        accessStatus: ACCESS_STATUS.UNLOCKED,
        status: ENROLLMENT_STATUS.ACTIVE,
        paymentStatus: PAYMENT_STATUS.COMPLETED
      });

      const result = await enrollmentServices.checkCourseAccess('user123', COURSE_IDS.ONLINE);

      expect(result).toHaveProperty('hasAccess');
      expect(result).toHaveProperty('accessStatus');
      expect(result).toHaveProperty('enrollmentStatus');
      expect(result).toHaveProperty('paymentStatus');
    });
  });
});
