// Payment Services
// Handles payment processing and Stripe integration

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { PAYMENT_STATUS } from '../../constants/courses';
import { executeService } from '../base/ServiceWrapper';
import { ValidationError, PaymentError } from '../errors/ApiError';
import { validateUserId, validateCourseId, validatePaymentData } from '../validators/validators';

const PAYMENTS_COLLECTION = 'payments';

/**
 * Create payment intent (to be called from Cloud Function)
 * This is a placeholder - actual implementation requires Cloud Function
 */
export const createPaymentIntent = async (userId, courseId, amount, paymentType = 'upfront') => {
  return executeService(async () => {
    validatePaymentData(userId, courseId, amount, paymentType);
    
    const paymentData = {
      userId,
      courseId,
      amount,
      paymentType,
      status: PAYMENT_STATUS.PENDING,
      currency: 'usd',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const paymentsRef = collection(db, PAYMENTS_COLLECTION);
    const paymentDoc = await addDoc(paymentsRef, paymentData);

    return {
      id: paymentDoc.id,
      ...paymentData,
      clientSecret: `pi_test_${paymentDoc.id}`
    };
  }, 'createPaymentIntent');
};

/**
 * Create checkout session for Stripe
 */
export const createCheckoutSession = async (userId, courseId, amount, paymentType, userEmail) => {
  return executeService(async () => {
    validatePaymentData(userId, courseId, amount, paymentType);
    if (!userEmail || typeof userEmail !== 'string' || !userEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new ValidationError('User email must be valid format');
    }
    
    const paymentData = {
      userId,
      courseId,
      amount,
      paymentType,
      userEmail,
      status: PAYMENT_STATUS.PENDING,
      currency: 'usd',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const paymentsRef = collection(db, PAYMENTS_COLLECTION);
    const paymentDoc = await addDoc(paymentsRef, paymentData);

    return {
      id: paymentDoc.id,
      sessionId: `cs_test_${paymentDoc.id}`,
      ...paymentData
    };
  }, 'createCheckoutSession');
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (paymentId, status, metadata = {}) => {
  return executeService(async () => {
    if (!paymentId || typeof paymentId !== 'string') {
      throw new ValidationError('Payment ID is required');
    }
    if (!status || typeof status !== 'string') {
      throw new ValidationError('Payment status is required');
    }
    if (typeof metadata !== 'object' || metadata === null) {
      throw new ValidationError('Metadata must be an object');
    }
    
    const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    
    const updates = {
      status,
      ...metadata,
      updatedAt: serverTimestamp()
    };

    if (status === PAYMENT_STATUS.COMPLETED) {
      updates.completedAt = serverTimestamp();
    } else if (status === PAYMENT_STATUS.FAILED) {
      updates.failedAt = serverTimestamp();
    }

    await updateDoc(paymentRef, updates);

    return updates;
  }, 'updatePaymentStatus');
};

/**
 * Get payment by ID
 */
export const getPayment = async (paymentId) => {
  return executeService(async () => {
    if (!paymentId || typeof paymentId !== 'string') {
      throw new ValidationError('Payment ID is required');
    }
    
    const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    const paymentDoc = await getDoc(paymentRef);

    if (!paymentDoc.exists()) {
      throw new PaymentError('Payment not found');
    }

    return {
      id: paymentDoc.id,
      ...paymentDoc.data()
    };
  }, 'getPayment');
};

/**
 * Get user's payment history
 */
export const getUserPayments = async (userId) => {
  return executeService(async () => {
    validateUserId(userId);
    
    const paymentsRef = collection(db, PAYMENTS_COLLECTION);
    const q = query(
      paymentsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const payments = [];
    querySnapshot.forEach((doc) => {
      payments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return payments;
  }, 'getUserPayments');
};

/**
 * Get payments for a specific course enrollment
 */
export const getCoursePayments = async (userId, courseId) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    
    const paymentsRef = collection(db, PAYMENTS_COLLECTION);
    const q = query(
      paymentsRef,
      where('userId', '==', userId),
      where('courseId', '==', courseId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const payments = [];
    querySnapshot.forEach((doc) => {
      payments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return payments;
  }, 'getCoursePayments');
};

/**
 * Process successful payment (called by webhook or after payment confirmation)
 */
export const processSuccessfulPayment = async (paymentId, stripePaymentIntentId = null) => {
  return executeService(async () => {
    if (!paymentId || typeof paymentId !== 'string') {
      throw new ValidationError('Payment ID is required');
    }
    
    const payment = await getPayment(paymentId);
    
    if (payment.status === PAYMENT_STATUS.COMPLETED) {
      return payment;
    }

    const updates = {
      status: PAYMENT_STATUS.COMPLETED,
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (stripePaymentIntentId) {
      updates.stripePaymentIntentId = stripePaymentIntentId;
    }

    await updatePaymentStatus(paymentId, PAYMENT_STATUS.COMPLETED, updates);

    return {
      ...payment,
      ...updates
    };
  }, 'processSuccessfulPayment');
};

/**
 * Handle payment failure
 */
export const handlePaymentFailure = async (paymentId, errorMessage = '') => {
  return executeService(async () => {
    if (!paymentId || typeof paymentId !== 'string') {
      throw new ValidationError('Payment ID is required');
    }
    if (typeof errorMessage !== 'string') {
      throw new ValidationError('Error message must be a string');
    }
    
    const updates = {
      status: PAYMENT_STATUS.FAILED,
      errorMessage,
      failedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await updatePaymentStatus(paymentId, PAYMENT_STATUS.FAILED, updates);

    return updates;
  }, 'handlePaymentFailure');
};

/**
 * Calculate total amount paid for a course
 */
export const calculateTotalPaid = async (userId, courseId) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    
    const payments = await getCoursePayments(userId, courseId);
    
    const totalPaid = payments
      .filter(payment => payment.status === PAYMENT_STATUS.COMPLETED)
      .reduce((sum, payment) => sum + payment.amount, 0);

    return totalPaid;
  }, 'calculateTotalPaid');
};

const paymentServices = {
  createPaymentIntent,
  createCheckoutSession,
  updatePaymentStatus,
  getPayment,
  getUserPayments,
  getCoursePayments,
  processSuccessfulPayment,
  handlePaymentFailure,
  calculateTotalPaid
};

export default paymentServices;