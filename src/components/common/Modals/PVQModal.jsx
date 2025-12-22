import { useState, useLayoutEffect } from 'react';

import Button from '../Button/Button';
import Input from '../Input/Input';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';

import BaseModal from './BaseModal';
import styles from './PVQModal.module.css';

const PVQModal = ({
  isOpen,
  onClose,
  pvqQuestion,
  onSubmit,
  isSubmitting = false,
  error = null
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [timeStarted, setTimeStarted] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useLayoutEffect(() => {
    if (isOpen && pvqQuestion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeStarted(Date.now());
      setUserAnswer('');
      setSubmitError(null);
    }
  }, [isOpen, pvqQuestion]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userAnswer.trim()) {
      setSubmitError('Please provide an answer');
      return;
    }

    const timeToAnswer = Math.round((Date.now() - timeStarted) / 1000);

    try {
      await onSubmit({
        answer: userAnswer.trim(),
        timeToAnswer
      });
    } catch (err) {
      setSubmitError(err.message || 'Error submitting answer');
    }
  };

  const handleSkip = () => {
    setUserAnswer('');
    setSubmitError(null);
    onClose();
  };

  if (!pvqQuestion) {
    return null;
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleSkip}
      title="Identity Verification"
      size="medium"
      closeOnOverlayClick={false}
      closeOnEscape={false}
      showCloseButton={false}
    >
      <div className={styles.pvqContent}>
        <div className={styles.warningBanner}>
          <svg className={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>This is a required compliance check. Please answer honestly.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.questionSection}>
            <label className={styles.questionLabel}>
              {pvqQuestion.question}
            </label>
            <Input
              type="text"
              placeholder="Your answer"
              value={userAnswer}
              onChange={(e) => {
                setUserAnswer(e.target.value);
                setSubmitError(null);
              }}
              disabled={isSubmitting}
              className={styles.answerInput}
              autoFocus
            />
          </div>

          {(submitError || error) && (
            <div className={styles.errorMessage}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {submitError || error}
            </div>
          )}

          <div className={styles.actions}>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !userAnswer.trim()}
              fullWidth
            >
              {isSubmitting ? <LoadingSpinner size="small" /> : 'Submit Answer'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSkip}
              disabled={isSubmitting}
              fullWidth
            >
              Skip for Now
            </Button>
          </div>

          <p className={styles.note}>
            This verification helps ensure course integrity. Your response is recorded for compliance purposes.
          </p>
        </form>
      </div>
    </BaseModal>
  );
};

export default PVQModal;
