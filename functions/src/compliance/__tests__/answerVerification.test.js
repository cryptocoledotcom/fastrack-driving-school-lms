const {
  normalizeAnswer,
  verifyAnswer,
  formatFeedbackMessage,
  generateDetailedFeedback
} = require('../answerVerification');

describe('Task 2.2: Answer Verification Logic', () => {
  describe('normalizeAnswer', () => {
    it('should convert answer to lowercase', () => {
      expect(normalizeAnswer('APPLE')).toBe('apple');
      expect(normalizeAnswer('ApPlE')).toBe('apple');
    });

    it('should trim whitespace', () => {
      expect(normalizeAnswer('  apple  ')).toBe('apple');
      expect(normalizeAnswer('\n apple \t')).toBe('apple');
    });

    it('should handle empty string', () => {
      expect(normalizeAnswer('')).toBe('');
      expect(normalizeAnswer(null)).toBe('');
      expect(normalizeAnswer(undefined)).toBe('');
    });

    it('should handle numbers as strings', () => {
      expect(normalizeAnswer('123')).toBe('123');
      expect(normalizeAnswer(' 456 ')).toBe('456');
    });
  });

  describe('case-insensitive verification', () => {
    it('should match different cases when caseSensitive is false', () => {
      const result = verifyAnswer('apple', 'APPLE', { caseSensitive: false });
      expect(result.isCorrect).toBe(true);
    });

    it('should not match different cases when caseSensitive is true', () => {
      const result = verifyAnswer('apple', 'APPLE', { caseSensitive: true });
      expect(result.isCorrect).toBe(false);
    });

    it('should handle mixed case answers', () => {
      const result = verifyAnswer('ApPlE', 'apple', { caseSensitive: false });
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('answer trimming', () => {
    it('should trim whitespace by default', () => {
      const result = verifyAnswer(' apple ', 'apple', { trimWhitespace: true });
      expect(result.isCorrect).toBe(true);
    });

    it('should not trim when trimWhitespace is false', () => {
      const result = verifyAnswer(' apple ', 'apple', { trimWhitespace: false });
      expect(result.isCorrect).toBe(false);
    });

    it('should handle multiple spaces', () => {
      const result = verifyAnswer('   APPLE   ', 'apple', { trimWhitespace: true, caseSensitive: false });
      expect(result.isCorrect).toBe(true);
    });

    it('should handle tabs and newlines', () => {
      const result = verifyAnswer('\t apple \n', 'apple', { trimWhitespace: true });
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('special characters handling', () => {
    it('should include special characters by default', () => {
      const result = verifyAnswer('hello!', 'hello!', { normalizeSpecialChars: false });
      expect(result.isCorrect).toBe(true);
    });

    it('should remove special characters when normalizeSpecialChars is true', () => {
      const result = verifyAnswer('hello!@#', 'hello', { normalizeSpecialChars: true });
      expect(result.isCorrect).toBe(true);
    });

    it('should handle punctuation in answers', () => {
      const result = verifyAnswer('Dr. Smith', 'Dr. Smith', { normalizeSpecialChars: false });
      expect(result.isCorrect).toBe(true);
    });

    it('should normalize punctuation when flag is set', () => {
      const result = verifyAnswer('hello-world', 'helloworld', { normalizeSpecialChars: true });
      expect(result.isCorrect).toBe(true);
    });

    it('should handle apostrophes correctly', () => {
      const result = verifyAnswer("don't", "don't", { normalizeSpecialChars: false });
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('long answer handling', () => {
    it('should accept answers within maxLength', () => {
      const longAnswer = 'a'.repeat(100);
      const result = verifyAnswer(longAnswer, longAnswer, { maxLength: 1000 });
      expect(result.isCorrect).toBe(true);
    });

    it('should reject answers exceeding maxLength', () => {
      const tooLongAnswer = 'a'.repeat(1001);
      const result = verifyAnswer(tooLongAnswer, 'answer', { maxLength: 1000 });
      expect(result.isCorrect).toBe(false);
      expect(result.feedback).toContain('exceeds maximum length');
    });

    it('should use default maxLength of 10000', () => {
      const maxLengthAnswer = 'a'.repeat(10000);
      const result = verifyAnswer(maxLengthAnswer, maxLengthAnswer);
      expect(result.isCorrect).toBe(true);
    });

    it('should reject answers exceeding default maxLength', () => {
      const tooLongAnswer = 'a'.repeat(10001);
      const result = verifyAnswer(tooLongAnswer, 'answer');
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('verifyAnswer - basic functionality', () => {
    it('should return correct=true for matching answers', () => {
      const result = verifyAnswer('Paris', 'Paris');
      expect(result.isCorrect).toBe(true);
      expect(result.feedback).toBe('Correct! Well done.');
    });

    it('should return correct=false for non-matching answers', () => {
      const result = verifyAnswer('London', 'Paris');
      expect(result.isCorrect).toBe(false);
      expect(result.feedback).toBe('Incorrect. Please try again.');
    });

    it('should handle null selectedAnswer', () => {
      const result = verifyAnswer(null, 'Paris');
      expect(result.isCorrect).toBe(false);
      expect(result.feedback).toBe('Please provide an answer');
    });

    it('should handle null correctAnswer', () => {
      const result = verifyAnswer('Paris', null);
      expect(result.isCorrect).toBe(false);
      expect(result.feedback).toBe('Correct answer is not configured for this question');
    });

    it('should handle both null', () => {
      const result = verifyAnswer(null, null);
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('partial match verification', () => {
    it('should reject partial matches by default', () => {
      const result = verifyAnswer('test', 'testing', { allowPartialMatch: false });
      expect(result.isCorrect).toBe(false);
    });

    it('should accept partial matches when allowPartialMatch is true', () => {
      const result = verifyAnswer('test', 'testing', { allowPartialMatch: true });
      expect(result.isCorrect).toBe(true);
    });

    it('should handle bidirectional partial matching', () => {
      const result = verifyAnswer('testing', 'test', { allowPartialMatch: true });
      expect(result.isCorrect).toBe(true);
    });

    it('should not match unrelated strings with allowPartialMatch', () => {
      const result = verifyAnswer('hello', 'world', { allowPartialMatch: true });
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('formatFeedbackMessage', () => {
    it('should format correct answer with explanation', () => {
      const result = { isCorrect: true, feedback: 'Correct! Well done.' };
      const message = formatFeedbackMessage(result, 'Paris is the capital of France.');
      expect(message).toBe('Correct! Well done. Paris is the capital of France.');
    });

    it('should not add explanation for incorrect answers', () => {
      const result = { isCorrect: false, feedback: 'Incorrect. Please try again.' };
      const message = formatFeedbackMessage(result, 'Paris is the capital of France.');
      expect(message).toBe('Incorrect. Please try again.');
    });

    it('should handle missing explanation', () => {
      const result = { isCorrect: true, feedback: 'Correct! Well done.' };
      const message = formatFeedbackMessage(result, null);
      expect(message).toBe('Correct! Well done.');
    });

    it('should handle empty explanation', () => {
      const result = { isCorrect: true, feedback: 'Correct! Well done.' };
      const message = formatFeedbackMessage(result, '');
      expect(message).toBe('Correct! Well done.');
    });
  });

  describe('generateDetailedFeedback', () => {
    it('should generate feedback for first attempt correct answer', () => {
      const result = { isCorrect: true, feedback: 'Correct! Well done.' };
      const feedback = generateDetailedFeedback(result, 'Great job!', 1);
      expect(feedback.isCorrect).toBe(true);
      expect(feedback.attempts).toBe(1);
      expect(feedback.message).toBe('Correct! Well done. Great job!');
      expect(feedback.correctAnswer).toBe(null);
    });

    it('should generate feedback for incorrect answer', () => {
      const result = { isCorrect: false, feedback: 'Incorrect. Please try again.', expectedNormalized: 'paris' };
      const feedback = generateDetailedFeedback(result, null, 1);
      expect(feedback.isCorrect).toBe(false);
      expect(feedback.attempts).toBe(1);
      expect(feedback.correctAnswer).toBe('paris');
    });

    it('should not show allAttemptsUsed flag for first two attempts', () => {
      const result = { isCorrect: false, feedback: 'Incorrect. Please try again.', expectedNormalized: 'paris' };
      const feedback1 = generateDetailedFeedback(result, null, 1);
      const feedback2 = generateDetailedFeedback(result, null, 2);
      expect(feedback1.allAttemptsUsed).toBeUndefined();
      expect(feedback2.allAttemptsUsed).toBeUndefined();
    });

    it('should show allAttemptsUsed flag on third failed attempt', () => {
      const result = { isCorrect: false, feedback: 'Incorrect. Please try again.', expectedNormalized: 'paris' };
      const feedback = generateDetailedFeedback(result, null, 3);
      expect(feedback.allAttemptsUsed).toBe(true);
      expect(feedback.message).toContain('You have used all your attempts');
    });

    it('should not show allAttemptsUsed for correct answers', () => {
      const result = { isCorrect: true, feedback: 'Correct! Well done.' };
      const feedback = generateDetailedFeedback(result, null, 3);
      expect(feedback.allAttemptsUsed).toBeUndefined();
    });
  });

  describe('edge cases and complex scenarios', () => {
    it('should handle numeric answers', () => {
      const result = verifyAnswer(42, '42');
      expect(result.isCorrect).toBe(true);
    });

    it('should handle boolean-like strings', () => {
      const result = verifyAnswer('true', 'true');
      expect(result.isCorrect).toBe(true);
    });

    it('should handle single character answers', () => {
      const result = verifyAnswer('A', 'a');
      expect(result.isCorrect).toBe(true);
    });

    it('should handle answers with multiple spaces between words', () => {
      const result = verifyAnswer('hello  world', 'hello  world', { trimWhitespace: false });
      expect(result.isCorrect).toBe(true);
    });

    it('should handle answers with Unicode characters', () => {
      const result = verifyAnswer('café', 'CAFÉ');
      expect(result.isCorrect).toBe(true);
    });

    it('should handle empty string comparison', () => {
      const result = verifyAnswer('', '');
      expect(result.isCorrect).toBe(false);
      expect(result.feedback).toBe('Please provide an answer');
    });

    it('should combine multiple normalization options', () => {
      const result = verifyAnswer(
        '  HELLO-WORLD!  ',
        'hello-world',
        { caseSensitive: false, trimWhitespace: true, normalizeSpecialChars: true }
      );
      expect(result.isCorrect).toBe(true);
    });

    it('should handle very long answers with multiple options', () => {
      const longAnswer = 'The quick brown fox jumps over the lazy dog. '.repeat(100);
      const result = verifyAnswer(
        longAnswer,
        longAnswer,
        { caseSensitive: false, trimWhitespace: true, maxLength: 10000 }
      );
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('feedback accuracy and messaging', () => {
    it('should provide clear success message', () => {
      const result = verifyAnswer('correct', 'correct');
      expect(result.feedback).toEqual('Correct! Well done.');
    });

    it('should provide clear failure message', () => {
      const result = verifyAnswer('wrong', 'correct');
      expect(result.feedback).toEqual('Incorrect. Please try again.');
    });

    it('should indicate missing answer', () => {
      const result = verifyAnswer('', 'correct');
      expect(result.feedback).toEqual('Please provide an answer');
    });

    it('should indicate misconfigured question', () => {
      const result = verifyAnswer('answer', '');
      expect(result.feedback).toEqual('Correct answer is not configured for this question');
    });

    it('should indicate length exceeded', () => {
      const result = verifyAnswer('a'.repeat(1001), 'answer', { maxLength: 1000 });
      expect(result.feedback).toContain('exceeds maximum length of 1000');
    });
  });
});
