import { ValidationError } from '../errors/ApiError';

export const validateUserId = (userId) => {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new ValidationError('User ID is required and must be a non-empty string');
  }
};

export const validateCourseId = (courseId) => {
  if (!courseId || typeof courseId !== 'string' || courseId.trim().length === 0) {
    throw new ValidationError('Course ID is required and must be a non-empty string');
  }
};

export const validateModuleId = (moduleId) => {
  if (!moduleId || typeof moduleId !== 'string' || moduleId.trim().length === 0) {
    throw new ValidationError('Module ID is required and must be a non-empty string');
  }
};

export const validateLessonId = (lessonId) => {
  if (!lessonId || typeof lessonId !== 'string' || lessonId.trim().length === 0) {
    throw new ValidationError('Lesson ID is required and must be a non-empty string');
  }
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

export const validateSessionId = (sessionId) => {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new ValidationError('Session ID is required');
  }
};

export const validateQuizAttemptData = (data) => {
  const errors = [];

  if (!data.userId) errors.push('userId is required');
  if (!data.courseId) errors.push('courseId is required');
  if (!data.quizId) errors.push('quizId is required');
  if (data.score === undefined || data.score === null) errors.push('score is required');
  if (typeof data.score !== 'number' || data.score < 0 || data.score > 100) {
    errors.push('score must be a number between 0 and 100');
  }

  if (errors.length > 0) {
    throw new ValidationError(
      'Invalid quiz attempt data: ' + errors.join('; '),
      errors
    );
  }
};

export const validateEnrollmentData = (userId, courseId, userEmail) => {
  const errors = [];

  if (!userId) errors.push('userId is required');
  if (!courseId) errors.push('courseId is required');
  if (userEmail && !userEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push('userEmail must be valid format');
  }

  if (errors.length > 0) {
    throw new ValidationError(
      'Invalid enrollment data: ' + errors.join('; '),
      errors
    );
  }
};

export const validateBreakData = (breakData) => {
  const errors = [];

  if (!breakData.sessionId) errors.push('sessionId is required');
  if (!breakData.breakType) errors.push('breakType is required');
  if (!breakData.startTime) errors.push('startTime is required');

  if (errors.length > 0) {
    throw new ValidationError(
      'Invalid break data: ' + errors.join('; '),
      errors
    );
  }
};

export const validateLessonCompletionData = (data) => {
  const errors = [];

  if (!data.sessionId) errors.push('sessionId is required');
  if (!data.lessonId) errors.push('lessonId is required');
  if (!data.lessonTitle) errors.push('lessonTitle is required');
  if (data.duration === undefined) errors.push('duration is required');

  if (errors.length > 0) {
    throw new ValidationError(
      'Invalid lesson completion data: ' + errors.join('; '),
      errors
    );
  }
};

export const validatePVQData = (data) => {
  const errors = [];

  if (!data.questionId) errors.push('questionId is required');
  if (!data.userAnswer) errors.push('userAnswer is required');
  if (!data.sessionId) errors.push('sessionId is required');

  if (errors.length > 0) {
    throw new ValidationError(
      'Invalid PVQ data: ' + errors.join('; '),
      errors
    );
  }
};

export const validatePaymentData = (userId, courseId, amount, paymentType) => {
  const errors = [];
  if (!userId) errors.push('userId is required');
  if (!courseId) errors.push('courseId is required');
  if (typeof amount !== 'number' || amount <= 0) errors.push('amount must be positive number');
  if (!paymentType) errors.push('paymentType is required');
  if (errors.length > 0) {
    throw new ValidationError('Invalid payment data: ' + errors.join('; '), errors);
  }
};

export const validateProgressData = (userId, courseId, totalLessons) => {
  const errors = [];
  if (!userId) errors.push('userId is required');
  if (!courseId) errors.push('courseId is required');
  if (typeof totalLessons !== 'number' || totalLessons < 0) {
    errors.push('totalLessons must be non-negative number');
  }
  if (errors.length > 0) {
    throw new ValidationError('Invalid progress data: ' + errors.join('; '), errors);
  }
};

export const validateLessonData = (lessonData) => {
  const errors = [];
  if (!lessonData.courseId) errors.push('courseId is required');
  if (!lessonData.moduleId) errors.push('moduleId is required');
  if (!lessonData.title) errors.push('title is required');
  if (errors.length > 0) {
    throw new ValidationError('Invalid lesson data: ' + errors.join('; '), errors);
  }
};

export const validateModuleData = (moduleData) => {
  const errors = [];
  if (!moduleData.courseId) errors.push('courseId is required');
  if (!moduleData.title) errors.push('title is required');
  if (errors.length > 0) {
    throw new ValidationError('Invalid module data: ' + errors.join('; '), errors);
  }
};

export const validateCourseData = (courseData) => {
  const errors = [];
  if (!courseData.title) errors.push('title is required');
  if (!courseData.description) errors.push('description is required');
  if (errors.length > 0) {
    throw new ValidationError('Invalid course data: ' + errors.join('; '), errors);
  }
};

export const validateTimeSlotData = (slotData) => {
  const errors = [];
  if (!slotData.date) errors.push('date is required');
  if (!slotData.startTime) errors.push('startTime is required');
  if (!slotData.endTime) errors.push('endTime is required');
  if (errors.length > 0) {
    throw new ValidationError('Invalid time slot data: ' + errors.join('; '), errors);
  }
};
