// Progress Services
// User progress tracking operations

import {
  collection,
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Corrected to point to the per-course progress document
const getCourseProgressRef = (userId, courseId) => {
  return doc(db, 'users', userId, 'courses', courseId, 'progress', 'progress');
};

// Get user's progress for a specific course
export const getProgress = async (userId, courseId) => {
  try {
    const progressRef = getCourseProgressRef(userId, courseId);
    const progressDoc = await getDoc(progressRef);

    if (!progressDoc.exists()) {
      // Return default progress if none exists
      return {
        overallProgress: 0,
        completedLessons: 0,
        totalLessons: 0,
        lessonProgress: {},
        moduleProgress: {}
      };
    }

    // The entire document is the progress for this course
    return progressDoc.data();
  } catch (error) {
    console.error('Error fetching progress:', error);
    throw error;
  }
};

// Save or update user progress
export const saveProgress = async (userId, courseId, progressData) => {
  try {
    const progressRef = getCourseProgressRef(userId, courseId);

    // Use setDoc with merge to create or update the course-specific progress
    await setDoc(progressRef, progressData, { merge: true });
    return progressData;
  } catch (error) {
    console.error('Error saving progress:', error);
    throw error;
  }
};

// Update specific progress fields
export const updateProgress = async (userId, courseId, updates) => {
  try {
    const progressRef = getCourseProgressRef(userId, courseId);
    await updateDoc(progressRef, updates);
    return await getProgress(userId, courseId);
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

    const courses = enrollmentsSnapshot.docs.map(doc => doc.data());

    let enrolledCourses = 0;
    let completedCourses = 0;
    let inProgressCourses = 0;
    let totalLessonsCompleted = 0;
    let totalTimeSpent = 0;
    
    Object.values(courses).forEach((course) => {
      // Filter out sub-courses of bundles from stats
      if (!course.isComponentOfBundle) {
        enrolledCourses++;
        if (course.progress === 100) {
          completedCourses++;
        } else if (course.progress > 0) {
          inProgressCourses++;
        }
      }
    });
    
    return {
      enrolledCourses,
      completedCourses,
      inProgressCourses,
      totalLessonsCompleted,
      totalTimeSpent,
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
  getProgress,
  saveProgress,
  updateProgress,
  markLessonComplete,
  markModuleComplete,
  updateLessonProgress,
  getUserStats
};

export default progressServices;