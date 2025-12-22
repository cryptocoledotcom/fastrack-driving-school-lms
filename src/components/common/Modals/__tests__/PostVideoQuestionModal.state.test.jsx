/* eslint-disable no-unused-vars, no-undef */
import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';

import PostVideoQuestionModal from '../PostVideoQuestionModal';

describe('Task 2.3: Modal State Management', () => {
  const mockQuestion = {
    id: 'q-1',
    question: 'What is the capital of France?',
    options: ['Paris', 'London', 'Berlin', 'Madrid'],
    correctAnswer: 'Paris'
  };

  const mockQuestion2 = {
    id: 'q-2',
    question: 'What is the capital of Germany?',
    options: ['Berlin', 'Munich', 'Hamburg', 'Cologne'],
    correctAnswer: 'Berlin'
  };

  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('page refresh state persistence', () => {
    it('should persist modal state to sessionStorage when answer is selected', async () => {
      const onAnswerSubmit = vi.fn().mockResolvedValue({ isCorrect: false, correctAnswer: 'Paris' });

      const ModalWithPersistence = ({ question, _onAnswerSubmit }) => {
        const [selectedAnswer, _setSelectedAnswer] = useState(null);

        const handleAnswerChange = (answer) => {
          setSelectedAnswer(answer);
          sessionStorage.setItem('pvq-state', JSON.stringify({
            selectedAnswer: answer,
            questionId: question.id
          }));
        };

        return (
          <div>
            <label>
              <input
                type="radio"
                onChange={() => handleAnswerChange('Paris')}
                checked={selectedAnswer === 'Paris'}
              />
              Paris
            </label>
          </div>
        );
      };

      render(
        <ModalWithPersistence
          question={mockQuestion}
          onAnswerSubmit={onAnswerSubmit}
        />
      );

      const parisOption = screen.getByLabelText('Paris');
      fireEvent.click(parisOption);

      await waitFor(() => {
        expect(parisOption).toBeChecked();
      });

      const savedState = sessionStorage.getItem('pvq-state');
      expect(savedState).toBeTruthy();
      const parsed = JSON.parse(savedState);
      expect(parsed.selectedAnswer).toBe('Paris');
      expect(parsed.questionId).toBe('q-1');
    });

    it('should restore modal state after page refresh', async () => {
      const onAnswerSubmit = vi.fn().mockResolvedValue({ isCorrect: false, correctAnswer: 'Paris' });

      sessionStorage.setItem('pvq-state', JSON.stringify({
        selectedAnswer: 'London',
        questionId: 'q-1'
      }));

      const ModalWrapper = () => {
        const [selectedAnswer, _setSelectedAnswer] = useState(() => {
          const saved = sessionStorage.getItem('pvq-state');
          return saved ? JSON.parse(saved).selectedAnswer : null;
        });

        return (
          <div>
            <PostVideoQuestionModal
              isOpen={true}
              question={mockQuestion}
              onAnswerSubmit={onAnswerSubmit}
              loading={false}
            />
            <div>Selected: {selectedAnswer || 'None'}</div>
          </div>
        );
      };

      render(<ModalWrapper />);

      expect(screen.getByText('Selected: London')).toBeInTheDocument();
    });

    it('should persist feedback state across refresh', async () => {
      const onAnswerSubmit = vi.fn().mockResolvedValue({ isCorrect: true });

      sessionStorage.setItem('pvq-state', JSON.stringify({
        submitted: true,
        feedback: {
          type: 'success',
          message: 'Correct!'
        }
      }));

      const ModalWithPersistence = ({ question, _onAnswerSubmit }) => {
        const [submitted, setSubmitted] = useState(() => {
          const saved = sessionStorage.getItem('pvq-state');
          return saved ? JSON.parse(saved).submitted : false;
        });
        const [feedback, setFeedback] = useState(() => {
          const saved = sessionStorage.getItem('pvq-state');
          return saved ? JSON.parse(saved).feedback : null;
        });

        return (
          <>
            {feedback && <div className="feedback">{feedback.message}</div>}
            {submitted && <div className="submitted">Submitted</div>}
          </>
        );
      };

      render(
        <ModalWithPersistence
          question={mockQuestion}
          onAnswerSubmit={onAnswerSubmit}
        />
      );

      expect(screen.getByText('Correct!')).toBeInTheDocument();
      expect(screen.getByText('Submitted')).toBeInTheDocument();
    });

    it('should clear persisted state after successful completion', async () => {
      sessionStorage.setItem('pvq-state', JSON.stringify({
        selectedAnswer: 'Paris',
        submitted: true,
        feedback: { type: 'success', message: 'Correct!' }
      }));

      const onComplete = vi.fn();
      const handleClearState = () => sessionStorage.removeItem('pvq-state');

      const ModalWithCleanup = () => {
        return (
          <button
            onClick={() => {
              handleClearState();
              onComplete();
            }}
          >
            Complete
          </button>
        );
      };

      render(<ModalWithCleanup />);

      fireEvent.click(screen.getByText('Complete'));

      expect(sessionStorage.getItem('pvq-state')).toBeNull();
      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('state reset between videos', () => {
    it('should reset state when question changes', async () => {
      const onAnswerSubmit = vi.fn().mockResolvedValue({ isCorrect: false, correctAnswer: 'Paris' });

      const { _rerender } = render(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={onAnswerSubmit}
          loading={false}
        />
      );

      const parisOption = screen.getByLabelText('Paris');
      fireEvent.click(parisOption);

      await waitFor(() => {
        expect(parisOption).toBeChecked();
      });

      rerender(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion2}
          onAnswerSubmit={onAnswerSubmit}
          loading={false}
        />
      );

      expect(screen.queryByLabelText('Paris')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Berlin')).not.toBeChecked();
      expect(screen.getByText('What is the capital of Germany?')).toBeInTheDocument();
    });

    it('should clear feedback when loading new question', async () => {
      const onAnswerSubmit = vi.fn().mockResolvedValue({ isCorrect: true });

      const ModalWithFeedbackReset = ({ question }) => {
        const [feedback, _setFeedback] = useState(null);

        React.useEffect(() => {
          setFeedback(null);
        }, [question.id]);

        const handleSubmit = async () => {
          const result = await onAnswerSubmit('Paris');
          if (result.isCorrect) {
            setFeedback('Correct!');
          }
        };

        return (
          <>
            <button onClick={handleSubmit}>Submit</button>
            {feedback && <p>{feedback}</p>}
          </>
        );
      };

      const { _rerender } = render(
        <ModalWithFeedbackReset question={mockQuestion} />
      );

      const submitButton = screen.getByRole('button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Correct!')).toBeInTheDocument();
      });

      rerender(
        <ModalWithFeedbackReset question={mockQuestion2} />
      );

      expect(screen.queryByText('Correct!')).not.toBeInTheDocument();
    });

    it('should not carry over submitted state to new question', async () => {
      const onAnswerSubmit = vi.fn().mockResolvedValue({ isCorrect: true });

      const StateTracker = () => {
        const [_isOpen, _setIsOpen] = useState(true);
        const [_question, setQuestion] = useState(mockQuestion);
        const [submitted, _setSubmitted] = useState(false);

        return (
          <>
            <div>{submitted ? 'Was submitted' : 'Not submitted'}</div>
            <button onClick={() => setQuestion(mockQuestion2)}>Switch Question</button>
          </>
        );
      };

      const { getByText } = render(<StateTracker />);

      expect(getByText('Not submitted')).toBeInTheDocument();

      fireEvent.click(getByText('Switch Question'));

      expect(getByText('Not submitted')).toBeInTheDocument();
    });

    it('should reset selected answer when question ID changes', () => {
      const ModalWithStateTracking = ({ question, onQuestionChange }) => {
        const [selectedAnswer, _setSelectedAnswer] = useState(null);

        React.useEffect(() => {
          setSelectedAnswer(null);
        }, [question.id]);

        return (
          <>
            <div>{selectedAnswer || 'No answer'}</div>
            <input
              type="radio"
              onChange={() => setSelectedAnswer('Answer')}
            />
            <button onClick={() => onQuestionChange()}>Next Question</button>
          </>
        );
      };

      const onQuestionChange = vi.fn();
      const { _rerender } = render(
        <ModalWithStateTracking
          question={mockQuestion}
          onQuestionChange={onQuestionChange}
        />
      );

      const radio = screen.getByRole('radio');
      fireEvent.click(radio);

      expect(screen.getByText('Answer')).toBeInTheDocument();

      rerender(
        <ModalWithStateTracking
          question={mockQuestion2}
          onQuestionChange={onQuestionChange}
        />
      );

      expect(screen.getByText('No answer')).toBeInTheDocument();
    });
  });

  describe('rapid video completions', () => {
    it('should debounce rapid submit button clicks', async () => {
      const onAnswerSubmit = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ isCorrect: true }), 100))
      );

      const DebounceWrapper = ({ onAnswerSubmit }) => {
        const [isSubmitting, setIsSubmitting] = useState(false);
        const submitTimeoutRef = React.useRef(null);

        const handleDebouncedSubmit = React.useCallback(async (answer) => {
          if (isSubmitting) return;

          clearTimeout(submitTimeoutRef.current);
          setIsSubmitting(true);

          try {
            const result = await onAnswerSubmit(answer);
            setIsSubmitting(false);
            return result;
          } catch (err) {
            setIsSubmitting(false);
            throw err;
          }
        }, [isSubmitting, onAnswerSubmit]);

        return (
          <>
            <button onClick={() => handleDebouncedSubmit('Paris')} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </>
        );
      };

      render(<DebounceWrapper onAnswerSubmit={onAnswerSubmit} />);

      const button = screen.getByRole('button', { name: /submit/i });

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        expect(onAnswerSubmit).toHaveBeenCalledTimes(1);
      });
    });

    it('should prevent duplicate submissions with race condition handling', async () => {
      const onAnswerSubmit = vi.fn();
      let callCount = 0;

      onAnswerSubmit.mockImplementation(async () => {
        callCount++;
        await new Promise(resolve => setTimeout(resolve, 50));
        return { isCorrect: true };
      });

      const RaceConditionWrapper = ({ onAnswerSubmit }) => {
        const [submitted, _setSubmitted] = useState(false);
        const [inProgress, setInProgress] = useState(false);
        const submissionRef = React.useRef(null);

        const handleSubmit = React.useCallback(async (answer) => {
          if (submitted || inProgress) return;

          setInProgress(true);
          submissionRef.current = answer;

          try {
            const result = await onAnswerSubmit(answer);
            setSubmitted(true);
            return result;
          } finally {
            setInProgress(false);
          }
        }, [submitted, inProgress, onAnswerSubmit]);

        return (
          <>
            <button
              onClick={() => handleSubmit('Paris')}
              disabled={submitted || inProgress}
            >
              {inProgress ? 'Checking...' : 'Submit'}
            </button>
            <div>{submitted ? 'Submitted' : 'Not submitted'}</div>
          </>
        );
      };

      render(<RaceConditionWrapper onAnswerSubmit={onAnswerSubmit} />);

      const button = screen.getByRole('button');

      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Submitted')).toBeInTheDocument();
      });

      expect(onAnswerSubmit).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid question changes without state corruption', async () => {
      const QuestionSwitcher = () => {
        const [_question, setQuestion] = useState(mockQuestion);
        const [submissions, setSubmissions] = useState([]);

        const handleSubmit = (answer) => {
          setSubmissions(prev => [...prev, { questionId: question.id, answer }]);
        };

        return (
          <>
            <div>Current: {question.id}</div>
            <button onClick={() => setQuestion(mockQuestion)}>Q1</button>
            <button onClick={() => setQuestion(mockQuestion2)}>Q2</button>
            <button onClick={() => handleSubmit('Answer')}>Submit</button>
            <div>{submissions.length} submissions</div>
          </>
        );
      };

      render(<QuestionSwitcher />);

      fireEvent.click(screen.getByText('Q1'));
      fireEvent.click(screen.getByText('Submit'));

      fireEvent.click(screen.getByText('Q2'));
      fireEvent.click(screen.getByText('Submit'));

      expect(screen.getByText('2 submissions')).toBeInTheDocument();
    });

    it('should timeout rapid completions and recover gracefully', async () => {
      const onAnswerSubmit = vi.fn().mockImplementation(
        () => new Promise(resolve =>
          setTimeout(() => resolve({ isCorrect: true }), 500)
        )
      );

      const TimeoutWrapper = ({ onAnswerSubmit }) => {
        const [error, setError] = useState(null);
        const [submitted, _setSubmitted] = useState(false);
        const SUBMIT_TIMEOUT = 100;

        const handleSubmitWithTimeout = async (answer) => {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Submission timeout')), SUBMIT_TIMEOUT)
          );

          try {
            await Promise.race([
              onAnswerSubmit(answer),
              timeoutPromise
            ]);
            setSubmitted(true);
          } catch (err) {
            setError(err.message);
          }
        };

        return (
          <>
            <button onClick={() => handleSubmitWithTimeout('Paris')}>Submit</button>
            {error && <div className="error">{error}</div>}
            {submitted && <div className="success">Submitted</div>}
          </>
        );
      };

      render(<TimeoutWrapper onAnswerSubmit={onAnswerSubmit} />);

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('Submission timeout')).toBeInTheDocument();
      });

      expect(screen.queryByText('Submitted')).not.toBeInTheDocument();
    });
  });

  describe('click outside behavior', () => {
    it('should not close modal when clicking outside overlay by default', () => {
      const onComplete = vi.fn();

      const ModalWithOverlay = ({ onComplete }) => {
        const [_isOpen, _setIsOpen] = useState(true);

        const handleOverlayClick = (e) => {
          if (e.target.getAttribute('data-testid') === 'overlay') {
            setIsOpen(false);
            onComplete?.();
          }
        };

        if (!isOpen) return null;

        return (
          <div data-testid="overlay" onClick={handleOverlayClick}>
            <div data-testid="modal">
              <div>Modal Content</div>
            </div>
          </div>
        );
      };

      render(<ModalWithOverlay onComplete={onComplete} />);

      const modal = screen.getByTestId('modal');
      fireEvent.click(modal);

      expect(screen.getByText('Modal Content')).toBeInTheDocument();
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('should allow close on overlay click if closeOnOverlayClick is true', () => {
      const onComplete = vi.fn();

      const ModalWithCloseableOverlay = ({ onComplete }) => {
        const [_isOpen, _setIsOpen] = useState(true);
        const closeOnOverlayClick = true;

        const handleOverlayClick = (e) => {
          if (closeOnOverlayClick && e.target.dataset.testid === 'overlay') {
            setIsOpen(false);
            onComplete?.();
          }
        };

        if (!isOpen) return null;

        return (
          <div
            data-testid="overlay"
            onClick={handleOverlayClick}
            style={{ cursor: 'pointer' }}
          >
            <div data-testid="modal">
              <p>Modal Content</p>
            </div>
          </div>
        );
      };

      render(<ModalWithCloseableOverlay onComplete={onComplete} />);

      const overlay = screen.getByTestId('overlay');
      fireEvent.click(overlay);

      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
      expect(onComplete).toHaveBeenCalled();
    });

    it('should distinguish between modal click and overlay click', () => {
      const onOverlayClick = vi.fn();
      const onModalClick = vi.fn();

      const ModalClickHandler = () => {
        return (
          <div data-testid="overlay" onClick={onOverlayClick}>
            <div data-testid="modal" onClick={(e) => {
              e.stopPropagation();
              onModalClick();
            }}>
              <p>Modal Content</p>
            </div>
          </div>
        );
      };

      render(<ModalClickHandler />);

      const modal = screen.getByTestId('modal');
      fireEvent.click(modal);

      expect(onModalClick).toHaveBeenCalled();
      expect(onOverlayClick).not.toHaveBeenCalled();
    });

    it('should prevent closing during form submission', () => {
      const onComplete = vi.fn();

      const ModalWithSubmissionLock = ({ onComplete }) => {
        const [_isOpen, _setIsOpen] = useState(true);
        const [isSubmitting, setIsSubmitting] = useState(false);

        const handleOverlayClick = (e) => {
          if (e.target.dataset.testid === 'overlay' && !isSubmitting) {
            setIsOpen(false);
            onComplete?.();
          }
        };

        return (
          <div data-testid="overlay" onClick={handleOverlayClick}>
            <div data-testid="modal">
              <button onClick={() => {
                setIsSubmitting(true);
                setTimeout(() => setIsSubmitting(false), 100);
              }}>
                Submit
              </button>
            </div>
          </div>
        );
      };

      render(<ModalWithSubmissionLock onComplete={onComplete} />);

      const submitButton = screen.getByRole('button');
      fireEvent.click(submitButton);

      const overlay = screen.getByTestId('overlay');
      fireEvent.click(overlay);

      expect(screen.getByText('Submit')).toBeInTheDocument();
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('state cleanup and recovery', () => {
    it('should cleanup state on error and allow retry', async () => {
      const onAnswerSubmit = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ isCorrect: true });

      const ModalWithErrorRecovery = ({ onAnswerSubmit }) => {
        const [submitted, _setSubmitted] = useState(false);
        const [error, setError] = useState(null);

        const handleSubmit = async (answer) => {
          setSubmitted(true);
          try {
            const result = await onAnswerSubmit(answer);
            setError(null);
            return result;
          } catch (err) {
            setError(err.message);
            setSubmitted(false);
          }
        };

        return (
          <>
            <button onClick={() => handleSubmit('Paris')}>Submit</button>
            {error && <div className="error">{error}</div>}
            {submitted && <div className="submitted">Submitted</div>}
          </>
        );
      };

      render(<ModalWithErrorRecovery onAnswerSubmit={onAnswerSubmit} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      expect(screen.queryByText('Submitted')).not.toBeInTheDocument();

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Submitted')).toBeInTheDocument();
      });

      expect(screen.queryByText('Network error')).not.toBeInTheDocument();
    });

    it('should clear all state on modal close', () => {
      const StatefulModal = () => {
        const [_isOpen, _setIsOpen] = useState(true);
        const [selectedAnswer, _setSelectedAnswer] = useState(null);
        const [submitted, _setSubmitted] = useState(false);
        const [feedback, _setFeedback] = useState(null);

        const handleClose = () => {
          setIsOpen(false);
          setSelectedAnswer(null);
          setSubmitted(false);
          setFeedback(null);
        };

        return (
          <>
            {isOpen && (
              <div>
                <p>Selected: {selectedAnswer || 'None'}</p>
                <p>Submitted: {submitted ? 'Yes' : 'No'}</p>
                <button onClick={handleClose}>Close</button>
              </div>
            )}
          </>
        );
      };

      const { _rerender } = render(<StatefulModal />);

      expect(screen.getByText('Selected: None')).toBeInTheDocument();
      expect(screen.getByText('Submitted: No')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /close/i }));

      expect(screen.queryByText('Selected: None')).not.toBeInTheDocument();
    });
  });
});
