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
  if (!email || typeof email !== 'string') {
    throw new ValidationError('Email is required and must be a string');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Email must be a valid email address');
  }
};

export const validateSessionId = (sessionId) => {
  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
    throw new ValidationError('Session ID is required and must be a non-empty string');
  }
};

export const validateQuizAttemptData = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError('Quiz attempt data must be an object');
  }

  const errors = [];

  if (!data.userId) errors.push('userId is required');
  if (!data.courseId) errors.push('courseId is required');
  if (!data.quizId) errors.push('quizId is required');
  if (data.score === undefined || data.score === null) errors.push('score is required');
  if (data.score < 0 || data.score > 100) errors.push('score must be between 0 and 100');

  if (errors.length > 0) {
    throw new ValidationError('Invalid quiz attempt data: ' + errors.join('; '), errors);
  }
};

export const validateEnrollmentData = (userId, courseId, userEmail) => {
  const errors = [];

  if (!userId || typeof userId !== 'string') errors.push('userId is required');
  if (!courseId || typeof courseId !== 'string') errors.push('courseId is required');

  try {
    validateEmail(userEmail);
  } catch (e) {
    errors.push('userEmail must be valid');
  }

  if (errors.length > 0) {
    throw new ValidationError('Invalid enrollment data: ' + errors.join('; '), errors);
  }
};

export const validateBreakData = (breakData) => {
  if (!breakData || typeof breakData !== 'object' || Array.isArray(breakData)) {
    throw new ValidationError('Break data must be an object');
  }

  const errors = [];

  if (!breakData.userId) errors.push('userId is required');
  if (!breakData.sessionId) errors.push('sessionId is required');
  if (!breakData.breakType) errors.push('breakType is required');
  if (!breakData.startTime) errors.push('startTime is required');
  if (breakData.duration !== undefined && breakData.duration !== null && breakData.duration < 0) {
    errors.push('duration must be positive');
  }

  if (errors.length > 0) {
    throw new ValidationError('Invalid break data: ' + errors.join('; '), errors);
  }
};

export const validateLessonCompletionData = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError('Lesson completion data must be an object');
  }

  const errors = [];

  if (!data.userId) errors.push('userId is required');
  if (!data.lessonId) errors.push('lessonId is required');
  if (!data.courseId) errors.push('courseId is required');

  if (errors.length > 0) {
    throw new ValidationError('Invalid lesson completion data: ' + errors.join('; '), errors);
  }
};

export const validatePVQData = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ValidationError('PVQ data must be an object');
  }

  const errors = [];

  if (!data.userId) errors.push('userId is required');
  if (!data.questionId) errors.push('questionId is required');
  if (!data.answer) errors.push('answer is required');

  if (errors.length > 0) {
    throw new ValidationError('Invalid PVQ data: ' + errors.join('; '), errors);
  }
};

export const validatePaymentData = (userId, courseId, amount, paymentType) => {
  const errors = [];

  if (!userId || typeof userId !== 'string') errors.push('userId is required');
  if (!courseId || typeof courseId !== 'string') errors.push('courseId is required');
  if (typeof amount !== 'number' || amount <= 0) errors.push('amount must be a positive number');
  if (!paymentType || typeof paymentType !== 'string') errors.push('paymentType is required');

  if (errors.length > 0) {
    throw new ValidationError('Invalid payment data: ' + errors.join('; '), errors);
  }
};

export const validateProgressData = (userId, courseId, totalLessons) => {
  const errors = [];

  if (!userId || typeof userId !== 'string') errors.push('userId is required');
  if (!courseId || typeof courseId !== 'string') errors.push('courseId is required');
  if (typeof totalLessons !== 'number' || totalLessons < 1) {
    errors.push('totalLessons must be a positive number');
  }

  if (errors.length > 0) {
    throw new ValidationError('Invalid progress data: ' + errors.join('; '), errors);
  }
};

export const validateLessonData = (lessonData) => {
  if (!lessonData || typeof lessonData !== 'object' || Array.isArray(lessonData)) {
    throw new ValidationError('Lesson data must be an object');
  }

  const errors = [];

  if (!lessonData.courseId) errors.push('courseId is required');
  if (!lessonData.moduleId) errors.push('moduleId is required');
  if (!lessonData.title) errors.push('title is required');

  if (errors.length > 0) {
    throw new ValidationError('Invalid lesson data: ' + errors.join('; '), errors);
  }
};

export const validateModuleData = (moduleData) => {
  if (!moduleData || typeof moduleData !== 'object' || Array.isArray(moduleData)) {
    throw new ValidationError('Module data must be an object');
  }

  const errors = [];

  if (!moduleData.courseId) errors.push('courseId is required');
  if (!moduleData.title) errors.push('title is required');

  if (errors.length > 0) {
    throw new ValidationError('Invalid module data: ' + errors.join('; '), errors);
  }
};

export const validateCourseData = (courseData) => {
  if (!courseData || typeof courseData !== 'object' || Array.isArray(courseData)) {
    throw new ValidationError('Course data must be an object');
  }

  const errors = [];

  if (!courseData.title) errors.push('title is required');
  if (!courseData.description) errors.push('description is required');

  if (errors.length > 0) {
    throw new ValidationError('Invalid course data: ' + errors.join('; '), errors);
  }
};

export const validateTimeSlotData = (slotData) => {
  if (!slotData || typeof slotData !== 'object' || Array.isArray(slotData)) {
    throw new ValidationError('Time slot data must be an object');
  }

  const errors = [];

  if (!slotData.instructorId) errors.push('instructorId is required');
  if (!slotData.startTime) errors.push('startTime is required');
  if (!slotData.endTime) errors.push('endTime is required');

  if (errors.length > 0) {
    throw new ValidationError('Invalid time slot data: ' + errors.join('; '), errors);
  }
};
