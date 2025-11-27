class LoggingService {
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

    // Console logging in development
    if (process.env.NODE_ENV === 'development') {
      const logMethod = level.toLowerCase();
      if (typeof console[logMethod] === 'function') {
        console[logMethod](message, data);
      } else {
        console.log(message, data);
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
   * Placeholder for Cloud Logging integration
   * Will be implemented in Phase 3
   * @param {object} entry - Log entry to send
   * @returns {Promise}
   */
  static async sendToCloudLogging(entry) {
    // TODO: Implement Cloud Logging integration
    // Example:
    // const response = await fetch('/api/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(entry)
    // });
    // return response.json();
    return Promise.resolve({
      status: 'pending',
      message: 'Cloud Logging not yet implemented'
    });
  }
}

export default LoggingService;
