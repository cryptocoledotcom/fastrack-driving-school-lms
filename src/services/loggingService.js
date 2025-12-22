class LoggingService {
  static cloudLoggingEnabled = false;
  static cloudLoggingCredentials = null;
  static logBuffer = [];
  static maxBufferSize = 100;
  static retryAttempts = 0;
  static maxRetryAttempts = 3;

  /**
   * Create a log entry with level, message, and additional data
   * @param {string} level - Log level: DEBUG, INFO, WARN, ERROR
   * @param {string} message - Log message
   * @param {object} data - Additional data to log
   * @returns {object} Log entry
   */
  static log(level, message, data = {}) {
    const logEntry = {
      level: level.toUpperCase(),
      message,
      data,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'Node.js',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'
    };

    // Console logging in development and test environments
    const isDevelopment = import.meta.env.MODE !== 'production';
    if (isDevelopment) {
      const logMethod = level.toLowerCase();
      if (logMethod === 'error' || logMethod === 'warn') {
        // eslint-disable-next-line no-console
        console[logMethod](message, data);
      } else {
        console.warn(message, data);
      }
    }

    // TODO: Send to Cloud Logging in production
    // This will be implemented in Phase 3
    // if (process.env.NODE_ENV === 'production') {
    //   await this.sendToCloudLogging(logEntry);
    // }

    return logEntry;
  }

  /**
   * Log a debug message
   * @param {string} message - Debug message
   * @param {object} data - Additional data
   * @returns {object} Log entry
   */
  static debug(message, data = {}) {
    return this.log('DEBUG', message, data);
  }

  /**
   * Log an info message
   * @param {string} message - Info message
   * @param {object} data - Additional data
   * @returns {object} Log entry
   */
  static info(message, data = {}) {
    return this.log('INFO', message, data);
  }

  /**
   * Log a warning message
   * @param {string} message - Warning message
   * @param {object} data - Additional data
   * @returns {object} Log entry
   */
  static warn(message, data = {}) {
    return this.log('WARN', message, data);
  }

  /**
   * Log an error message
   * @param {string} message - Error message
   * @param {Error|object|string} error - Error object or data
   * @param {object} context - Additional context
   * @returns {object} Log entry
   */
  static error(message, error = null, context = {}) {
    let errorData = {};

    if (error instanceof Error) {
      errorData = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code || null
      };
    } else if (typeof error === 'object' && error !== null) {
      errorData = error;
    } else if (typeof error === 'string') {
      errorData = { message: error };
    }

    return this.log('ERROR', message, {
      error: errorData,
      context
    });
  }

  /**
   * Cloud Logging integration for production environments
   * @param {object} entry - Log entry to send to Cloud Logging
   * @returns {Promise} Result of Cloud Logging operation
   */
  static async sendToCloudLogging(entry) {
    if (!this.cloudLoggingEnabled) {
      this.bufferLog(entry);
      return Promise.resolve({
        status: 'buffered',
        message: 'Cloud Logging not enabled, log buffered locally'
      });
    }

    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.cloudLoggingCredentials?.authHeader && {
            Authorization: this.cloudLoggingCredentials.authHeader
          })
        },
        body: JSON.stringify(entry)
      });

      if (!response.ok) {
        throw new Error(`Cloud Logging error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      this.logError('Cloud Logging failed', error, {
        entry,
        attempt: this.retryAttempts
      });
      this.bufferLog(entry);
      return Promise.resolve({
        status: 'error',
        message: `Cloud Logging failed: ${error.message}`,
        buffered: true
      });
    }
  }

  /**
   * Set Cloud Logging credentials
   * @param {object} credentials - Cloud Logging credentials
   * @returns {void}
   */
  static setCloudLoggingCredentials(credentials) {
    if (credentials && typeof credentials === 'object') {
      this.cloudLoggingCredentials = credentials;
      this.cloudLoggingEnabled = true;
      this.info('Cloud Logging enabled');
      this.flushLogBuffer();
    }
  }

  /**
   * Get Cloud Logging status
   * @returns {object} Cloud Logging status
   */
  static getCloudLoggingStatus() {
    return {
      enabled: this.cloudLoggingEnabled,
      hasCredentials: !!this.cloudLoggingCredentials,
      bufferSize: this.logBuffer.length,
      retryAttempts: this.retryAttempts,
      maxRetryAttempts: this.maxRetryAttempts
    };
  }

  /**
   * Buffer a log entry for later sending to Cloud Logging
   * @param {object} entry - Log entry to buffer
   * @returns {void}
   */
  static bufferLog(entry) {
    if (this.logBuffer.length < this.maxBufferSize) {
      this.logBuffer.push({
        ...entry,
        bufferedAt: new Date().toISOString()
      });
    } else {
      this.logBuffer.shift();
      this.logBuffer.push({
        ...entry,
        bufferedAt: new Date().toISOString()
      });
    }
  }

  /**
   * Get buffered logs
   * @returns {array} Array of buffered log entries
   */
  static getLogBuffer() {
    return [...this.logBuffer];
  }

  /**
   * Clear the log buffer
   * @returns {void}
   */
  static clearLogBuffer() {
    this.logBuffer = [];
    this.retryAttempts = 0;
  }

  /**
   * Retry sending Cloud Logging entries from buffer
   * @returns {Promise<number>} Number of logs sent
   */
  static async retryCloudLogging() {
    if (!this.cloudLoggingEnabled) {
      return Promise.resolve(0);
    }

    if (this.retryAttempts >= this.maxRetryAttempts) {
      this.warn('Max retry attempts reached for Cloud Logging');
      return Promise.resolve(0);
    }

    this.retryAttempts += 1;
    const buffer = [...this.logBuffer];
    let successCount = 0;

    for (const entry of buffer) {
      try {
        const response = await fetch('/api/logs/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.cloudLoggingCredentials?.authHeader && {
              Authorization: this.cloudLoggingCredentials.authHeader
            })
          },
          body: JSON.stringify([entry])
        });

        if (response.ok) {
          this.logBuffer = this.logBuffer.filter(e => e !== entry);
          successCount += 1;
        }
      } catch (error) {
        this.error('Retry failed for Cloud Logging entry', error);
      }
    }

    if (this.logBuffer.length === 0) {
      this.retryAttempts = 0;
    }

    return Promise.resolve(successCount);
  }

  /**
   * Flush all buffered logs to Cloud Logging
   * @returns {Promise<number>} Number of logs sent
   */
  static async flushLogBuffer() {
    if (!this.cloudLoggingEnabled || this.logBuffer.length === 0) {
      return Promise.resolve(0);
    }

    try {
      const buffer = [...this.logBuffer];
      const response = await fetch('/api/logs/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.cloudLoggingCredentials?.authHeader && {
            Authorization: this.cloudLoggingCredentials.authHeader
          })
        },
        body: JSON.stringify(buffer)
      });

      if (response.ok) {
        this.clearLogBuffer();
        this.info(`Flushed ${buffer.length} logs to Cloud Logging`);
        return Promise.resolve(buffer.length);
      }

      return Promise.resolve(0);
    } catch (error) {
      this.error('Failed to flush log buffer to Cloud Logging', error);
      return Promise.resolve(0);
    }
  }
}

export default LoggingService;
