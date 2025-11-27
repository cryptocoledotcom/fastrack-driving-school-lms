import ServiceBase from './base/ServiceBase.js';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { EnrollmentError, ValidationError } from './errors/ApiError.js';
import { 
  COURSE_IDS, 
  COURSE_PRICING, 
  ENROLLMENT_STATUS, 
  PAYMENT_STATUS,
  ACCESS_STATUS,
  ADMIN_CONFIG
} from '../constants/courses.js';

class EnrollmentService extends ServiceBase {
  constructor() {
    super('EnrollmentService');
  }

  async createEnrollment(userId, courseId, userEmail = '') {
    try {
      this.validate.validateUserId(userId);
      this.validate.validateCourseId(courseId);
      if (typeof userEmail !== 'string') {
        throw new ValidationError('userEmail must be a string');
      }

      const enrollmentRef = doc(db, 'users', userId, 'courses', courseId);
      const existingEnrollment = await this.getDoc(`users/${userId}/courses`, courseId);
      
      if (existingEnrollment) {
        return existingEnrollment;
      }

      const pricing = COURSE_PRICING[courseId];
      if (!pricing) {
        throw new EnrollmentError('Invalid course ID', courseId);
      }

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

      await this.setDoc(`users/${userId}/courses`, courseId, enrollmentData);
      this.log(`Created enrollment for user ${userId} in course ${courseId}`);
      
      return {
        id: courseId,
        ...enrollmentData
      };
    } catch (error) {
      this.logError(error, { method: 'createEnrollment', userId, courseId });
      throw error;
    }
  }

