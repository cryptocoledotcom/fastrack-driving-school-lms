import { validateAndThrow, handleServiceError, createErrorContext } from '../errorHandler.js';
import { ValidationError } from '../../errors/ApiError.js';

describe('errorHandler', () => {
  describe('validateAndThrow', () => {
    it('should throw ValidationError when condition is false', () => {
      expect(() => {
        validateAndThrow(false, 'Test error');
      }).toThrow(ValidationError);
    });

    it('should throw with custom message', () => {
      expect(() => {
        validateAndThrow(false, 'Custom message');
      }).toThrow('Custom message');
    });

    it('should not throw when condition is true', () => {
      expect(() => {
        validateAndThrow(true, 'Test error');
      }).not.toThrow();
    });

    it('should use custom ErrorClass', () => {
      class CustomError extends Error {
        constructor(message) {
          super(message);
          this.name = 'CustomError';
        }
      }
      
      expect(() => {
        validateAndThrow(false, 'Custom', CustomError);
      }).toThrow(CustomError);
    });

    it('should handle truthy values correctly', () => {
      expect(() => {
        validateAndThrow('non-empty string', 'Error');
      }).not.toThrow();
      
      expect(() => {
        validateAndThrow(1, 'Error');
      }).not.toThrow();
      
      expect(() => {
        validateAndThrow(true, 'Error');
      }).not.toThrow();
    });

    it('should handle falsy values correctly', () => {
      expect(() => {
        validateAndThrow(0, 'Error');
      }).toThrow();
      
      expect(() => {
        validateAndThrow('', 'Error');
      }).toThrow();
      
      expect(() => {
        validateAndThrow(null, 'Error');
      }).toThrow();
    });
  });

  describe('handleServiceError', () => {
    it('should throw error without logger', () => {
      const testError = new Error('Test');
      expect(() => {
        handleServiceError(testError, { method: 'test' });
      }).toThrow('Test');
    });

    it('should call logger.logError when logger provided', () => {
      const testError = new Error('Test');
      const mockLogger = { logError: jest.fn() };
      const context = { method: 'test', userId: '123' };

      expect(() => {
        handleServiceError(testError, context, mockLogger);
      }).toThrow();
      
      expect(mockLogger.logError).toHaveBeenCalledWith(testError, context);
    });

    it('should ignore logger if logError is not function', () => {
      const testError = new Error('Test');
      const mockLogger = { logError: 'not a function' };

      expect(() => {
        handleServiceError(testError, {}, mockLogger);
      }).toThrow();
    });
  });

  describe('createErrorContext', () => {
    it('should create error context with method name', () => {
      const context = createErrorContext('testMethod');
      expect(context.method).toBe('testMethod');
      expect(context.timestamp).toBeDefined();
    });

    it('should include args in context', () => {
      const context = createErrorContext('testMethod', 'arg1', 'arg2');
      expect(context.args).toEqual(['arg1', 'arg2']);
    });

    it('should have valid ISO timestamp', () => {
      const context = createErrorContext('test');
      expect(new Date(context.timestamp)).not.toBeNaN();
    });

    it('should handle no args', () => {
      const context = createErrorContext('test');
      expect(context.args).toEqual([]);
    });
  });
});
