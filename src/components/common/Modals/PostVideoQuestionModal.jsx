import React, { useState } from 'react';
import Button from '../Button/Button';
import styles from './PostVideoQuestionModal.module.css';

const PostVideoQuestionModal = ({
  isOpen,
  question,
  onAnswerSubmit,
  onComplete,
  loading,
  error
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen || !question) return null;

  const handleSubmit = async () => {
    if (!selectedAnswer) {
      setFeedback({
        type: 'error',
        message: 'Please select an answer before submitting.'
      });
      return;
    }

    setSubmitted(true);
    try {
      const result = await onAnswerSubmit(selectedAnswer);
      
      if (result.isCorrect) {
        setFeedback({
          type: 'success',
          message: 'Correct! You can now proceed to the next lesson.'
        });
      } else {
        setFeedback({
          type: 'error',
          message: `Incorrect. The correct answer is: ${result.correctAnswer}`
        });
        setSelectedAnswer(null);
        setSubmitted(false);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'An error occurred while submitting your answer.'
      });
      setSubmitted(false);
    }
  };

  const handleContinue = () => {
    onComplete?.();
  };

  const canProceed = feedback?.type === 'success';

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Video Comprehension Check</h2>
          <p className={styles.subtitle}>Answer the following question to continue</p>
        </div>

        <div className={styles.content}>
          <div className={styles.questionContainer}>
            <p className={styles.questionText}>{question.question}</p>
          </div>

          {!canProceed && (
            <div className={styles.answersContainer}>
              {question.answers?.map((answer, index) => (
                <label key={index} className={styles.answerOption}>
                  <input
                    type="radio"
                    name="answer"
                    value={answer}
                    checked={selectedAnswer === answer}
                    onChange={() => setSelectedAnswer(answer)}
                    disabled={submitted || loading}
                    className={styles.radioInput}
                  />
                  <span className={styles.answerLabel}>{answer}</span>
                </label>
              ))}
            </div>
          )}

          {feedback && (
            <div className={`${styles.feedback} ${styles[feedback.type]}`}>
              <span className={styles.icon}>
                {feedback.type === 'success' ? '✓' : '✗'}
              </span>
              <p>{feedback.message}</p>
            </div>
          )}

          {error && !feedback && (
            <div className={styles.globalError}>
              {error}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {!canProceed && (
            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={!selectedAnswer || submitted || loading}
              className={styles.submitButton}
            >
              {loading ? 'Checking...' : 'Submit Answer'}
            </Button>
          )}

          {canProceed && (
            <Button
              onClick={handleContinue}
              variant="success"
              className={styles.proceedButton}
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
