// Validation Rules Constants
// Centralized validation rules and regex patterns

export const VALIDATION_RULES = {
  // Password Rules
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  
  // Email Rules
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  EMAIL_MAX_LENGTH: 254,
  
  // Name Rules
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  NAME_REGEX: /^[a-zA-Z\s'-]+$/,
  
  // Phone Rules
  PHONE_REGEX: /^\+?[\d\s\-()]+$/,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
  
  // Username Rules
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  USERNAME_REGEX: /^[a-zA-Z0-9_-]+$/,
  
  // Age Rules
  MIN_AGE: 16, // Minimum age for driving school
  MAX_AGE: 100,
  
  // Text Fields
  SHORT_TEXT_MAX_LENGTH: 100,
  MEDIUM_TEXT_MAX_LENGTH: 500,
  LONG_TEXT_MAX_LENGTH: 2000,
  
  // Numbers
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  
  // File Upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB in bytes
  MAX_VIDEO_SIZE: 100 * 1024 * 1024 // 100MB in bytes
};

// Validation Functions
export const validators = {
  // Email Validator
  isValidEmail: (email) => {
    if (!email) return false;
    return VALIDATION_RULES.EMAIL_REGEX.test(email) && 
           email.length <= VALIDATION_RULES.EMAIL_MAX_LENGTH;
  },
  
  // Password Validator
  isValidPassword: (password) => {
    if (!password) return false;
    return password.length >= VALIDATION_RULES.PASSWORD_MIN_LENGTH &&
           password.length <= VALIDATION_RULES.PASSWORD_MAX_LENGTH;
  },
  
  // Strong Password Validator
  isStrongPassword: (password) => {
    if (!password) return false;
    return VALIDATION_RULES.PASSWORD_REGEX.test(password) &&
           password.length >= VALIDATION_RULES.PASSWORD_MIN_LENGTH;
  },
  
  // Name Validator
  isValidName: (name) => {
    if (!name) return false;
    return name.length >= VALIDATION_RULES.NAME_MIN_LENGTH &&
           name.length <= VALIDATION_RULES.NAME_MAX_LENGTH &&
           VALIDATION_RULES.NAME_REGEX.test(name);
  },
  
  // Phone Validator
  isValidPhone: (phone) => {
    if (!phone) return false;
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    return cleanPhone.length >= VALIDATION_RULES.PHONE_MIN_LENGTH &&
           cleanPhone.length <= VALIDATION_RULES.PHONE_MAX_LENGTH &&
           VALIDATION_RULES.PHONE_REGEX.test(phone);
  },
  
  // Username Validator
  isValidUsername: (username) => {
    if (!username) return false;
    return username.length >= VALIDATION_RULES.USERNAME_MIN_LENGTH &&
           username.length <= VALIDATION_RULES.USERNAME_MAX_LENGTH &&
           VALIDATION_RULES.USERNAME_REGEX.test(username);
  },
  
  // Age Validator
  isValidAge: (age) => {
    const numAge = parseInt(age, 10);
    return !isNaN(numAge) && 
           numAge >= VALIDATION_RULES.MIN_AGE && 
           numAge <= VALIDATION_RULES.MAX_AGE;
  },
  
  // Required Field Validator
  isRequired: (value) => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
  },
  
  // File Size Validator
  isValidFileSize: (file, maxSize = VALIDATION_RULES.MAX_FILE_SIZE) => {
    return file && file.size <= maxSize;
  },
  
  // File Type Validator
  isValidFileType: (file, allowedTypes) => {
    return file && allowedTypes.includes(file.type);
  },
  
  // URL Validator
  isValidURL: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  // Score Validator
  isValidScore: (score) => {
    const numScore = parseFloat(score);
    return !isNaN(numScore) && 
           numScore >= VALIDATION_RULES.MIN_SCORE && 
           numScore <= VALIDATION_RULES.MAX_SCORE;
  }
};

export default {
  VALIDATION_RULES,
  validators
};