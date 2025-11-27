export class ApiError extends Error {
  constructor(code, message, originalError = null) {
    super(message);
    this.code = code;
    this.message = message;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        timestamp: this.timestamp
      }
    };
  }
}

export class ValidationError extends ApiError {
  constructor(message, fields = []) {
    super('VALIDATION_ERROR', message);
    this.fields = fields;
  }
}

export class NotFoundError extends ApiError {
  constructor(resource, id) {
    super('NOT_FOUND', `${resource} with id ${id} not found`);
    this.resource = resource;
    this.id = id;
  }
}

export class AuthError extends ApiError {
  constructor(message = 'Authentication required') {
    super('AUTH_ERROR', message);
  }
}

export class PermissionError extends ApiError {
  constructor(message = 'Permission denied') {
    super('PERMISSION_ERROR', message);
  }
}

export class ComplianceError extends ApiError {
  constructor(message, details = {}) {
    super('COMPLIANCE_ERROR', message);
    this.details = details;
  }
}

export class EnrollmentError extends ApiError {
  constructor(message, enrollment = null) {
    super('ENROLLMENT_ERROR', message);
    this.enrollment = enrollment;
  }
}

export class PaymentError extends ApiError {
  constructor(message, paymentId = null) {
    super('PAYMENT_ERROR', message);
    this.paymentId = paymentId;
  }
}

export class QuizError extends ApiError {
  constructor(message, quizId = null) {
    super('QUIZ_ERROR', message);
    this.quizId = quizId;
  }
}

export class ProgressError extends ApiError {
  constructor(message, courseId = null) {
    super('PROGRESS_ERROR', message);
    this.courseId = courseId;
  }
}

export class LessonError extends ApiError {
  constructor(message, lessonId = null) {
    super('LESSON_ERROR', message);
    this.lessonId = lessonId;
  }
}

export class ModuleError extends ApiError {
  constructor(message, moduleId = null) {
    super('MODULE_ERROR', message);
    this.moduleId = moduleId;
  }
}

export class CourseError extends ApiError {
  constructor(message, courseId = null) {
    super('COURSE_ERROR', message);
    this.courseId = courseId;
  }
}

export class PVQError extends ApiError {
  constructor(message, questionId = null) {
    super('PVQ_ERROR', message);
    this.questionId = questionId;
  }
}

export class SchedulingError extends ApiError {
  constructor(message, slotId = null) {
    super('SCHEDULING_ERROR', message);
    this.slotId = slotId;
  }
}

export class SecurityError extends ApiError {
  constructor(message, userId = null) {
    super('SECURITY_ERROR', message);
    this.userId = userId;
  }
}

export class UserError extends ApiError {
  constructor(message, userId = null) {
    super('USER_ERROR', message);
    this.userId = userId;
  }
}

export const mapFirebaseError = (error) => {
  const errorMap = {
    'auth/user-not-found': new AuthError('User not found'),
    'auth/wrong-password': new AuthError('Invalid credentials'),
    'auth/email-already-in-use': new AuthError('Email already registered'),
    'auth/weak-password': new ValidationError('Password must be at least 6 characters'),
    'permission-denied': new PermissionError('Access denied by Firestore rules'),
    'not-found': new NotFoundError('Document'),
    'unavailable': new ApiError('SERVICE_UNAVAILABLE', 'Service temporarily unavailable')
  };

  const mappedError = errorMap[error.code];
  if (mappedError) return mappedError;

  return new ApiError(
    'UNKNOWN_ERROR',
    error.message || 'An unexpected error occurred',
    error
  );
};
