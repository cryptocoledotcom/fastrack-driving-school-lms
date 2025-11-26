// Progress Services
// User progress tracking operations

import {
  collection,
  doc, 
  getDoc, 
  getDocs,
  updateDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  logLessonCompletion,
  logModuleCompletion
} from './complianceServices';
import { executeService } from './base/ServiceWrapper';
import { ValidationError, ProgressError } from './errors/ApiError';
import { validateUserId, validateCourseId, validateLessonId, validateModuleId } from './validators/validators';

// Reference to user's main progress document
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
        lastAccessedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        enrolled: true
      };

      const mergedData = { ...existingData, [courseId]: courseProgress };
      await setDoc(progressRef, mergedData, { merge: true });
      
      return courseProgress;
    } else {
      const updatedProgress = {
        ...existingData[courseId],
        lastAccessedAt: new Date().toISOString()
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
    if (typeof progressData !== 'object' || !progressData) {
      throw new ValidationError('Progress data must be a valid object');
    }
    
    const progressRef = getUserProgressRef(userId);

    await updateDoc(progressRef, {
      [courseId]: progressData
    });
    return progressData;
  }, 'saveProgress');
};

// Update specific progress fields for a course
export const updateProgress = async (userId, courseId, updates) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    if (typeof updates !== 'object' || !updates) {
      throw new ValidationError('Updates must be a valid object');
    }
    
    const progressRef = getUserProgressRef(userId);
    
    const currentProgress = await getProgress(userId, courseId);
    const mergedProgress = { ...currentProgress, ...updates };
    
    await updateDoc(progressRef, {
      [courseId]: mergedProgress
    });
    return mergedProgress;
  }, 'updateProgress');
};

// Mark lesson as complete
export const markLessonComplete = async (userId, courseId, lessonId) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    validateLessonId(lessonId);
    
    const progress = await getProgress(userId, courseId);
    const lessonProgress = progress.lessonProgress || {};
    
    lessonProgress[lessonId] = {
      completed: true,
      completedAt: new Date().toISOString(),
      attempts: (lessonProgress[lessonId]?.attempts || 0) + 1
    };
    
    const completedLessons = Object.keys(lessonProgress).filter(
      id => lessonProgress[id].completed
    ).length;
    
    const overallProgress = progress.totalLessons > 0 
      ? Math.round((completedLessons / (progress.totalLessons || 1)) * 100)
      : 0;
    
    return await saveProgress(userId, courseId, {
      lessonProgress,
      completedLessons,
      overallProgress,
      lastAccessedAt: new Date().toISOString()
    });
  }, 'markLessonComplete');
};

// Mark lesson as complete with compliance logging
export const markLessonCompleteWithCompliance = async (
  userId,
  courseId,
  lessonId,
  complianceData = {}
) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    validateLessonId(lessonId);
    if (typeof complianceData !== 'object' || complianceData === null) {
      throw new ValidationError('Compliance data must be an object');
    }
    
    const progress = await getProgress(userId, courseId);
    const lessonProgress = progress.lessonProgress || {};
    
    lessonProgress[lessonId] = {
      completed: true,
      completedAt: new Date().toISOString(),
      attempts: (lessonProgress[lessonId]?.attempts || 0) + 1
    };
    
    const completedLessons = Object.keys(lessonProgress).filter(
      id => lessonProgress[id].completed
    ).length;
    
    const overallProgress = progress.totalLessons > 0 
      ? Math.round((completedLessons / (progress.totalLessons || 1)) * 100)
      : 0;
    
    const progressResult = await saveProgress(userId, courseId, {
      lessonProgress,
      completedLessons,
      overallProgress,
      lastAccessedAt: new Date().toISOString()
    });

    if (complianceData.sessionId) {
      try {
        await logLessonCompletion(complianceData.sessionId, {
          lessonId,
          lessonTitle: complianceData.lessonTitle,
          moduleId: complianceData.moduleId,
          moduleTitle: complianceData.moduleTitle,
          sessionTime: complianceData.sessionTime || 0,
          videoProgress: complianceData.videoProgress || null
        });
      } catch (complianceError) {
        // Suppress compliance error - progress still saved
      }
    }

    return progressResult;
  }, 'markLessonCompleteWithCompliance');
};

