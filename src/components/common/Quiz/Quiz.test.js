import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Quiz from './Quiz';
import { vi } from 'vitest';

describe('Quiz Component', () => {
  const mockQuiz = {
    id: 'quiz-1',
    title: 'Sample Quiz',
    description: 'Test your knowledge',
    passingScore: 70,
    questions: [
      {
        id: 'q1',
        text: 'What is 2+2?',
        question: 'What is 2+2?',
        answers: ['3', '4', '5', '6'],
        options: ['3', '4', '5', '6'],
        correctAnswer: '4'
      },
      {
        id: 'q2',
        text: 'What is the capital of France?',
        question: 'What is the capital of France?',
        answers: ['London', 'Paris', 'Berlin', 'Madrid'],
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        correctAnswer: 'Paris'
      }
    ]
  };

  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  test('renders quiz header and questions', () => {
    render(
      <Quiz
        quiz={mockQuiz}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Sample Quiz')).toBeInTheDocument();
    expect(screen.getByText('Test your knowledge')).toBeInTheDocument();
    expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
  });

  test('displays all answer options without revealing correct answers initially', () => {
    render(
      <Quiz
        quiz={mockQuiz}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const answers = ['3', '4', '5', '6', 'London', 'Paris', 'Berlin', 'Madrid'];
    answers.forEach(answer => {
      expect(screen.getByLabelText(answer)).toBeInTheDocument();
    });

    expect(screen.queryByText('✓')).not.toBeInTheDocument();
    expect(screen.queryByText('✗')).not.toBeInTheDocument();
  });

  test('tracks answer selection and shows "Answered" status', async () => {
    render(
      <Quiz
        quiz={mockQuiz}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const firstAnswer = screen.getByLabelText('4');
    fireEvent.click(firstAnswer);

    await waitFor(() => {
      const answerStatuses = screen.getAllByText('✓ Answered');
      expect(answerStatuses.length).toBeGreaterThan(0);
    });
  });

  test('disables submit button until all questions are answered', async () => {
    render(
      <Quiz
        quiz={mockQuiz}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Submit Quiz/i });
    expect(submitButton).toBeDisabled();

    const firstAnswer = screen.getByLabelText('4');
    fireEvent.click(firstAnswer);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    const secondAnswer = screen.getByLabelText('Paris');
    fireEvent.click(secondAnswer);

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  test('calls onSubmit with correct data when submitting', async () => {
    mockOnSubmit.mockResolvedValue({
      attemptId: 'attempt-1',
      score: 100,
      passed: true,
      correctAnswers: 2,
      totalQuestions: 2
    });

    render(
      <Quiz
        quiz={mockQuiz}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByLabelText('4'));
    fireEvent.click(screen.getByLabelText('Paris'));

    const submitButton = screen.getByRole('button', { name: /Submit Quiz/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
      const callArgs = mockOnSubmit.mock.calls[0][0];
      expect(callArgs.totalQuestions).toBe(2);
      expect(callArgs.selectedAnswers).toEqual({
        q1: '4',
        q2: 'Paris'
      });
    });
  });

  test('displays results page after submission with correct answers revealed', async () => {
    mockOnSubmit.mockResolvedValue({
      attemptId: 'attempt-1',
      score: 100,
      passed: true,
      correctAnswers: 2,
      totalQuestions: 2
    });

    render(
      <Quiz
        quiz={mockQuiz}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByLabelText('4'));
    fireEvent.click(screen.getByLabelText('Paris'));

    const submitButton = screen.getByRole('button', { name: /Submit Quiz/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('✓ Quiz Passed!')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('2 out of 2 correct')).toBeInTheDocument();
    });
  });

  test('displays failed results page when quiz fails', async () => {
    const failedQuiz = {
      ...mockQuiz,
      questions: [
        ...mockQuiz.questions,
        {
          id: 'q3',
          text: 'Question 3',
          question: 'Question 3',
          answers: ['A', 'B', 'C', 'D'],
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'C'
        }
      ]
    };

    mockOnSubmit.mockResolvedValue({
      attemptId: 'attempt-1',
      score: 67,
      passed: false,
      correctAnswers: 2,
      totalQuestions: 3
    });

    render(
      <Quiz
        quiz={failedQuiz}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByLabelText('4'));
    fireEvent.click(screen.getByLabelText('Paris'));
    fireEvent.click(screen.getByLabelText('A'));

    const submitButton = screen.getByRole('button', { name: /Submit Quiz/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('✗ Quiz Failed')).toBeInTheDocument();
      expect(screen.getByText('67%')).toBeInTheDocument();
    });
  });

  test('displays quiz review with correct/incorrect answers marked', async () => {
    mockOnSubmit.mockResolvedValue({
      attemptId: 'attempt-1',
      score: 50,
      passed: false,
      correctAnswers: 1,
      totalQuestions: 2
    });

    render(
      <Quiz
        quiz={mockQuiz}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByLabelText('4'));
    fireEvent.click(screen.getByLabelText('London'));

    const submitButton = screen.getByRole('button', { name: /Submit Quiz/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Quiz Review')).toBeInTheDocument();
      const correctAnswers = screen.getAllByText(/✓ Correct/i);
      const incorrectAnswers = screen.getAllByText(/✗ Incorrect/i);
      expect(correctAnswers.length).toBeGreaterThan(0);
      expect(incorrectAnswers.length).toBeGreaterThan(0);
    });
  });

  test('handles retake button click', async () => {
    mockOnSubmit.mockResolvedValue({
      attemptId: 'attempt-1',
      score: 50,
      passed: false,
      correctAnswers: 1,
      totalQuestions: 2
    });

    render(
      <Quiz
        quiz={mockQuiz}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByLabelText('4'));
    fireEvent.click(screen.getByLabelText('London'));

    const submitButton = screen.getByRole('button', { name: /Submit Quiz/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Retake Quiz/i })).toBeInTheDocument();
    });

    const retakeButton = screen.getByRole('button', { name: /Retake Quiz/i });
    fireEvent.click(retakeButton);

    await waitFor(() => {
      expect(screen.getByText('Sample Quiz')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Submit Quiz/i })).toBeInTheDocument();
    });
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(
      <Quiz
        quiz={mockQuiz}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('shows alert when trying to submit without answering all questions', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <Quiz
        quiz={mockQuiz}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByLabelText('4'));

    const submitButton = screen.getByRole('button', { name: /Submit Quiz/i });
    fireEvent.click(submitButton);

    expect(alertSpy).toHaveBeenCalledWith('Please answer all questions before submitting.');

    alertSpy.mockRestore();
  });

  test('disables submit button while loading', () => {
    render(
      <Quiz
        quiz={mockQuiz}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Submitting/i });
    expect(submitButton).toBeDisabled();
  });

  test('displays error message if provided', () => {
    const errorMessage = 'Failed to submit quiz. Please try again.';

    render(
      <Quiz
        quiz={mockQuiz}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        error={errorMessage}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
