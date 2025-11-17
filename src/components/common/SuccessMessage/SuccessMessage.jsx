// SuccessMessage Component
// Success notification component

import React from 'react';
import styles from './SuccessMessage.module.css';

const SuccessMessage = ({
  message,
  title = 'Success',
  onDismiss,
  className = ''
}) => {
  if (!message) return null;

  return (
    <div className={`${styles.successMessage} ${className}`}>
      <div className={styles.iconWrapper}>
        <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className={styles.dismissButton}>
          <svg className={styles.dismissIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SuccessMessage;