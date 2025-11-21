// Enrollment Services
// Handles course enrollment operations using users/{userId}/courses/{courseId} subcollection

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
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

/**
 * Create enrollment record for a course in users/{userId}/courses/{courseId}
 */
export const createEnrollment = async (userId, courseId, userEmail = '') => {
  try {
    // Reference to users/{userId}/courses/{courseId}
    const enrollmentRef = doc(db, 'users', userId, 'courses', courseId);
    
    // Check if enrollment already exists
    const existingEnrollment = await getDoc(enrollmentRef);
    if (existingEnrollment.exists()) {
      return {
        id: courseId,
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
      id: enrollmentRef.id,
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
    const completeEnrollmentRef = doc(db, 'users', userId, 'courses', COURSE_IDS.COMPLETE);
    
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
    const onlineEnrollmentRef = doc(db, 'users', userId, 'courses', COURSE_IDS.ONLINE);
    
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
      parentEnrollmentId: COURSE_IDS.COMPLETE,
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
    const btwEnrollmentRef = doc(db, 'users', userId, 'courses', COURSE_IDS.BEHIND_WHEEL);
    
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
      parentEnrollmentId: COURSE_IDS.COMPLETE,
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
      completePackage: { id: COURSE_IDS.COMPLETE, ...completeEnrollmentData },
      online: { id: COURSE_IDS.ONLINE, ...onlineEnrollmentData },
      behindWheel: { id: COURSE_IDS.BEHIND_WHEEL, ...btwEnrollmentData }
    };
  } catch (error) {
    console.error('Error creating complete package enrollment:', error);
    throw error;
  }
};

/**
 * Get user's enrollment for a specific course from users/{userId}/courses/{courseId}
 */
export const getEnrollment = async (userId, courseId) => {
  try {
    const enrollmentRef = doc(db, 'users', userId, 'courses', courseId);
    const enrollmentDoc = await getDoc(enrollmentRef);

    if (!enrollmentDoc.exists()) {
      return null;
    }

    const data = enrollmentDoc.data();
    return {
      id: enrollmentDoc.id,
      ...data,
      totalAmount: Number(data.totalAmount ?? 0),
      amountPaid: Number(data.amountPaid ?? 0),
      amountDue: Number(data.amountDue ?? 0),
    };
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    throw error;
  }
};

/**
 * Get all enrollments for a user from users/{userId}/courses subcollection
 */
export const getUserEnrollments = async (userId) => {
  try {
    const enrollmentsRef = collection(db, 'users', userId, 'courses');
    const querySnapshot = await getDocs(enrollmentsRef);

    const enrollments = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      const enrollment = {
        id: doc.id,
        ...data,
        totalAmount: Number(data.totalAmount ?? 0),
        amountPaid: Number(data.amountPaid ?? 0),
        amountDue: Number(data.amountDue ?? 0),
      };
      
      enrollments.push(enrollment);
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
    const enrollmentRef = doc(db, 'users', userId, 'courses', courseId);
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
        const onlineEnrollmentRef = doc(db, 'users', userId, 'courses', COURSE_IDS.ONLINE);
        await updateDoc(onlineEnrollmentRef, {
          accessStatus: ACCESS_STATUS.UNLOCKED,
          status: ENROLLMENT_STATUS.ACTIVE,
          updatedAt: serverTimestamp()
        });
      } else if (paymentType === 'remaining' && newAmountPaid >= enrollment.totalAmount) {
        // Unlock behind-the-wheel component
        const btwEnrollmentRef = doc(db, 'users', userId, 'courses', COURSE_IDS.BEHIND_WHEEL);
        await updateDoc(btwEnrollmentRef, {
          accessStatus: ACCESS_STATUS.UNLOCKED,
          status: ENROLLMENT_STATUS.ACTIVE,
          updatedAt: serverTimestamp()
        });
      }
    }

    await updateDoc(enrollmentRef, updates);

    return {
      id: enrollmentRef.id,
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
    const enrollmentRef = doc(db, 'users', userId, 'courses', courseId);

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

/**
 * Reset enrollment to pending payment state (for testing)
 */
export const resetEnrollmentToPending = async (userId, courseId) => {
  try {
    const enrollmentRef = doc(db, 'users', userId, 'courses', courseId);
    const enrollmentDoc = await getDoc(enrollmentRef);

    if (!enrollmentDoc.exists()) {
      throw new Error('Enrollment not found');
    }

    const enrollment = enrollmentDoc.data();
    const pricing = COURSE_PRICING[courseId];

    if (!pricing) {
      throw new Error('Invalid course ID');
    }

    const updates = {
      status: ENROLLMENT_STATUS.PENDING_PAYMENT,
      paymentStatus: PAYMENT_STATUS.PENDING,
      accessStatus: ACCESS_STATUS.LOCKED,
      amountPaid: 0,
      amountDue: pricing.upfront || pricing.total,
      certificateGenerated: false,
      updatedAt: serverTimestamp()
    };

    await updateDoc(enrollmentRef, updates);

    const result = {
      id: enrollmentRef.id,
      ...enrollment,
      ...updates,
      totalAmount: Number(enrollment.totalAmount ?? 0),
      amountPaid: Number(updates.amountPaid ?? (enrollment.amountPaid ?? 0)),
      amountDue: Number(updates.amountDue ?? (enrollment.amountDue ?? 0)),
    };
    return result;
  } catch (error) {
    console.error('Error resetting enrollment:', error);
    throw error;
  }
};

/**
 * Reset all enrollments for a user to pending payment state
 */
export const resetUserEnrollmentsToPending = async (userId) => {
  try {
    const userCoursesRef = collection(db, 'users', userId, 'courses');
    const coursesSnapshot = await getDocs(userCoursesRef);

    const resetEnrollments = [];

    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;
      const resetEnrollment = await resetEnrollmentToPending(userId, courseId);
      resetEnrollments.push(resetEnrollment);
    }

    return resetEnrollments;
  } catch (error) {
    console.error('Error resetting user enrollments:', error);
    throw error;
  }
};

/**
 * Get all users with enrollments (for admin)
 */
export const getAllUsersWithEnrollments = async () => {
  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    const usersWithEnrollments = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      const enrollments = await getUserEnrollments(userId);
      
      if (enrollments.length > 0) {
        usersWithEnrollments.push({
          userId,
          email: userData.email,
          displayName: userData.displayName || '',
          enrollments
        });
      }
    }

    return usersWithEnrollments;
  } catch (error) {
    console.error('Error fetching users with enrollments:', error);
    throw error;
  }
};

