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
import { db } from '../config/firebase';

const COURSES_COLLECTION = 'courses';

// Get all courses
export const getCourses = async () => {
  try {
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
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

// Get course by ID
export const getCourseById = async (courseId) => {
  try {
    const courseRef = doc(db, COURSES_COLLECTION, courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      throw new Error('Course not found');
    }
    
    return {
      id: courseDoc.id,
      ...courseDoc.data()
    };
  } catch (error) {
    console.error('Error fetching course:', error);
    throw error;
  }
};

// Get featured courses
export const getFeaturedCourses = async (limitCount = 6) => {
  try {
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
  } catch (error) {
    console.error('Error fetching featured courses:', error);
    throw error;
  }
};

// Get courses by category
export const getCoursesByCategory = async (category) => {
  try {
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
  } catch (error) {
    console.error('Error fetching courses by category:', error);
    throw error;
  }
};

// Create new course
export const createCourse = async (courseData) => {
  try {
    const coursesRef = collection(db, COURSES_COLLECTION);
    const newCourse = {
      ...courseData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(coursesRef, newCourse);
    return {
      id: docRef.id,
      ...newCourse
    };
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

// Update course
export const updateCourse = async (courseId, updates) => {
  try {
    const courseRef = doc(db, COURSES_COLLECTION, courseId);
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(courseRef, updateData);
    
    // Return updated course
    return await getCourseById(courseId);
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
};

// Delete course
export const deleteCourse = async (courseId) => {
  try {
    const courseRef = doc(db, COURSES_COLLECTION, courseId);
    await deleteDoc(courseRef);
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};

// Search courses
export const searchCourses = async (searchTerm) => {
  try {
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
  } catch (error) {
    console.error('Error searching courses:', error);
    throw error;
  }
};

// Get course statistics
export const getCourseStats = async (courseId) => {
  try {
    const courseRef = doc(db, COURSES_COLLECTION, courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      throw new Error('Course not found');
    }
    
    const courseData = courseDoc.data();
    
    return {
      totalStudents: courseData.enrolledStudents || 0,
      averageRating: courseData.averageRating || 0,
      totalReviews: courseData.totalReviews || 0,
      completionRate: courseData.completionRate || 0
    };
  } catch (error) {
    console.error('Error fetching course stats:', error);
    throw error;
  }
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