import { vi } from 'vitest';

import * as userServices from '../userServices.js';
import * as progressServices from '../progressServices.js';

let firestore;
let _db;
let validateUserId;
let validateCourseId;
let validateLessonId;
let validateModuleId;
let ValidationError;
let _NotFoundError;

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  setDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  writeBatch: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _seconds: 1234567890 })),
  increment: vi.fn((n) => ({ _increment: n })),
  arrayUnion: vi.fn((val) => ({ _arrayUnion: val }))
}));

vi.mock('../../../config/firebase.js', () => ({
  db: {}
}));

vi.mock('../../../utils/api/validators.js', () => ({
  validateUserId: vi.fn(),
  validateCourseId: vi.fn(),
  validateLessonId: vi.fn(),
  validateModuleId: vi.fn()
}));

vi.mock('../../../utils/api/timestampHelper.js', () => ({
  getUpdatedTimestamp: vi.fn(() => ({ updatedAt: new Date().toISOString() }))
}));

vi.mock('../../../constants/userRoles.js', () => ({
  USER_ROLES: {
    STUDENT: 'student',
    INSTRUCTOR: 'instructor',
    DMV_ADMIN: 'dmv_admin',
    SUPER_ADMIN: 'super_admin'
  }
}));

vi.mock('../../errors/ApiError.js', () => ({
  ValidationError: class ValidationError extends Error {
    constructor(message) {
      super(message);
      this.code = 'VALIDATION_ERROR';
    }
  },
  NotFoundError: class NotFoundError extends Error {
    constructor(resource, id) {
      super(`${resource} not found: ${id}`);
      this.code = 'NOT_FOUND';
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
    return await operation();
  })
}));

beforeEach(async () => {
  vi.clearAllMocks();
  firestore = vi.mocked(await import('firebase/firestore'));
  const configModule = await import('../../../config/firebase.js');
  _db = configModule.db;
  const validatorsModule = await import('../../../utils/api/validators.js');
  validateUserId = validatorsModule.validateUserId;
  validateCourseId = validatorsModule.validateCourseId;
  validateLessonId = validatorsModule.validateLessonId;
  validateModuleId = validatorsModule.validateModuleId;
  const errorModule = await import('../../errors/ApiError.js');
  ValidationError = errorModule.ValidationError;
  _NotFoundError = errorModule.NotFoundError;
});

