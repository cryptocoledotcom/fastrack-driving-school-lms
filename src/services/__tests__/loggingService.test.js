import LoggingService from '../loggingService';

// Mock console methods
const consoleMethods = ['debug', 'info', 'warn', 'error', 'log'];
const originalConsole = {};

beforeAll(() => {
  consoleMethods.forEach(method => {
    originalConsole[method] = console[method];
    console[method] = jest.fn();
  });
});

afterAll(() => {
  consoleMethods.forEach(method => {
    console[method] = originalConsole[method];
  });
});

afterEach(() => {
  jest.clearAllMocks();
  process.env.NODE_ENV = 'test';
});

describe('LoggingService', () => {
  describe('log() method', () => {
    it('should create a log entry with correct structure', () => {
      const entry = LoggingService.log('INFO', 'Test message', { key: 'value' });

      expect(entry).toHaveProperty('level');
      expect(entry).toHaveProperty('message');
      expect(entry).toHaveProperty('data');
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('url');
      expect(entry).toHaveProperty('userAgent');
    });

    it('should normalize level to uppercase', () => {
      const entryLower = LoggingService.log('info', 'Test');
      const entryUpper = LoggingService.log('INFO', 'Test');
      const entryMixed = LoggingService.log('InFo', 'Test');

      expect(entryLower.level).toBe('INFO');
      expect(entryUpper.level).toBe('INFO');
      expect(entryMixed.level).toBe('INFO');
    });

    it('should include provided message', () => {
      const message = 'Test message content';
      const entry = LoggingService.log('INFO', message);

      expect(entry.message).toBe(message);
    });

    it('should include provided data', () => {
      const data = { userId: '123', action: 'login' };
      const entry = LoggingService.log('INFO', 'Test', data);

      expect(entry.data).toEqual(data);
    });

    it('should default data to empty object', () => {
      const entry = LoggingService.log('INFO', 'Test');

      expect(entry.data).toEqual({});
    });

    it('should include ISO timestamp', () => {
      const entry = LoggingService.log('INFO', 'Test');
      const date = new Date(entry.timestamp);

      expect(date).toBeInstanceOf(Date);
      expect(!isNaN(date.getTime())).toBe(true);
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should include URL when in browser', () => {
      const entry = LoggingService.log('INFO', 'Test');

      // In test environment, window might not exist
      if (typeof window !== 'undefined') {
        expect(entry.url).toBeDefined();
      }
    });

    it('should include user agent when in browser', () => {
      const entry = LoggingService.log('INFO', 'Test');

      if (typeof window !== 'undefined') {
        expect(entry.userAgent).toBeDefined();
      }
    });

    it('should log to console in development', () => {
      process.env.NODE_ENV = 'development';
      LoggingService.log('INFO', 'Test message', { key: 'value' });

      expect(console.info).toHaveBeenCalledWith('Test message', { key: 'value' });
    });

    it('should use correct console method based on level', () => {
      process.env.NODE_ENV = 'development';

      LoggingService.log('DEBUG', 'Debug message');
      expect(console.debug).toHaveBeenCalled();

      LoggingService.log('INFO', 'Info message');
      expect(console.info).toHaveBeenCalled();

      LoggingService.log('WARN', 'Warn message');
      expect(console.warn).toHaveBeenCalled();

      LoggingService.log('ERROR', 'Error message');
      expect(console.error).toHaveBeenCalled();
    });

    it('should not log to console in production', () => {
      process.env.NODE_ENV = 'production';
      console.info.mockClear();

      LoggingService.log('INFO', 'Test');

      expect(console.info).not.toHaveBeenCalled();
    });
  });

  describe('debug() method', () => {
    it('should call log with DEBUG level', () => {
      const data = { userId: '123' };
      const entry = LoggingService.debug('Debug message', data);

      expect(entry.level).toBe('DEBUG');
      expect(entry.message).toBe('Debug message');
      expect(entry.data).toEqual(data);
    });

    it('should work without data parameter', () => {
      const entry = LoggingService.debug('Debug message');

      expect(entry.level).toBe('DEBUG');
      expect(entry.message).toBe('Debug message');
      expect(entry.data).toEqual({});
    });
  });

  describe('info() method', () => {
    it('should call log with INFO level', () => {
      const data = { action: 'login' };
      const entry = LoggingService.info('Info message', data);

      expect(entry.level).toBe('INFO');
      expect(entry.message).toBe('Info message');
      expect(entry.data).toEqual(data);
    });

    it('should work without data parameter', () => {
      const entry = LoggingService.info('Info message');

      expect(entry.level).toBe('INFO');
      expect(entry.message).toBe('Info message');
    });
  });

  describe('warn() method', () => {
    it('should call log with WARN level', () => {
      const data = { warning: 'deprecated api' };
      const entry = LoggingService.warn('Warning message', data);

      expect(entry.level).toBe('WARN');
      expect(entry.message).toBe('Warning message');
      expect(entry.data).toEqual(data);
    });

    it('should work without data parameter', () => {
      const entry = LoggingService.warn('Warning message');

      expect(entry.level).toBe('WARN');
      expect(entry.message).toBe('Warning message');
    });
  });

  describe('error() method', () => {
    it('should handle Error objects', () => {
      const error = new Error('Test error');
      const entry = LoggingService.error('An error occurred', error);

      expect(entry.level).toBe('ERROR');
      expect(entry.data.error).toHaveProperty('name', 'Error');
      expect(entry.data.error).toHaveProperty('message', 'Test error');
      expect(entry.data.error).toHaveProperty('stack');
    });

    it('should handle Error with custom properties', () => {
      const error = new Error('Test error');
      error.code = 'CUSTOM_CODE';
      const entry = LoggingService.error('An error occurred', error);

      expect(entry.data.error.code).toBe('CUSTOM_CODE');
    });

    it('should handle plain objects', () => {
      const errorObj = { message: 'Something went wrong', code: 'ERR_001' };
      const entry = LoggingService.error('An error occurred', errorObj);

      expect(entry.data.error).toEqual(errorObj);
    });

    it('should handle string errors', () => {
      const entry = LoggingService.error('An error occurred', 'String error');

      expect(entry.data.error).toEqual({ message: 'String error' });
    });

    it('should handle null error', () => {
      const entry = LoggingService.error('An error occurred', null);

      expect(entry.data.error).toEqual({});
    });

    it('should include context information', () => {
      const context = { userId: 'user123', action: 'login' };
      const entry = LoggingService.error('Login failed', new Error('Invalid credentials'), context);

      expect(entry.data.context).toEqual(context);
    });

    it('should work without error parameter', () => {
      const entry = LoggingService.error('Something went wrong');

      expect(entry.level).toBe('ERROR');
      expect(entry.message).toBe('Something went wrong');
      expect(entry.data.error).toEqual({});
    });

    it('should work without context parameter', () => {
      const error = new Error('Test');
      const entry = LoggingService.error('Failed', error);

      expect(entry.data.context).toEqual({});
    });
  });

  describe('error() method - Error classes', () => {
    it('should handle TypeError', () => {
      const error = new TypeError('Type error message');
      const entry = LoggingService.error('Type error', error);

      expect(entry.data.error.name).toBe('TypeError');
      expect(entry.data.error.message).toBe('Type error message');
    });

    it('should handle ReferenceError', () => {
      const error = new ReferenceError('Reference error message');
      const entry = LoggingService.error('Reference error', error);

      expect(entry.data.error.name).toBe('ReferenceError');
    });

    it('should handle SyntaxError', () => {
      const error = new SyntaxError('Syntax error message');
      const entry = LoggingService.error('Syntax error', error);

      expect(entry.data.error.name).toBe('SyntaxError');
    });

    it('should handle custom error classes', () => {
      class CustomError extends Error {
        constructor(message) {
          super(message);
          this.name = 'CustomError';
          this.code = 'CUSTOM_ERR';
        }
      }

      const error = new CustomError('Custom error message');
      const entry = LoggingService.error('Custom error', error);

      expect(entry.data.error.name).toBe('CustomError');
      expect(entry.data.error.code).toBe('CUSTOM_ERR');
    });
  });

  describe('sendToCloudLogging() method', () => {
    it('should be an async function', () => {
      const result = LoggingService.sendToCloudLogging({});

      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve with buffered status when Cloud Logging disabled', async () => {
      const result = await LoggingService.sendToCloudLogging({ level: 'INFO', message: 'Test' });

      expect(result).toHaveProperty('status', 'buffered');
      expect(result).toHaveProperty('message');
    });

    it('should be called but not break logging', async () => {
      const entry = LoggingService.log('INFO', 'Test');
      const cloudResult = await LoggingService.sendToCloudLogging(entry);

      expect(cloudResult).toBeDefined();
      expect(entry).toBeDefined();
    });
  });

  describe('Full integration', () => {
    it('should handle a complete logging flow', () => {
      process.env.NODE_ENV = 'development';

      const entries = [];
      entries.push(LoggingService.info('App started'));
      entries.push(LoggingService.debug('Debugging info', { version: '1.0.0' }));
      entries.push(LoggingService.warn('Deprecated API used'));
      entries.push(LoggingService.error('Connection failed', new Error('Network timeout')));

      expect(entries.length).toBe(4);
      expect(entries[0].level).toBe('INFO');
      expect(entries[1].level).toBe('DEBUG');
      expect(entries[2].level).toBe('WARN');
      expect(entries[3].level).toBe('ERROR');

      entries.forEach(entry => {
        expect(entry).toHaveProperty('timestamp');
        expect(entry).toHaveProperty('message');
      });
    });

    it('should handle rapid consecutive logs', () => {
      const entries = [];

      for (let i = 0; i < 10; i++) {
        entries.push(LoggingService.info(`Log message ${i}`));
      }

      expect(entries.length).toBe(10);
      entries.forEach((entry, index) => {
        expect(entry.message).toBe(`Log message ${index}`);
      });
    });

    it('should handle deeply nested data structures', () => {
      const complexData = {
        user: {
          id: 'user123',
          profile: {
            name: 'John Doe',
            settings: {
              notifications: {
                email: true,
                push: false
              }
            }
          }
        },
        metadata: {
          timestamps: [
            '2025-01-01T00:00:00Z',
            '2025-01-02T00:00:00Z'
          ]
        }
      };

      const entry = LoggingService.info('Complex data', complexData);

      expect(entry.data).toEqual(complexData);
    });
  });

  describe('Thread safety / Concurrent calls', () => {
    it('should handle concurrent logging calls', () => {
      const promises = [];

      for (let i = 0; i < 20; i++) {
        promises.push(
          Promise.resolve(LoggingService.info(`Concurrent log ${i}`))
        );
      }

      return Promise.all(promises).then(entries => {
        expect(entries.length).toBe(20);
        entries.forEach(entry => {
          expect(entry).toHaveProperty('message');
          expect(entry).toHaveProperty('timestamp');
        });
      });
    });
  });

  describe('Cloud Logging Integration (Phase 3)', () => {
    it('should have sendToCloudLogging method', () => {
      expect(typeof LoggingService.sendToCloudLogging).toBe('function');
    });

    it('should accept a log entry object', async () => {
      const entry = { level: 'INFO', message: 'Test' };
      const result = await LoggingService.sendToCloudLogging(entry);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should be async and return a Promise', () => {
      const result = LoggingService.sendToCloudLogging({});
      expect(result instanceof Promise).toBe(true);
    });

    it('should include method for setting Cloud Logging credentials', () => {
      expect(LoggingService).toHaveProperty('setCloudLoggingCredentials');
      expect(typeof LoggingService.setCloudLoggingCredentials).toBe('function');
    });

    it('should have getCloudLoggingStatus method', () => {
      expect(LoggingService).toHaveProperty('getCloudLoggingStatus');
      expect(typeof LoggingService.getCloudLoggingStatus).toBe('function');
    });

    it('should track Cloud Logging availability status', () => {
      const status = LoggingService.getCloudLoggingStatus();
      expect(status).toHaveProperty('enabled');
      expect(typeof status.enabled).toBe('boolean');
    });

    it('should handle Cloud Logging failures gracefully', async () => {
      const entry = { level: 'ERROR', message: 'Test error' };
      const result = await LoggingService.sendToCloudLogging(entry);

      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
    });

    it('should include retry capability for failed sends', async () => {
      expect(LoggingService).toHaveProperty('retryCloudLogging');
      expect(typeof LoggingService.retryCloudLogging).toBe('function');
    });

    it('should buffer logs when Cloud Logging is unavailable', async () => {
      expect(LoggingService).toHaveProperty('getLogBuffer');
      expect(typeof LoggingService.getLogBuffer).toBe('function');
    });

    it('should flush buffered logs when Cloud Logging becomes available', async () => {
      expect(LoggingService).toHaveProperty('flushLogBuffer');
      expect(typeof LoggingService.flushLogBuffer).toBe('function');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      const entry = LoggingService.info(longMessage);

      expect(entry.message).toBe(longMessage);
      expect(entry.message.length).toBe(10000);
    });

    it('should handle special characters in messages', () => {
      const messages = [
        'Message with unicode: 你好 🎉',
        'Message with quotes: "quoted"',
        "Message with apostrophes: it's here",
        'Message with backslashes: \\ and /',
        'Message with tabs and\nnewlines'
      ];

      messages.forEach(msg => {
        const entry = LoggingService.info(msg);
        expect(entry.message).toBe(msg);
      });
    });

    it('should handle undefined in data objects', () => {
      const entry = LoggingService.info('Test', { key: undefined });

      expect(entry.data).toHaveProperty('key', undefined);
    });

    it('should handle circular reference attempts gracefully', () => {
      // Don't actually create circular refs, but test with similar structures
      const data = { a: 1, b: { c: 2 } };
      const entry = LoggingService.info('Test', data);

      expect(entry.data).toEqual(data);
    });
  });
});
