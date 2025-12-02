import { ValidationError } from '../../api/errors/ApiError.js';

export const validateAndThrow = (condition, message, ErrorClass = ValidationError) => {
  if (!condition) {
    throw new ErrorClass(message);
  }
};

export const handleServiceError = (error, context, logger) => {
  if (logger && typeof logger.logError === 'function') {
    logger.logError(error, context);
  }
  throw error;
};

export const createErrorContext = (method, ...args) => ({
  method,
  args,
  timestamp: new Date().toISOString()
});
