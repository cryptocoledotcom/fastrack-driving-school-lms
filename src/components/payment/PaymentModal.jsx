// PaymentModal Component
// Modal wrapper for payment checkout

import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '../../config/stripe';
import { COURSE_IDS } from '../../constants/courses';
import CheckoutForm from './CheckoutForm';
import CompletePackageCheckoutForm from './CompletePackageCheckoutForm';
import styles from './PaymentModal.module.css';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  amount, 
  courseId,
  courseName,
  paymentType,
  onSuccess 
}) => {
  if (!isOpen) return null;

  const handleSuccess = (paymentData) => {
    if (onSuccess) {
      onSuccess(paymentData);
    }
    onClose();
  };

  const handleError = (error) => {
    console.error('Payment error:', error);
  };

  const isCompletePackage = courseId === COURSE_IDS.COMPLETE;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        
        {!isCompletePackage && (
          <div className={styles.modalHeader}>
            <h2>Complete Your Payment</h2>
            <p className={styles.courseName}>{courseName}</p>
          </div>
        )}

        <Elements stripe={stripePromise}>
          {isCompletePackage ? (
            <CompletePackageCheckoutForm
              courseId={courseId}
              onSuccess={handleSuccess}
              onError={handleError}
              onCancel={onClose}
            />
          ) : (
            <CheckoutForm
              amount={amount}
              courseId={courseId}
              courseName={courseName}
              paymentType={paymentType}
              onSuccess={handleSuccess}
              onError={handleError}
              onCancel={onClose}
            />
          )}
        </Elements>
      </div>
    </div>
  );
};

export default PaymentModal;