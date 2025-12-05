import { ValidationError } from '../../api/errors/ApiError.js';

export const validateString = (value, fieldName) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${fieldName} must be a non-empty string`);
  }
  return value;
};

export const validateNumber = (value, fieldName, options = {}) => {
  const { min, max, integer = false } = options;
  
  if (typeof value !== 'number') {
    throw new ValidationError(`${fieldName} must be a number`);
  }
  
  if (integer && !Number.isInteger(value)) {
    throw new ValidationError(`${fieldName} must be an integer`);
  }
  
  if (min !== undefined && value < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`);
  }
  
  if (max !== undefined && value > max) {
    throw new ValidationError(`${fieldName} must be at most ${max}`);
  }
  
  return value;
};

export const validateObject = (value, fieldName) => {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length === 0) {
    throw new ValidationError(`${fieldName} must be a non-empty object`);
  }
  return value;
};

export const validateArray = (value, fieldName) => {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`);
  }
  return value;
};

export const validateEmail = (value) => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(value)) {
    throw new ValidationError('Invalid email format');
  }
  return value;
};

export const validateOneOf = (value, allowedValues, fieldName) => {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }
  return value;
};

export const validateRequired = (value, fieldName) => {
  if (value === null || value === undefined) {
    throw new ValidationError(`${fieldName} is required`);
  }
  return value;
};
