// Course Context
// Manages course data and current course state throughout the app

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getCourses, getCourseById } from '../api/courseServices';
import { getModules } from '../api/moduleServices';
import { getLessons } from '../api/lessonServices';
import { getProgress } from '../api/progressServices';

const CourseContext = createContext();

// Custom hook to use course context
export const useCourse = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
};

export const CourseProvider = ({ children }) => {
  const { user } = useAuth();
  
  // State management
  const [courses, setCourses] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [currentModule, setCurrentModule] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [courseProgress, setCourseProgress] = useState({});

  // Fetch all courses
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const coursesData = await getCourses();
      setCourses(coursesData);
      return coursesData;
    } catch (err) {
      setError(err);
      console.error('Error fetching courses:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch course by ID
  const fetchCourseById = async (courseId) => {
    try {
      setLoading(true);
      setError(null);
      const courseData = await getCourseById(courseId);
      setCurrentCourse(courseData);
      
      // Fetch modules for this course
      const modulesData = await getModules(courseId);
      setModules(modulesData);
      
      return courseData;
    } catch (err) {
      setError(err);
      console.error('Error fetching course:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch lessons for a module
  const fetchLessons = async (courseId, moduleId) => {
    try {
      setLoading(true);
      setError(null);
      const lessonsData = await getLessons(courseId, moduleId);
      setLessons(lessonsData);
      return lessonsData;
    } catch (err) {
      setError(err);
      console.error('Error fetching lessons:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Set current module
  const selectModule = async (moduleId) => {
    const module = modules.find(m => m.id === moduleId);
    if (module) {
      setCurrentModule(module);
      if (currentCourse) {
        await fetchLessons(currentCourse.id, moduleId);
      }
    }
  };

  // Set current lesson
  const selectLesson = (lessonId) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (lesson) {
      setCurrentLesson(lesson);
    }
  };

  // Get next lesson
  const getNextLesson = () => {
    if (!currentLesson || lessons.length === 0) return null;
    
    const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
    if (currentIndex < lessons.length - 1) {
      return lessons[currentIndex + 1];
    }
    return null;
  };

  // Get previous lesson
  const getPreviousLesson = () => {
    if (!currentLesson || lessons.length === 0) return null;
    
    const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
    if (currentIndex > 0) {
      return lessons[currentIndex - 1];
    }
    return null;
  };

  // Fetch user's course progress
  const fetchCourseProgress = async (courseId) => {
    if (!user) return null;
    
    try {
      const progress = await getProgress(user.uid, courseId);
      setCourseProgress(prev => ({
        ...prev,
        [courseId]: progress
      }));
      return progress;
    } catch (err) {
      console.error('Error fetching course progress:', err);
      return null;
    }
  };

  // Get enrolled courses for current user
  const getEnrolledCourses = () => {
    if (!user || !courseProgress) return [];
    
    return courses.filter(course => 
      courseProgress[course.id] && courseProgress[course.id].enrolled
    );
  };

  // Check if user is enrolled in a course
  const isEnrolledInCourse = (courseId) => {
    if (!user || !courseProgress[courseId]) return false;
    return courseProgress[courseId].enrolled === true;
  };

  // Get course completion percentage
  const getCourseCompletionPercentage = (courseId) => {
    if (!courseProgress[courseId]) return 0;
    
    const progress = courseProgress[courseId];
    if (!progress.totalLessons || progress.totalLessons === 0) return 0;
    
    return Math.round((progress.completedLessons / progress.totalLessons) * 100);
  };

  // Clear current course data
  const clearCurrentCourse = () => {
    setCurrentCourse(null);
    setCurrentModule(null);
    setCurrentLesson(null);
    setModules([]);
    setLessons([]);
  };

  // Load courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // Load progress for all courses when user changes
  useEffect(() => {
    if (user && courses.length > 0) {
      courses.forEach(course => {
        fetchCourseProgress(course.id);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, courses]);

  const value = {
    // State
    courses,
    currentCourse,
    currentModule,
    currentLesson,
    modules,
    lessons,
    loading,
    error,
    courseProgress,
    
    // Methods
    fetchCourses,
    fetchCourseById,
    fetchLessons,
    selectModule,
    selectLesson,
    getNextLesson,
    getPreviousLesson,
    fetchCourseProgress,
    getEnrolledCourses,
    isEnrolledInCourse,
    getCourseCompletionPercentage,
    clearCurrentCourse
  };

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
};

export default CourseContext;