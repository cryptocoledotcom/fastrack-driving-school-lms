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

const PROGRESS_COLLECTION = 'userProgress';

// Updated to match your Firestore structure: users/{userId}/userProgress/progress
const getUserProgressRef = (userId) => {
  return doc(db, 'users', userId, 'userProgress', 'progress');
};

// Get user's progress for a specific course
export const getProgress = async (userId, courseId) => {
  try {
    const progressRef = getUserProgressRef(userId);
    const progressDoc = await getDoc(progressRef);
    
    if (!progressDoc.exists()) {
      // Return default progress if none exists
      return {
        userId,
        courses: {}
      };
    }
    
    const progressData = progressDoc.data();
    const courseProgress = progressData.courses?.[courseId];
    
    if (!courseProgress) {
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
      userId,
      courseId,
      ...courseProgress
    };
  } catch (error) {
    console.error('Error fetching progress:', error);
    throw error;
  }
};

// Save or update user progress
export const saveProgress = async (userId, courseId, progressData) => {
  try {
    const progressRef = getUserProgressRef(userId);
    const data = {
      [`courses.${courseId}`]: {
        ...progressData,
        updatedAt: new Date().toISOString()
      }
    };
    
    await setDoc(progressRef, data, { merge: true });
    return progressData;
  } catch (error) {
    console.error('Error saving progress:', error);
    throw error;
  }
};

// Update specific progress fields
export const updateProgress = async (userId, courseId, updates) => {
  try {
    const progressRef = getUserProgressRef(userId);
    const updateData = {
      [`courses.${courseId}`]: {
        ...updates,
        updatedAt: new Date().toISOString()
      }
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

// Enroll user in course - creates entry in users/{userId}/courses/{courseId}
export const enrollInCourse = async (userId, courseId, courseData) => {
  try {
    // Create entry in users/{userId}/courses/{courseId}
    const userCourseRef = doc(db, 'users', userId, 'courses', courseId);
    const enrollmentData = {
      courseId,
      courseName: courseData.title || '',
      enrolled: true,
      enrolledAt: new Date().toISOString(),
      status: 'active'
    };
    
    await setDoc(userCourseRef, enrollmentData);
    
    // Initialize progress in users/{userId}/userProgress/progress
    await saveProgress(userId, courseId, {
      enrolled: true,
      enrolledAt: new Date().toISOString(),
      totalLessons: courseData.totalLessons || 0,
      totalModules: courseData.totalModules || 0,
      completedLessons: 0,
      completedModules: 0,
      overallProgress: 0,
      lessonProgress: {},
      moduleProgress: {},
      timeSpent: 0
    });
    
    return enrollmentData;
  } catch (error) {
    console.error('Error enrolling in course:', error);
    throw error;
  }
};

// Get all user's enrolled courses from users/{userId}/courses subcollection
export const getUserEnrolledCourses = async (userId) => {
  try {
    const userCoursesRef = collection(db, 'users', userId, 'courses');
    const querySnapshot = await getDocs(userCoursesRef);
    
    const enrolledCourses = [];
    querySnapshot.forEach((doc) => {
      enrolledCourses.push({
        courseId: doc.id,
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
      ...progress,
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
    const progressRef = getUserProgressRef(userId);
    const progressDoc = await getDoc(progressRef);
    
    if (!progressDoc.exists()) {
      return {
        totalCourses: 0,
        enrolledCourses: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        totalLessonsCompleted: 0,
        totalTimeSpent: 0,
        completionRate: 0
      };
    }
    
    const progressData = progressDoc.data();
    const courses = progressData.courses || {};
    
    let enrolledCourses = 0;
    let completedCourses = 0;
    let inProgressCourses = 0;
    let totalLessonsCompleted = 0;
    let totalTimeSpent = 0;
    
    Object.values(courses).forEach((course) => {
      if (course.enrolled) {
        enrolledCourses++;
        if (course.overallProgress === 100) {
          completedCourses++;
        } else if (course.overallProgress > 0) {
          inProgressCourses++;
        }
        totalLessonsCompleted += course.completedLessons || 0;
        totalTimeSpent += course.timeSpent || 0;
      }
    });
    
    return {
      totalCourses: enrolledCourses,
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
  enrollInCourse,
  getUserEnrolledCourses,
  getUserCompletedCourses,
  updateLessonProgress,
  getUserStats
};

export default progressServices;