describe('User Services', () => {
  describe('getUser()', () => {
    it('should retrieve user by ID', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', displayName: 'Test User' };
      validateUserId.mockImplementation(() => true);
      const mockDocRef = {};
      firestore.doc.mockReturnValue(mockDocRef);
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'user-1',
        data: () => mockUser
      });

      const result = await userServices.getUser('user-1');
      expect(result).toEqual({ id: 'user-1', ...mockUser });
    });

    it('should throw NotFoundError when user does not exist', async () => {
      validateUserId.mockImplementation(() => true);
      firestore.getDoc.mockResolvedValue({ exists: () => false });

      await expect(userServices.getUser('nonexistent')).rejects.toThrow();
    });

    it('should throw validation error for invalid userId', async () => {
      validateUserId.mockImplementation(() => {
        throw new ValidationError('Invalid user ID');
      });

      await expect(userServices.getUser('invalid')).rejects.toThrow();
    });
  });

  describe('updateProfile()', () => {
    it('should update user profile with valid data', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', displayName: 'Updated' };
      validateUserId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.updateDoc.mockResolvedValue(undefined);
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'user-1',
        data: () => mockUser
      });

      const result = await userServices.updateProfile('user-1', { displayName: 'Updated' });
      expect(result.displayName).toBe('Updated');
    });

    it('should throw validation error for null updates', async () => {
      validateUserId.mockImplementation(() => true);

      await expect(userServices.updateProfile('user-1', null)).rejects.toThrow();
    });

    it('should throw validation error for non-object updates', async () => {
      validateUserId.mockImplementation(() => true);

      await expect(userServices.updateProfile('user-1', 'string')).rejects.toThrow();
    });
  });

  describe('updateUserSettings()', () => {
    it('should update user settings', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', settings: { darkMode: true } };
      validateUserId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.updateDoc.mockResolvedValue(undefined);
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'user-1',
        data: () => mockUser
      });

      const settings = { darkMode: true, notifications: false };
      const result = await userServices.updateUserSettings('user-1', settings);
      expect(result).toBeDefined();
    });

    it('should throw validation error for invalid settings object', async () => {
      validateUserId.mockImplementation(() => true);

      await expect(userServices.updateUserSettings('user-1', null)).rejects.toThrow();
    });
  });

  describe('getUserSettings()', () => {
    it('should return user settings with defaults', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      validateUserId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'user-1',
        data: () => mockUser
      });

      const result = await userServices.getUserSettings('user-1');
      expect(result).toHaveProperty('darkMode');
      expect(result).toHaveProperty('notifications');
    });

    it('should return custom settings if available', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', settings: { darkMode: true } };
      validateUserId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'user-1',
        data: () => mockUser
      });

      const result = await userServices.getUserSettings('user-1');
      expect(result.darkMode).toBe(true);
    });
  });

  describe('getUserCertificates()', () => {
    it('should retrieve user certificates', async () => {
      const mockCertificates = [
        { id: 'cert-1', userId: 'user-1', courseName: 'Course 1' },
        { id: 'cert-2', userId: 'user-1', courseName: 'Course 2' }
      ];
      validateUserId.mockImplementation(() => true);
      firestore.collection.mockReturnValue({});
      firestore.query.mockReturnValue({});
      firestore.getDocs.mockResolvedValue({
        forEach: (callback) => {
          mockCertificates.forEach((cert) => {
            callback({ id: cert.id, data: () => cert });
          });
        }
      });

      const result = await userServices.getUserCertificates('user-1');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no certificates exist', async () => {
      validateUserId.mockImplementation(() => true);
      firestore.collection.mockReturnValue({});
      firestore.query.mockReturnValue({});
      firestore.getDocs.mockResolvedValue({ forEach: vi.fn() });

      const result = await userServices.getUserCertificates('user-1');
      expect(result).toEqual([]);
    });
  });

  describe('updateUserPreferences()', () => {
    it('should update user preferences', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', preferences: { language: 'en' } };
      validateUserId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.updateDoc.mockResolvedValue(undefined);
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'user-1',
        data: () => mockUser
      });

      const result = await userServices.updateUserPreferences('user-1', { language: 'en' });
      expect(result).toBeDefined();
    });

    it('should throw validation error for invalid preferences', async () => {
      validateUserId.mockImplementation(() => true);

      await expect(userServices.updateUserPreferences('user-1', null)).rejects.toThrow();
    });
  });

  describe('getUserRecentActivity()', () => {
    it('should retrieve recent activity for user', async () => {
      const mockActivity = [
        { courseId: 'course-1', lastAccessedAt: new Date().toISOString(), overallProgress: 50 },
        { courseId: 'course-2', lastAccessedAt: new Date().toISOString(), overallProgress: 75 }
      ];
      validateUserId.mockImplementation(() => true);
      firestore.collection.mockReturnValue({});
      firestore.query.mockReturnValue({});
      firestore.getDocs.mockResolvedValue({
        forEach: (callback) => {
          mockActivity.forEach((activity) => {
            callback({ data: () => activity });
          });
        }
      });

      const result = await userServices.getUserRecentActivity('user-1', 10);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw validation error for invalid limit', async () => {
      validateUserId.mockImplementation(() => true);

      await expect(userServices.getUserRecentActivity('user-1', -1)).rejects.toThrow();
    });

    it('should throw validation error for non-number limit', async () => {
      validateUserId.mockImplementation(() => true);

      await expect(userServices.getUserRecentActivity('user-1', 'ten')).rejects.toThrow();
    });
  });

  describe('isUsernameAvailable()', () => {
    it('should return true when username is available', async () => {
      firestore.collection.mockReturnValue({});
      firestore.query.mockReturnValue({});
      firestore.getDocs.mockResolvedValue({ empty: true });

      const result = await userServices.isUsernameAvailable('newuser');
      expect(result).toBe(true);
    });

    it('should return false when username is taken', async () => {
      firestore.collection.mockReturnValue({});
      firestore.query.mockReturnValue({});
      firestore.getDocs.mockResolvedValue({ empty: false });

      const result = await userServices.isUsernameAvailable('takenuser');
      expect(result).toBe(false);
    });

    it('should throw validation error for empty username', async () => {
      await expect(userServices.isUsernameAvailable('')).rejects.toThrow();
    });

    it('should throw validation error for non-string username', async () => {
      await expect(userServices.isUsernameAvailable(123)).rejects.toThrow();
    });
  });

  describe('getUserByUsername()', () => {
    it('should retrieve user by username', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', username: 'testuser' };
      firestore.collection.mockReturnValue({});
      firestore.query.mockReturnValue({});
      firestore.getDocs.mockResolvedValue({
        empty: false,
        docs: [{ id: 'user-1', data: () => mockUser }]
      });

      const result = await userServices.getUserByUsername('testuser');
      expect(result.username).toBe('testuser');
    });

    it('should throw NotFoundError when user not found', async () => {
      firestore.collection.mockReturnValue({});
      firestore.query.mockReturnValue({});
      firestore.getDocs.mockResolvedValue({ empty: true });

      await expect(userServices.getUserByUsername('nonexistent')).rejects.toThrow();
    });

    it('should throw validation error for empty username', async () => {
      await expect(userServices.getUserByUsername('')).rejects.toThrow();
    });
  });

  describe('updateUserRole()', () => {
    it('should update user role', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com', role: 'instructor' };
      validateUserId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.updateDoc.mockResolvedValue(undefined);
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        id: 'user-1',
        data: () => mockUser
      });

      const result = await userServices.updateUserRole('user-1', 'instructor');
      expect(result).toBeDefined();
    });

    it('should throw validation error for empty role', async () => {
      validateUserId.mockImplementation(() => true);

      await expect(userServices.updateUserRole('user-1', '')).rejects.toThrow();
    });

    it('should throw validation error for non-string role', async () => {
      validateUserId.mockImplementation(() => true);

      await expect(userServices.updateUserRole('user-1', 123)).rejects.toThrow();
    });
  });

  describe('getAllStudents()', () => {
    it('should retrieve all students', async () => {
      const mockStudents = [
        { id: 'student-1', email: 'alice@example.com', displayName: 'Alice', role: 'student' },
        { id: 'student-2', email: 'bob@example.com', displayName: 'Bob', role: 'student' }
      ];
      firestore.collection.mockReturnValue({});
      firestore.query.mockReturnValue({});
      firestore.getDocs.mockResolvedValue({
        forEach: (callback) => {
          mockStudents.forEach((student) => {
            callback({ id: student.id, data: () => student });
          });
        }
      });

      const result = await userServices.getAllStudents();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should sort students alphabetically', async () => {
      const mockStudents = [
        { id: 'student-1', email: 'alice@example.com', displayName: 'Zoe', role: 'student' },
        { id: 'student-2', email: 'bob@example.com', displayName: 'Alice', role: 'student' }
      ];
      firestore.collection.mockReturnValue({});
      firestore.query.mockReturnValue({});
      firestore.getDocs.mockResolvedValue({
        forEach: (callback) => {
          mockStudents.forEach((student) => {
            callback({ id: student.id, data: () => student });
          });
        }
      });

      const result = await userServices.getAllStudents();
      expect(result[0].displayName).toBe('Alice');
      expect(result[1].displayName).toBe('Zoe');
    });

    it('should return empty array when no students', async () => {
      firestore.collection.mockReturnValue({});
      firestore.query.mockReturnValue({});
      firestore.getDocs.mockResolvedValue({ forEach: vi.fn() });

      const result = await userServices.getAllStudents();
      expect(result).toEqual([]);
    });
  });
});

