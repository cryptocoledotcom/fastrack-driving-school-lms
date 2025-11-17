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
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

const LESSONS_COLLECTION = 'lessons';

// Get all lessons for a module
export const getLessons = async (courseId, moduleId) => {
  try {
    const lessonsRef = collection(db, LESSONS_COLLECTION);
    const q = query(
      lessonsRef,
      where('courseId', '==', courseId),
      where('moduleId', '==', moduleId),
      orderBy('order', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    const lessons = [];
    querySnapshot.forEach((doc) => {
      lessons.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return lessons;
  } catch (error) {
    console.error('Error fetching lessons:', error);
    throw error;
  }
};

// Get lesson by ID
export const getLessonById = async (lessonId) => {
  try {
    const lessonRef = doc(db, LESSONS_COLLECTION, lessonId);
    const lessonDoc = await getDoc(lessonRef);
    
    if (!lessonDoc.exists()) {
      throw new Error('Lesson not found');
    }
    
    return {
      id: lessonDoc.id,
      ...lessonDoc.data()
    };
  } catch (error) {
    console.error('Error fetching lesson:', error);
    throw error;
  }
};

// Get all lessons for a course
export const getAllCourseLessons = async (courseId) => {
  try {
    const lessonsRef = collection(db, LESSONS_COLLECTION);
    const q = query(
      lessonsRef,
      where('courseId', '==', courseId),
      orderBy('order', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    const lessons = [];
    querySnapshot.forEach((doc) => {
      lessons.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return lessons;
  } catch (error) {
    console.error('Error fetching course lessons:', error);
    throw error;
  }
};

// Create new lesson
export const createLesson = async (lessonData) => {
  try {
    const lessonsRef = collection(db, LESSONS_COLLECTION);
    const newLesson = {
      ...lessonData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(lessonsRef, newLesson);
    return {
      id: docRef.id,
      ...newLesson
    };
  } catch (error) {
    console.error('Error creating lesson:', error);
    throw error;
  }
};

// Update lesson
export const updateLesson = async (lessonId, updates) => {
  try {
    const lessonRef = doc(db, LESSONS_COLLECTION, lessonId);
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(lessonRef, updateData);
    
    // Return updated lesson
    return await getLessonById(lessonId);
  } catch (error) {
    console.error('Error updating lesson:', error);
    throw error;
  }
};

// Delete lesson
export const deleteLesson = async (lessonId) => {
  try {
    const lessonRef = doc(db, LESSONS_COLLECTION, lessonId);
    await deleteDoc(lessonRef);
  } catch (error) {
    console.error('Error deleting lesson:', error);
    throw error;
  }
};

// Mark lesson as complete for user
export const markComplete = async (userId, lessonId, courseId) => {
  try {
    const progressRef = collection(db, 'progress');
    const progressData = {
      userId,
      lessonId,
      courseId,
      completed: true,
      completedAt: new Date().toISOString()
    };
    
    await addDoc(progressRef, progressData);
  } catch (error) {
    console.error('Error marking lesson complete:', error);
    throw error;
  }
};

// Reorder lessons
export const reorderLessons = async (moduleId, lessonOrders) => {
  try {
    const updatePromises = lessonOrders.map(({ lessonId, order }) => {
      const lessonRef = doc(db, LESSONS_COLLECTION, lessonId);
      return updateDoc(lessonRef, { 
        order,
        updatedAt: new Date().toISOString()
      });
    });
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error reordering lessons:', error);
    throw error;
  }
};

// Get next lesson
export const getNextLesson = async (currentLessonId) => {
  try {
    const currentLesson = await getLessonById(currentLessonId);
    const lessonsRef = collection(db, LESSONS_COLLECTION);
    const q = query(
      lessonsRef,
      where('moduleId', '==', currentLesson.moduleId),
      where('order', '>', currentLesson.order),
      orderBy('order', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const nextLessonDoc = querySnapshot.docs[0];
    return {
      id: nextLessonDoc.id,
      ...nextLessonDoc.data()
    };
  } catch (error) {
    console.error('Error getting next lesson:', error);
    throw error;
  }
};

// Get previous lesson
export const getPreviousLesson = async (currentLessonId) => {
  try {
    const currentLesson = await getLessonById(currentLessonId);
    const lessonsRef = collection(db, LESSONS_COLLECTION);
    const q = query(
      lessonsRef,
      where('moduleId', '==', currentLesson.moduleId),
      where('order', '<', currentLesson.order),
      orderBy('order', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const prevLessonDoc = querySnapshot.docs[0];
    return {
      id: prevLessonDoc.id,
      ...prevLessonDoc.data()
    };
  } catch (error) {
    console.error('Error getting previous lesson:', error);
    throw error;
  }
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