import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as firestore from 'firebase/firestore';

// Mock dependencies
vi.mock('firebase/firestore', async () => {
    const actual = await vi.importActual('firebase/firestore');
    return {
        ...actual,
        collection: vi.fn(),
        doc: vi.fn(),
        getDoc: vi.fn(),
        getDocs: vi.fn(),
        addDoc: vi.fn(),
        updateDoc: vi.fn(),
        deleteDoc: vi.fn(),
        query: vi.fn(),
        where: vi.fn(),
        orderBy: vi.fn(),
    };
});

vi.mock('../../config/firebase', () => ({
    db: {},
}));

vi.mock('../../utils/api/timestampHelper.js', () => ({
    getTimestamps: vi.fn(() => ({ createdAt: 'ISO-DATE', updatedAt: 'ISO-DATE' })),
    getUpdatedTimestamp: vi.fn(() => ({ updatedAt: 'ISO-DATE' })),
    getCreatedTimestamp: vi.fn(() => ({ createdAt: 'ISO-DATE' })),
    getCurrentISOTimestamp: vi.fn(() => 'ISO-DATE'),
}));

// Import service under test
import quizServices from '../quizServices';

describe('Quiz Services', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createQuizAttempt', () => {
        it('should create a new quiz attempt', async () => {
            const mockRef = { id: 'attempt-123' };
            firestore.addDoc.mockResolvedValue(mockRef);

            const quizData = { quizId: 'q1', quizTitle: 'Test Quiz' };
            const result = await quizServices.createQuizAttempt('u1', 'c1', quizData);

            expect(firestore.addDoc).toHaveBeenCalled();
            expect(result).toBe('attempt-123');
        });

        it('should validate inputs', async () => {
            await expect(quizServices.createQuizAttempt(null, 'c1', {}))
                .rejects.toThrow('User ID is required');
        });
    });

    describe('submitQuizAttempt', () => {
        it('should submit and score quiz successfully', async () => {
            const mockSnapshot = {
                exists: () => true,
                data: () => ({ /* existing data */ }),
                id: 'attempt-123'
            };
            firestore.getDoc.mockResolvedValue(mockSnapshot);

            const submission = {
                answers: { q1: 'a' },
                correctAnswers: 8,
                totalQuestions: 10,
                timeSpent: 100
            };

            const result = await quizServices.submitQuizAttempt('attempt-123', submission);

            expect(firestore.updateDoc).toHaveBeenCalled();
            expect(result.score).toBe(80);
            expect(result.passed).toBe(true);
        });

        it('should fail if attempt not found', async () => {
            firestore.getDoc.mockResolvedValue({ exists: () => false });

            await expect(quizServices.submitQuizAttempt('bad-id', {}))
                .rejects.toThrow('Quiz attempt not found');
        });
    });

    describe('getQuizAttempts', () => {
        it('should retrieve attempts', async () => {
            const mockDocs = [
                { id: 'a1', data: () => ({ score: 80 }) }
            ];
            firestore.getDocs.mockResolvedValue(mockDocs);

            const result = await quizServices.getQuizAttempts('u1', 'c1');
            expect(result).toHaveLength(1);
            expect(firestore.query).toHaveBeenCalled();
        });
    });

    describe('canRetakeQuiz', () => {
        // We'll mock internal calls by mocking the module/exports in a real setup, 
        // but here we are testing the service which calls exports. 
        // Since we are mocking firestore, we simulate the data returned by getQuizAttempts.

        it('should allow retake if attempts < 3 and not passed', async () => {
            // Mock getDocs to return empty array (0 attempts)
            firestore.getDocs.mockResolvedValue([]);

            const result = await quizServices.canRetakeQuiz('u1', 'c1', 'q1');
            expect(result).toBe(true);
        });

        it('should deny retake if already passed', async () => {
            // Mock getDocs to return one passed attempt
            const mockDocs = [
                { id: 'a1', data: () => ({ passed: true, score: 90 }) }
            ];
            firestore.getDocs.mockResolvedValue(mockDocs);

            const result = await quizServices.canRetakeQuiz('u1', 'c1', 'q1');
            expect(result).toBe(false);
        });
    });
});
