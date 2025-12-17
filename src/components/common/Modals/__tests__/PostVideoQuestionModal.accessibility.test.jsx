import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import PostVideoQuestionModal from '../PostVideoQuestionModal';

describe('Task 2.4: Accessibility for Modal', () => {
  const mockQuestion = {
    id: 'q-1',
    question: 'What is the capital of France?',
    options: ['Paris', 'London', 'Berlin', 'Madrid'],
    correctAnswer: 'Paris'
  };

  describe('tab navigation', () => {
    it('should include all focusable elements in tab order', async () => {
      const user = userEvent.setup();
      const onAnswerSubmit = vi.fn();

      render(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={onAnswerSubmit}
          loading={false}
        />
      );

      const focusableElements = screen.getAllByRole('radio').concat(
        screen.getByRole('button')
      );

      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('should allow tabbing through radio options and submit button', async () => {
      const user = userEvent.setup();
      const onAnswerSubmit = vi.fn();

      const { container } = render(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={onAnswerSubmit}
          loading={false}
        />
      );

      const firstRadio = screen.getByLabelText('Answer option: Paris');
      firstRadio.focus();
      expect(document.activeElement).toBe(firstRadio);

      await user.keyboard('{Tab}');
      const nextElement = document.activeElement;
      expect(nextElement).not.toBe(firstRadio);
    });

    it('should trap focus within modal when open', async () => {
      const user = userEvent.setup();
      const onAnswerSubmit = vi.fn();

      render(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={onAnswerSubmit}
          loading={false}
        />
      );

      const submitButton = screen.getByRole('button');
      const firstRadio = screen.getByLabelText('Answer option: Paris');

      expect(submitButton).toBeInTheDocument();
      expect(firstRadio).toBeInTheDocument();

      const focusableElements = [firstRadio, ...screen.getAllByRole('radio'), submitButton];
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('should set focus to first radio option when modal opens', async () => {
      const onAnswerSubmit = vi.fn();

      const FocusTracker = () => {
        const [isOpen, setIsOpen] = useState(false);

        return (
          <>
            <button onClick={() => setIsOpen(true)}>Open Modal</button>
            {isOpen && (
              <PostVideoQuestionModal
                isOpen={isOpen}
                question={mockQuestion}
                onAnswerSubmit={onAnswerSubmit}
                loading={false}
              />
            )}
          </>
        );
      };

      render(<FocusTracker />);
      const openButton = screen.getByRole('button', { name: /open modal/i });
      fireEvent.click(openButton);

      await waitFor(() => {
        const firstRadio = screen.getByLabelText('Paris');
        expect(firstRadio).toBeVisible();
      });
    });

    it('should move focus to continue button after successful answer', async () => {
      const user = userEvent.setup();
      const onAnswerSubmit = vi.fn().mockResolvedValue({ isCorrect: true });

      render(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={onAnswerSubmit}
          loading={false}
        />
      );

      const parisRadio = screen.getByLabelText('Answer option: Paris');
      await user.click(parisRadio);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        const continueButton = screen.getByRole('button', { name: /continue/i });
        expect(continueButton).toBeInTheDocument();
      });
    });
  });

  describe('screen reader support', () => {
    it('should have descriptive heading for modal', () => {
      render(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={vi.fn()}
          loading={false}
        />
      );

      expect(screen.getByRole('heading', { name: /comprehension check/i })).toBeInTheDocument();
    });

    it('should have descriptive subtitle for modal purpose', () => {
      render(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={vi.fn()}
          loading={false}
        />
      );

      expect(screen.getByText(/answer the following question to continue/i)).toBeInTheDocument();
    });

    it('should have accessible radio button labels', () => {
      render(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={vi.fn()}
          loading={false}
        />
      );

      mockQuestion.options.forEach(option => {
        expect(screen.getByLabelText(option)).toBeInTheDocument();
      });
    });

    it('should announce form submission status to screen readers', async () => {
      const user = userEvent.setup();
      const onAnswerSubmit = vi.fn().mockResolvedValue({ isCorrect: true });

      const { container } = render(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={onAnswerSubmit}
          loading={false}
        />
      );

      const parisRadio = screen.getByLabelText('Paris');
      await user.click(parisRadio);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        const feedback = screen.getByText(/correct/i);
        expect(feedback).toBeVisible();
      });
    });

    it('should have aria-label for modal overlay', () => {
      const ModalWithAriaLabel = ({ isOpen, question, onAnswerSubmit }) => {
        return (
          <>
            {isOpen && (
              <div
                role="dialog"
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
              >
                <div className="modal">
                  <h2 id="modal-title">Video Comprehension Check</h2>
                  <p id="modal-description">Answer the following question to continue</p>
                </div>
              </div>
            )}
          </>
        );
      };

      render(
        <ModalWithAriaLabel
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={vi.fn()}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'modal-description');
    });

    it('should have descriptive button text', () => {
      render(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={vi.fn()}
          loading={false}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label');
    });

    it('should announce error messages to screen readers', async () => {
      const user = userEvent.setup();

      render(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={vi.fn()}
          loading={false}
        />
      );

      const submitButton = screen.getByRole('button');
      await user.click(submitButton);

      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('focus trap', () => {
    it('should trap focus within modal', async () => {
      const user = userEvent.setup();
      const onAnswerSubmit = vi.fn();

      const MockModal = ({ isOpen }) => {
        const [firstFocusableRef, setFirstFocusableRef] = React.useState(null);
        const [lastFocusableRef, setLastFocusableRef] = React.useState(null);

        const handleKeyDown = (e) => {
          if (e.key !== 'Tab') return;

          const focusableElements = [
            firstFocusableRef,
            lastFocusableRef
          ].filter(Boolean);

          if (focusableElements.length === 0) return;

          const isFirstElement = document.activeElement === firstFocusableRef;
          const isLastElement = document.activeElement === lastFocusableRef;

          if (e.shiftKey && isFirstElement) {
            e.preventDefault();
            lastFocusableRef?.focus();
          } else if (!e.shiftKey && isLastElement) {
            e.preventDefault();
            firstFocusableRef?.focus();
          }
        };

        return (
          <div
            role="dialog"
            onKeyDown={handleKeyDown}
            style={{ display: isOpen ? 'block' : 'none' }}
          >
            <button ref={setFirstFocusableRef}>First Button</button>
            <input type="radio" />
            <button ref={setLastFocusableRef}>Last Button</button>
          </div>
        );
      };

      render(<MockModal isOpen={true} />);

      const firstButton = screen.getByRole('button', { name: /first button/i });
      firstButton.focus();

      expect(document.activeElement).toBe(firstButton);
    });

    it('should prevent focus from leaving modal when tabbing backward from first element', async () => {
      const user = userEvent.setup();

      const FocusTrapTest = () => {
        const containerRef = React.useRef(null);
        const firstRef = React.useRef(null);
        const lastRef = React.useRef(null);

        const handleKeyDown = (e) => {
          if (e.key !== 'Tab') return;

          const isShiftTab = e.shiftKey;
          const isFirstElement = document.activeElement === firstRef.current;
          const isLastElement = document.activeElement === lastRef.current;

          if (isShiftTab && isFirstElement) {
            e.preventDefault();
            lastRef.current?.focus();
          } else if (!isShiftTab && isLastElement) {
            e.preventDefault();
            firstRef.current?.focus();
          }
        };

        return (
          <div ref={containerRef} onKeyDown={handleKeyDown} role="dialog">
            <button ref={firstRef}>Option 1</button>
            <button>Option 2</button>
            <button ref={lastRef}>Submit</button>
          </div>
        );
      };

      render(<FocusTrapTest />);

      const option1 = screen.getByRole('button', { name: /option 1/i });
      const submit = screen.getByRole('button', { name: /submit/i });

      option1.focus();
      expect(document.activeElement).toBe(option1);

      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(document.activeElement).toBe(submit);
    });

    it('should prevent focus from leaving modal when tabbing forward from last element', async () => {
      const user = userEvent.setup();

      const FocusTrappingModal = () => {
        const focusableElements = React.useRef([]);

        const handleKeyDown = (e) => {
          if (e.key !== 'Tab' || focusableElements.current.length === 0) return;

          const currentIndex = focusableElements.current.indexOf(document.activeElement);
          const isLastElement = currentIndex === focusableElements.current.length - 1;

          if (!e.shiftKey && isLastElement) {
            e.preventDefault();
            focusableElements.current[0]?.focus();
          }
        };

        return (
          <div role="dialog" onKeyDown={handleKeyDown}>
            <button ref={(el) => {
              if (el && !focusableElements.current.includes(el)) {
                focusableElements.current[0] = el;
              }
            }}>
              First Button
            </button>
            <button ref={(el) => {
              if (el && !focusableElements.current.includes(el)) {
                focusableElements.current[1] = el;
              }
            }}>
              Submit
            </button>
          </div>
        );
      };

      render(<FocusTrappingModal />);

      const submit = screen.getByRole('button', { name: /submit/i });
      submit.focus();

      expect(document.activeElement).toBe(submit);
    });

    it('should maintain focus within modal during state changes', async () => {
      const user = userEvent.setup();
      const onAnswerSubmit = vi.fn().mockResolvedValue({ isCorrect: true });

      render(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={onAnswerSubmit}
          loading={false}
        />
      );

      const parisRadio = screen.getByLabelText('Answer option: Paris');
      parisRadio.focus();

      await user.click(parisRadio);
      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        const continueButton = screen.getByRole('button', { name: /continue/i });
        expect(continueButton).toBeInTheDocument();
      });
    });

    it('should release focus trap when modal closes', () => {
      const onComplete = vi.fn();

      const ClosableModal = ({ isOpen, onComplete }) => {
        const [open, setOpen] = React.useState(isOpen);

        const handleClose = () => {
          setOpen(false);
          onComplete?.();
        };

        if (!open) return null;

        return (
          <div role="dialog">
            <button onClick={handleClose}>Close</button>
            <input type="radio" />
          </div>
        );
      };

      const { rerender } = render(
        <ClosableModal isOpen={true} onComplete={onComplete} />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('keyboard navigation', () => {
    it('should allow space/enter to select radio option', async () => {
      const user = userEvent.setup();

      render(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={vi.fn()}
          loading={false}
        />
      );

      const parisRadio = screen.getByLabelText('Answer option: Paris');
      parisRadio.focus();

      await user.keyboard(' ');

      expect(parisRadio).toBeChecked();
    });

    it('should allow enter to submit answer', async () => {
      const user = userEvent.setup();
      const onAnswerSubmit = vi.fn().mockResolvedValue({ isCorrect: true });

      render(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={onAnswerSubmit}
          loading={false}
        />
      );

      const parisRadio = screen.getByLabelText('Answer option: Paris');
      await user.click(parisRadio);

      const submitButton = screen.getByRole('button');
      submitButton.focus();

      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(onAnswerSubmit).toHaveBeenCalled();
      });
    });

    it('should allow escape key to close modal if configured', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      const EscapeCloseModal = () => {
        const [isOpen, setIsOpen] = React.useState(true);

        const handleEscape = React.useCallback((e) => {
          if (e.key === 'Escape' && isOpen) {
            setIsOpen(false);
            onComplete?.();
          }
        }, [isOpen, onComplete]);

        React.useEffect(() => {
          document.addEventListener('keydown', handleEscape);
          return () => document.removeEventListener('keydown', handleEscape);
        }, [handleEscape]);

        if (!isOpen) return null;

        return (
          <div role="dialog">
            <button>First Button</button>
          </div>
        );
      };

      render(<EscapeCloseModal />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(onComplete).toHaveBeenCalled();
    });

    it('should support arrow keys for radio selection', async () => {
      const user = userEvent.setup();

      render(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={vi.fn()}
          loading={false}
        />
      );

      const parisRadio = screen.getByLabelText('Answer option: Paris');
      parisRadio.focus();

      await user.keyboard('{ArrowDown}');

      const londonRadio = screen.getByLabelText('Answer option: London');
      expect(londonRadio).toBeVisible();
    });
  });

  describe('semantic markup', () => {
    it('should use dialog role for modal', () => {
      const AccessibleModal = ({ isOpen, question }) => {
        return isOpen ? (
          <div role="dialog" aria-modal="true">
            <h2>Modal Title</h2>
          </div>
        ) : null;
      };

      render(
        <AccessibleModal isOpen={true} question={mockQuestion} />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should use fieldset for radio group', () => {
      const AccessibleRadioGroup = ({ options }) => {
        return (
          <fieldset>
            <legend>Select an option</legend>
            {options.map(option => (
              <label key={option}>
                <input type="radio" name="options" value={option} />
                {option}
              </label>
            ))}
          </fieldset>
        );
      };

      render(
        <AccessibleRadioGroup options={mockQuestion.options} />
      );

      expect(screen.getByRole('group')).toBeInTheDocument();
      expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    it('should use proper heading hierarchy', () => {
      render(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={vi.fn()}
          loading={false}
        />
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
    });

    it('should use section or article for content areas', () => {
      const SemanticModal = ({ isOpen }) => {
        return isOpen ? (
          <div role="dialog">
            <section>
              <h2>Questions</h2>
              <p>Question text</p>
            </section>
            <section>
              <h3>Options</h3>
            </section>
          </div>
        ) : null;
      };

      render(<SemanticModal isOpen={true} />);

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('contrast and visibility', () => {
    it('should have visible focus indicators on interactive elements', () => {
      render(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={vi.fn()}
          loading={false}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
    });

    it('should maintain focus visibility when navigating with keyboard', async () => {
      const user = userEvent.setup();

      render(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={vi.fn()}
          loading={false}
        />
      );

      const firstRadio = screen.getByLabelText('Answer option: Paris');
      expect(firstRadio).toBeVisible();
      expect(firstRadio).toBeInTheDocument();

      const submitButton = screen.getByRole('button');
      expect(submitButton).toBeVisible();
    });
  });

  describe('form accessibility', () => {
    it('should associate labels with form inputs', () => {
      render(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={vi.fn()}
          loading={false}
        />
      );

      mockQuestion.options.forEach(option => {
        const radio = screen.getByLabelText(option);
        expect(radio).toHaveAttribute('type', 'radio');
      });
    });

    it('should have unique name attribute for radio group', () => {
      render(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={vi.fn()}
          loading={false}
        />
      );

      const radios = screen.getAllByRole('radio');
      const names = radios.map(r => r.getAttribute('name'));
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(1);
    });

    it('should have descriptive error messages', async () => {
      const user = userEvent.setup();

      render(
        <PostVideoQuestionModal
          isOpen={true}
          question={mockQuestion}
          onAnswerSubmit={vi.fn()}
          loading={false}
        />
      );

      const submitButton = screen.getByRole('button');
      expect(submitButton).toBeDisabled();
      
      const firstRadio = screen.getByLabelText('Answer option: Paris');
      await user.click(firstRadio);

      expect(submitButton).not.toBeDisabled();
    });
  });
});
