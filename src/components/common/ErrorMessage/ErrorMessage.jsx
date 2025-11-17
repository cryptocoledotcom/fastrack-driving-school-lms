// ErrorMessage Component
// Error display component

import React from 'react';
import styles from './ErrorMessage.module.css';

const ErrorMessage = ({
  message,
  title = 'Error',
  onRetry,
  onDismiss,
  className = ''
}) => {
  if (!message) return null;

  return (
    <div className={`${styles.errorMessage} ${className}`}>
      <div className={styles.iconWrapper}>
        <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        {(onRetry || onDismiss) && (
          <div className={styles.actions}>
            {onRetry && (
              <button onClick={onRetry} className={styles.retryButton}>
                Try Again
              </button>
            )}
            {onDismiss && (
              <button onClick={onDismiss} className={styles.dismissButton}>
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;