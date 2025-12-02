// Progress Services
// User progress tracking operations

import {
  doc, 
  getDoc, 
  updateDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
  increment,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { executeService } from '../base/ServiceWrapper';
import { ValidationError } from '../errors/ApiError';
import { validateUserId, validateCourseId, validateLessonId, validateModuleId } from '../../utils/api/validators.js';

// Reference to user's progress document
// Path: users/{userId}/userProgress/progress
const getUserProgressRef = (userId) => {
  return doc(db, 'users', userId, 'userProgress', 'progress');
};

// Initialize progress for a course on first access
export const initializeProgress = async (userId, courseId, totalLessons = 0) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    if (typeof totalLessons !== 'number' || totalLessons < 0) {
      throw new ValidationError('Total lessons must be a non-negative number');
    }
    
    const progressRef = getUserProgressRef(userId);
    const progressDoc = await getDoc(progressRef);

    let existingData = {};
    if (progressDoc.exists()) {
      existingData = progressDoc.data();
    }

    if (!existingData[courseId]) {
      const courseProgress = {
        overallProgress: 0,
        completedLessons: 0,
        totalLessons: totalLessons,
        lessonProgress: {},
        moduleProgress: {},
        lastAccessedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        enrolled: true
      };

      const mergedData = { ...existingData, [courseId]: courseProgress };
      await setDoc(progressRef, mergedData, { merge: true });
      
      return courseProgress;
    } else {
      const updatedProgress = {
        ...existingData[courseId],
        lastAccessedAt: serverTimestamp()
      };
      
      await updateDoc(progressRef, {
        [courseId]: updatedProgress
      });
      
      return updatedProgress;
    }
  }, 'initializeProgress');
};

// Get user's progress for a specific course
export const getProgress = async (userId, courseId) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    
    const progressRef = getUserProgressRef(userId);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      return {
        overallProgress: 0,
        completedLessons: 0,
        totalLessons: 0,
        enrolled: false
      };
    }

    const courseProgress = progressDoc.data()[courseId];
    
    if (!courseProgress) {
      return {
        overallProgress: 0,
        completedLessons: 0,
        totalLessons: 0,
        enrolled: false
      };
    }

    return courseProgress;
  }, 'getProgress');
};

// Save or update user progress for a specific course
export const saveProgress = async (userId, courseId, progressData) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    if (!progressData || typeof progressData !== 'object') {
      throw new ValidationError('progressData must be a non-empty object');
    }

    const progressRef = getUserProgressRef(userId);
    const updateData = {
      [courseId]: progressData,
      lastModified: serverTimestamp()
    };

    await updateDoc(progressRef, updateData);
    return progressData;
  }, 'saveProgress');
};

// Update specific fields in user progress
export const updateProgress = async (userId, courseId, updates) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    if (!updates || typeof updates !== 'object') {
      throw new ValidationError('updates must be a non-empty object');
    }

    const progressRef = getUserProgressRef(userId);
    const updateData = {};

    for (const [key, value] of Object.entries(updates)) {
      updateData[`${courseId}.${key}`] = value;
    }
    updateData['lastModified'] = serverTimestamp();

    await updateDoc(progressRef, updateData);
    return updates;
  }, 'updateProgress');
};

// Mark a single lesson as complete (without compliance)
export const markLessonComplete = async (userId, courseId, lessonId) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    validateLessonId(lessonId);

    return await saveProgress(userId, courseId, {
      lessonProgress: {
        [lessonId]: {
          completed: true,
          completedAt: serverTimestamp(),
          attempts: 1
        }
      }
    });
  }, 'markLessonComplete');
};

// Mark lesson complete WITH compliance tracking (atomic batch)
// PHASE 1 - Issue #1: Atomic batch transaction
export const markLessonCompleteWithCompliance = async (
  userId,
  courseId,
  lessonId,
  complianceData
) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    validateLessonId(lessonId);

    if (!complianceData || typeof complianceData !== 'object') {
      throw new ValidationError('complianceData must be a non-empty object');
    }

    if (!complianceData.sessionId) {
      throw new ValidationError('complianceData.sessionId is required');
    }

    // Get current progress to calculate new overall progress
    const progressRef = getUserProgressRef(userId);
    const progressDoc = await getDoc(progressRef);
    const progress = progressDoc.exists() ? progressDoc.data()[courseId] || {} : {};
    const lessonProgress = { ...progress.lessonProgress } || {};
    
    // Mark lesson as completed
    lessonProgress[lessonId] = {
      completed: true,
      completedAt: serverTimestamp(),
      attempts: (lessonProgress[lessonId]?.attempts || 0) + 1
    };
    
    // Calculate new overall progress
    const completedLessons = Object.keys(lessonProgress).filter(
      id => lessonProgress[id].completed
    ).length;
    const overallProgress = progress.totalLessons > 0
      ? Math.round((completedLessons / progress.totalLessons) * 100)
      : 0;

    // CREATE ATOMIC BATCH TRANSACTION
    const batch = writeBatch(db);
    
    // Update 1: Progress document
    batch.update(progressRef, {
      [`${courseId}.lessonProgress.${lessonId}.completed`]: true,
      [`${courseId}.lessonProgress.${lessonId}.completedAt`]: serverTimestamp(),
      [`${courseId}.lessonProgress.${lessonId}.attempts`]: increment(1),
      [`${courseId}.completedLessons`]: increment(1),
      [`${courseId}.overallProgress`]: overallProgress,
      [`${courseId}.lastModified`]: serverTimestamp()
    });
    
    // Update 2: Compliance session - append to completionEvents array (SUBCOLLECTION)
    const sessionRef = doc(db, 'users', userId, 'sessions', complianceData.sessionId);
    batch.update(sessionRef, {
      completionEvents: arrayUnion({
        type: 'lesson_completion',
        lessonId,
        lessonTitle: complianceData.lessonTitle,
        moduleId: complianceData.moduleId,
        moduleTitle: complianceData.moduleTitle,
        sessionTime: complianceData.sessionTime,
        videoProgress: complianceData.videoProgress || null,
        completedAt: serverTimestamp(),
        timestamp: serverTimestamp()
      })
    });
    
    // ATOMIC COMMIT: Both succeed or both fail
    await batch.commit();

    return {
      lessonId,
      completedLessons,
      overallProgress,
      sessionTime: complianceData.sessionTime
    };
  }, 'markLessonCompleteWithCompliance');
};

