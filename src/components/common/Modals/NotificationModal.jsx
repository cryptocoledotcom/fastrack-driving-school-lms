// NotificationModal Component
// Info/warning notifications

import React from 'react';
import BaseModal from './BaseModal';
import Button from '../Button/Button';
import styles from './NotificationModal.module.css';

const NotificationModal = ({
  isOpen,
  onClose,
  title = 'Notification',
  message,
  type = 'info',
  buttonText = 'OK'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className={styles.iconSuccess} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={styles.iconWarning} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'error':
        return (
          <svg className={styles.iconError} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className={styles.iconInfo} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
    >
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          {getIcon()}
        </div>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={onClose}
            fullWidth
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default NotificationModal;