describe('Progress Services', () => {
  describe('initializeProgress()', () => {
    it('should initialize course progress for new course', async () => {
      validateUserId.mockImplementation(() => true);
      validateCourseId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.getDoc.mockResolvedValue({ exists: () => false });
      firestore.setDoc.mockResolvedValue(undefined);

      const result = await progressServices.initializeProgress('user-1', 'course-1', 10);
      expect(result).toHaveProperty('overallProgress');
      expect(result).toHaveProperty('completedLessons');
      expect(result).toHaveProperty('totalLessons', 10);
    });

    it('should not reinitialize existing course progress', async () => {
      validateUserId.mockImplementation(() => true);
      validateCourseId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          'course-1': {
            overallProgress: 50,
            completedLessons: 5,
            totalLessons: 10
          }
        })
      });
      firestore.updateDoc.mockResolvedValue(undefined);

      const result = await progressServices.initializeProgress('user-1', 'course-1', 10);
      expect(result).toBeDefined();
    });

    it('should throw validation error for invalid totalLessons', async () => {
      validateUserId.mockImplementation(() => true);
      validateCourseId.mockImplementation(() => true);

      await expect(progressServices.initializeProgress('user-1', 'course-1', -5)).rejects.toThrow();
    });
  });

  describe('getProgress()', () => {
    it('should retrieve course progress', async () => {
      validateUserId.mockImplementation(() => true);
      validateCourseId.mockImplementation(() => true);
      const mockProgress = {
        overallProgress: 50,
        completedLessons: 5,
        totalLessons: 10,
        enrolled: true
      };
      firestore.doc.mockReturnValue({});
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          'course-1': mockProgress
        })
      });

      const result = await progressServices.getProgress('user-1', 'course-1');
      expect(result.overallProgress).toBe(50);
    });

    it('should return default progress when no progress data', async () => {
      validateUserId.mockImplementation(() => true);
      validateCourseId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.getDoc.mockResolvedValue({ exists: () => false });

      const result = await progressServices.getProgress('user-1', 'course-1');
      expect(result.enrolled).toBe(false);
      expect(result.overallProgress).toBe(0);
    });
  });

  describe('saveProgress()', () => {
    it('should save course progress', async () => {
      validateUserId.mockImplementation(() => true);
      validateCourseId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.updateDoc.mockResolvedValue(undefined);

      const progressData = { overallProgress: 75, completedLessons: 7 };
      const result = await progressServices.saveProgress('user-1', 'course-1', progressData);
      expect(result).toEqual(progressData);
    });

    it('should throw validation error for invalid progressData', async () => {
      validateUserId.mockImplementation(() => true);
      validateCourseId.mockImplementation(() => true);

      await expect(progressServices.saveProgress('user-1', 'course-1', null)).rejects.toThrow();
    });
  });

  describe('updateProgress()', () => {
    it('should update specific progress fields', async () => {
      validateUserId.mockImplementation(() => true);
      validateCourseId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.updateDoc.mockResolvedValue(undefined);

      const updates = { overallProgress: 80 };
      const result = await progressServices.updateProgress('user-1', 'course-1', updates);
      expect(result).toEqual(updates);
    });

    it('should throw validation error for empty updates', async () => {
      validateUserId.mockImplementation(() => true);
      validateCourseId.mockImplementation(() => true);

      await expect(progressServices.updateProgress('user-1', 'course-1', null)).rejects.toThrow();
    });
  });

  describe('markLessonComplete()', () => {
    it('should mark lesson as complete', async () => {
      validateUserId.mockImplementation(() => true);
      validateCourseId.mockImplementation(() => true);
      validateLessonId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.updateDoc.mockResolvedValue(undefined);

      const result = await progressServices.markLessonComplete('user-1', 'course-1', 'lesson-1');
      expect(result).toBeDefined();
    });

    it('should throw validation error for invalid lessonId', async () => {
      validateUserId.mockImplementation(() => true);
      validateCourseId.mockImplementation(() => true);
      validateLessonId.mockImplementation(() => {
        throw new ValidationError('Invalid lesson ID');
      });

      await expect(progressServices.markLessonComplete('user-1', 'course-1', 'invalid')).rejects.toThrow();
    });
  });

  describe('markLessonCompleteWithCompliance()', () => {
    it('should mark lesson complete with compliance tracking', async () => {
      validateUserId.mockImplementation(() => true);
      validateCourseId.mockImplementation(() => true);
      validateLessonId.mockImplementation(() => true);
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined)
      };
      firestore.writeBatch.mockReturnValue(mockBatch);
      firestore.doc.mockReturnValue({});
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          'course-1': {
            totalLessons: 10,
            completedLessons: 5,
            lessonProgress: {}
          }
        })
      });

      const complianceData = {
        sessionId: 'session-1',
        lessonTitle: 'Lesson 1',
        moduleId: 'module-1',
        moduleTitle: 'Module 1',
        sessionTime: 3600
      };

      const result = await progressServices.markLessonCompleteWithCompliance(
        'user-1',
        'course-1',
        'lesson-1',
        complianceData
      );
      expect(result).toHaveProperty('lessonId');
      expect(result).toHaveProperty('completedLessons');
    });

    it('should throw validation error for missing sessionId', async () => {
      validateUserId.mockImplementation(() => true);
      validateCourseId.mockImplementation(() => true);
      validateLessonId.mockImplementation(() => true);

      const complianceData = { lessonTitle: 'Lesson 1' };
      await expect(
        progressServices.markLessonCompleteWithCompliance('user-1', 'course-1', 'lesson-1', complianceData)
      ).rejects.toThrow();
    });
  });

  describe('markModuleComplete()', () => {
    it('should mark module as complete', async () => {
      validateUserId.mockImplementation(() => true);
      validateCourseId.mockImplementation(() => true);
      validateModuleId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.updateDoc.mockResolvedValue(undefined);

      const result = await progressServices.markModuleComplete('user-1', 'course-1', 'module-1');
      expect(result).toBeDefined();
    });

    it('should throw validation error for invalid moduleId', async () => {
      validateUserId.mockImplementation(() => true);
      validateCourseId.mockImplementation(() => true);
      validateModuleId.mockImplementation(() => {
        throw new ValidationError('Invalid module ID');
      });

      await expect(progressServices.markModuleComplete('user-1', 'course-1', 'invalid')).rejects.toThrow();
    });
  });

  describe('markModuleCompleteWithCompliance()', () => {
    it('should mark module complete with compliance tracking', async () => {
      validateUserId.mockImplementation(() => true);
      validateCourseId.mockImplementation(() => true);
      validateModuleId.mockImplementation(() => true);
      const mockBatch = {
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined)
      };
      firestore.writeBatch.mockReturnValue(mockBatch);
      firestore.doc.mockReturnValue({});
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          'course-1': {
            moduleProgress: {}
          }
        })
      });

      const complianceData = {
        sessionId: 'session-1',
        moduleTitle: 'Module 1',
        sessionTime: 3600
      };

      const result = await progressServices.markModuleCompleteWithCompliance(
        'user-1',
        'course-1',
        'module-1',
        complianceData
      );
      expect(result).toHaveProperty('moduleId');
    });

    it('should throw validation error for missing sessionId', async () => {
      validateUserId.mockImplementation(() => true);
      validateCourseId.mockImplementation(() => true);
      validateModuleId.mockImplementation(() => true);

      const complianceData = { moduleTitle: 'Module 1' };
      await expect(
        progressServices.markModuleCompleteWithCompliance('user-1', 'course-1', 'module-1', complianceData)
      ).rejects.toThrow();
    });
  });

  describe('updateLessonProgress()', () => {
    it('should update lesson progress', async () => {
      validateUserId.mockImplementation(() => true);
      validateCourseId.mockImplementation(() => true);
      validateLessonId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.updateDoc.mockResolvedValue(undefined);

      const progressData = { videoWatched: 75, quizScore: 90 };
      const result = await progressServices.updateLessonProgress(
        'user-1',
        'course-1',
        'lesson-1',
        progressData
      );
      expect(result).toEqual(progressData);
    });

    it('should throw validation error for invalid progressData', async () => {
      validateUserId.mockImplementation(() => true);
      validateCourseId.mockImplementation(() => true);
      validateLessonId.mockImplementation(() => true);

      await expect(
        progressServices.updateLessonProgress('user-1', 'course-1', 'lesson-1', null)
      ).rejects.toThrow();
    });
  });

  describe('getUserStats()', () => {
    it('should retrieve user stats across courses', async () => {
      validateUserId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          'course-1': {
            enrolled: true,
            completedLessons: 5,
            overallProgress: 50
          },
          'course-2': {
            enrolled: true,
            completedLessons: 8,
            overallProgress: 80
          }
        })
      });

      const result = await progressServices.getUserStats('user-1');
      expect(result).toHaveProperty('totalCoursesEnrolled');
      expect(result).toHaveProperty('totalLessonsCompleted');
      expect(result).toHaveProperty('averageProgress');
    });

    it('should return default stats when no progress data', async () => {
      validateUserId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.getDoc.mockResolvedValue({ exists: () => false });

      const result = await progressServices.getUserStats('user-1');
      expect(result.totalCoursesEnrolled).toBe(0);
      expect(result.averageProgress).toBe(0);
    });

    it('should calculate average progress correctly', async () => {
      validateUserId.mockImplementation(() => true);
      firestore.doc.mockReturnValue({});
      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          'course-1': {
            enrolled: true,
            overallProgress: 60
          },
          'course-2': {
            enrolled: true,
            overallProgress: 40
          }
        })
      });

      const result = await progressServices.getUserStats('user-1');
      expect(result.averageProgress).toBe(50);
    });
  });
});
