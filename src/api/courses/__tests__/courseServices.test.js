import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as courseServices from '../courseServices.js';

let firestore;
let db;
let validateCourseId;
let ValidationError;
let CourseError;
let getTimestamps;
let getUpdatedTimestamp;

vi.mock('firebase/firestore', () => ({
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
  limit: vi.fn()
}));

vi.mock('../../../config/firebase.js', () => ({
  db: {}
}));

vi.mock('../../../utils/api/validators.js', () => ({
  validateCourseId: vi.fn()
}));

vi.mock('../../../utils/api/timestampHelper.js', () => ({
  getTimestamps: vi.fn(() => ({ createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })),
  getUpdatedTimestamp: vi.fn(() => ({ updatedAt: new Date().toISOString() }))
}));

vi.mock('../../errors/ApiError.js', () => ({
  CourseError: class CourseError extends Error {
    constructor(message, courseId) {
      super(message);
      this.code = 'COURSE_ERROR';
      this.courseId = courseId;
    }
  },
  ValidationError: class ValidationError extends Error {
    constructor(message) {
      super(message);
      this.code = 'VALIDATION_ERROR';
    }
  },
  ApiError: class ApiError extends Error {
    constructor(code, message, originalError) {
      super(message);
      this.code = code;
      this.originalError = originalError;
    }
  },
  mapFirebaseError: vi.fn((error) => error)
}));

vi.mock('../base/ServiceWrapper.js', () => ({
  executeService: vi.fn(async (operation) => {
    try {
      return await operation();
    } catch (error) {
      throw error;
    }
  })
}));

beforeEach(async () => {
  vi.clearAllMocks();
  firestore = vi.mocked(await import('firebase/firestore'));
  const configModule = await import('../../../config/firebase.js');
  db = configModule.db;
  const validatorsModule = await import('../../../utils/api/validators.js');
  validateCourseId = validatorsModule.validateCourseId;
  const timestampModule = await import('../../../utils/api/timestampHelper.js');
  getTimestamps = timestampModule.getTimestamps;
  getUpdatedTimestamp = timestampModule.getUpdatedTimestamp;
  const errorModule = await import('../../errors/ApiError.js');
  ValidationError = errorModule.ValidationError;
  CourseError = errorModule.CourseError;
});

