// Progress Services
// User progress tracking operations

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

const PROGRESS_COLLECTION = 'progress';

// Get user's progress for a specific course
export const getProgress = async (userId, courseId) => {
  try {
    const progressRef = doc(db, PROGRESS_COLLECTION, `${userId}_${courseId}`);
    const progressDoc = await getDoc(progressRef);
    
    if (!progressDoc.exists()) {
      // Return default progress if none exists
      return {
        userId,
        courseId,
        enrolled: false,
        completedLessons: 0,
        totalLessons: 0,
        completedModules: 0,
        totalModules: 0,
        overallProgress: 0,
        lastAccessedAt: null,
        enrolledAt: null,
        completedAt: null,
        lessonProgress: {},
        moduleProgress: {}
      };
    }
    
    return {
      id: progressDoc.id,
      ...progressDoc.data()
    };
  } catch (error) {
    console.error('Error fetching progress:', error);
    throw error;
  }
};

// Save or update user progress
export const saveProgress = async (userId, courseId, progressData) => {
  try {
    const progressRef = doc(db, PROGRESS_COLLECTION, `${userId}_${courseId}`);
    const data = {
      userId,
      courseId,
      ...progressData,
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(progressRef, data, { merge: true });
    return data;
  } catch (error) {
    console.error('Error saving progress:', error);
    throw error;
  }
};

// Update specific progress fields
export const updateProgress = async (userId, courseId, updates) => {
  try {
    const progressRef = doc(db, PROGRESS_COLLECTION, `${userId}_${courseId}`);
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(progressRef, updateData);
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
      ? Math.round((completedLessons / progress.totalLessons) * 100)
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

// Enroll user in course
export const enrollInCourse = async (userId, courseId, courseData) => {
  try {
    return await saveProgress(userId, courseId, {
      enrolled: true,
      enrolledAt: new Date().toISOString(),
      totalLessons: courseData.totalLessons || 0,
      totalModules: courseData.totalModules || 0,
      completedLessons: 0,
      completedModules: 0,
      overallProgress: 0,
      lessonProgress: {},
      moduleProgress: {}
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    throw error;
  }
};

// Get all user's enrolled courses
export const getUserEnrolledCourses = async (userId) => {
  try {
    const progressRef = collection(db, PROGRESS_COLLECTION);
    const q = query(
      progressRef,
      where('userId', '==', userId),
      where('enrolled', '==', true),
      orderBy('enrolledAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const enrolledCourses = [];
    querySnapshot.forEach((doc) => {
      enrolledCourses.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return enrolledCourses;
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    throw error;
  }
};

// Get user's completed courses
export const getUserCompletedCourses = async (userId) => {
  try {
    const progressRef = collection(db, PROGRESS_COLLECTION);
    const q = query(
      progressRef,
      where('userId', '==', userId),
      where('overallProgress', '==', 100),
      orderBy('completedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const completedCourses = [];
    querySnapshot.forEach((doc) => {
      completedCourses.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return completedCourses;
  } catch (error) {
    console.error('Error fetching completed courses:', error);
    throw error;
  }
};

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
    const progressRef = collection(db, PROGRESS_COLLECTION);
    const q = query(progressRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    let totalCourses = 0;
    let enrolledCourses = 0;
    let completedCourses = 0;
    let totalLessonsCompleted = 0;
    let totalTimeSpent = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      totalCourses++;
      if (data.enrolled) enrolledCourses++;
      if (data.overallProgress === 100) completedCourses++;
      totalLessonsCompleted += data.completedLessons || 0;
      totalTimeSpent += data.timeSpent || 0;
    });
    
    return {
      totalCourses,
      enrolledCourses,
      completedCourses,
      totalLessonsCompleted,
      totalTimeSpent,
      averageProgress: enrolledCourses > 0 
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
  enrollInCourse,
  getUserEnrolledCourses,
  getUserCompletedCourses,
  updateLessonProgress,
  getUserStats
};

export default progressServices;