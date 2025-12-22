import { vi } from 'vitest';

import enrollmentServices from '../enrollmentServices.js';
import { ValidationError, EnrollmentError } from '../../errors/ApiError.js';
import { COURSE_IDS, COURSE_PRICING, ENROLLMENT_STATUS, PAYMENT_STATUS, ACCESS_STATUS } from '../../../constants/courses.js';

vi.mock('../../../utils/api/validators.js');
vi.mock('../../../utils/api/timestampHelper.js', () => ({
  getFirestoreTimestamps: jest.fn(() => ({
    createdAt: 'mock-created',
    updatedAt: 'mock-updated'
  }))
}));

describe('enrollmentServices.createEnrollment() - Refactored with utilities', () => {
  let mockSetDoc;
  let mockGetDoc;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetDoc = vi.fn();
    mockGetDoc = vi.fn();
    
    enrollmentServices.setDoc = mockSetDoc;
    enrollmentServices.getDoc = mockGetDoc;
    // Reset all validator mocks to not throw by default
    enrollmentServices.validate.validateUserId.mockImplementation(() => {});
    enrollmentServices.validate.validateCourseId.mockImplementation(() => {});
    enrollmentServices.validate.validateBreakData.mockImplementation(() => {});
  });

  describe('Input Validation', () => {
    it('should throw ValidationError for invalid userId', async () => {
      enrollmentServices.validate.validateUserId.mockImplementation(() => {
        throw new ValidationError('Invalid userId');
      });

      await expect(
        enrollmentServices.createEnrollment(null, COURSE_IDS.ONLINE, 'user@example.com')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid courseId', async () => {
      enrollmentServices.validate.validateCourseId.mockImplementation(() => {
        throw new ValidationError('Invalid courseId');
      });

      await expect(
        enrollmentServices.createEnrollment('user123', 'invalid', 'user@example.com')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for non-string userEmail', async () => {
      await expect(
        enrollmentServices.createEnrollment('user123', COURSE_IDS.ONLINE, 123)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Duplicate Detection', () => {
    it('should return existing enrollment if already enrolled', async () => {
      const existingEnrollment = { 
        id: COURSE_IDS.ONLINE, 
        status: ENROLLMENT_STATUS.ACTIVE 
      };
      mockGetDoc.mockResolvedValue(existingEnrollment);

      const result = await enrollmentServices.createEnrollment(
        'user123',
        COURSE_IDS.ONLINE,
        'user@example.com'
      );

      expect(result).toEqual(existingEnrollment);
      expect(mockSetDoc).not.toHaveBeenCalled();
    });
  });

  describe('Enrollment Creation', () => {
    it('should create enrollment with correct data for regular user', async () => {
      mockGetDoc.mockResolvedValue(null);
      mockSetDoc.mockResolvedValue(true);

      await enrollmentServices.createEnrollment(
        'user123',
        COURSE_IDS.ONLINE,
        'regular@example.com'
      );

      expect(mockSetDoc).toHaveBeenCalled();
      const callArgs = mockSetDoc.mock.calls[0];
      const enrollmentData = callArgs[2];

      expect(enrollmentData).toHaveProperty('userId', 'user123');
      expect(enrollmentData).toHaveProperty('courseId', COURSE_IDS.ONLINE);
      expect(enrollmentData).toHaveProperty('status', ENROLLMENT_STATUS.PENDING_PAYMENT);
      expect(enrollmentData).toHaveProperty('paymentStatus', PAYMENT_STATUS.PENDING);
      expect(enrollmentData).toHaveProperty('accessStatus', ACCESS_STATUS.LOCKED);
      expect(enrollmentData).toHaveProperty('certificateGenerated', false);
      expect(enrollmentData).toHaveProperty('progress', 0);
    });

    it('should create admin enrollment with correct status', async () => {
      mockGetDoc.mockResolvedValue(null);
      mockSetDoc.mockResolvedValue(true);

      const adminEmail = 'admin@fastrackdrive.com';
      await enrollmentServices.createEnrollment(
        'user123',
        COURSE_IDS.ONLINE,
        adminEmail
      );

      const enrollmentData = mockSetDoc.mock.calls[0][2];

      expect(enrollmentData).toHaveProperty('status', ENROLLMENT_STATUS.ACTIVE);
      expect(enrollmentData).toHaveProperty('paymentStatus', PAYMENT_STATUS.COMPLETED);
      expect(enrollmentData).toHaveProperty('accessStatus', ACCESS_STATUS.UNLOCKED);
      expect(enrollmentData).toHaveProperty('amountPaid', COURSE_PRICING[COURSE_IDS.ONLINE].total);
      expect(enrollmentData).toHaveProperty('isAdminEnrollment', true);
    });

    it('should return created enrollment with id', async () => {
      mockGetDoc.mockResolvedValue(null);
      mockSetDoc.mockResolvedValue(true);

      const result = await enrollmentServices.createEnrollment(
        'user123',
        COURSE_IDS.ONLINE,
        'user@example.com'
      );

      expect(result).toHaveProperty('id', COURSE_IDS.ONLINE);
      expect(result).toHaveProperty('userId', 'user123');
      expect(result).toHaveProperty('courseId', COURSE_IDS.ONLINE);
    });

    it('should include required timestamp and enrollment fields', async () => {
      mockGetDoc.mockResolvedValue(null);
      mockSetDoc.mockResolvedValue(true);

      await enrollmentServices.createEnrollment(
        'user123',
        COURSE_IDS.ONLINE,
        'user@example.com'
      );

      const enrollmentData = mockSetDoc.mock.calls[0][2];
      expect(enrollmentData).toHaveProperty('enrollmentDate');
      expect(enrollmentData).toHaveProperty('userId', 'user123');
      expect(enrollmentData).toHaveProperty('courseId', COURSE_IDS.ONLINE);
      expect(enrollmentData).toHaveProperty('status');
      expect(enrollmentData).toHaveProperty('paymentStatus');
      expect(enrollmentData).toHaveProperty('accessStatus');
    });

    it('should call correct Firestore path for document', async () => {
      mockGetDoc.mockResolvedValue(null);
      mockSetDoc.mockResolvedValue(true);

      await enrollmentServices.createEnrollment(
        'user123',
        COURSE_IDS.ONLINE,
        'user@example.com'
      );

      const setDocCall = mockSetDoc.mock.calls[0];
      expect(setDocCall[0]).toBe(`users/user123/courses`);
      expect(setDocCall[1]).toBe(COURSE_IDS.ONLINE);
    });
  });

  describe('Error Handling', () => {
    it('should throw EnrollmentError for invalid courseId pricing', async () => {
      mockGetDoc.mockResolvedValue(null);

      await expect(
        enrollmentServices.createEnrollment('user123', 'invalid-course', 'user@example.com')
      ).rejects.toThrow(EnrollmentError);
    });

    it('should rethrow caught errors', async () => {
      mockGetDoc.mockRejectedValue(new Error('Firebase error'));

      await expect(
        enrollmentServices.createEnrollment('user123', COURSE_IDS.ONLINE, 'user@example.com')
      ).rejects.toThrow('Firebase error');
    });
  });

  describe('Admin Email Detection', () => {
    it('should recognize admin email (case insensitive)', async () => {
      mockGetDoc.mockResolvedValue(null);
      mockSetDoc.mockResolvedValue(true);

      const adminEmail = 'admin@fastrackdrive.com';
      await enrollmentServices.createEnrollment('user123', COURSE_IDS.ONLINE, adminEmail);

      const enrollmentData = mockSetDoc.mock.calls[0][2];
      expect(enrollmentData.isAdminEnrollment).toBe(true);
    });

    it('should not recognize non-admin email', async () => {
      mockGetDoc.mockResolvedValue(null);
      mockSetDoc.mockResolvedValue(true);

      await enrollmentServices.createEnrollment('user123', COURSE_IDS.ONLINE, 'user@gmail.com');

      const enrollmentData = mockSetDoc.mock.calls[0][2];
      expect(enrollmentData.isAdminEnrollment).toBe(false);
    });
  });
});
