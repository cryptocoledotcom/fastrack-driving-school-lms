// Database Initialization Script
// Run this to populate courses collection and enroll test users

import { 
  doc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';

import { db } from '../config/firebase';
import { COURSE_IDS, COURSE_PRICING } from '../constants/courses';

/**
 * Initialize courses in the courses collection
 */
export const initializeCourses = async () => {
  try {
    console.warn('Initializing courses...');

    const courses = [
      {
        id: COURSE_IDS.ONLINE,
        title: 'Fastrack Online',
        description: '24-hour online driving course. Get your Ohio Driver\'s Permit Online! Work at your own pace with our fully certified BMV program.',
        price: COURSE_PRICING[COURSE_IDS.ONLINE].total,
        category: 'online',
        level: 'Beginner',
        duration: 24,
        totalLessons: 24,
        totalModules: 6,
        featured: true,
        features: [
          '24 hours of online instruction',
          'BMV certified curriculum',
          'Self-paced learning',
          'Instant access after payment',
          'Certificate upon completion'
        ],
        requirements: [
          'Valid learner\'s permit or driver\'s license',
          'Basic understanding of traffic rules',
          'Commitment to complete all modules'
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: COURSE_IDS.BEHIND_WHEEL,
        title: 'Fastrack Behind the Wheel',
        description: '8 hours of one-on-one driving instruction with a certified instructor.',
        price: COURSE_PRICING[COURSE_IDS.BEHIND_WHEEL].total,
        category: 'in-person',
        level: 'Intermediate',
        duration: 8,
        totalLessons: 8,
        totalModules: 1,
        featured: true,
        features: [
          '8 hours of in-person instruction',
          'One-on-one with certified instructor',
          'Flexible scheduling',
          'Real-world driving experience',
          'Certificate upon completion'
        ],
        requirements: [
          'Completed online course',
          'Valid learner\'s permit',
          'Reliable transportation to lessons'
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        id: COURSE_IDS.COMPLETE,
        title: 'Fastrack Complete',
        description: 'Complete package combining both online and behind-the-wheel courses at a discounted rate.',
        price: COURSE_PRICING[COURSE_IDS.COMPLETE].total,
        originalPrice: COURSE_PRICING[COURSE_IDS.COMPLETE].originalPrice,
        discount: COURSE_PRICING[COURSE_IDS.COMPLETE].discount,
        category: 'bundle',
        level: 'Beginner to Advanced',
        duration: 32,
        totalLessons: 32,
        totalModules: 7,
        featured: true,
        popular: true,
        features: [
          'All Online Course features',
          'All Behind-the-Wheel features',
          `Save $${COURSE_PRICING[COURSE_IDS.COMPLETE].discount}!`,
          'Split payment option',
          'Complete driver education'
        ],
        requirements: [
          'Valid learner\'s permit or driver\'s license',
          'Commitment to complete both courses'
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    for (const course of courses) {
      const courseRef = doc(db, 'courses', course.id);
      await setDoc(courseRef, course);
      console.warn(`✓ Created course: ${course.title}`);
    }

    console.warn('✓ All courses initialized successfully!');
    return { success: true, message: 'Courses initialized' };
  } catch (error) {
    console.error('Error initializing courses:', error);
    throw error;
  }
};

/**
 * Enroll a user in all courses (for testing)
 */
export const enrollUserInAllCourses = async (userId, userEmail) => {
  try {
    console.warn(`Enrolling user ${userEmail} in all courses...`);

    const { default: enrollmentServices } = await import('../api/enrollment/enrollmentServices');

    for (const courseId of Object.values(COURSE_IDS)) {
      await enrollmentServices.createEnrollment(userId, courseId, userEmail);
      console.warn(`✓ Enrolled in: ${courseId}`);
    }

    console.warn('✓ User enrolled in all courses successfully!');
    return { success: true, message: 'User enrolled in all courses' };
  } catch (error) {
    console.error('Error enrolling user:', error);
    throw error;
  }
};

/**
 * Run all initialization tasks
 */
export const runInitialization = async () => {
  try {
    console.warn('=== Starting Database Initialization ===');
    
    await initializeCourses();
    
    console.warn('=== Database Initialization Complete ===');
    return { success: true };
  } catch (error) {
    console.error('Initialization failed:', error);
    return { success: false, error };
  }
};

export default {
  initializeCourses,
  enrollUserInAllCourses,
  runInitialization
};