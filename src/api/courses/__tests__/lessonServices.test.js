import { vi, describe, it, expect, beforeEach } from 'vitest';
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
    };
});

vi.mock('../../config/firebase', () => ({
    db: {},
}));

vi.mock('../../utils/api/timestampHelper.js', () => ({
    getTimestamps: vi.fn(() => ({ createdAt: 'ISO-DATE', updatedAt: 'ISO-DATE' })),
    getUpdatedTimestamp: vi.fn(() => ({ updatedAt: 'ISO-DATE' })),
    getCreatedTimestamp: vi.fn(() => ({ createdAt: 'ISO-DATE' })),
}));

// Import service under test
import lessonServices from '../lessonServices';

describe('Lesson Services', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getLessons', () => {
        it('should fetch lessons for a module', async () => {
            const mockDocs = [
                { id: 'l1', data: () => ({ title: 'Lesson 1', order: 1 }) },
                { id: 'l2', data: () => ({ title: 'Lesson 2', order: 2 }) },
            ];
            firestore.getDocs.mockResolvedValue(mockDocs);

            const result = await lessonServices.getLessons('c1', 'm1');

            expect(firestore.query).toHaveBeenCalled();
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('l1');
        });

        it('should validate inputs', async () => {
            await expect(lessonServices.getLessons(null, 'm1'))
                .rejects.toThrow('Course ID is required');
            await expect(lessonServices.getLessons('c1', null))
                .rejects.toThrow('Module ID is required');
        });
    });

    describe('getLessonById', () => {
        it('should fetch lesson by ID', async () => {
            const mockSnapshot = {
                exists: () => true,
                id: 'l1',
                data: () => ({ title: 'Lesson 1' }),
            };
            firestore.getDoc.mockResolvedValue(mockSnapshot);

            const result = await lessonServices.getLessonById('l1');
            expect(result.id).toBe('l1');
            expect(result.title).toBe('Lesson 1');
        });

        it('should throw error if not found', async () => {
            const mockSnapshot = {
                exists: () => false,
            };
            firestore.getDoc.mockResolvedValue(mockSnapshot);

            await expect(lessonServices.getLessonById('l1'))
                .rejects.toThrow('Lesson not found');
        });
    });

    describe('createLesson', () => {
        it('should create a new lesson', async () => {
            const mockRef = { id: 'new-lesson-id' };
            firestore.addDoc.mockResolvedValue(mockRef);

            const lessonData = { title: 'New Lesson', moduleId: 'm1' };
            const result = await lessonServices.createLesson(lessonData);

            expect(firestore.addDoc).toHaveBeenCalled();
            expect(result.id).toBe('new-lesson-id');
        });

        it('should validate input data', async () => {
            await expect(lessonServices.createLesson(null))
                .rejects.toThrow('Lesson data must be a valid object');
        });
    });

    describe('updateLesson', () => {
        it('should update valid lesson', async () => {
            // Mock getLessonById for return value
            const mockSnapshot = {
                exists: () => true,
                id: 'l1',
                data: () => ({ title: 'Updated Lesson' }),
            };
            firestore.getDoc.mockResolvedValue(mockSnapshot);

            const updates = { title: 'Updated Lesson' };
            await lessonServices.updateLesson('l1', updates);

            expect(firestore.updateDoc).toHaveBeenCalled();
        });
    });

    describe('deleteLesson', () => {
        it('should delete lesson', async () => {
            await lessonServices.deleteLesson('l1');
            expect(firestore.deleteDoc).toHaveBeenCalled();
        });
    });

    describe('markComplete', () => {
        it('should mark lesson as complete', async () => {
            firestore.addDoc.mockResolvedValue({});

            await lessonServices.markComplete('u1', 'l1', 'c1');

            expect(firestore.addDoc).toHaveBeenCalled();
            const callArgs = firestore.addDoc.mock.calls[0][1];
            expect(callArgs.completed).toBe(true);
            expect(callArgs.userId).toBe('u1');
        });
    });
});
