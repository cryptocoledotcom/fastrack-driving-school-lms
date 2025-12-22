import { useState, useEffect, useLayoutEffect } from 'react';

import Button from '../Button/Button';

import BaseModal from './BaseModal';
import styles from './MandatoryBreakModal.module.css';

const MandatoryBreakModal = ({
  isOpen,
  breakTimeRemaining,
  onBreakComplete,
  error
}) => {
  const validBreakTime = breakTimeRemaining > 0 ? breakTimeRemaining : 600;
  const [displayTime, setDisplayTime] = useState(validBreakTime);
  const [showResumeButton, setShowResumeButton] = useState(false);

  useLayoutEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayTime(0);
      setShowResumeButton(false);
    } else {
      setDisplayTime(validBreakTime);
      setShowResumeButton(false);
    }
  }, [isOpen, validBreakTime]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const interval = setInterval(() => {
      setDisplayTime(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setShowResumeButton(true);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResumeClick = () => {
    onBreakComplete();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => {}}
      title="⏸️ Mandatory Break Required"
      size="medium"
      closeOnOverlayClick={false}
      closeOnEscape={false}
      showCloseButton={false}
    >
      <div className={styles.content}>
        <div className={styles.icon}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className={styles.title}>You've Earned a Break</h2>

        <p className={styles.message}>
          You've been studying for 2 hours. Ohio law requires a 10-minute break before you can continue.
        </p>

        {error && (
          <div className={styles.errorMessage}>
            <strong>⚠️ Break Validation:</strong> {error}
          </div>
        )}

        <p className={styles.compliance}>
          This break helps you learn better and is required by state regulations.
        </p>

        <div className={styles.countdownContainer}>
          <div className={`${styles.countdown} ${showResumeButton ? styles.complete : ''}`}>
            <div className={styles.time}>{formatTime(displayTime)}</div>
            <div className={styles.label}>
              {showResumeButton ? 'Break Complete!' : 'Break Time'}
            </div>
          </div>
        </div>

        <p className={styles.details}>
          {showResumeButton
            ? 'You are ready to resume learning. Click the button below to continue.'
            : `Your break will end in ${formatTime(displayTime)}.`}
        </p>

        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={handleResumeClick}
            disabled={!showResumeButton}
            fullWidth
            className={styles.resumeButton}
          >
            {showResumeButton ? 'Resume Learning' : 'Taking a Break...'}
          </Button>
        </div>

        <p className={styles.note}>
          {showResumeButton
            ? 'You must manually click to resume—your course will not auto-start.'
            : 'You cannot bypass this break. Course content is locked during your break time.'}
        </p>
      </div>
    </BaseModal>
  );
};

export default MandatoryBreakModal;
