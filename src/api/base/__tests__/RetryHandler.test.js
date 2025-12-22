import { RetryHandler, retryAsync, createRetryHandler } from '../RetryHandler.js';

describe('RetryHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new RetryHandler(3, 10, 100);
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const h = new RetryHandler();
      expect(h.maxAttempts).toBe(3);
      expect(h.initialDelayMs).toBe(100);
      expect(h.maxDelayMs).toBe(5000);
    });

    it('should initialize with custom values', () => {
      const h = new RetryHandler(5, 50, 2000);
      expect(h.maxAttempts).toBe(5);
      expect(h.initialDelayMs).toBe(50);
      expect(h.maxDelayMs).toBe(2000);
    });

    it('should enforce minimum values', () => {
      const h = new RetryHandler(0, 0, 50);
      expect(h.maxAttempts).toBeGreaterThanOrEqual(1);
      expect(h.initialDelayMs).toBeGreaterThanOrEqual(1);
      expect(h.maxDelayMs).toBeGreaterThanOrEqual(h.initialDelayMs);
    });
  });

  describe('getDelayMs', () => {
    it('should calculate exponential backoff', () => {
      const h = new RetryHandler(5, 100, 5000);

      const delay1 = h.getDelayMs(1);
      const delay2 = h.getDelayMs(2);
      const delay3 = h.getDelayMs(3);

      // Each should be roughly double (with jitter)
      expect(delay1).toBeGreaterThanOrEqual(90); // 100ms - 10% jitter
      expect(delay1).toBeLessThanOrEqual(110); // 100ms + 10% jitter

      expect(delay2).toBeGreaterThanOrEqual(180);
      expect(delay2).toBeLessThanOrEqual(220);

      expect(delay3).toBeGreaterThanOrEqual(360);
      expect(delay3).toBeLessThanOrEqual(440);
    });

    it('should cap delay at maxDelayMs', () => {
      const h = new RetryHandler(10, 100, 500);
      const delay10 = h.getDelayMs(10); // Would be 51200ms without cap

      expect(delay10).toBeLessThanOrEqual(550); // 500ms + 10% jitter
    });

    it('should add jitter to prevent thundering herd', () => {
      const h = new RetryHandler(3, 100, 5000);
      const delays = [];

      // Call multiple times - should get slightly different values
      for (let i = 0; i < 5; i++) {
        delays.push(h.getDelayMs(2));
      }

      // All delays should be different due to jitter
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });

  describe('isNonRetryableError', () => {
    it('should identify permission errors as non-retryable', () => {
      const error = new Error('Permission denied');
      error.code = 'PERMISSION_DENIED';

      expect(handler.isNonRetryableError(error)).toBe(true);
    });

    it('should identify auth errors as non-retryable', () => {
      const error = new Error('User is not authenticated');
      error.code = 'UNAUTHENTICATED';

      expect(handler.isNonRetryableError(error)).toBe(true);
    });

    it('should identify validation errors as non-retryable', () => {
      const error = new Error('Invalid field value');
      error.code = 'INVALID_ARGUMENT';

      expect(handler.isNonRetryableError(error)).toBe(true);
    });

    it('should identify not found errors as non-retryable', () => {
      const error = new Error('Document not found');
      error.code = 'NOT_FOUND';

      expect(handler.isNonRetryableError(error)).toBe(true);
    });

    it('should identify network errors as retryable', () => {
      const error = new Error('Network error');
      error.code = 'NETWORK_ERROR';

      expect(handler.isNonRetryableError(error)).toBe(false);
    });

    it('should identify timeout errors as retryable', () => {
      const error = new Error('Request timeout');
      error.code = 'TIMEOUT';

      expect(handler.isNonRetryableError(error)).toBe(false);
    });

    it('should check message for non-retryable patterns', () => {
      const error1 = new Error('Validation failed');
      expect(handler.isNonRetryableError(error1)).toBe(true);

      const error2 = new Error('User not found');
      expect(handler.isNonRetryableError(error2)).toBe(true);

      const error3 = new Error('Unauthorized access');
      expect(handler.isNonRetryableError(error3)).toBe(true);
    });
  });

  describe('sleep', () => {
    it('should wait for specified milliseconds', async () => {
      const startTime = Date.now();
      await handler.sleep(50);
      const elapsedTime = Date.now() - startTime;

      expect(elapsedTime).toBeGreaterThanOrEqual(40);
      expect(elapsedTime).toBeLessThan(100);
    });
  });

  describe('execute', () => {
    it('should succeed on first attempt', async () => {
      let attempts = 0;

      const result = await handler.execute(async () => {
        attempts++;
        return 'success';
      }, 'test-operation');

      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });

    it('should retry and eventually succeed', async () => {
      let attempts = 0;

      const result = await handler.execute(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Network timeout');
        }
        return 'success';
      }, 'test-operation');

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should fail immediately for non-retryable errors', async () => {
      let attempts = 0;

      try {
        await handler.execute(async () => {
          attempts++;
          const error = new Error('Invalid credentials');
          error.code = 'UNAUTHENTICATED';
          throw error;
        }, 'test-operation');
        fail('Should have thrown error');
      } catch (error) {
        expect(attempts).toBe(1);
        expect(error.message).toContain('Invalid credentials');
      }
    });

    it('should throw after max attempts exhausted', async () => {
      let attempts = 0;

      try {
        await handler.execute(async () => {
          attempts++;
          throw new Error('Persistent network error');
        }, 'test-operation');
        fail('Should have thrown error');
      } catch (error) {
        expect(attempts).toBe(3);
        // RetryHandler throws ApiError with RETRY_EXHAUSTED code
        expect(error.message).toContain('failed after 3 attempts');
        expect(error.message).toContain('Persistent network error');
      }
    });

    it('should throw ApiError with context information', async () => {
      try {
        await handler.execute(async () => {
          throw new Error('Connection failed');
        }, 'updateUser');
        fail('Should have thrown error');
      } catch (error) {
        // Should throw ApiError after exhausting retries
        expect(error.message).toContain('failed after 3 attempts');
        expect(error.message).toContain('Connection failed');
      }
    });

    it('should validate operation parameter', async () => {
      try {
        await handler.execute('not a function', 'test-operation');
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toContain('must be a function');
      }
    });

    it('should handle async operations correctly', async () => {
      let attempts = 0;

      const result = await handler.execute(async () => {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 5));
        if (attempts < 2) {
          throw new Error('Network error');
        }
        return 'async-success';
      }, 'async-operation');

      expect(result).toBe('async-success');
      expect(attempts).toBe(2);
    });

    it('should use exponential backoff timing', async () => {
      const shortHandler = new RetryHandler(3, 10, 100);
      let attempts = 0;
      const timings = [];
      let lastTime = Date.now();

      await shortHandler.execute(async () => {
        attempts++;
        const now = Date.now();
        if (attempts > 1) {
          timings.push(now - lastTime);
        }
        lastTime = now;

        if (attempts < 3) {
          throw new Error('Network error');
        }
        return 'success';
      }, 'timed-operation');

      // First retry should have ~10-20ms delay
      expect(timings[0]).toBeGreaterThanOrEqual(5);
      // Second retry should have ~20-40ms delay (roughly double)
      expect(timings[1]).toBeGreaterThanOrEqual(timings[0] - 10);
    });

    it('should handle errors with message property', async () => {
      const error = new Error('Something failed');
      error.message = 'Specific failure reason';

      try {
        await handler.execute(async () => {
          throw error;
        }, 'test-operation');
        fail('Should have thrown error');
      } catch (caughtError) {
        // Should include original error message in context
        expect(caughtError.message).toContain('failed after 3 attempts');
        expect(caughtError.message).toContain('Specific failure reason');
      }
    });

    it('should log context in thrown error', async () => {
      const error = new Error('Network unavailable');
      error.code = 'SERVICE_UNAVAILABLE';

      try {
        await handler.execute(async () => {
          throw error;
        }, 'myOperation');
        fail('Should have thrown error');
      } catch (caughtError) {
        // Should include operation name and attempt count
        expect(caughtError.message).toContain('myOperation');
        expect(caughtError.message).toContain('failed after 3 attempts');
        expect(caughtError.message).toContain('Network unavailable');
      }
    });
  });

  describe('retryAsync convenience function', () => {
    it('should work with default configuration', async () => {
      let attempts = 0;

      const result = await retryAsync(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Network error');
        }
        return 'success';
      }, 'test-operation');

      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    it('should throw after max attempts', async () => {
      try {
        await retryAsync(async () => {
          throw new Error('Persistent error');
        }, 'test-operation');
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toContain('failed after');
        expect(error.message).toContain('Persistent error');
      }
    });
  });

  describe('createRetryHandler factory', () => {
    it('should create handler with custom configuration', () => {
      const customHandler = createRetryHandler(5, 50, 2000);

      expect(customHandler.maxAttempts).toBe(5);
      expect(customHandler.initialDelayMs).toBe(50);
      expect(customHandler.maxDelayMs).toBe(2000);
    });

    it('should work with custom handler', async () => {
      const customHandler = createRetryHandler(2, 5, 50);
      let attempts = 0;

      try {
        await customHandler.execute(async () => {
          attempts++;
          throw new Error('Error');
        }, 'test');
        fail('Should have thrown');
      } catch (error) {
        expect(attempts).toBe(2);
        expect(error.message).toContain('failed after 2 attempts');
      }
    });
  });

  describe('real-world scenarios', () => {
    it('should handle temporary network failure', async () => {
      let attempts = 0;

      const result = await handler.execute(async () => {
        attempts++;
        if (attempts <= 2) {
          const error = new Error('Network error');
          error.code = 'NETWORK_TIMEOUT';
          throw error;
        }
        return { success: true, data: 'result' };
      }, 'fetchData');

      expect(result).toEqual({ success: true, data: 'result' });
      expect(attempts).toBe(3);
    });

    it('should fail fast on permission error', async () => {
      let attempts = 0;

      try {
        await handler.execute(async () => {
          attempts++;
          const error = new Error('Access denied');
          error.code = 'PERMISSION_DENIED';
          throw error;
        }, 'updateDocument');
        fail('Should have thrown');
      } catch (error) {
        expect(attempts).toBe(1);
        expect(error.message).toContain('Access denied');
      }
    });

    it('should recover from server temporarily unavailable', async () => {
      let attempts = 0;

      const result = await handler.execute(async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error('Service unavailable');
        }
        return 'success';
      }, 'submitForm');

      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });
  });
});
