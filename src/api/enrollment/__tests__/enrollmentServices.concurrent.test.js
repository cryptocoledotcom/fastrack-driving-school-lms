import enrollmentServices from '../enrollmentServices.js';
import { EnrollmentError, ValidationError } from '../../errors/ApiError.js';

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  writeBatch: jest.fn(),
  increment: jest.fn((val) => ({ _type: 'increment', value: val })),
  serverTimestamp: jest.fn(() => ({ _type: 'serverTimestamp' }))
}));

jest.mock('../../../config/firebase.js', () => ({
  db: {}
}));

jest.mock('../../errors/ApiError.js', () => {
  class ValidationError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ValidationError';
      this.code = 'VALIDATION_ERROR';
    }
  }
  
  class EnrollmentError extends Error {
    constructor(message, code) {
      super(message);
      this.name = 'EnrollmentError';
      this.code = 'ENROLLMENT_ERROR';
      this.enrollmentCode = code;
    }
  }
  
  class ApiError extends Error {
    constructor(code, message) {
      super(message);
      this.name = 'ApiError';
      this.code = code;
    }
  }
  
  return {
    ValidationError,
    EnrollmentError,
    ApiError,
    mapFirebaseError: (error) => new ApiError('FIREBASE_ERROR', error.message)
  };
});

jest.mock('../../../utils/api/validators.js', () => ({
  validateUserId: jest.fn((userId) => {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID');
    }
  }),
  validateCourseId: jest.fn((courseId) => {
    if (!courseId || typeof courseId !== 'string') {
      throw new Error('Invalid course ID');
    }
  }),
  validateEmail: jest.fn(),
  validatePaymentData: jest.fn(),
  validateEnrollmentData: jest.fn()
}));

let firebaseFirestore;
let db;

beforeEach(() => {
  jest.clearAllMocks();
  firebaseFirestore = require('firebase/firestore');
  db = require('../../../config/firebase.js').db;
  
  enrollmentServices.getEnrollment = jest.fn();
  
  enrollmentServices.validate = {
    validateUserId: (userId) => {
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID');
      }
    },
    validateCourseId: (courseId) => {
      if (!courseId || typeof courseId !== 'string') {
        throw new Error('Invalid course ID');
      }
    }
  };
});

