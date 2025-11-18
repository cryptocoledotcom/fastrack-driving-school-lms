// PaymentModal Component
// Modal wrapper for payment checkout

import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '../../config/stripe';
import CheckoutForm from './CheckoutForm';
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

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        
        <div className={styles.modalHeader}>
          <h2>Complete Your Payment</h2>
          <p className={styles.courseName}>{courseName}</p>
          <p className={styles.paymentTypeLabel}>
            {paymentType === 'upfront' ? 'Initial Payment' : 'Remaining Balance'}
          </p>
        </div>

        <Elements stripe={stripePromise}>
          <CheckoutForm
            amount={amount}
            courseId={courseId}
            paymentType={paymentType}
            onSuccess={handleSuccess}
            onError={handleError}
            onCancel={onClose}
          />
        </Elements>
      </div>
    </div>
  );
};

export default PaymentModal;