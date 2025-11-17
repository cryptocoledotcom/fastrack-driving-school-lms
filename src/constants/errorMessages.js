// Error Messages Constants
// Centralized error messages for consistent user feedback

export const AUTH_ERRORS = {
  // Login Errors
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  USER_NOT_FOUND: 'No account found with this email address.',
  WRONG_PASSWORD: 'Incorrect password. Please try again.',
  TOO_MANY_REQUESTS: 'Too many failed login attempts. Please try again later.',
  USER_DISABLED: 'This account has been disabled. Please contact support.',
  
  // Registration Errors
  EMAIL_ALREADY_IN_USE: 'An account with this email already exists.',
  WEAK_PASSWORD: 'Password is too weak. Please use a stronger password.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  
  // Password Reset Errors
  RESET_EMAIL_FAILED: 'Failed to send password reset email. Please try again.',
  INVALID_RESET_CODE: 'Invalid or expired password reset code.',
  
  // General Auth Errors
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  AUTHENTICATION_REQUIRED: 'Please log in to access this page.'
};

export const VALIDATION_ERRORS = {
  // Required Fields
  REQUIRED_FIELD: 'This field is required.',
  EMAIL_REQUIRED: 'Email address is required.',
  PASSWORD_REQUIRED: 'Password is required.',
  NAME_REQUIRED: 'Name is required.',
  
  // Format Errors
  INVALID_EMAIL_FORMAT: 'Please enter a valid email address.',
  INVALID_PHONE_FORMAT: 'Please enter a valid phone number.',
  INVALID_DATE_FORMAT: 'Please enter a valid date.',
  
  // Length Errors
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long.',
  PASSWORD_TOO_LONG: 'Password must not exceed 128 characters.',
  NAME_TOO_SHORT: 'Name must be at least 2 characters long.',
  NAME_TOO_LONG: 'Name must not exceed 50 characters.',
  
  // Password Strength
  PASSWORD_NO_UPPERCASE: 'Password must contain at least one uppercase letter.',
  PASSWORD_NO_LOWERCASE: 'Password must contain at least one lowercase letter.',
  PASSWORD_NO_NUMBER: 'Password must contain at least one number.',
  PASSWORD_NO_SPECIAL: 'Password must contain at least one special character.',
  
  // Confirmation
  PASSWORDS_DO_NOT_MATCH: 'Passwords do not match.',
  
  // File Upload
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed size.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a supported file format.',
  
  // General
  INVALID_INPUT: 'Invalid input. Please check your entry and try again.'
};

export const NETWORK_ERRORS = {
  NO_CONNECTION: 'No internet connection. Please check your network.',
  TIMEOUT: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NOT_FOUND: 'The requested resource was not found.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  BAD_REQUEST: 'Invalid request. Please check your input.'
};

export const COURSE_ERRORS = {
  COURSE_NOT_FOUND: 'Course not found.',
  LESSON_NOT_FOUND: 'Lesson not found.',
  MODULE_NOT_FOUND: 'Module not found.',
  ENROLLMENT_FAILED: 'Failed to enroll in course. Please try again.',
  ALREADY_ENROLLED: 'You are already enrolled in this course.',
  COURSE_LOCKED: 'This course is locked. Complete prerequisites first.',
  LESSON_LOCKED: 'This lesson is locked. Complete previous lessons first.'
};

export const PROGRESS_ERRORS = {
  SAVE_FAILED: 'Failed to save progress. Please try again.',
  LOAD_FAILED: 'Failed to load progress data.',
  INVALID_PROGRESS: 'Invalid progress data.'
};

export const QUIZ_ERRORS = {
  SUBMISSION_FAILED: 'Failed to submit quiz. Please try again.',
  TIME_EXPIRED: 'Quiz time has expired.',
  MAX_ATTEMPTS_REACHED: 'Maximum quiz attempts reached.',
  INVALID_ANSWER: 'Please answer all questions before submitting.'
};

export const GENERAL_ERRORS = {
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  OPERATION_FAILED: 'Operation failed. Please try again.',
  DATA_LOAD_FAILED: 'Failed to load data. Please refresh the page.',
  UPDATE_FAILED: 'Failed to update. Please try again.',
  DELETE_FAILED: 'Failed to delete. Please try again.'
};

// Helper function to get user-friendly error message
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  
  // Firebase error codes
  const firebaseErrors = {
    'auth/invalid-email': AUTH_ERRORS.INVALID_EMAIL,
    'auth/user-disabled': AUTH_ERRORS.USER_DISABLED,
    'auth/user-not-found': AUTH_ERRORS.USER_NOT_FOUND,
    'auth/wrong-password': AUTH_ERRORS.WRONG_PASSWORD,
    'auth/email-already-in-use': AUTH_ERRORS.EMAIL_ALREADY_IN_USE,
    'auth/weak-password': AUTH_ERRORS.WEAK_PASSWORD,
    'auth/too-many-requests': AUTH_ERRORS.TOO_MANY_REQUESTS,
    'auth/network-request-failed': NETWORK_ERRORS.NO_CONNECTION
  };
  
  return firebaseErrors[error.code] || error.message || GENERAL_ERRORS.UNKNOWN_ERROR;
};

const errorMessages = {
  AUTH_ERRORS,
  VALIDATION_ERRORS,
  NETWORK_ERRORS,
  COURSE_ERRORS,
  PROGRESS_ERRORS,
  QUIZ_ERRORS,
  GENERAL_ERRORS,
  getErrorMessage
};

export default errorMessages;