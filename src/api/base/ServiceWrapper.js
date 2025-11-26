import { ApiError, mapFirebaseError } from '../errors/ApiError';

export const executeService = async (
  operation,
  operationName = 'Operation',
  onError = null
) => {
  try {
    const result = await operation();
    return result;
  } catch (error) {
    let standardizedError = error;

    if (error instanceof ApiError) {
      standardizedError = error;
    } else if (error.code && error.message) {
      standardizedError = mapFirebaseError(error);
    } else {
      standardizedError = new ApiError(
        'UNKNOWN_ERROR',
        `${operationName} failed: ${error.message || 'Unknown error'}`,
        error
      );
    }

    if (onError) {
      onError(standardizedError);
    } else {
      console.error(
        `[${standardizedError.code}] ${standardizedError.message}`,
        standardizedError.originalError
      );
    }

    throw standardizedError;
  }
};

export const tryCatch = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw mapFirebaseError(error);
    }
  };
};