describe('Course Services', () => {
  describe('getCourses()', () => {
    it('should retrieve all courses ordered by createdAt', async () => {
      const mockCourses = [
        { id: 'course-1', title: 'Course 1', description: 'Desc 1' },
        { id: 'course-2', title: 'Course 2', description: 'Desc 2' }
      ];
      const mockQuerySnapshot = {
        forEach: (callback) => {
          mockCourses.forEach(course => {
            callback({
              id: course.id,
              data: () => course
            });
          });
        }
      };
      
      firestore.collection.mockReturnValue({});
      firestore.query.mockReturnValue({});
      firestore.orderBy.mockReturnValue({});
      firestore.getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await courseServices.getCourses();
      expect(result).toEqual(mockCourses);
      expect(firestore.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('should return empty array when no courses exist', async () => {
      const mockQuerySnapshot = {
        forEach: (callback) => {}
      };
      
      firestore.collection.mockReturnValue({});
      firestore.query.mockReturnValue({});
      firestore.orderBy.mockReturnValue({});
      firestore.getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await courseServices.getCourses();
      expect(result).toEqual([]);
    });

    it('should throw error on Firebase failure', async () => {
      firestore.collection.mockReturnValue({});
      firestore.query.mockReturnValue({});
      firestore.orderBy.mockReturnValue({});
      firestore.getDocs.mockRejectedValue(new Error('Firebase error'));

      await expect(courseServices.getCourses()).rejects.toThrow();
    });
  });

  describe('getCourseById()', () => {
    it('should retrieve course by ID', async () => {
      const mockCourse = { id: 'course-1', title: 'Course 1', description: 'Desc 1' };
      validateCourseId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'course-1',
        data: () => mockCourse
      });

      const result = await courseServices.getCourseById('course-1');
      expect(result).toEqual({ id: 'course-1', ...mockCourse });
      expect(validateCourseId).toHaveBeenCalledWith('course-1');
    });

    it('should throw CourseError when course does not exist', async () => {
      validateCourseId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.getDoc.mockResolvedValue({ exists: () => false });

      await expect(courseServices.getCourseById('nonexistent')).rejects.toThrow();
    });

    it('should throw validation error for invalid courseId', async () => {
      validateCourseId.mockImplementation(() => {
        throw new ValidationError('Invalid course ID');
      });

      await expect(courseServices.getCourseById('invalid')).rejects.toThrow();
    });
  });

  describe('getFeaturedCourses()', () => {
    it('should retrieve featured courses with default limit of 6', async () => {
      const mockCourses = [
        { id: 'featured-1', title: 'Featured 1', featured: true }
      ];
      const mockQuerySnapshot = {
        forEach: (callback) => {
          mockCourses.forEach(course => {
            callback({
              id: course.id,
              data: () => course
            });
          });
        }
      };

      firestore.collection.mockReturnValue({});
      firestore.query.mockReturnValue({});
      firestore.where.mockReturnValue({});
      firestore.orderBy.mockReturnValue({});
      firestore.limit.mockReturnValue({});
      firestore.getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await courseServices.getFeaturedCourses();
      expect(result).toEqual(mockCourses);
      expect(firestore.limit).toHaveBeenCalledWith(6);
    });

    it('should retrieve featured courses with custom limit', async () => {
      const mockCourses = [
        { id: 'featured-1', title: 'Featured 1', featured: true }
      ];
      const mockQuerySnapshot = {
        forEach: (callback) => {
          mockCourses.forEach(course => {
            callback({
              id: course.id,
              data: () => course
            });
          });
        }
      };

      firestore.collection.mockReturnValue({});
      firestore.query.mockReturnValue({});
      firestore.where.mockReturnValue({});
      firestore.orderBy.mockReturnValue({});
      firestore.limit.mockReturnValue({});
      firestore.getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await courseServices.getFeaturedCourses(10);
      expect(result).toEqual(mockCourses);
      expect(firestore.limit).toHaveBeenCalledWith(10);
    });

    it('should throw validation error for invalid limitCount', async () => {
      await expect(courseServices.getFeaturedCourses(0)).rejects.toThrow();
      await expect(courseServices.getFeaturedCourses(-5)).rejects.toThrow();
      await expect(courseServices.getFeaturedCourses('not a number')).rejects.toThrow();
    });
  });

  describe('getCoursesByCategory()', () => {
    it('should retrieve courses by category', async () => {
      const mockCourses = [
        { id: 'course-1', title: 'Course 1', category: 'JavaScript' }
      ];
      const mockQuerySnapshot = {
        forEach: (callback) => {
          mockCourses.forEach(course => {
            callback({
              id: course.id,
              data: () => course
            });
          });
        }
      };

      firestore.collection.mockReturnValue({});
      firestore.query.mockReturnValue({});
      firestore.where.mockReturnValue({});
      firestore.orderBy.mockReturnValue({});
      firestore.getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await courseServices.getCoursesByCategory('JavaScript');
      expect(result).toEqual(mockCourses);
      expect(firestore.where).toHaveBeenCalledWith('category', '==', 'JavaScript');
    });

    it('should throw validation error for empty category', async () => {
      await expect(courseServices.getCoursesByCategory('')).rejects.toThrow();
      await expect(courseServices.getCoursesByCategory(null)).rejects.toThrow();
    });
  });

  describe('createCourse()', () => {
    it('should create course with valid data', async () => {
      const courseData = {
        title: 'New Course',
        description: 'Course description'
      };
      const mockDocRef = { id: 'course-new' };

      firestore.collection.mockReturnValue({});
      firestore.addDoc.mockResolvedValue(mockDocRef);

      const result = await courseServices.createCourse(courseData);
      expect(result.id).toBe('course-new');
      expect(result.title).toBe('New Course');
    });

    it('should throw validation error for missing title', async () => {
      await expect(courseServices.createCourse({
        description: 'Course description'
      })).rejects.toThrow();
    });

    it('should throw validation error for missing description', async () => {
      await expect(courseServices.createCourse({
        title: 'New Course'
      })).rejects.toThrow();
    });
  });

  describe('updateCourse()', () => {
    it('should update course with valid data', async () => {
      const updates = { title: 'Updated Course' };
      const updatedCourse = {
        id: 'course-1',
        title: 'Updated Course',
        description: 'Desc'
      };

      validateCourseId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.updateDoc.mockResolvedValue(undefined);
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'course-1',
        data: () => updatedCourse
      });

      const result = await courseServices.updateCourse('course-1', updates);
      expect(result.title).toBe('Updated Course');
    });

    it('should throw validation error for null updates', async () => {
      validateCourseId.mockImplementation(() => true);
      await expect(courseServices.updateCourse('course-1', null)).rejects.toThrow();
    });
  });

  describe('deleteCourse()', () => {
    it('should delete course with valid courseId', async () => {
      validateCourseId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.deleteDoc.mockResolvedValue(undefined);

      await courseServices.deleteCourse('course-1');
      expect(validateCourseId).toHaveBeenCalledWith('course-1');
      expect(firestore.deleteDoc).toHaveBeenCalled();
    });

    it('should throw validation error for invalid courseId', async () => {
      validateCourseId.mockImplementation(() => {
        throw new ValidationError('Invalid course ID');
      });

      await expect(courseServices.deleteCourse('invalid')).rejects.toThrow();
    });
  });

  describe('searchCourses()', () => {
    it('should search courses by title', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          title: 'JavaScript Basics',
          description: 'Learn JavaScript',
          category: 'Programming'
        }
      ];
      const mockQuerySnapshot = {
        forEach: (callback) => {
          mockCourses.forEach(course => {
            callback({
              id: course.id,
              data: () => course
            });
          });
        }
      };

      firestore.collection.mockReturnValue({});
      firestore.getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await courseServices.searchCourses('JavaScript');
      expect(result).toEqual(mockCourses);
    });

    it('should perform case-insensitive search', async () => {
      const mockCourses = [
        {
          id: 'course-1',
          title: 'JavaScript Basics',
          description: 'Learn JS',
          category: 'Programming'
        }
      ];
      const mockQuerySnapshot = {
        forEach: (callback) => {
          mockCourses.forEach(course => {
            callback({
              id: course.id,
              data: () => course
            });
          });
        }
      };

      firestore.collection.mockReturnValue({});
      firestore.getDocs.mockResolvedValue(mockQuerySnapshot);

      const result = await courseServices.searchCourses('javascript');
      expect(result).toEqual(mockCourses);
    });

    it('should throw validation error for empty searchTerm', async () => {
      await expect(courseServices.searchCourses('')).rejects.toThrow();
      await expect(courseServices.searchCourses(null)).rejects.toThrow();
    });
  });

  describe('getCourseStats()', () => {
    it('should retrieve course statistics', async () => {
      const mockCourse = {
        id: 'course-1',
        title: 'Course 1',
        enrolledStudents: 150,
        averageRating: 4.5,
        totalReviews: 45,
        completionRate: 0.75
      };

      validateCourseId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'course-1',
        data: () => mockCourse
      });

      const result = await courseServices.getCourseStats('course-1');
      expect(result).toEqual({
        totalStudents: 150,
        averageRating: 4.5,
        totalReviews: 45,
        completionRate: 0.75
      });
    });

    it('should return default stats for missing fields', async () => {
      const mockCourse = {
        id: 'course-1',
        title: 'Course 1'
      };

      validateCourseId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'course-1',
        data: () => mockCourse
      });

      const result = await courseServices.getCourseStats('course-1');
      expect(result).toEqual({
        totalStudents: 0,
        averageRating: 0,
        totalReviews: 0,
        completionRate: 0
      });
    });
  });
});
