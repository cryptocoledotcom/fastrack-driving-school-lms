/**
 * Sanitizer - Clean and validate user input to prevent XSS and injection attacks
 */
class Sanitizer {
  /**
   * Sanitize a string by removing/escaping dangerous characters
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  static sanitizeString(str) {
    if (typeof str !== 'string') {
      return str;
    }

    return str
      .trim()
      .replace(/[<>]/g, '');
  }

  /**
   * Recursively sanitize all strings in an object
   * @param {object} obj - Object to sanitize
   * @returns {object} Sanitized object
   */
  static sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return obj;
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeObject(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = this.sanitizeArray(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Recursively sanitize all strings in an array
   * @param {array} arr - Array to sanitize
   * @returns {array} Sanitized array
   */
  static sanitizeArray(arr) {
    if (!Array.isArray(arr)) {
      return arr;
    }

    return arr.map(item => {
      if (typeof item === 'string') {
        return this.sanitizeString(item);
      } else if (typeof item === 'object' && item !== null) {
        if (Array.isArray(item)) {
          return this.sanitizeArray(item);
        } else {
          return this.sanitizeObject(item);
        }
      }
      return item;
    });
  }

  /**
   * Sanitize an email address
   * @param {string} email - Email to sanitize
   * @returns {string} Sanitized email
   */
  static sanitizeEmail(email) {
    const sanitized = this.sanitizeString(email);
    return sanitized.toLowerCase();
  }

  /**
   * Sanitize and validate a URL
   * @param {string} url - URL to sanitize
   * @returns {string} Sanitized URL
   * @throws {Error} If URL contains javascript: protocol
   */
  static sanitizeUrl(url) {
    if (typeof url !== 'string') {
      throw new Error('URL must be a string');
    }

    const trimmed = this.sanitizeString(url);

    // Prevent javascript: protocol (XSS attack vector)
    if (trimmed.toLowerCase().startsWith('javascript:')) {
      throw new Error('Invalid URL - JavaScript protocol not allowed');
    }

    // Prevent data: protocol with scripts
    if (trimmed.toLowerCase().startsWith('data:') && trimmed.includes('script')) {
      throw new Error('Invalid URL - Data protocol with scripts not allowed');
    }

    return trimmed;
  }

  /**
   * Sanitize HTML by removing all tags
   * @param {string} html - HTML string to sanitize
   * @returns {string} Sanitized HTML (stripped of tags)
   */
  static sanitizeHtml(html) {
    if (typeof html !== 'string') {
      return html;
    }

    return html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  static escapeHtml(text) {
    if (typeof text !== 'string') {
      return text;
    }

    const htmlEscapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;'
    };

    return text.replace(/[&<>"'/]/g, char => htmlEscapeMap[char]);
  }

  /**
   * Remove all special characters except alphanumeric, spaces, and specified chars
   * @param {string} str - String to sanitize
   * @param {string} allowedSpecial - Additional allowed special characters (e.g., '-._')
   * @returns {string} Sanitized string
   */
  static sanitizeAlphanumeric(str, allowedSpecial = '') {
    if (typeof str !== 'string') {
      return str;
    }

    const escapedAllowed = allowedSpecial.replace(/[-.*+?^${}()|[\]\\]/g, '\\$&');
    const allowedChars = `a-zA-Z0-9 ${escapedAllowed}`;
    const regex = new RegExp(`[^${allowedChars}]`, 'g');

    return str.replace(regex, '').trim();
  }

  /**
   * Sanitize user input for database storage
   * Combines string sanitization with HTML escaping
   * @param {string} input - User input
   * @returns {string} Safe for database
   */
  static sanitizeForDatabase(input) {
    if (typeof input !== 'string') {
      return input;
    }

    return this.escapeHtml(this.sanitizeString(input));
  }

  /**
   * Sanitize username (alphanumeric, dash, underscore only)
   * @param {string} username - Username to sanitize
   * @returns {string} Sanitized username
   */
  static sanitizeUsername(username) {
    if (typeof username !== 'string') {
      return username;
    }

    return this.sanitizeAlphanumeric(username, '-_');
  }

  /**
   * Sanitize phone number (digits, spaces, hyphens, parentheses only)
   * @param {string} phone - Phone number
   * @returns {string} Sanitized phone number
   */
  static sanitizePhoneNumber(phone) {
    if (typeof phone !== 'string') {
      return phone;
    }

    return this.sanitizeAlphanumeric(phone, '- ()').trim();
  }
}

export default Sanitizer;
