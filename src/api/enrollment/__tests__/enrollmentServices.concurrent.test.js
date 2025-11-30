import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  doc,
  writeBatch,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import enrollmentServices from '../enrollmentServices.js';
import { db } from '../../../config/firebase.js';

vi.mock('firebase/firestore');
vi.mock('../../../config/firebase.js');

describe('Enrollment Services - Concurrent Operations (Atomic)', () => {
  const userId = 'test-user-123';
  const courseId = 'course-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateEnrollmentAfterPayment - Atomic Operations', () => {
    it('should use increment() for atomic amountPaid updates', async () => {
      const mockBatch = {
        update: vi.fn().mockReturnThis(),
        commit: vi.fn().mockResolvedValue(undefined)
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(doc).mockReturnValue('enrollment-ref' as any);

      enrollmentServices.getEnrollment = vi.fn().mockResolvedValue({
        amountPaid: 100,
        amountDue: 900,
        status: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
        accessStatus: 'LOCKED'
      });

      const paymentAmount = 250;

      await enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, paymentAmount);

      expect(mockBatch.update).toHaveBeenCalledWith(
        'enrollment-ref',
        expect.objectContaining({
          amountPaid: increment(250),
          amountDue: increment(-250)
        })
      );
    });

    it('should use atomic operations even with negative increments', async () => {
      const mockBatch = {
        update: vi.fn().mockReturnThis(),
        commit: vi.fn().mockResolvedValue(undefined)
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(doc).mockReturnValue('enrollment-ref' as any);

      enrollmentServices.getEnrollment = vi.fn().mockResolvedValue({
        amountPaid: 0,
        amountDue: 500,
        status: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING'
      });

      await enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 200);

      const callArgs = mockBatch.update.mock.calls[0][1];
      expect(callArgs.amountDue).toEqual(increment(-200));
    });

    it('should set paymentStatus to COMPLETED when amountDue reaches zero', async () => {
      const mockBatch = {
        update: vi.fn().mockReturnThis(),
        commit: vi.fn().mockResolvedValue(undefined)
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(doc).mockReturnValue('enrollment-ref' as any);

      enrollmentServices.getEnrollment = vi.fn().mockResolvedValue({
        amountPaid: 750,
        amountDue: 250,
        status: 'PENDING_PAYMENT'
      });

      await enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 250);

      const callArgs = mockBatch.update.mock.calls[0][1];
      expect(callArgs.paymentStatus).toBe('COMPLETED');
      expect(callArgs.status).toBe('ACTIVE');
      expect(callArgs.accessStatus).toBe('UNLOCKED');
    });

    it('should set paymentStatus to PARTIAL when amountDue remains', async () => {
      const mockBatch = {
        update: vi.fn().mockReturnThis(),
        commit: vi.fn().mockResolvedValue(undefined)
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(doc).mockReturnValue('enrollment-ref' as any);

      enrollmentServices.getEnrollment = vi.fn().mockResolvedValue({
        amountPaid: 0,
        amountDue: 1000,
        status: 'PENDING_PAYMENT'
      });

      await enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 300);

      const callArgs = mockBatch.update.mock.calls[0][1];
      expect(callArgs.paymentStatus).toBe('PARTIAL');
      expect(callArgs.accessStatus).toBe('LOCKED');
    });

    it('should use atomic batch.commit() for transactionality', async () => {
      const mockBatch = {
        update: vi.fn().mockReturnThis(),
        commit: vi.fn().mockResolvedValue(undefined)
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(doc).mockReturnValue('enrollment-ref' as any);

      enrollmentServices.getEnrollment = vi.fn().mockResolvedValue({
        amountPaid: 0,
        amountDue: 500
      });

      await enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 100);

      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
      expect(writeBatch).toHaveBeenCalledWith(db);
    });

    it('should handle concurrent payments without race conditions', async () => {
      const mockBatch1 = {
        update: vi.fn().mockReturnThis(),
        commit: vi.fn().mockResolvedValue(undefined)
      };
      const mockBatch2 = {
        update: vi.fn().mockReturnThis(),
        commit: vi.fn().mockResolvedValue(undefined)
      };

      const batches = [mockBatch1, mockBatch2];
      let batchIndex = 0;
      vi.mocked(writeBatch).mockImplementation(() => batches[batchIndex++]);
      vi.mocked(doc).mockReturnValue('enrollment-ref' as any);

      const mockEnrollment = {
        amountPaid: 0,
        amountDue: 500
      };

      enrollmentServices.getEnrollment = vi.fn().mockResolvedValue(mockEnrollment);

      await Promise.all([
        enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 100),
        enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 200)
      ]);

      expect(mockBatch1.update).toHaveBeenCalledWith(
        'enrollment-ref',
        expect.objectContaining({
          amountPaid: increment(100),
          amountDue: increment(-100)
        })
      );

      expect(mockBatch2.update).toHaveBeenCalledWith(
        'enrollment-ref',
        expect.objectContaining({
          amountPaid: increment(200),
          amountDue: increment(-200)
        })
      );

      expect(mockBatch1.commit).toHaveBeenCalled();
      expect(mockBatch2.commit).toHaveBeenCalled();
    });
  });

  describe('payRemainingBalance - Atomic Operations', () => {
    it('should use atomic increment() for payment processing', async () => {
      const mockBatch = {
        update: vi.fn().mockReturnThis(),
        commit: vi.fn().mockResolvedValue(undefined)
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(doc).mockReturnValue('enrollment-ref' as any);

      enrollmentServices.getEnrollment = vi.fn().mockResolvedValue({
        amountPaid: 500,
        amountDue: 500,
        status: 'PENDING_PAYMENT'
      });

      await enrollmentServices.payRemainingBalance(userId, courseId, 500);

      const callArgs = mockBatch.update.mock.calls[0][1];
      expect(callArgs.amountPaid).toEqual(increment(500));
      expect(callArgs.amountDue).toEqual(increment(-500));
    });

    it('should mark completion when remaining balance is paid', async () => {
      const mockBatch = {
        update: vi.fn().mockReturnThis(),
        commit: vi.fn().mockResolvedValue(undefined)
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(doc).mockReturnValue('enrollment-ref' as any);

      enrollmentServices.getEnrollment = vi.fn().mockResolvedValue({
        amountPaid: 750,
        amountDue: 250,
        status: 'PENDING_PAYMENT'
      });

      await enrollmentServices.payRemainingBalance(userId, courseId, 250);

      const callArgs = mockBatch.update.mock.calls[0][1];
      expect(callArgs.paymentStatus).toBe('COMPLETED');
      expect(callArgs.status).toBe('ACTIVE');
    });
  });

  describe('Atomic Operations - Race Condition Prevention', () => {
    it('should prevent lost updates in concurrent payment scenarios', async () => {
      const mockBatch = {
        update: vi.fn().mockReturnThis(),
        commit: vi.fn().mockResolvedValue(undefined)
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(doc).mockReturnValue('enrollment-ref' as any);

      enrollmentServices.getEnrollment = vi.fn().mockResolvedValue({
        amountPaid: 0,
        amountDue: 1000
      });

      const operations = [
        enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 100),
        enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 200),
        enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 300)
      ];

      await Promise.all(operations);

      const calls = mockBatch.update.mock.calls;
      expect(calls).toHaveLength(3);

      calls.forEach((call, index) => {
        const expectedAmount = [100, 200, 300][index];
        expect(call[1].amountPaid).toEqual(increment(expectedAmount));
        expect(call[1].amountDue).toEqual(increment(-expectedAmount));
      });

      expect(mockBatch.commit).toHaveBeenCalledTimes(3);
    });

    it('should not lose data with negative increment operations', async () => {
      const mockBatch = {
        update: vi.fn().mockReturnThis(),
        commit: vi.fn().mockResolvedValue(undefined)
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(doc).mockReturnValue('enrollment-ref' as any);

      enrollmentServices.getEnrollment = vi.fn().mockResolvedValue({
        amountPaid: 100,
        amountDue: 400
      });

      await enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 150);

      const callArgs = mockBatch.update.mock.calls[0][1];
      expect(callArgs.amountDue).toEqual(increment(-150));
    });
  });

  describe('Error Handling with Atomic Operations', () => {
    it('should throw error if enrollment not found', async () => {
      enrollmentServices.getEnrollment = vi.fn().mockResolvedValue(null);

      await expect(
        enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 100)
      ).rejects.toThrow('Enrollment not found');
    });

    it('should validate payment amount before atomic operation', async () => {
      await expect(
        enrollmentServices.payRemainingBalance(userId, courseId, -100)
      ).rejects.toThrow();
    });

    it('should not call batch.commit() on validation error', async () => {
      const mockBatch = {
        update: vi.fn().mockReturnThis(),
        commit: vi.fn().mockResolvedValue(undefined)
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch);

      try {
        await enrollmentServices.payRemainingBalance(userId, courseId, -100);
      } catch {
        // Expected
      }

      expect(mockBatch.commit).not.toHaveBeenCalled();
    });
  });

  describe('Return Value After Atomic Operations', () => {
    it('should return computed values after successful atomic update', async () => {
      const mockBatch = {
        update: vi.fn().mockReturnThis(),
        commit: vi.fn().mockResolvedValue(undefined)
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch);
      vi.mocked(doc).mockReturnValue('enrollment-ref' as any);

      enrollmentServices.getEnrollment = vi.fn().mockResolvedValue({
        amountPaid: 200,
        amountDue: 800,
        status: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING'
      });

      const result = await enrollmentServices.updateEnrollmentAfterPayment(userId, courseId, 300);

      expect(result).toEqual({
        amountPaid: 300,
        amountDue: 500,
        paymentStatus: 'PARTIAL',
        accessStatus: 'LOCKED',
        status: 'PENDING_PAYMENT'
      });
    });
  });
});