/**
 * Create enrollment after successful payment
 * Enrollment is created in ACTIVE/COMPLETED/UNLOCKED state
 */
export const createPaidEnrollment = async (userId, courseId, paidAmount, userEmail = '') => {
  try {
    const pricing = COURSE_PRICING[courseId];
    if (!pricing) {
      throw new Error('Invalid course ID');
    }

    if (courseId === COURSE_IDS.COMPLETE) {
      return await createPaidCompletePackageEnrollment(userId, paidAmount, userEmail);
    }

    const enrollmentRef = doc(db, 'users', userId, 'courses', courseId);
    
    const enrollmentData = {
      userId,
      courseId,
      enrollmentDate: serverTimestamp(),
      status: ENROLLMENT_STATUS.ACTIVE,
      paymentStatus: PAYMENT_STATUS.COMPLETED,
      accessStatus: ACCESS_STATUS.UNLOCKED,
      totalAmount: pricing.total,
      amountPaid: Number(paidAmount),
      amountDue: Math.max(0, pricing.total - Number(paidAmount)),
      upfrontAmount: pricing.upfront,
      remainingAmount: Math.max(0, pricing.remaining - (Number(paidAmount) - pricing.upfront)),
      certificateGenerated: false,
      progress: 0,
      lastAccessedAt: null,
      completedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(enrollmentRef, enrollmentData);

    return {
      id: enrollmentRef.id,
      ...enrollmentData
    };
  } catch (error) {
    console.error('Error creating paid enrollment:', error);
    throw error;
  }
};

/**
 * Create Complete Package enrollment after successful payment
 */
export const createPaidCompletePackageEnrollment = async (userId, paidAmount, userEmail = '') => {
  try {
    const batch = writeBatch(db);
    const completePricing = COURSE_PRICING[COURSE_IDS.COMPLETE];

    // Create enrollment for Complete Package
    const completeEnrollmentRef = doc(db, 'users', userId, 'courses', COURSE_IDS.COMPLETE);
    
    const completeEnrollmentData = {
      userId,
      courseId: COURSE_IDS.COMPLETE,
      enrollmentDate: serverTimestamp(),
      status: ENROLLMENT_STATUS.ACTIVE,
      paymentStatus: PAYMENT_STATUS.COMPLETED,
      accessStatus: ACCESS_STATUS.UNLOCKED,
      totalAmount: completePricing.total,
      amountPaid: Number(paidAmount),
      amountDue: Math.max(0, completePricing.total - Number(paidAmount)),
      upfrontAmount: completePricing.upfront,
      remainingAmount: Math.max(0, completePricing.remaining - (Number(paidAmount) - completePricing.upfront)),
      certificateGenerated: false,
      progress: 0,
      lastAccessedAt: null,
      completedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    batch.set(completeEnrollmentRef, completeEnrollmentData);

    // Create enrollment for Online Course (component) - unlocked via parent
    const onlineEnrollmentRef = doc(db, 'users', userId, 'courses', COURSE_IDS.ONLINE);
    
    const onlineEnrollmentData = {
      userId,
      courseId: COURSE_IDS.ONLINE,
      enrollmentDate: serverTimestamp(),
      status: ENROLLMENT_STATUS.ACTIVE,
      paymentStatus: PAYMENT_STATUS.COMPLETED,
      accessStatus: ACCESS_STATUS.UNLOCKED,
      totalAmount: 0,
      amountPaid: 0,
      amountDue: 0,
      parentEnrollmentId: COURSE_IDS.COMPLETE,
      isComponentOfBundle: true,
      progress: 0,
      lastAccessedAt: null,
      completedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    batch.set(onlineEnrollmentRef, onlineEnrollmentData);

    // Create enrollment for Behind-the-Wheel Course (component) - unlocked via parent
    const btwEnrollmentRef = doc(db, 'users', userId, 'courses', COURSE_IDS.BEHIND_WHEEL);
    
    const btwEnrollmentData = {
      userId,
      courseId: COURSE_IDS.BEHIND_WHEEL,
      enrollmentDate: serverTimestamp(),
      status: ENROLLMENT_STATUS.ACTIVE,
      paymentStatus: PAYMENT_STATUS.COMPLETED,
      accessStatus: ACCESS_STATUS.UNLOCKED,
      totalAmount: 0,
      amountPaid: 0,
      amountDue: 0,
      parentEnrollmentId: COURSE_IDS.COMPLETE,
      isComponentOfBundle: true,
      certificateGenerated: false,
      progress: 0,
      lastAccessedAt: null,
      completedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    batch.set(btwEnrollmentRef, btwEnrollmentData);

    await batch.commit();

    return {
      completePackage: { id: COURSE_IDS.COMPLETE, ...completeEnrollmentData },
      online: { id: COURSE_IDS.ONLINE, ...onlineEnrollmentData },
      behindWheel: { id: COURSE_IDS.BEHIND_WHEEL, ...btwEnrollmentData }
    };
  } catch (error) {
    console.error('Error creating paid complete package enrollment:', error);
    throw error;
  }
};

/**
 * Create Complete Package enrollment with split payment
 * $99.99 now for online, $450 remaining for behind-wheel after certificate
 */
export const createPaidCompletePackageSplit = async (userId, upfrontAmount, userEmail = '') => {
  try {
    const batch = writeBatch(db);
    const completePricing = COURSE_PRICING[COURSE_IDS.COMPLETE];

    // Create enrollment for Complete Package
    const completeEnrollmentRef = doc(db, 'users', userId, 'courses', COURSE_IDS.COMPLETE);
    
    const completeEnrollmentData = {
      userId,
      courseId: COURSE_IDS.COMPLETE,
      enrollmentDate: serverTimestamp(),
      status: ENROLLMENT_STATUS.ACTIVE,
      paymentStatus: PAYMENT_STATUS.PARTIAL,
      accessStatus: ACCESS_STATUS.UNLOCKED,
      totalAmount: completePricing.total,
      amountPaid: Number(upfrontAmount),
      amountDue: 450, // Remaining balance
      upfrontAmount: completePricing.upfront,
      remainingAmount: 450,
      paymentPlan: 'split',
      splitPaymentStatus: 'awaiting_certificate', // Awaiting online certificate completion
      certificateGenerated: false,
      progress: 0,
      lastAccessedAt: null,
      completedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    batch.set(completeEnrollmentRef, completeEnrollmentData);

    // Create enrollment for Online Course (component) - UNLOCKED for payment
    const onlineEnrollmentRef = doc(db, 'users', userId, 'courses', COURSE_IDS.ONLINE);
    
    const onlineEnrollmentData = {
      userId,
      courseId: COURSE_IDS.ONLINE,
      enrollmentDate: serverTimestamp(),
      status: ENROLLMENT_STATUS.ACTIVE,
      paymentStatus: PAYMENT_STATUS.COMPLETED,
      accessStatus: ACCESS_STATUS.UNLOCKED,
      totalAmount: 0,
      amountPaid: 0,
      amountDue: 0,
      parentEnrollmentId: COURSE_IDS.COMPLETE,
      isComponentOfBundle: true,
      progress: 0,
      lastAccessedAt: null,
      completedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    batch.set(onlineEnrollmentRef, onlineEnrollmentData);

    // Create enrollment for Behind-the-Wheel Course (component) - LOCKED until payment
    const btwEnrollmentRef = doc(db, 'users', userId, 'courses', COURSE_IDS.BEHIND_WHEEL);
    
    const btwEnrollmentData = {
      userId,
      courseId: COURSE_IDS.BEHIND_WHEEL,
      enrollmentDate: serverTimestamp(),
      status: ENROLLMENT_STATUS.PENDING_PAYMENT,
      paymentStatus: PAYMENT_STATUS.PENDING,
      accessStatus: ACCESS_STATUS.LOCKED,
      totalAmount: 450, // Remaining balance
      amountPaid: 0,
      amountDue: 450,
      parentEnrollmentId: COURSE_IDS.COMPLETE,
      isComponentOfBundle: true,
      certificateGenerated: false,
      progress: 0,
      lastAccessedAt: null,
      completedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    batch.set(btwEnrollmentRef, btwEnrollmentData);

    await batch.commit();

    return {
      completePackage: { id: COURSE_IDS.COMPLETE, ...completeEnrollmentData },
      online: { id: COURSE_IDS.ONLINE, ...onlineEnrollmentData },
      behindWheel: { id: COURSE_IDS.BEHIND_WHEEL, ...btwEnrollmentData }
    };
  } catch (error) {
    console.error('Error creating split payment complete package enrollment:', error);
    throw error;
  }
};

export const payRemainingBalance = async (userId, courseId, amountPaid, userEmail = '') => {
  try {
    const enrollmentRef = doc(db, 'users', userId, 'courses', courseId);
    const enrollmentDoc = await getDoc(enrollmentRef);

    if (!enrollmentDoc.exists()) {
      throw new Error('Enrollment not found');
    }

    const enrollment = enrollmentDoc.data();
    const newAmountPaid = Number(enrollment.amountPaid || 0) + Number(amountPaid);
    const newAmountDue = Math.max(0, Number(enrollment.amountDue || 0) - Number(amountPaid));

    const updates = {
      amountPaid: newAmountPaid,
      amountDue: newAmountDue,
      paymentStatus: newAmountDue === 0 ? PAYMENT_STATUS.COMPLETED : PAYMENT_STATUS.PARTIAL,
      accessStatus: newAmountDue === 0 ? ACCESS_STATUS.UNLOCKED : ACCESS_STATUS.LOCKED,
      updatedAt: serverTimestamp()
    };

    if (newAmountDue === 0) {
      updates.status = ENROLLMENT_STATUS.ACTIVE;
    }

    await updateDoc(enrollmentRef, updates);

    return updates;
  } catch (error) {
    console.error('Error paying remaining balance:', error);
    throw error;
  }
};

const enrollmentServices = {
  createEnrollment,
  createCompletePackageEnrollment,
  createPaidEnrollment,
  createPaidCompletePackageEnrollment,
  createPaidCompletePackageSplit,
  payRemainingBalance,
  getEnrollment,
  getUserEnrollments,
  updateEnrollmentAfterPayment,
  updateCertificateStatus,
  checkCourseAccess,
  autoEnrollAdmin,
  resetEnrollmentToPending,
  resetUserEnrollmentsToPending,
  getAllUsersWithEnrollments
};

export default enrollmentServices;