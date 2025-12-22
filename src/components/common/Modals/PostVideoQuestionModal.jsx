import { useState, useEffect, useRef } from 'react';

import Button from '../Button/Button';

import styles from './PostVideoQuestionModal.module.css';

const PostVideoQuestionModal = ({
  isOpen,
  question,
  onAnswerSubmit,
  onComplete,
  loading,
  error,
  persistState = true,
  closeOnOverlayClick = false
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitTimeoutRef = useRef(null);

  const storageKey = `pvq-state-${question?.id}`;

  useEffect(() => {
    if (!isOpen || !question) return;

    if (persistState) {
      const savedState = sessionStorage.getItem(storageKey);
      if (savedState) {
        try {
          const { selectedAnswer: saved, feedback: savedFeedback, submitted: savedSubmitted } = JSON.parse(savedState);
          setSelectedAnswer(saved);
          setFeedback(savedFeedback);
          setSubmitted(savedSubmitted);
        } catch (err) {
          console.warn('Failed to restore modal state:', err);
        }
      }
    }
  }, [isOpen, question, persistState, storageKey]);

  useEffect(() => {
    setSelectedAnswer(null);
    setSubmitted(false);
    setFeedback(null);
    if (persistState) {
      sessionStorage.removeItem(storageKey);
    }
  }, [question?.id, persistState, storageKey]);

  const saveState = (answer, feedbackState, isSubmittedState) => {
    if (persistState && question) {
      sessionStorage.setItem(storageKey, JSON.stringify({
        selectedAnswer: answer,
        feedback: feedbackState,
        submitted: isSubmittedState,
        questionId: question.id
      }));
    }
  };

  const clearState = () => {
    if (persistState) {
      sessionStorage.removeItem(storageKey);
    }
  };

  if (!isOpen || !question) return null;

  const handleAnswerChange = (answer) => {
    setSelectedAnswer(answer);
    saveState(answer, null, false);
  };

  const handleSubmit = async () => {
    if (!selectedAnswer) {
      const newFeedback = {
        type: 'error',
        message: 'Please select an answer before submitting.'
      };
      setFeedback(newFeedback);
      saveState(selectedAnswer, newFeedback, false);
      return;
    }

    if (isSubmitting) return;

    clearTimeout(submitTimeoutRef.current);
    setIsSubmitting(true);
    setSubmitted(true);

    try {
      const result = await onAnswerSubmit(selectedAnswer);

      if (result.isCorrect) {
        const successFeedback = {
          type: 'success',
          message: 'Correct! You can now proceed to the next lesson.'
        };
        setFeedback(successFeedback);
        saveState(selectedAnswer, successFeedback, true);
      } else {
        const errorFeedback = {
          type: 'error',
          message: `Incorrect. The correct answer is: ${result.correctAnswer}`
        };
        setFeedback(errorFeedback);
        setSelectedAnswer(null);
        setSubmitted(false);
        saveState(null, errorFeedback, false);
      }
    } catch (err) {
      const errorFeedback = {
        type: 'error',
        message: err.message || 'An error occurred while submitting your answer.'
      };
      setFeedback(errorFeedback);
      setSubmitted(false);
      saveState(selectedAnswer, errorFeedback, false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !isSubmitting && !canProceed) {
      e.preventDefault();
    }
  };

  const handleContinue = () => {
    clearState();
    onComplete?.();
  };

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget && !isSubmitting) {
      clearState();
      onComplete?.();
    }
  };

  const canProceed = feedback?.type === 'success';

  return (
    <div 
      className={styles.overlay} 
      onClick={handleOverlayClick}
      role="presentation"
      aria-hidden={!isOpen}
    >
      <div 
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pvq-modal-title"
        aria-describedby="pvq-modal-description"
        onKeyDown={handleKeyDown}
      >
        <div className={styles.header}>
          <h2 id="pvq-modal-title">Video Comprehension Check</h2>
          <p id="pvq-modal-description" className={styles.subtitle}>
            Answer the following question to continue
          </p>
        </div>

        <div className={styles.content}>
          <section className={styles.questionContainer} aria-labelledby="pvq-question-label">
            <p id="pvq-question-label" className={styles.questionText}>
              {question.question}
            </p>
          </section>

          {!canProceed && (
            <fieldset className={styles.answersContainer}>
              <legend className="sr-only">Select an answer</legend>
              {question.options?.map((option, index) => (
                <label key={index} className={styles.answerOption}>
                  <input
                    type="radio"
                    name={`answer-${question.id}`}
                    value={option}
                    checked={selectedAnswer === option}
                    onChange={() => handleAnswerChange(option)}
                    disabled={submitted || loading || isSubmitting}
                    className={styles.radioInput}
                    aria-label={`Answer option: ${option}`}
                  />
                  <span className={styles.answerLabel}>{option}</span>
                </label>
              ))}
            </fieldset>
          )}

          {feedback && (
            <div 
              className={`${styles.feedback} ${styles[feedback.type]}`}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <span className={styles.icon} aria-hidden="true">
                {feedback.type === 'success' ? '✓' : '✗'}
              </span>
              <p>{feedback.message}</p>
            </div>
          )}

          {error && !feedback && (
            <div 
              className={styles.globalError}
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {!canProceed && (
            <Button
              onClick={handleSubmit}
              loading={loading || isSubmitting}
              disabled={!selectedAnswer || submitted || loading || isSubmitting}
              className={styles.submitButton}
              aria-label={selectedAnswer ? 'Submit your answer' : 'Select an answer to continue'}
            >
              {loading || isSubmitting ? 'Checking...' : 'Submit Answer'}
            </Button>
          )}

          {canProceed && (
            <Button
              onClick={handleContinue}
              variant="success"
              className={styles.proceedButton}
              aria-label="You answered correctly. Continue to the next lesson"
            >
              Continue to Next Lesson
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostVideoQuestionModal;