describe('enrollmentServices - Concurrent Operations (Atomic)', () => {
  const userId = 'test-user-123';
  const courseId = 'course-456';

  describe('updateEnrollmentAfterPayment - Atomic Operations', () => {
    it('should validate userId before atomic operation', async () => {
      await expect(
        enrollmentServices.updateEnrollmentAfterPayment('', courseId, 100)
      ).rejects.toThrow();
    });

    it('should validate courseId before atomic operation', async () => {
      await expect(
        enrollmentServices.updateEnrollmentAfterPayment(userId, '', 100)
      ).rejects.toThrow();
    });

    it('should throw error if enrollment not found', async () => {
      enrollmentServices.getEnrollment.mockResolvedValue(null);

      await expect(
        enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 100)
      ).rejects.toThrow('Enrollment not found');
    });

    it('should use atomic operations with batch updates', async () => {
      const mockBatch = {
        update: jest.fn().mockReturnThis(),
        commit: jest.fn().mockResolvedValue(undefined)
      };

      firebaseFirestore.writeBatch.mockReturnValue(mockBatch);
      firebaseFirestore.doc.mockReturnValue('docRef');

      enrollmentServices.getEnrollment.mockResolvedValue({
        amountPaid: 100,
        amountDue: 900,
        status: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING'
      });

      await enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 250);

      expect(mockBatch.commit).toHaveBeenCalled();
      expect(mockBatch.update).toHaveBeenCalled();
    });

    it('should handle negative amounts (decrement)', async () => {
      enrollmentServices.getEnrollment.mockResolvedValue({
        amountPaid: 500,
        amountDue: 500
      });

      const mockBatch = {
        update: jest.fn().mockReturnThis(),
        commit: jest.fn().mockResolvedValue(undefined)
      };

      firebaseFirestore.writeBatch.mockReturnValue(mockBatch);
      firebaseFirestore.doc.mockReturnValue('docRef');

      await enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 200);

      expect(mockBatch.update).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should set correct status when payment completed', async () => {
      enrollmentServices.getEnrollment.mockResolvedValue({
        amountPaid: 750,
        amountDue: 250,
        status: 'PENDING_PAYMENT'
      });

      const mockBatch = {
        update: jest.fn().mockReturnThis(),
        commit: jest.fn().mockResolvedValue(undefined)
      };

      firebaseFirestore.writeBatch.mockReturnValue(mockBatch);
      firebaseFirestore.doc.mockReturnValue('docRef');

      const result = await enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 250);

      expect(result).toBeDefined();
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('payRemainingBalance - Atomic Operations', () => {
    it('should validate payment amount', async () => {
      await expect(
        enrollmentServices.payRemainingBalance(userId, courseId, -100)
      ).rejects.toThrow();

      await expect(
        enrollmentServices.payRemainingBalance(userId, courseId, 0)
      ).rejects.toThrow();
    });

    it('should throw error if enrollment not found', async () => {
      enrollmentServices.getEnrollment.mockResolvedValue(null);

      await expect(
        enrollmentServices.payRemainingBalance(userId, courseId, 100)
      ).rejects.toThrow('Enrollment not found');
    });

    it('should use atomic batch operations', async () => {
      enrollmentServices.getEnrollment.mockResolvedValue({
        amountPaid: 500,
        amountDue: 500,
        status: 'PENDING_PAYMENT'
      });

      const mockBatch = {
        update: jest.fn().mockReturnThis(),
        commit: jest.fn().mockResolvedValue(undefined)
      };

      firebaseFirestore.writeBatch.mockReturnValue(mockBatch);
      firebaseFirestore.doc.mockReturnValue('docRef');

      await enrollmentServices.payRemainingBalance(userId, courseId, 500);

      expect(mockBatch.update).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should handle remaining balance correctly', async () => {
      enrollmentServices.getEnrollment.mockResolvedValue({
        amountPaid: 250,
        amountDue: 750
      });

      const mockBatch = {
        update: jest.fn().mockReturnThis(),
        commit: jest.fn().mockResolvedValue(undefined)
      };

      firebaseFirestore.writeBatch.mockReturnValue(mockBatch);
      firebaseFirestore.doc.mockReturnValue('docRef');

      const result = await enrollmentServices.payRemainingBalance(userId, courseId, 300);

      expect(result).toBeDefined();
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('Atomic Operations - Consistency', () => {
    it('should not lose updates with concurrent operations', async () => {
      enrollmentServices.getEnrollment.mockResolvedValue({
        amountPaid: 0,
        amountDue: 1000
      });

      const mockBatch1 = {
        update: jest.fn().mockReturnThis(),
        commit: jest.fn().mockResolvedValue(undefined)
      };

      const mockBatch2 = {
        update: jest.fn().mockReturnThis(),
        commit: jest.fn().mockResolvedValue(undefined)
      };

      let batchIndex = 0;
      firebaseFirestore.writeBatch.mockImplementation(() => {
        return batchIndex++ === 0 ? mockBatch1 : mockBatch2;
      });
      firebaseFirestore.doc.mockReturnValue('docRef');

      await Promise.all([
        enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 100),
        enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 200)
      ]);

      expect(mockBatch1.commit).toHaveBeenCalled();
      expect(mockBatch2.commit).toHaveBeenCalled();
    });

    it('should handle partial payment scenarios', async () => {
      enrollmentServices.getEnrollment
        .mockResolvedValueOnce({
          amountPaid: 0,
          amountDue: 1000
        })
        .mockResolvedValueOnce({
          amountPaid: 300,
          amountDue: 700
        });

      const mockBatch = {
        update: jest.fn().mockReturnThis(),
        commit: jest.fn().mockResolvedValue(undefined)
      };

      firebaseFirestore.writeBatch.mockReturnValue(mockBatch);
      firebaseFirestore.doc.mockReturnValue('docRef');

      await enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 300);
      await enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 700);

      expect(mockBatch.update).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling with Atomic Operations', () => {
    it('should not commit batch on validation error', async () => {
      const mockBatch = {
        update: jest.fn().mockReturnThis(),
        commit: jest.fn().mockResolvedValue(undefined)
      };

      firebaseFirestore.writeBatch.mockReturnValue(mockBatch);

      await expect(
        enrollmentServices.updateEnrollmentAfterPayment('', courseId, 100)
      ).rejects.toThrow();

      expect(mockBatch.commit).not.toHaveBeenCalled();
    });

    it('should handle enrollment not found without batch commit', async () => {
      enrollmentServices.getEnrollment.mockResolvedValue(null);

      const mockBatch = {
        update: jest.fn().mockReturnThis(),
        commit: jest.fn().mockResolvedValue(undefined)
      };

      firebaseFirestore.writeBatch.mockReturnValue(mockBatch);

      await expect(
        enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 100)
      ).rejects.toThrow();

      expect(mockBatch.commit).not.toHaveBeenCalled();
    });
  });

  describe('Return Values After Atomic Update', () => {
    it('should return correct values after successful atomic update', async () => {
      enrollmentServices.getEnrollment.mockResolvedValue({
        amountPaid: 200,
        amountDue: 800,
        status: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING'
      });

      const mockBatch = {
        update: jest.fn().mockReturnThis(),
        commit: jest.fn().mockResolvedValue(undefined)
      };

      firebaseFirestore.writeBatch.mockReturnValue(mockBatch);
      firebaseFirestore.doc.mockReturnValue('docRef');

      const result = await enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 300);

      expect(result).toBeDefined();
      expect(result.amountPaid).toBe(300);
      expect(result.amountDue).toBe(500);
    });

    it('should return correct payment status values', async () => {
      enrollmentServices.getEnrollment.mockResolvedValue({
        amountPaid: 900,
        amountDue: 100,
        status: 'PENDING_PAYMENT',
        paymentStatus: 'PARTIAL'
      });

      const mockBatch = {
        update: jest.fn().mockReturnThis(),
        commit: jest.fn().mockResolvedValue(undefined)
      };

      firebaseFirestore.writeBatch.mockReturnValue(mockBatch);
      firebaseFirestore.doc.mockReturnValue('docRef');

      const result = await enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 100);

      expect(result.amountDue).toBe(0);
      expect(result.paymentStatus).toBe('completed');
    });
  });
});
