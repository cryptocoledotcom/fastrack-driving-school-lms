// Lesson Services
// Firestore lesson operations

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where
} from 'firebase/firestore';

import { db } from '../../config/firebase';
import { executeService } from '../base/ServiceWrapper';
import { ValidationError, LessonError } from '../errors/ApiError';
import { validateCourseId, validateModuleId, validateLessonId, validateUserId } from '../../utils/api/validators.js';
import { getTimestamps, getUpdatedTimestamp, getCreatedTimestamp } from '../../utils/api/timestampHelper.js';

const LESSONS_COLLECTION = 'lessons';

// Get all lessons for a module
export const getLessons = async (courseId, moduleId) => {
  return executeService(async () => {
    validateCourseId(courseId);
    validateModuleId(moduleId);
    
    const lessonsRef = collection(db, LESSONS_COLLECTION);
    const q = query(
      lessonsRef,
      where('courseId', '==', courseId),
      where('moduleId', '==', moduleId)
    );
    const querySnapshot = await getDocs(q);
    
    const lessons = [];
    querySnapshot.forEach((doc) => {
      lessons.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
    return lessons;
  }, 'getLessons');
};

// Get lesson by ID
export const getLessonById = async (lessonId) => {
  return executeService(async () => {
    validateLessonId(lessonId);
    
    const lessonRef = doc(db, LESSONS_COLLECTION, lessonId);
    const lessonDoc = await getDoc(lessonRef);
    
    if (!lessonDoc.exists()) {
      throw new LessonError('Lesson not found');
    }
    
    return {
      id: lessonDoc.id,
      ...lessonDoc.data()
    };
  }, 'getLessonById');
};

// Get all lessons for a course
export const getAllCourseLessons = async (courseId) => {
  return executeService(async () => {
    validateCourseId(courseId);
    
    const lessonsRef = collection(db, LESSONS_COLLECTION);
    const q = query(
      lessonsRef,
      where('courseId', '==', courseId)
    );
    const querySnapshot = await getDocs(q);
    
    const lessons = [];
    querySnapshot.forEach((doc) => {
      lessons.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
    return lessons;
  }, 'getAllCourseLessons');
};

// Create new lesson
export const createLesson = async (lessonData) => {
  return executeService(async () => {
    if (typeof lessonData !== 'object' || !lessonData) {
      throw new ValidationError('Lesson data must be a valid object');
    }
    
    const lessonsRef = collection(db, LESSONS_COLLECTION);
    const newLesson = {
      ...lessonData,
      ...getTimestamps()
    };
    
    const docRef = await addDoc(lessonsRef, newLesson);
    return {
      id: docRef.id,
      ...newLesson
    };
  }, 'createLesson');
};

// Update lesson
export const updateLesson = async (lessonId, updates) => {
  return executeService(async () => {
    validateLessonId(lessonId);
    if (typeof updates !== 'object' || !updates) {
      throw new ValidationError('Updates must be a valid object');
    }
    
    const lessonRef = doc(db, LESSONS_COLLECTION, lessonId);
    const updateData = {
      ...updates,
      ...getUpdatedTimestamp()
    };
    
    await updateDoc(lessonRef, updateData);
    
    return await getLessonById(lessonId);
  }, 'updateLesson');
};

// Delete lesson
export const deleteLesson = async (lessonId) => {
  return executeService(async () => {
    validateLessonId(lessonId);
    
    const lessonRef = doc(db, LESSONS_COLLECTION, lessonId);
    await deleteDoc(lessonRef);
  }, 'deleteLesson');
};

// Mark lesson as complete for user
export const markComplete = async (userId, lessonId, courseId) => {
  return executeService(async () => {
    validateUserId(userId);
    validateLessonId(lessonId);
    validateCourseId(courseId);
    
    const progressRef = collection(db, 'progress');
    const progressData = {
      userId,
      lessonId,
      courseId,
      completed: true,
      ...getCreatedTimestamp()
    };
    
    await addDoc(progressRef, progressData);
  }, 'markComplete');
};

// Reorder lessons
export const reorderLessons = async (moduleId, lessonOrders) => {
  return executeService(async () => {
    validateModuleId(moduleId);
    if (!Array.isArray(lessonOrders)) {
      throw new ValidationError('Lesson orders must be an array');
    }
    
    const updatePromises = lessonOrders.map(({ lessonId, order }) => {
      const lessonRef = doc(db, LESSONS_COLLECTION, lessonId);
      return updateDoc(lessonRef, { 
        order,
        ...getUpdatedTimestamp()
      });
    });
    
    await Promise.all(updatePromises);
  }, 'reorderLessons');
};

// Get next lesson
export const getNextLesson = async (currentLessonId) => {
  return executeService(async () => {
    validateLessonId(currentLessonId);
    
    const currentLesson = await getLessonById(currentLessonId);
    const lessonsRef = collection(db, LESSONS_COLLECTION);
    const q = query(
      lessonsRef,
      where('moduleId', '==', currentLesson.moduleId)
    );
    
    const querySnapshot = await getDocs(q);
    
    const lessons = [];
    querySnapshot.forEach((doc) => {
      if ((doc.data().order || 0) > (currentLesson.order || 0)) {
        lessons.push({
          id: doc.id,
          ...doc.data()
        });
      }
    });
    
    if (lessons.length === 0) {
      return null;
    }
    
    lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
    return lessons[0];
  }, 'getNextLesson');
};

// Get previous lesson
export const getPreviousLesson = async (currentLessonId) => {
  return executeService(async () => {
    validateLessonId(currentLessonId);
    
    const currentLesson = await getLessonById(currentLessonId);
    const lessonsRef = collection(db, LESSONS_COLLECTION);
    const q = query(
      lessonsRef,
      where('moduleId', '==', currentLesson.moduleId)
    );
    
    const querySnapshot = await getDocs(q);
    
    const lessons = [];
    querySnapshot.forEach((doc) => {
      if ((doc.data().order || 0) < (currentLesson.order || 0)) {
        lessons.push({
          id: doc.id,
          ...doc.data()
        });
      }
    });
    
    if (lessons.length === 0) {
      return null;
    }
    
    lessons.sort((a, b) => (b.order || 0) - (a.order || 0));
    return lessons[0];
  }, 'getPreviousLesson');
};

const lessonServices = {
  getLessons,
  getLessonById,
  getAllCourseLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  markComplete,
  reorderLessons,
  getNextLesson,
  getPreviousLesson
};

export default lessonServices;
