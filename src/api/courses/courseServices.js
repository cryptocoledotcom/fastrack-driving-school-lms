// Course Services
// Firestore course CRUD operations

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
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { executeService } from '../base/ServiceWrapper';
import { validateCourseId } from '../../utils/api/validators.js';
import { CourseError, ValidationError } from '../errors/ApiError';
import { getTimestamps, getUpdatedTimestamp } from '../../utils/api/timestampHelper.js';

const COURSES_COLLECTION = 'courses';

// Get all courses
export const getCourses = async () => {
  return executeService(async () => {
    const coursesRef = collection(db, COURSES_COLLECTION);
    const q = query(coursesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const courses = [];
    querySnapshot.forEach((doc) => {
      courses.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return courses;
  }, 'getCourses');
};

// Get course by ID
export const getCourseById = async (courseId) => {
  return executeService(async () => {
    validateCourseId(courseId);
    
    const courseRef = doc(db, COURSES_COLLECTION, courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      throw new CourseError('Course not found', courseId);
    }
    
    return {
      id: courseDoc.id,
      ...courseDoc.data()
    };
  }, 'getCourseById');
};

// Get featured courses
export const getFeaturedCourses = async (limitCount = 6) => {
  return executeService(async () => {
    if (typeof limitCount !== 'number' || limitCount <= 0) {
      throw new ValidationError('limitCount must be a positive number');
    }

    const coursesRef = collection(db, COURSES_COLLECTION);
    const q = query(
      coursesRef, 
      where('featured', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    
    const courses = [];
    querySnapshot.forEach((doc) => {
      courses.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return courses;
  }, 'getFeaturedCourses');
};

// Get courses by category
export const getCoursesByCategory = async (category) => {
  return executeService(async () => {
    if (!category || typeof category !== 'string') {
      throw new ValidationError('category must be a non-empty string');
    }

    const coursesRef = collection(db, COURSES_COLLECTION);
    const q = query(
      coursesRef,
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const courses = [];
    querySnapshot.forEach((doc) => {
      courses.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return courses;
  }, 'getCoursesByCategory');
};

// Create new course
export const createCourse = async (courseData) => {
  return executeService(async () => {
    if (!courseData || typeof courseData !== 'object') {
      throw new ValidationError('courseData must be a non-empty object');
    }
    if (!courseData.title || typeof courseData.title !== 'string') {
      throw new ValidationError('courseData.title must be a non-empty string');
    }
    if (!courseData.description || typeof courseData.description !== 'string') {
      throw new ValidationError('courseData.description must be a non-empty string');
    }

    const coursesRef = collection(db, COURSES_COLLECTION);
    const newCourse = {
      ...courseData,
      ...getTimestamps()
    };
    
    const docRef = await addDoc(coursesRef, newCourse);
    return {
      id: docRef.id,
      ...newCourse
    };
  }, 'createCourse');
};

// Update course
export const updateCourse = async (courseId, updates) => {
  return executeService(async () => {
    validateCourseId(courseId);
    if (!updates || typeof updates !== 'object') {
      throw new ValidationError('updates must be a non-empty object');
    }

    const courseRef = doc(db, COURSES_COLLECTION, courseId);
    const updateData = {
      ...updates,
      ...getUpdatedTimestamp()
    };
    
    await updateDoc(courseRef, updateData);
    
    return await getCourseById(courseId);
  }, 'updateCourse');
};

// Delete course
export const deleteCourse = async (courseId) => {
  return executeService(async () => {
    validateCourseId(courseId);
    
    const courseRef = doc(db, COURSES_COLLECTION, courseId);
    await deleteDoc(courseRef);
  }, 'deleteCourse');
};

// Search courses
export const searchCourses = async (searchTerm) => {
  return executeService(async () => {
    if (!searchTerm || typeof searchTerm !== 'string') {
      throw new ValidationError('searchTerm must be a non-empty string');
    }

    const coursesRef = collection(db, COURSES_COLLECTION);
    const querySnapshot = await getDocs(coursesRef);
    
    const courses = [];
    querySnapshot.forEach((doc) => {
      const courseData = doc.data();
      const searchString = `${courseData.title} ${courseData.description} ${courseData.category}`.toLowerCase();
      
      if (searchString.includes(searchTerm.toLowerCase())) {
        courses.push({
          id: doc.id,
          ...courseData
        });
      }
    });
    
    return courses;
  }, 'searchCourses');
};

// Get course statistics
export const getCourseStats = async (courseId) => {
  return executeService(async () => {
    validateCourseId(courseId);
    
    const courseRef = doc(db, COURSES_COLLECTION, courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      throw new CourseError('Course not found', courseId);
    }
    
    const courseData = courseDoc.data();
    
    return {
      totalStudents: courseData.enrolledStudents || 0,
      averageRating: courseData.averageRating || 0,
      totalReviews: courseData.totalReviews || 0,
      completionRate: courseData.completionRate || 0
    };
  }, 'getCourseStats');
};

const courseServices = {
  getCourses,
  getCourseById,
  getFeaturedCourses,
  getCoursesByCategory,
  createCourse,
  updateCourse,
  deleteCourse,
  searchCourses,
  getCourseStats
};

export default courseServices;