// Mark module as complete (without compliance)
export const markModuleComplete = async (userId, courseId, moduleId) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    validateModuleId(moduleId);

    return await saveProgress(userId, courseId, {
      moduleProgress: {
        [moduleId]: {
          completed: true,
          completedAt: serverTimestamp()
        }
      }
    });
  }, 'markModuleComplete');
};

// Mark module complete WITH compliance tracking (atomic batch)
// PHASE 1 - Issue #1: Atomic batch transaction
export const markModuleCompleteWithCompliance = async (
  userId,
  courseId,
  moduleId,
  complianceData
) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    validateModuleId(moduleId);

    if (!complianceData || typeof complianceData !== 'object') {
      throw new ValidationError('complianceData must be a non-empty object');
    }

    if (!complianceData.sessionId) {
      throw new ValidationError('complianceData.sessionId is required');
    }

    // Get current progress
    const progressRef = getUserProgressRef(userId);

    // CREATE ATOMIC BATCH TRANSACTION
    const batch = writeBatch(db);
    
    // Update 1: Progress document
    batch.update(progressRef, {
      [`${courseId}.moduleProgress.${moduleId}.completed`]: true,
      [`${courseId}.moduleProgress.${moduleId}.completedAt`]: serverTimestamp(),
      [`${courseId}.lastModified`]: serverTimestamp()
    });
    
    // Update 2: Compliance session - append to completionEvents array (SUBCOLLECTION)
    const sessionRef = doc(db, 'users', userId, 'sessions', complianceData.sessionId);
    batch.update(sessionRef, {
      completionEvents: arrayUnion({
        type: 'module_completion',
        moduleId,
        moduleTitle: complianceData.moduleTitle,
        sessionTime: complianceData.sessionTime,
        completedAt: serverTimestamp(),
        timestamp: serverTimestamp()
      })
    });
    
    // ATOMIC COMMIT
    await batch.commit();

    return {
      moduleId,
      sessionTime: complianceData.sessionTime
    };
  }, 'markModuleCompleteWithCompliance');
};

// Update progress for a lesson
export const updateLessonProgress = async (userId, courseId, lessonId, progressData) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    validateLessonId(lessonId);
    if (!progressData || typeof progressData !== 'object') {
      throw new ValidationError('progressData must be a non-empty object');
    }

    const progressRef = getUserProgressRef(userId);
    const updateData = {};

    for (const [key, value] of Object.entries(progressData)) {
      updateData[`${courseId}.lessonProgress.${lessonId}.${key}`] = value;
    }
    updateData[`${courseId}.lastModified`] = serverTimestamp();

    await updateDoc(progressRef, updateData);
    return progressData;
  }, 'updateLessonProgress');
};

// Get user stats across all courses
export const getUserStats = async (userId) => {
  return executeService(async () => {
    validateUserId(userId);

    const progressRef = getUserProgressRef(userId);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      return {
        totalCoursesEnrolled: 0,
        totalLessonsCompleted: 0,
        averageProgress: 0
      };
    }

    const data = progressDoc.data();
    let totalCoursesEnrolled = 0;
    let totalLessonsCompleted = 0;
    let totalProgress = 0;

    for (const courseId in data) {
      if (data[courseId].enrolled) {
        totalCoursesEnrolled++;
        totalLessonsCompleted += data[courseId].completedLessons || 0;
        totalProgress += data[courseId].overallProgress || 0;
      }
    }

    const averageProgress = totalCoursesEnrolled > 0 
      ? Math.round(totalProgress / totalCoursesEnrolled) 
      : 0;

    return {
      totalCoursesEnrolled,
      totalLessonsCompleted,
      averageProgress
    };
  }, 'getUserStats');
};

const progressServices = {
  initializeProgress,
  getProgress,
  saveProgress,
  updateProgress,
  markLessonComplete,
  markLessonCompleteWithCompliance,
  markModuleComplete,
  markModuleCompleteWithCompliance,
  updateLessonProgress,
  getUserStats
};

export default progressServices;
