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
import { db } from '../config/firebase';
import { PAYMENT_STATUS } from '../constants/courses';

const PAYMENTS_COLLECTION = 'payments';

/**
 * Create payment intent (to be called from Cloud Function)
 * This is a placeholder - actual implementation requires Cloud Function
 */
export const createPaymentIntent = async (userId, courseId, amount, paymentType = 'upfront') => {
  try {
    // In production, this should call a Cloud Function that creates a Stripe Payment Intent
    // For now, we'll create a payment record
    const paymentData = {
      userId,
      courseId,
      amount,
      paymentType, // 'upfront' or 'remaining'
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
      // In production, this would include clientSecret from Stripe
      clientSecret: `pi_test_${paymentDoc.id}`
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

/**
 * Create checkout session for Stripe
 */
export const createCheckoutSession = async (userId, courseId, amount, paymentType, userEmail) => {
  try {
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

    // In production, call Cloud Function to create Stripe Checkout Session
    // For now, return mock data
    return {
      id: paymentDoc.id,
      sessionId: `cs_test_${paymentDoc.id}`,
      ...paymentData
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (paymentId, status, metadata = {}) => {
  try {
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
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

/**
 * Get payment by ID
 */
export const getPayment = async (paymentId) => {
  try {
    const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    const paymentDoc = await getDoc(paymentRef);

    if (!paymentDoc.exists()) {
      throw new Error('Payment not found');
    }

    return {
      id: paymentDoc.id,
      ...paymentDoc.data()
    };
  } catch (error) {
    console.error('Error fetching payment:', error);
    throw error;
  }
};

/**
 * Get user's payment history
 */
export const getUserPayments = async (userId) => {
  try {
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
  } catch (error) {
    console.error('Error fetching user payments:', error);
    throw error;
  }
};

/**
 * Get payments for a specific course enrollment
 */
export const getCoursePayments = async (userId, courseId) => {
  try {
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
  } catch (error) {
    console.error('Error fetching course payments:', error);
    throw error;
  }
};

/**
 * Process successful payment (called by webhook or after payment confirmation)
 */
export const processSuccessfulPayment = async (paymentId, stripePaymentIntentId = null) => {
  try {
    const payment = await getPayment(paymentId);
    
    if (payment.status === PAYMENT_STATUS.COMPLETED) {
      return payment; // Already processed
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
  } catch (error) {
    console.error('Error processing successful payment:', error);
    throw error;
  }
};

/**
 * Handle payment failure
 */
export const handlePaymentFailure = async (paymentId, errorMessage = '') => {
  try {
    const updates = {
      status: PAYMENT_STATUS.FAILED,
      errorMessage,
      failedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await updatePaymentStatus(paymentId, PAYMENT_STATUS.FAILED, updates);

    return updates;
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
};

/**
 * Calculate total amount paid for a course
 */
export const calculateTotalPaid = async (userId, courseId) => {
  try {
    const payments = await getCoursePayments(userId, courseId);
    
    const totalPaid = payments
      .filter(payment => payment.status === PAYMENT_STATUS.COMPLETED)
      .reduce((sum, payment) => sum + payment.amount, 0);

    return totalPaid;
  } catch (error) {
    console.error('Error calculating total paid:', error);
    throw error;
  }
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