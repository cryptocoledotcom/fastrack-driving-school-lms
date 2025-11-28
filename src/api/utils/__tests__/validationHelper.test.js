import {
  validateString,
  validateNumber,
  validateObject,
  validateArray,
  validateEmail,
  validateOneOf,
  validateRequired
} from '../validationHelper.js';
import { ValidationError } from '../../errors/ApiError.js';

describe('validationHelper', () => {
  describe('validateString', () => {
    it('should pass for valid non-empty string', () => {
      expect(() => validateString('hello', 'name')).not.toThrow();
      expect(validateString('test', 'field')).toBe('test');
    });

    it('should throw for empty string', () => {
      expect(() => validateString('', 'name')).toThrow(ValidationError);
    });

    it('should throw for non-string', () => {
      expect(() => validateString(123, 'name')).toThrow(ValidationError);
      expect(() => validateString(null, 'name')).toThrow(ValidationError);
      expect(() => validateString(undefined, 'name')).toThrow(ValidationError);
    });

    it('should throw for whitespace only', () => {
      expect(() => validateString('   ', 'name')).toThrow(ValidationError);
    });

    it('should include field name in error', () => {
      expect(() => validateString('', 'username')).toThrow(/username/);
    });
  });

  describe('validateNumber', () => {
    it('should pass for valid number', () => {
      expect(() => validateNumber(42, 'count')).not.toThrow();
      expect(validateNumber(3.14, 'pi')).toBe(3.14);
    });

    it('should throw for non-number', () => {
      expect(() => validateNumber('42', 'count')).toThrow(ValidationError);
      expect(() => validateNumber(null, 'count')).toThrow(ValidationError);
    });

    it('should validate integer requirement', () => {
      expect(() => validateNumber(5, 'count', { integer: true })).not.toThrow();
      expect(() => validateNumber(5.5, 'count', { integer: true })).toThrow(ValidationError);
    });

    it('should validate min value', () => {
      expect(() => validateNumber(10, 'age', { min: 5 })).not.toThrow();
      expect(() => validateNumber(3, 'age', { min: 5 })).toThrow(ValidationError);
    });

    it('should validate max value', () => {
      expect(() => validateNumber(50, 'age', { max: 100 })).not.toThrow();
      expect(() => validateNumber(150, 'age', { max: 100 })).toThrow(ValidationError);
    });

    it('should validate min and max together', () => {
      expect(() => validateNumber(50, 'score', { min: 0, max: 100 })).not.toThrow();
      expect(() => validateNumber(-10, 'score', { min: 0, max: 100 })).toThrow();
      expect(() => validateNumber(150, 'score', { min: 0, max: 100 })).toThrow();
    });
  });

  describe('validateObject', () => {
    it('should pass for valid object', () => {
      expect(() => validateObject({ a: 1 }, 'data')).not.toThrow();
      expect(validateObject({ test: true }, 'config')).toEqual({ test: true });
    });

    it('should throw for array', () => {
      expect(() => validateObject([1, 2, 3], 'data')).toThrow(ValidationError);
    });

    it('should throw for non-object', () => {
      expect(() => validateObject('string', 'data')).toThrow(ValidationError);
      expect(() => validateObject(null, 'data')).toThrow(ValidationError);
      expect(() => validateObject(undefined, 'data')).toThrow(ValidationError);
    });

    it('should throw for empty object', () => {
      expect(() => validateObject({}, 'data')).toThrow(ValidationError);
    });
  });

  describe('validateArray', () => {
    it('should pass for valid array', () => {
      expect(() => validateArray([1, 2, 3], 'items')).not.toThrow();
      expect(validateArray(['a', 'b'], 'values')).toEqual(['a', 'b']);
    });

    it('should throw for non-array', () => {
      expect(() => validateArray('string', 'items')).toThrow(ValidationError);
      expect(() => validateArray({ a: 1 }, 'items')).toThrow(ValidationError);
      expect(() => validateArray(null, 'items')).toThrow(ValidationError);
    });

    it('should allow empty array', () => {
      expect(() => validateArray([], 'items')).not.toThrow();
    });
  });

  describe('validateEmail', () => {
    it('should pass for valid email', () => {
      expect(() => validateEmail('user@example.com')).not.toThrow();
      expect(validateEmail('test.user@example.co.uk')).toBe('test.user@example.co.uk');
    });

    it('should throw for invalid email', () => {
      expect(() => validateEmail('notanemail')).toThrow(ValidationError);
      expect(() => validateEmail('user@')).toThrow(ValidationError);
      expect(() => validateEmail('@example.com')).toThrow(ValidationError);
      expect(() => validateEmail('user @example.com')).toThrow(ValidationError);
    });

    it('should throw for empty string', () => {
      expect(() => validateEmail('')).toThrow(ValidationError);
    });
  });

  describe('validateOneOf', () => {
    it('should pass for allowed values', () => {
      expect(() => validateOneOf('active', ['active', 'inactive'], 'status')).not.toThrow();
      expect(validateOneOf('small', ['small', 'medium', 'large'], 'size')).toBe('small');
    });

    it('should throw for disallowed values', () => {
      expect(() => validateOneOf('unknown', ['active', 'inactive'], 'status')).toThrow(ValidationError);
    });

    it('should include allowed values in error', () => {
      expect(() => validateOneOf('invalid', ['a', 'b', 'c'], 'field')).toThrow(/a, b, c/);
    });

    it('should be case sensitive', () => {
      expect(() => validateOneOf('ACTIVE', ['active', 'inactive'], 'status')).toThrow(ValidationError);
    });
  });

  describe('validateRequired', () => {
    it('should pass for non-null/undefined values', () => {
      expect(() => validateRequired('value', 'field')).not.toThrow();
      expect(() => validateRequired(0, 'field')).not.toThrow();
      expect(() => validateRequired(false, 'field')).not.toThrow();
      expect(() => validateRequired('', 'field')).not.toThrow();
    });

    it('should throw for null', () => {
      expect(() => validateRequired(null, 'field')).toThrow(ValidationError);
    });

    it('should throw for undefined', () => {
      expect(() => validateRequired(undefined, 'field')).toThrow(ValidationError);
    });

    it('should include field name in error', () => {
      expect(() => validateRequired(null, 'username')).toThrow(/username/);
    });
  });
});
