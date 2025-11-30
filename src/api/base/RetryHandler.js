import { ApiError } from '../errors/ApiError.js';

/**
 * RetryHandler: Implements exponential backoff retry logic
 * for network failures and transient errors
 *
 * Retry strategy:
 * - Attempt 1: 100ms + jitter (10%)
 * - Attempt 2: 200ms + jitter (10%)
 * - Attempt 3: 400ms + jitter (10%)
 * - Max delay capped at 5000ms
 *
 * Non-retryable errors (fail immediately):
 * - Authentication errors
 * - Permission denied
 * - Validation errors
 * - Not found errors
 *
 * @example
 * const handler = new RetryHandler(3, 100, 5000);
 * const result = await handler.execute(() => updateDoc(ref, data), 'updateDoc');
 */
export class RetryHandler {
  constructor(maxAttempts = 3, initialDelayMs = 100, maxDelayMs = 5000) {
    this.maxAttempts = Math.max(1, maxAttempts);
    this.initialDelayMs = Math.max(1, initialDelayMs);
    this.maxDelayMs = Math.max(this.initialDelayMs, maxDelayMs);
  }

  /**
   * Calculate delay with exponential backoff and jitter
   * @param {number} attemptNumber - Current attempt (1-indexed)
   * @returns {number} Delay in milliseconds
   */
  getDelayMs(attemptNumber) {
    // Exponential: 100ms, 200ms, 400ms, 800ms, ...
    const exponentialDelay = this.initialDelayMs * Math.pow(2, attemptNumber - 1);

    // Cap at maxDelayMs
    const cappedDelay = Math.min(exponentialDelay, this.maxDelayMs);

    // Add jitter (±10% random variation to prevent thundering herd)
    const jitterAmount = cappedDelay * 0.1;
    const jitter = (Math.random() - 0.5) * jitterAmount * 2;

    return Math.max(0, cappedDelay + jitter);
  }

  /**
   * Execute operation with automatic retry on failure
   * @param {Function} operation - Async function to execute
   * @param {string} operationName - Name for logging and error context
   * @returns {Promise} Result of successful operation
   * @throws {ApiError} If all retries exhausted
   */
  async execute(operation, operationName = 'Operation') {
    if (typeof operation !== 'function') {
      throw new ApiError(
        'Operation must be a function',
        'INVALID_OPERATION',
        400
      );
    }

    let lastError;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        // Execute operation
        const result = await operation();

        // Log success (but only log multi-attempt success)
        if (attempt > 1) {
          console.log(
            `✅ [${operationName}] Succeeded on attempt ${attempt}/${this.maxAttempts}`
          );
        }

        return result;

      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (this.isNonRetryableError(error)) {
          console.error(
            `❌ [${operationName}] Non-retryable error on attempt ${attempt}: ${error.message}`
          );
          // If already an ApiError, re-throw as-is
          if (error instanceof ApiError) {
            throw error;
          }
          // Otherwise wrap in ApiError
          throw new ApiError(
            error.message,
            error.code || 'NON_RETRYABLE_ERROR',
            500
          );
        }

        // If last attempt, break loop and throw
        if (attempt === this.maxAttempts) {
          console.error(
            `❌ [${operationName}] Failed after ${this.maxAttempts} attempts. Last error: ${error.message}`
          );
          break;
        }

        // Calculate delay and log retry
        const delayMs = this.getDelayMs(attempt);
        console.warn(
          `⏱️  [${operationName}] Attempt ${attempt}/${this.maxAttempts} failed, retrying in ${Math.round(delayMs)}ms: ${error.message}`
        );

        // Wait before retrying
        await this.sleep(delayMs);
      }
    }

    // All retries exhausted - throw comprehensive error
    throw new ApiError(
      `${operationName} failed after ${this.maxAttempts} attempts: ${lastError?.message || 'Unknown error'}`,
      'RETRY_EXHAUSTED',
      500,
      {
        operationName,
        attempts: this.maxAttempts,
        lastErrorCode: lastError?.code,
        lastErrorMessage: lastError?.message
      }
    );
  }

  /**
   * Determine if error should NOT be retried
   * @param {Error} error - Error to check
   * @returns {boolean} True if error is non-retryable
   */
  isNonRetryableError(error) {
    // Codes that indicate permanent failures
    const nonRetryableCodes = [
      'PERMISSION_DENIED',
      'UNAUTHENTICATED',
      'INVALID_ARGUMENT',
      'NOT_FOUND',
      'ALREADY_EXISTS',
      'FAILED_PRECONDITION',
      'INVALID_OPERATION',
      'FORBIDDEN',
      'UNAUTHORIZED',
      'BAD_REQUEST'
    ];

    // Extract error code
    const errorCode = error.code || error.message || '';

    // Check if code matches non-retryable patterns
    if (nonRetryableCodes.some(code => errorCode.includes(code))) {
      return true;
    }

    // Check if error message contains non-retryable indicators
    const message = error.message || '';
    const nonRetryablePatterns = [
      'validation',
      'invalid',
      'permission',
      'unauthorized',
      'not found',
      'does not exist'
    ];

    return nonRetryablePatterns.some(pattern =>
      message.toLowerCase().includes(pattern)
    );
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Singleton instance with default retry configuration
 * - Max 3 attempts
 * - Initial delay: 100ms
 * - Max delay: 5000ms (5 seconds)
 */
export const defaultRetryHandler = new RetryHandler(3, 100, 5000);

/**
 * Convenience function for retrying operations
 * Uses default retry configuration
 *
 * @param {Function} operation - Async function to retry
 * @param {string} operationName - Name for logging
 * @returns {Promise} Result of successful operation
 *
 * @example
 * const result = await retryAsync(
 *   () => updateDoc(userRef, { name: 'John' }),
 *   'updateUserName'
 * );
 */
export const retryAsync = (operation, operationName = 'Operation') => {
  return defaultRetryHandler.execute(operation, operationName);
};

/**
 * Create custom retry handler with specific configuration
 *
 * @param {number} maxAttempts - Maximum retry attempts
 * @param {number} initialDelayMs - Initial delay in milliseconds
 * @param {number} maxDelayMs - Maximum delay cap in milliseconds
 * @returns {RetryHandler} Configured retry handler
 *
 * @example
 * const aggressiveRetry = createRetryHandler(5, 50, 2000);
 * const result = await aggressiveRetry.execute(operation, 'operationName');
 */
export const createRetryHandler = (maxAttempts, initialDelayMs, maxDelayMs) => {
  return new RetryHandler(maxAttempts, initialDelayMs, maxDelayMs);
};

export default {
  RetryHandler,
  defaultRetryHandler,
  retryAsync,
  createRetryHandler
};