  async createCompletePackageEnrollment(userId, userEmail = '') {
    try {
      this.validate.validateUserId(userId);
      if (typeof userEmail !== 'string') {
        throw new ValidationError('userEmail must be a string');
      }

      const batch = writeBatch(db);
      const isAdmin = ADMIN_CONFIG.AUTO_ENROLL_EMAILS.includes(userEmail.toLowerCase());

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

      const onlineEnrollmentRef = doc(db, 'users', userId, 'courses', COURSE_IDS.ONLINE);
      const onlineEnrollmentData = {
        userId,
        courseId: COURSE_IDS.ONLINE,
        enrollmentDate: serverTimestamp(),
        status: isAdmin ? ENROLLMENT_STATUS.ACTIVE : ENROLLMENT_STATUS.PENDING_PAYMENT,
        paymentStatus: isAdmin ? PAYMENT_STATUS.COMPLETED : PAYMENT_STATUS.PENDING,
        accessStatus: isAdmin ? ACCESS_STATUS.UNLOCKED : ACCESS_STATUS.LOCKED,
        totalAmount: 0,
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

      batch.set(onlineEnrollmentRef, onlineEnrollmentData);

      const btwEnrollmentRef = doc(db, 'users', userId, 'courses', COURSE_IDS.BEHIND_WHEEL);
      const btwEnrollmentData = {
        userId,
        courseId: COURSE_IDS.BEHIND_WHEEL,
        enrollmentDate: serverTimestamp(),
        status: isAdmin ? ENROLLMENT_STATUS.ACTIVE : ENROLLMENT_STATUS.PENDING_PAYMENT,
        paymentStatus: isAdmin ? PAYMENT_STATUS.COMPLETED : PAYMENT_STATUS.PENDING,
        accessStatus: isAdmin ? ACCESS_STATUS.UNLOCKED : ACCESS_STATUS.LOCKED,
        totalAmount: 0,
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
      this.log(`Created complete package enrollment for user ${userId}`);

      return {
        completePackage: { id: COURSE_IDS.COMPLETE, ...completeEnrollmentData },
        online: { id: COURSE_IDS.ONLINE, ...onlineEnrollmentData },
        behindWheel: { id: COURSE_IDS.BEHIND_WHEEL, ...btwEnrollmentData }
      };
    } catch (error) {
      this.logError(error, { method: 'createCompletePackageEnrollment', userId });
      throw error;
    }
  }

  async getEnrollment(userId, courseId) {
    try {
      this.validate.validateUserId(userId);
      this.validate.validateCourseId(courseId);

      const enrollment = await this.getDoc(`users/${userId}/courses`, courseId);
      
      if (!enrollment) {
        return null;
      }

      const data = enrollment;
      return {
        id: courseId,
        ...data,
        totalAmount: Number(data.totalAmount ?? 0),
        amountPaid: Number(data.amountPaid ?? 0),
        amountDue: Number(data.amountDue ?? 0)
      };
    } catch (error) {
      if (error.code === 'NOT_FOUND') {
        return null;
      }
      this.logError(error, { method: 'getEnrollment', userId, courseId });
      throw error;
    }
  }

  async getUserEnrollments(userId) {
    try {
      this.validate.validateUserId(userId);
      const enrollments = await this.getCollection(`users/${userId}/courses`);
      
      return enrollments.map(enrollment => ({
        id: enrollment.id,
        ...enrollment,
        totalAmount: Number(enrollment.totalAmount ?? 0),
        amountPaid: Number(enrollment.amountPaid ?? 0),
        amountDue: Number(enrollment.amountDue ?? 0)
      }));
    } catch (error) {
      this.logError(error, { method: 'getUserEnrollments', userId });
      throw error;
    }
  }

  async updateEnrollmentAfterPayment(userId, courseId, paymentAmount, paymentType = 'upfront') {
    try {
      this.validate.validateUserId(userId);
      this.validate.validateCourseId(courseId);

      const enrollment = await this.getEnrollment(userId, courseId);
      if (!enrollment) {
        throw new EnrollmentError('Enrollment not found', courseId);
      }

      const currentAmountPaid = Number(enrollment.amountPaid || 0);
      const currentAmountDue = Number(enrollment.amountDue || 0);
      const newAmountPaid = currentAmountPaid + Number(paymentAmount);
      const newAmountDue = Math.max(0, currentAmountDue - Number(paymentAmount));

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

      await this.updateDoc(`users/${userId}/courses`, courseId, updates);
      this.log(`Updated enrollment after payment: user ${userId}, course ${courseId}, amount ${paymentAmount}`);
      
      return updates;
    } catch (error) {
      this.logError(error, { method: 'updateEnrollmentAfterPayment', userId, courseId });
      throw error;
    }
  }

  async updateCertificateStatus(userId, courseId, certificateGenerated = true) {
    try {
      this.validate.validateUserId(userId);
      this.validate.validateCourseId(courseId);

      const updates = {
        certificateGenerated,
        updatedAt: serverTimestamp()
      };

      await this.updateDoc(`users/${userId}/courses`, courseId, updates);
      this.log(`Updated certificate status for user ${userId} in course ${courseId}`);
      
      return updates;
    } catch (error) {
      this.logError(error, { method: 'updateCertificateStatus', userId, courseId });
      throw error;
    }
  }

  async checkCourseAccess(userId, courseId) {
    try {
      this.validate.validateUserId(userId);
      this.validate.validateCourseId(courseId);

      const enrollment = await this.getEnrollment(userId, courseId);
      if (!enrollment) {
        return { hasAccess: false, reason: 'No enrollment found' };
      }

      const hasAccess = enrollment.accessStatus === ACCESS_STATUS.UNLOCKED;
      const isActive = enrollment.status === ENROLLMENT_STATUS.ACTIVE;
      
      return {
        hasAccess: hasAccess && isActive,
        accessStatus: enrollment.accessStatus,
        enrollmentStatus: enrollment.status,
        paymentStatus: enrollment.paymentStatus
      };
    } catch (error) {
      this.logError(error, { method: 'checkCourseAccess', userId, courseId });
      throw error;
    }
  }

  async autoEnrollAdmin(userId, userEmail) {
    try {
      this.validate.validateUserId(userId);
      if (typeof userEmail !== 'string') {
        throw new ValidationError('userEmail must be a string');
      }

      const isAdmin = ADMIN_CONFIG.AUTO_ENROLL_EMAILS.includes(userEmail.toLowerCase());
      if (!isAdmin) {
        this.log(`User ${userId} email not in admin list, skipping auto-enrollment`);
        return { enrolled: false };
      }

      await this.createCompletePackageEnrollment(userId, userEmail);
      this.log(`Auto-enrolled admin user ${userId}`);
      
      return { enrolled: true };
    } catch (error) {
      this.logError(error, { method: 'autoEnrollAdmin', userId });
      throw error;
    }
  }

  async resetEnrollmentToPending(userId, courseId) {
    try {
      this.validate.validateUserId(userId);
      this.validate.validateCourseId(courseId);

      const updates = {
        status: ENROLLMENT_STATUS.PENDING_PAYMENT,
        accessStatus: ACCESS_STATUS.LOCKED,
        paymentStatus: PAYMENT_STATUS.PENDING,
        amountPaid: 0,
        updatedAt: serverTimestamp()
      };

      await this.updateDoc(`users/${userId}/courses`, courseId, updates);
      this.log(`Reset enrollment to pending for user ${userId}, course ${courseId}`);
      
      return updates;
    } catch (error) {
      this.logError(error, { method: 'resetEnrollmentToPending', userId, courseId });
      throw error;
    }
  }

  async resetUserEnrollmentsToPending(userId) {
    try {
      this.validate.validateUserId(userId);

      const userEnrollments = await this.getUserEnrollments(userId);
      const batch = writeBatch(db);

      const updates = {
        status: ENROLLMENT_STATUS.PENDING_PAYMENT,
        accessStatus: ACCESS_STATUS.LOCKED,
        paymentStatus: PAYMENT_STATUS.PENDING,
        amountPaid: 0,
        updatedAt: serverTimestamp()
      };

      userEnrollments.forEach(enrollment => {
        const ref = doc(db, 'users', userId, 'courses', enrollment.id);
        batch.update(ref, updates);
      });

      await batch.commit();
      this.log(`Reset all enrollments to pending for user ${userId}`);
      
      return { updated: userEnrollments.length };
    } catch (error) {
      this.logError(error, { method: 'resetUserEnrollmentsToPending', userId });
      throw error;
    }
  }

  async getAllUsersWithEnrollments() {
    try {
      const usersCollection = await this.getCollection('users');
      const usersWithEnrollments = [];

      for (const user of usersCollection) {
        const enrollments = await this.getUserEnrollments(user.id);
        if (enrollments && enrollments.length > 0) {
          usersWithEnrollments.push({
            userId: user.id,
            enrollments
          });
        }
      }

      this.log(`Retrieved enrollments for ${usersWithEnrollments.length} users`);
      return usersWithEnrollments;
    } catch (error) {
      this.logError(error, { method: 'getAllUsersWithEnrollments' });
      throw error;
    }
  }

  async createPaidEnrollment(userId, courseId, paidAmount, userEmail = '') {
    try {
      this.validate.validateUserId(userId);
      this.validate.validateCourseId(courseId);
      if (typeof paidAmount !== 'number' || paidAmount <= 0) {
        throw new ValidationError('paidAmount must be a positive number');
      }

      const pricing = COURSE_PRICING[courseId];
      if (!pricing) {
        throw new EnrollmentError('Invalid course ID', courseId);
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
        remainingAmount: Math.max(0, pricing.remaining - Number(paidAmount)),
        certificateGenerated: false,
        progress: 0,
        lastAccessedAt: null,
        completedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await this.setDoc(`users/${userId}/courses`, courseId, enrollmentData);
      this.log(`Created paid enrollment for user ${userId} in course ${courseId}`);
      
      return {
        id: courseId,
        ...enrollmentData
      };
    } catch (error) {
      this.logError(error, { method: 'createPaidEnrollment', userId, courseId });
      throw error;
    }
  }

  async createPaidCompletePackageEnrollment(userId, paidAmount, userEmail = '') {
    try {
      this.validate.validateUserId(userId);
      if (typeof paidAmount !== 'number' || paidAmount <= 0) {
        throw new ValidationError('paidAmount must be a positive number');
      }

      const batch = writeBatch(db);
      const completePricing = COURSE_PRICING[COURSE_IDS.COMPLETE];

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
        remainingAmount: Math.max(0, completePricing.remaining - Number(paidAmount)),
        certificateGenerated: false,
        progress: 0,
        lastAccessedAt: null,
        completedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      batch.set(completeEnrollmentRef, completeEnrollmentData);

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
        certificateGenerated: false,
        progress: 0,
        lastAccessedAt: null,
        completedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      batch.set(onlineEnrollmentRef, onlineEnrollmentData);

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
      this.log(`Created paid complete package enrollment for user ${userId}`);

      return {
        completePackage: { id: COURSE_IDS.COMPLETE, ...completeEnrollmentData },
        online: { id: COURSE_IDS.ONLINE, ...onlineEnrollmentData },
        behindWheel: { id: COURSE_IDS.BEHIND_WHEEL, ...btwEnrollmentData }
      };
    } catch (error) {
      this.logError(error, { method: 'createPaidCompletePackageEnrollment', userId });
      throw error;
    }
  }

  async createPaidCompletePackageSplit(userId, upfrontAmount, userEmail = '') {
    try {
      this.validate.validateUserId(userId);
      if (typeof upfrontAmount !== 'number' || upfrontAmount <= 0) {
        throw new ValidationError('upfrontAmount must be a positive number');
      }

      const batch = writeBatch(db);
      const completePricing = COURSE_PRICING[COURSE_IDS.COMPLETE];

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
        amountDue: 450,
        upfrontAmount: completePricing.upfront,
        remainingAmount: 450,
        paymentPlan: 'split',
        splitPaymentStatus: 'awaiting_certificate',
        certificateGenerated: false,
        progress: 0,
        lastAccessedAt: null,
        completedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      batch.set(completeEnrollmentRef, completeEnrollmentData);

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
        certificateGenerated: false,
        progress: 0,
        lastAccessedAt: null,
        completedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      batch.set(onlineEnrollmentRef, onlineEnrollmentData);

      const btwEnrollmentRef = doc(db, 'users', userId, 'courses', COURSE_IDS.BEHIND_WHEEL);
      const btwEnrollmentData = {
        userId,
        courseId: COURSE_IDS.BEHIND_WHEEL,
        enrollmentDate: serverTimestamp(),
        status: ENROLLMENT_STATUS.PENDING_PAYMENT,
        paymentStatus: PAYMENT_STATUS.PENDING,
        accessStatus: ACCESS_STATUS.LOCKED,
        totalAmount: 450,
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
      this.log(`Created paid split enrollment for user ${userId}`);

      return {
        completePackage: { id: COURSE_IDS.COMPLETE, ...completeEnrollmentData },
        online: { id: COURSE_IDS.ONLINE, ...onlineEnrollmentData },
        behindWheel: { id: COURSE_IDS.BEHIND_WHEEL, ...btwEnrollmentData }
      };
    } catch (error) {
      this.logError(error, { method: 'createPaidCompletePackageSplit', userId });
      throw error;
    }
  }

  async payRemainingBalance(userId, courseId, amountPaid, userEmail = '') {
    try {
      this.validate.validateUserId(userId);
      this.validate.validateCourseId(courseId);
      if (typeof amountPaid !== 'number' || amountPaid <= 0) {
        throw new ValidationError('amountPaid must be a positive number');
      }

      const enrollment = await this.getEnrollment(userId, courseId);
      if (!enrollment) {
        throw new EnrollmentError('Enrollment not found', courseId);
      }

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

      await this.updateDoc(`users/${userId}/courses`, courseId, updates);
      this.log(`Paid remaining balance for user ${userId}, course ${courseId}, amount ${amountPaid}`);
      
      return updates;
    } catch (error) {
      this.logError(error, { method: 'payRemainingBalance', userId, courseId });
      throw error;
    }
  }
}

export default new EnrollmentService();

export const {
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
} = new EnrollmentService();
