import { describe, it, expect, vi, beforeEach } from 'vitest';
import paymentServices from '../paymentServices';
import { addDoc, getDoc, getDocs, updateDoc } from 'firebase/firestore';

// Mock Firestore
vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    doc: vi.fn(),
    addDoc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    updateDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    serverTimestamp: vi.fn()
}));

vi.mock('../../base/ServiceWrapper', () => ({
    executeService: async (fn) => fn(),
}));

// Mock validators
vi.mock('../../utils/api/validators.js', () => ({
    validatePaymentData: vi.fn(),
    validateUserId: vi.fn(),
    validateCourseId: vi.fn()
}));

vi.mock('../../utils/api/timestampHelper.js', () => ({
    getFirestoreTimestamps: () => ({ createdAt: 'now' })
}));

// Mock config
vi.mock('../../config/firebase', () => ({
    db: {}
}));

describe('paymentServices', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('createPaymentIntent adds document to firestore', async () => {
        addDoc.mockResolvedValue({ id: 'payment1' });

        const result = await paymentServices.createPaymentIntent('user1', 'course1', 100);

        expect(addDoc).toHaveBeenCalled();
        expect(result.id).toBe('payment1');
        expect(result.clientSecret).toBe('pi_test_payment1');
    });

    it('getPayment retrieves document', async () => {
        getDoc.mockResolvedValue({
            exists: () => true,
            id: 'payment1',
            data: () => ({ amount: 100, status: 'completed' })
        });

        const result = await paymentServices.getPayment('payment1');

        expect(getDoc).toHaveBeenCalled();
        expect(result.amount).toBe(100);
    });

    it('updatePaymentStatus updates document', async () => {
        await paymentServices.updatePaymentStatus('payment1', 'completed', { meta: 'data' });

        expect(updateDoc).toHaveBeenCalled();
    });
});
