const MAX_ANSWER_LENGTH = 10000;

const normalizeAnswer = (answer) => {
  if (!answer) return '';
  
  return String(answer)
    .trim()
    .toLowerCase();
};

const verifyAnswer = (selectedAnswer, correctAnswer, options = {}) => {
  const {
    caseSensitive = false,
    trimWhitespace = true,
    normalizeSpecialChars = false,
    maxLength = MAX_ANSWER_LENGTH,
    allowPartialMatch = false
  } = options;

  if (!selectedAnswer || !correctAnswer) {
    return {
      isCorrect: false,
      feedback: selectedAnswer && !correctAnswer ? 
        'Correct answer is not configured for this question' :
        'Please provide an answer'
    };
  }

  let normalized = String(selectedAnswer);
  let expectedNormalized = String(correctAnswer);

  if (!caseSensitive) {
    normalized = normalized.toLowerCase();
    expectedNormalized = expectedNormalized.toLowerCase();
  }

  if (trimWhitespace) {
    normalized = normalized.trim();
    expectedNormalized = expectedNormalized.trim();
  }

  if (maxLength && normalized.length > maxLength) {
    return {
      isCorrect: false,
      feedback: `Answer exceeds maximum length of ${maxLength} characters`
    };
  }

  if (normalizeSpecialChars) {
    normalized = normalized.replace(/[^\w\s]/g, '');
    expectedNormalized = expectedNormalized.replace(/[^\w\s]/g, '');
  }

  const isCorrect = allowPartialMatch ?
    expectedNormalized.includes(normalized) || normalized.includes(expectedNormalized) :
    normalized === expectedNormalized;

  return {
    isCorrect,
    feedback: isCorrect ?
      'Correct! Well done.' :
      'Incorrect. Please try again.',
    selectedNormalized: normalized,
    expectedNormalized
  };
};

const formatFeedbackMessage = (result, explanation) => {
  let message = result.feedback;

  if (result.isCorrect && explanation) {
    message += ` ${explanation}`;
  }

  return message;
};

const generateDetailedFeedback = (result, explanation, attempts = 1) => {
  const baseFeedback = {
    isCorrect: result.isCorrect,
    message: formatFeedbackMessage(result, explanation),
    attempts,
    correctAnswer: result.isCorrect ? null : result.expectedNormalized
  };

  if (attempts >= 3 && !result.isCorrect) {
    baseFeedback.message += ' You have used all your attempts for this question.';
    baseFeedback.allAttemptsUsed = true;
  }

  return baseFeedback;
};

module.exports = {
  normalizeAnswer,
  verifyAnswer,
  formatFeedbackMessage,
  generateDetailedFeedback,
  MAX_ANSWER_LENGTH
};
