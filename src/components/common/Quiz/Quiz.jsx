import { useState } from 'react';

import Button from '../Button/Button';

import styles from './Quiz.module.css';

const Quiz = ({
  quiz,
  onSubmit,
  loading = false,
  error = null,
  onCancel
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const questions = quiz?.questions || [];

  const handleAnswerSelect = (questionId, answer) => {
    if (!submitted) {
      setSelectedAnswers(prev => ({
        ...prev,
        [questionId]: answer
      }));
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedAnswers).length !== questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setSubmitted(true);

    try {
      const result = await onSubmit({
        selectedAnswers,
        totalQuestions: questions.length,
        timeSpent: 0
      });
      setResult(result);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setSubmitted(false);
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setSubmitted(false);
    setResult(null);
  };

  const renderQuestionContent = (question, index) => {
    const isAnswered = selectedAnswers[question.id] !== undefined;

    return (
      <div key={question.id} className={styles.questionContainer}>
        <div className={styles.questionHeader}>
          <span className={styles.questionNumber}>Question {index + 1}</span>
          <span className={styles.answerStatus}>
            {isAnswered && !submitted && '✓ Answered'}
            {!isAnswered && !submitted && '○ Not answered'}
          </span>
        </div>

        <p className={styles.questionText}>{question.text || question.question}</p>

        <div className={styles.answerOptions}>
          {(question.answers || question.options || []).map((answer, answerIndex) => {
            const isSelected = selectedAnswers[question.id] === answer;
            const isCorrect = submitted && answer === question.correctAnswer;
            const isWrong = submitted && isSelected && answer !== question.correctAnswer;

            return (
              <label
                key={answerIndex}
                className={`${styles.answerOption} ${
                  isSelected ? styles.selected : ''
                } ${submitted ? (isCorrect ? styles.correct : isWrong ? styles.incorrect : '') : ''}`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={answer}
                  checked={isSelected}
                  onChange={() => handleAnswerSelect(question.id, answer)}
                  disabled={submitted || loading}
                  className={styles.radioInput}
                />
                <span className={styles.answerLabel}>{answer}</span>
                {submitted && isCorrect && <span className={styles.correctIcon}>✓</span>}
                {submitted && isWrong && <span className={styles.incorrectIcon}>✗</span>}
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  if (submitted && result) {
    const correctCount = Object.entries(selectedAnswers).filter(
      ([qId, answer]) => {
        const question = questions.find(q => q.id === qId);
        return question && question.correctAnswer === answer;
      }
    ).length;

    const scorePercent = Math.round((correctCount / questions.length) * 100);
    const isPassed = scorePercent >= (quiz.passingScore || 70);

    return (
      <div className={styles.resultsContainer}>
        <div className={`${styles.resultsHeader} ${isPassed ? styles.passed : styles.failed}`}>
          <h2>{isPassed ? '✓ Quiz Passed!' : '✗ Quiz Failed'}</h2>
          <div className={styles.scoreDisplay}>
            <div className={styles.scoreNumber}>{scorePercent}%</div>
            <div className={styles.scoreText}>
              {correctCount} out of {questions.length} correct
            </div>
          </div>
        </div>

        <div className={styles.resultsDetails}>
          <p>Passing Score: {quiz.passingScore || 70}%</p>
          {quiz.passingScore && scorePercent >= quiz.passingScore && (
            <p className={styles.passedMessage}>Great job! You've successfully completed this quiz.</p>
          )}
          {quiz.passingScore && scorePercent < quiz.passingScore && (
            <p className={styles.failedMessage}>
              You didn't reach the passing score of {quiz.passingScore}%. Please review the material and try again.
            </p>
          )}
        </div>

        <div className={styles.reviewSection}>
          <h3>Quiz Review</h3>
          <div className={styles.reviewQuestions}>
            {questions.map((question, index) => {
              const selectedAnswer = selectedAnswers[question.id];
              const isCorrect = selectedAnswer === question.correctAnswer;

              return (
                <div key={question.id} className={`${styles.reviewItem} ${isCorrect ? styles.reviewCorrect : styles.reviewIncorrect}`}>
                  <div className={styles.reviewHeader}>
                    <span className={styles.reviewNumber}>Q{index + 1}</span>
                    <span className={styles.reviewStatus}>
                      {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>
                  <p className={styles.reviewQuestion}>{question.text || question.question}</p>
                  <div className={styles.reviewAnswers}>
                    <p className={styles.yourAnswer}>
                      <strong>Your answer:</strong> {selectedAnswer}
                    </p>
                    {!isCorrect && (
                      <p className={styles.correctAnswer}>
                        <strong>Correct answer:</strong> {question.correctAnswer}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.resultActions}>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Close Quiz
            </Button>
          )}
          {!isPassed && (
            <Button variant="primary" onClick={handleRetry}>
              Retake Quiz
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.quizContainer}>
      <div className={styles.quizHeader}>
        <h2>{quiz?.title || 'Quiz'}</h2>
        {quiz?.description && <p className={styles.quizDescription}>{quiz.description}</p>}
        <div className={styles.quizInfo}>
          <span>{Object.keys(selectedAnswers).length}/{questions.length} answered</span>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <div className={styles.questionsContainer}>
        {questions.map((question, index) => renderQuestionContent(question, index))}
      </div>

      <div className={styles.quizActions}>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={loading}
          disabled={Object.keys(selectedAnswers).length !== questions.length || loading}
        >
          {loading ? 'Submitting...' : 'Submit Quiz'}
        </Button>
      </div>
    </div>
  );
};

export default Quiz;
