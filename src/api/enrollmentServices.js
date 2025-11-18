// Enrollment Services
// Handles course enrollment operations

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  COURSE_IDS, 
  COURSE_PRICING, 
  ENROLLMENT_STATUS, 
  PAYMENT_STATUS,
  ACCESS_STATUS,
  ADMIN_CONFIG
} from '../constants/courses';

const ENROLLMENTS_COLLECTION = 'enrollments';
const COURSES_COLLECTION = 'courses'; // eslint-disable-line no-unused-vars

/**
 * Create enrollment record for a course
 */
export const createEnrollment = async (userId, courseId, userEmail = '') => {
  try {
    const enrollmentId = `${userId}_${courseId}`;
    const enrollmentRef = doc(db, ENROLLMENTS_COLLECTION, enrollmentId);
    
    // Check if enrollment already exists
    const existingEnrollment = await getDoc(enrollmentRef);
    if (existingEnrollment.exists()) {
      return {
        id: enrollmentId,
        ...existingEnrollment.data()
      };
    }

    const pricing = COURSE_PRICING[courseId];
    if (!pricing) {
      throw new Error('Invalid course ID');
    }

    // Check if user is admin (auto-enroll with full access)
    const isAdmin = ADMIN_CONFIG.AUTO_ENROLL_EMAILS.includes(userEmail.toLowerCase());

    const enrollmentData = {
      userId,
      courseId,
      enrollmentDate: serverTimestamp(),
      status: isAdmin ? ENROLLMENT_STATUS.ACTIVE : ENROLLMENT_STATUS.PENDING_PAYMENT,
      paymentStatus: isAdmin ? PAYMENT_STATUS.COMPLETED : PAYMENT_STATUS.PENDING,
      accessStatus: isAdmin ? ACCESS_STATUS.UNLOCKED : ACCESS_STATUS.LOCKED,
      totalAmount: pricing.total,
      amountPaid: isAdmin ? pricing.total : 0,
      amountDue: isAdmin ? 0 : pricing.upfront || pricing.total,
      upfrontAmount: pricing.upfront,
      remainingAmount: isAdmin ? 0 : pricing.remaining,
      certificateGenerated: false,
      progress: 0,
      lastAccessedAt: null,
      completedAt: null,
      isAdminEnrollment: isAdmin,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(enrollmentRef, enrollmentData);

    return {
      id: enrollmentId,
      ...enrollmentData
    };
  } catch (error) {
    console.error('Error creating enrollment:', error);
    throw error;
  }
};

/**
 * Create enrollments for Complete Package (both courses)
 */
export const createCompletePackageEnrollment = async (userId, userEmail = '') => {
  try {
    const batch = writeBatch(db);
    const isAdmin = ADMIN_CONFIG.AUTO_ENROLL_EMAILS.includes(userEmail.toLowerCase());

    // Create enrollment for Complete Package
    const completeEnrollmentId = `${userId}_${COURSE_IDS.COMPLETE}`;
    const completeEnrollmentRef = doc(db, ENROLLMENTS_COLLECTION, completeEnrollmentId);
    
    const completePricing = COURSE_PRICING[COURSE_IDS.COMPLETE];
    
    const completeEnrollmentData = {
      userId,
      courseId: COURSE_IDS.COMPLETE,
      enrollmentDate: serverTimestamp(),
      status: isAdmin ? ENROLLMENT_STATUS.ACTIVE : ENROLLMENT_STATUS.PENDING_PAYMENT,
      paymentStatus: isAdmin ? PAYMENT_STATUS.COMPLETED : PAYMENT_STATUS.PENDING,
      accessStatus: isAdmin ? ACCESS_STATUS.UNLOCKED : ACCESS_STATUS.LOCKED,
      totalAmount: completePricing.total,
      amountPaid: isAdmin ? completePricing.total : 0,
      amountDue: isAdmin ? 0 : completePricing.upfront,
      upfrontAmount: completePricing.upfront,
      remainingAmount: isAdmin ? 0 : completePricing.remaining,
      certificateGenerated: false,
      progress: 0,
      lastAccessedAt: null,
      completedAt: null,
      isAdminEnrollment: isAdmin,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    batch.set(completeEnrollmentRef, completeEnrollmentData);

    // Create enrollment for Online Course (component)
    const onlineEnrollmentId = `${userId}_${COURSE_IDS.ONLINE}`;
    const onlineEnrollmentRef = doc(db, ENROLLMENTS_COLLECTION, onlineEnrollmentId);
    
    const onlineEnrollmentData = {
      userId,
      courseId: COURSE_IDS.ONLINE,
      enrollmentDate: serverTimestamp(),
      status: isAdmin ? ENROLLMENT_STATUS.ACTIVE : ENROLLMENT_STATUS.PENDING_PAYMENT,
      paymentStatus: isAdmin ? PAYMENT_STATUS.COMPLETED : PAYMENT_STATUS.PENDING,
      accessStatus: isAdmin ? ACCESS_STATUS.UNLOCKED : ACCESS_STATUS.LOCKED,
      totalAmount: 0, // Part of bundle
      amountPaid: 0,
      amountDue: 0,
      parentEnrollmentId: completeEnrollmentId,
      isComponentOfBundle: true,
      progress: 0,
      lastAccessedAt: null,
      completedAt: null,
      isAdminEnrollment: isAdmin,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    batch.set(onlineEnrollmentRef, onlineEnrollmentData);

    // Create enrollment for Behind-the-Wheel Course (component)
    const btwEnrollmentId = `${userId}_${COURSE_IDS.BEHIND_WHEEL}`;
    const btwEnrollmentRef = doc(db, ENROLLMENTS_COLLECTION, btwEnrollmentId);
    
    const btwEnrollmentData = {
      userId,
      courseId: COURSE_IDS.BEHIND_WHEEL,
      enrollmentDate: serverTimestamp(),
      status: isAdmin ? ENROLLMENT_STATUS.ACTIVE : ENROLLMENT_STATUS.PENDING_PAYMENT,
      paymentStatus: isAdmin ? PAYMENT_STATUS.COMPLETED : PAYMENT_STATUS.PENDING,
      accessStatus: isAdmin ? ACCESS_STATUS.UNLOCKED : ACCESS_STATUS.LOCKED,
      totalAmount: 0, // Part of bundle
      amountPaid: 0,
      amountDue: 0,
      parentEnrollmentId: completeEnrollmentId,
      isComponentOfBundle: true,
      certificateGenerated: false,
      progress: 0,
      lastAccessedAt: null,
      completedAt: null,
      isAdminEnrollment: isAdmin,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    batch.set(btwEnrollmentRef, btwEnrollmentData);

    await batch.commit();

    return {
      completePackage: { id: completeEnrollmentId, ...completeEnrollmentData },
      online: { id: onlineEnrollmentId, ...onlineEnrollmentData },
      behindWheel: { id: btwEnrollmentId, ...btwEnrollmentData }
    };
  } catch (error) {
    console.error('Error creating complete package enrollment:', error);
    throw error;
  }
};

/**
 * Get user's enrollment for a specific course
 */
export const getEnrollment = async (userId, courseId) => {
  try {
    const enrollmentId = `${userId}_${courseId}`;
    const enrollmentRef = doc(db, ENROLLMENTS_COLLECTION, enrollmentId);
    const enrollmentDoc = await getDoc(enrollmentRef);

    if (!enrollmentDoc.exists()) {
      return null;
    }

    return {
      id: enrollmentDoc.id,
      ...enrollmentDoc.data()
    };
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    throw error;
  }
};

/**
 * Get all enrollments for a user
 */
export const getUserEnrollments = async (userId) => {
  try {
    const enrollmentsRef = collection(db, ENROLLMENTS_COLLECTION);
    const q = query(enrollmentsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const enrollments = [];
    querySnapshot.forEach((doc) => {
      enrollments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return enrollments;
  } catch (error) {
    console.error('Error fetching user enrollments:', error);
    throw error;
  }
};

/**
 * Update enrollment after payment
 */
export const updateEnrollmentAfterPayment = async (userId, courseId, paymentAmount, paymentType = 'upfront') => {
  try {
    const enrollmentId = `${userId}_${courseId}`;
    const enrollmentRef = doc(db, ENROLLMENTS_COLLECTION, enrollmentId);
    const enrollmentDoc = await getDoc(enrollmentRef);

    if (!enrollmentDoc.exists()) {
      throw new Error('Enrollment not found');
    }

    const enrollment = enrollmentDoc.data();
    const newAmountPaid = (enrollment.amountPaid || 0) + paymentAmount;
    const newAmountDue = enrollment.totalAmount - newAmountPaid;

    let updates = {
      amountPaid: newAmountPaid,
      amountDue: newAmountDue,
      updatedAt: serverTimestamp()
    };

    // Determine payment status
    if (newAmountPaid >= enrollment.totalAmount) {
      updates.paymentStatus = PAYMENT_STATUS.COMPLETED;
      updates.status = ENROLLMENT_STATUS.ACTIVE;
    } else if (newAmountPaid > 0) {
      updates.paymentStatus = PAYMENT_STATUS.PARTIAL;
    }

    // Handle course-specific logic
    if (courseId === COURSE_IDS.ONLINE) {
      // Online course: unlock access after upfront payment
      if (paymentType === 'upfront' && paymentAmount >= COURSE_PRICING[COURSE_IDS.ONLINE].upfront) {
        updates.accessStatus = ACCESS_STATUS.UNLOCKED;
        updates.status = ENROLLMENT_STATUS.ACTIVE;
      }
    } else if (courseId === COURSE_IDS.BEHIND_WHEEL) {
      // Behind-the-wheel: unlock after certificate and payment
      if (enrollment.certificateGenerated && newAmountPaid >= enrollment.totalAmount) {
        updates.accessStatus = ACCESS_STATUS.UNLOCKED;
        updates.status = ENROLLMENT_STATUS.ACTIVE;
      }
    } else if (courseId === COURSE_IDS.COMPLETE) {
      // Complete package: handle split payment
      if (paymentType === 'upfront' && paymentAmount >= COURSE_PRICING[COURSE_IDS.COMPLETE].upfront) {
        // Unlock online course component
        updates.accessStatus = ACCESS_STATUS.UNLOCKED;
        updates.remainingAmount = COURSE_PRICING[COURSE_IDS.COMPLETE].remaining;
        
        // Update online course component enrollment
        const onlineEnrollmentId = `${userId}_${COURSE_IDS.ONLINE}`;
        const onlineEnrollmentRef = doc(db, ENROLLMENTS_COLLECTION, onlineEnrollmentId);
        await updateDoc(onlineEnrollmentRef, {
          accessStatus: ACCESS_STATUS.UNLOCKED,
          status: ENROLLMENT_STATUS.ACTIVE,
          updatedAt: serverTimestamp()
        });
      } else if (paymentType === 'remaining' && newAmountPaid >= enrollment.totalAmount) {
        // Unlock behind-the-wheel component
        const btwEnrollmentId = `${userId}_${COURSE_IDS.BEHIND_WHEEL}`;
        const btwEnrollmentRef = doc(db, ENROLLMENTS_COLLECTION, btwEnrollmentId);
        await updateDoc(btwEnrollmentRef, {
          accessStatus: ACCESS_STATUS.UNLOCKED,
          status: ENROLLMENT_STATUS.ACTIVE,
          updatedAt: serverTimestamp()
        });
      }
    }

    await updateDoc(enrollmentRef, updates);

    return {
      id: enrollmentId,
      ...enrollment,
      ...updates
    };
  } catch (error) {
    console.error('Error updating enrollment after payment:', error);
    throw error;
  }
};

/**
 * Update certificate generation status
 */
export const updateCertificateStatus = async (userId, courseId, certificateGenerated = true) => {
  try {
    const enrollmentId = `${userId}_${courseId}`;
    const enrollmentRef = doc(db, ENROLLMENTS_COLLECTION, enrollmentId);

    const updates = {
      certificateGenerated,
      certificateGeneratedAt: certificateGenerated ? serverTimestamp() : null,
      updatedAt: serverTimestamp()
    };

    // For behind-the-wheel course, update access status
    if (courseId === COURSE_IDS.BEHIND_WHEEL && certificateGenerated) {
      const enrollmentDoc = await getDoc(enrollmentRef);
      if (enrollmentDoc.exists()) {
        const enrollment = enrollmentDoc.data();
        // Only unlock if payment is complete
        if (enrollment.paymentStatus === PAYMENT_STATUS.COMPLETED) {
          updates.accessStatus = ACCESS_STATUS.UNLOCKED;
        } else {
          updates.accessStatus = ACCESS_STATUS.PENDING_CERTIFICATE;
        }
      }
    }

    await updateDoc(enrollmentRef, updates);

    return updates;
  } catch (error) {
    console.error('Error updating certificate status:', error);
    throw error;
  }
};

/**
 * Check if user has access to a course
 */
export const checkCourseAccess = async (userId, courseId) => {
  try {
    const enrollment = await getEnrollment(userId, courseId);
    
    if (!enrollment) {
      return {
        hasAccess: false,
        reason: 'not_enrolled'
      };
    }

    if (enrollment.accessStatus === ACCESS_STATUS.UNLOCKED) {
      return {
        hasAccess: true,
        enrollment
      };
    }

    if (enrollment.accessStatus === ACCESS_STATUS.LOCKED) {
      return {
        hasAccess: false,
        reason: 'payment_required',
        amountDue: enrollment.amountDue,
        enrollment
      };
    }

    if (enrollment.accessStatus === ACCESS_STATUS.PENDING_CERTIFICATE) {
      return {
        hasAccess: false,
        reason: 'certificate_pending',
        enrollment
      };
    }

    return {
      hasAccess: false,
      reason: 'unknown',
      enrollment
    };
  } catch (error) {
    console.error('Error checking course access:', error);
    throw error;
  }
};

/**
 * Auto-enroll admin users in all courses
 */
export const autoEnrollAdmin = async (userId, userEmail) => {
  try {
    if (!ADMIN_CONFIG.AUTO_ENROLL_EMAILS.includes(userEmail.toLowerCase())) {
      return null;
    }

    const enrollments = [];

    // Enroll in all courses
    for (const courseId of Object.values(COURSE_IDS)) {
      const enrollment = await createEnrollment(userId, courseId, userEmail);
      enrollments.push(enrollment);
    }

    return enrollments;
  } catch (error) {
    console.error('Error auto-enrolling admin:', error);
    throw error;
  }
};

const enrollmentServices = {
  createEnrollment,
  createCompletePackageEnrollment,
  getEnrollment,
  getUserEnrollments,
  updateEnrollmentAfterPayment,
  updateCertificateStatus,
  checkCourseAccess,
  autoEnrollAdmin
};

export default enrollmentServices;