// Mark module as complete
export const markModuleComplete = async (userId, courseId, moduleId) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    validateModuleId(moduleId);
    
    const progress = await getProgress(userId, courseId);
    const moduleProgress = progress.moduleProgress || {};
    
    moduleProgress[moduleId] = {
      completed: true,
      completedAt: new Date().toISOString()
    };
    
    const completedModules = Object.keys(moduleProgress).filter(
      id => moduleProgress[id].completed
    ).length;
    
    return await saveProgress(userId, courseId, {
      moduleProgress,
      completedModules,
      lastAccessedAt: new Date().toISOString()
    });
  }, 'markModuleComplete');
};

// Mark module as complete with compliance logging
export const markModuleCompleteWithCompliance = async (
  userId,
  courseId,
  moduleId,
  complianceData = {}
) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    validateModuleId(moduleId);
    if (typeof complianceData !== 'object' || complianceData === null) {
      throw new ValidationError('Compliance data must be an object');
    }
    
    const progress = await getProgress(userId, courseId);
    const moduleProgress = progress.moduleProgress || {};
    
    moduleProgress[moduleId] = {
      completed: true,
      completedAt: new Date().toISOString()
    };
    
    const completedModules = Object.keys(moduleProgress).filter(
      id => moduleProgress[id].completed
    ).length;
    
    const progressResult = await saveProgress(userId, courseId, {
      moduleProgress,
      completedModules,
      lastAccessedAt: new Date().toISOString()
    });

    if (complianceData.sessionId) {
      try {
        await logModuleCompletion(complianceData.sessionId, {
          moduleId,
          moduleTitle: complianceData.moduleTitle,
          lessonsCompleted: complianceData.lessonsCompleted || 0,
          sessionTime: complianceData.sessionTime || 0
        });
      } catch (complianceError) {
        // Suppress compliance error - progress still saved
      }
    }

    return progressResult;
  }, 'markModuleCompleteWithCompliance');
};

// Note: enrollInCourse and getUserEnrolledCourses have been moved to enrollmentServices.js
// to maintain clear separation between enrollment management and progress tracking

// Update lesson progress (for video watching, quiz attempts, etc.)
export const updateLessonProgress = async (userId, courseId, lessonId, progressData) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    validateLessonId(lessonId);
    if (typeof progressData !== 'object' || !progressData) {
      throw new ValidationError('Progress data must be a valid object');
    }
    
    const progress = await getProgress(userId, courseId);
    const lessonProgress = progress.lessonProgress || {};
    
    lessonProgress[lessonId] = {
      ...lessonProgress[lessonId],
      ...progressData,
      lastAccessedAt: new Date().toISOString()
    };
    
    return await saveProgress(userId, courseId, {
      lessonProgress,
      lastAccessedAt: new Date().toISOString()
    });
  }, 'updateLessonProgress');
};

// Get user's overall statistics
export const getUserStats = async (userId) => {
  return executeService(async () => {
    validateUserId(userId);
    
    const enrollmentsRef = collection(db, 'users', userId, 'courses');
    const enrollmentsSnapshot = await getDocs(enrollmentsRef);

    if (enrollmentsSnapshot.empty) {
      return {
        enrolledCourses: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        completionRate: 0
      };
    }

    const enrollments = enrollmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    let enrolledCourses = 0;
    let completedCourses = 0;
    let inProgressCourses = 0;
    
    try {
      const progressRef = getUserProgressRef(userId);
      const progressDoc = await getDoc(progressRef);
      const progressData = progressDoc.exists() ? progressDoc.data() : {};

      for (const enrollment of enrollments) {
        if (!enrollment.isComponentOfBundle) {
          enrolledCourses++;
          
          const courseProgress = progressData[enrollment.id];
          
          if (courseProgress) {
            const overallProgress = courseProgress.overallProgress || 0;
            
            if (overallProgress === 100) {
              completedCourses++;
            } else if (overallProgress > 0) {
              inProgressCourses++;
            }
          }
        }
      }
    } catch (err) {
      // Progress data fetch error - continue with available data
    }
    
    return {
      enrolledCourses,
      completedCourses,
      inProgressCourses,
      completionRate: enrolledCourses > 0 
        ? Math.round((completedCourses / enrolledCourses) * 100)
        : 0
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