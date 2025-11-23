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

// Reference to user's main progress document
// Path: users/{userId}/userProgress/progress
const getUserProgressRef = (userId) => {
  return doc(db, 'users', userId, 'userProgress', 'progress');
};

// Initialize progress for a course on first access
export const initializeProgress = async (userId, courseId, totalLessons = 0) => {
  try {
    const progressRef = getUserProgressRef(userId);
    const progressDoc = await getDoc(progressRef);

    let existingData = {};
    if (progressDoc.exists()) {
      existingData = progressDoc.data();
    }

    // Only initialize if this course progress doesn't exist yet
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

      // Merge with existing data
      const mergedData = { ...existingData, [courseId]: courseProgress };

      // Use setDoc with merge to create or update the document
      await setDoc(progressRef, mergedData, { merge: true });
      
      return courseProgress;
    } else {
      // Course already initialized, just update lastAccessedAt
      const updatedProgress = {
        ...existingData[courseId],
        lastAccessedAt: new Date().toISOString()
      };
      
      await updateDoc(progressRef, {
        [courseId]: updatedProgress
      });
      
      return updatedProgress;
    }
  } catch (error) {
    console.error('Error initializing progress:', error);
    throw error;
  }
};

// Get user's progress for a specific course
export const getProgress = async (userId, courseId) => {
  try {
    const progressRef = getUserProgressRef(userId);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      // Return default progress if none exists
      return {
        overallProgress: 0,
        completedLessons: 0,
        totalLessons: 0,
        enrolled: false
      };
    }

    // Get the specific course progress from the document
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
  } catch (error) {
    console.error('Error fetching progress:', error);
    throw error;
  }
};

// Save or update user progress for a specific course
export const saveProgress = async (userId, courseId, progressData) => {
  try {
    const progressRef = getUserProgressRef(userId);

    // Update the specific course field within the progress document
    await updateDoc(progressRef, {
      [courseId]: progressData
    });
    return progressData;
  } catch (error) {
    console.error('Error saving progress:', error);
    throw error;
  }
};

// Update specific progress fields for a course
export const updateProgress = async (userId, courseId, updates) => {
  try {
    const progressRef = getUserProgressRef(userId);
    
    // Get current progress and merge updates
    const currentProgress = await getProgress(userId, courseId);
    const mergedProgress = { ...currentProgress, ...updates };
    
    await updateDoc(progressRef, {
      [courseId]: mergedProgress
    });
    return mergedProgress;
  } catch (error) {
    console.error('Error updating progress:', error);
    throw error;
  }
};

// Mark lesson as complete
export const markLessonComplete = async (userId, courseId, lessonId) => {
  try {
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
  } catch (error) {
    console.error('Error marking lesson complete:', error);
    throw error;
  }
};

// Mark lesson as complete with compliance logging
export const markLessonCompleteWithCompliance = async (
  userId,
  courseId,
  lessonId,
  complianceData = {}
) => {
  try {
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
        console.error('Error logging lesson completion to compliance:', complianceError);
      }
    }

    return progressResult;
  } catch (error) {
    console.error('Error marking lesson complete with compliance:', error);
    throw error;
  }
};

// Mark module as complete
export const markModuleComplete = async (userId, courseId, moduleId) => {
  try {
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
  } catch (error) {
    console.error('Error marking module complete:', error);
    throw error;
  }
};

// Mark module as complete with compliance logging
export const markModuleCompleteWithCompliance = async (
  userId,
  courseId,
  moduleId,
  complianceData = {}
) => {
  try {
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
        console.error('Error logging module completion to compliance:', complianceError);
      }
    }

    return progressResult;
  } catch (error) {
    console.error('Error marking module complete with compliance:', error);
    throw error;
  }
};

// Note: enrollInCourse and getUserEnrolledCourses have been moved to enrollmentServices.js
// to maintain clear separation between enrollment management and progress tracking

// Update lesson progress (for video watching, quiz attempts, etc.)
export const updateLessonProgress = async (userId, courseId, lessonId, progressData) => {
  try {
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
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    throw error;
  }
};

// Get user's overall statistics
export const getUserStats = async (userId) => {
  try {
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

    // Get all progress data from the main progress document
    let enrolledCourses = 0;
    let completedCourses = 0;
    let inProgressCourses = 0;
    
    try {
      const progressRef = getUserProgressRef(userId);
      const progressDoc = await getDoc(progressRef);
      const progressData = progressDoc.exists() ? progressDoc.data() : {};

      for (const enrollment of enrollments) {
        // Filter out sub-courses of bundles from stats
        if (!enrollment.isComponentOfBundle) {
          enrolledCourses++;
          
          // Get progress from the centralized progress document
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
      console.error('Error fetching progress data:', err);
    }
    
    return {
      enrolledCourses,
      completedCourses,
      inProgressCourses,
      completionRate: enrolledCourses > 0 
        ? Math.round((completedCourses / enrolledCourses) * 100)
        : 0
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
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