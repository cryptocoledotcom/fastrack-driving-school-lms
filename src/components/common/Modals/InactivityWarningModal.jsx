import React from 'react';
import BaseModal from './BaseModal';
import Button from '../Button/Button';
import styles from './InactivityWarningModal.module.css';

const InactivityWarningModal = ({
  isOpen,
  secondsRemaining,
  onContinue
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => {}}
      title="Session Timeout Warning"
      size="medium"
      closeOnOverlayClick={false}
      closeOnEscape={false}
      showCloseButton={false}
    >
      <div className={styles.content}>
        <div className={styles.warningIcon}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4v2m0 0v2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className={styles.title}>Are you still there?</h2>

        <p className={styles.message}>
          Your session will expire in <strong>{secondsRemaining} seconds</strong> due to inactivity.
        </p>

        <div className={styles.countdownContainer}>
          <div className={styles.countdown}>
            {secondsRemaining}s
          </div>
        </div>

        <p className={styles.details}>
          To continue your lesson, click the button below. This prevents your learning session from being lost.
        </p>

        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={onContinue}
            fullWidth
            className={styles.continueButton}
          >
            Continue Lesson
          </Button>
        </div>

        <p className={styles.note}>
          If you do not click within {secondsRemaining} seconds, you will be automatically logged out for security purposes.
        </p>
      </div>
    </BaseModal>
  );
};

export default InactivityWarningModal;
