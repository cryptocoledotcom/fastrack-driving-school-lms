import { formatTime24to12, parseLocalDate, formatDateDisplay } from '../dateTimeFormatter';
import { vi } from 'vitest';

describe('dateTimeFormatter', () => {
  describe('formatTime24to12', () => {
    it('should convert 24-hour time to 12-hour AM format', () => {
      expect(formatTime24to12('09:30')).toBe('9:30 AM');
      expect(formatTime24to12('11:45')).toBe('11:45 AM');
    });

    it('should convert noon', () => {
      expect(formatTime24to12('12:00')).toBe('12:00 PM');
      expect(formatTime24to12('12:30')).toBe('12:30 PM');
    });

    it('should convert 24-hour time to 12-hour PM format', () => {
      expect(formatTime24to12('13:00')).toBe('1:00 PM');
      expect(formatTime24to12('14:30')).toBe('2:30 PM');
      expect(formatTime24to12('23:59')).toBe('11:59 PM');
    });

    it('should convert midnight', () => {
      expect(formatTime24to12('00:00')).toBe('12:00 AM');
      expect(formatTime24to12('00:30')).toBe('12:30 AM');
    });

    it('should handle edge cases', () => {
      expect(formatTime24to12('01:00')).toBe('1:00 AM');
      expect(formatTime24to12('22:00')).toBe('10:00 PM');
    });

    it('should handle invalid input', () => {
      expect(formatTime24to12(null)).toBe(null);
      expect(formatTime24to12(undefined)).toBe(undefined);
      expect(formatTime24to12('')).toBe('');
      expect(formatTime24to12(123)).toBe(123);
    });
  });

  describe('parseLocalDate', () => {
    it('should parse ISO date string to local date', () => {
      const date = parseLocalDate('2025-12-01');
      expect(date).toEqual(new Date(2025, 11, 1));
      expect(date.getDate()).toBe(1);
      expect(date.getMonth()).toBe(11);
      expect(date.getFullYear()).toBe(2025);
    });

    it('should parse different dates correctly', () => {
      const date = parseLocalDate('2025-01-15');
      expect(date.getDate()).toBe(15);
      expect(date.getMonth()).toBe(0);
    });

    it('should handle invalid input', () => {
      expect(parseLocalDate(null)).toBe(null);
      expect(parseLocalDate(undefined)).toBe(null);
      expect(parseLocalDate('')).toBe(null);
      expect(parseLocalDate('invalid')).toBe(null);
    });
  });

  describe('formatDateDisplay', () => {
    it('should format date string to display format', () => {
      const result = formatDateDisplay('2025-12-01');
      expect(result).toMatch(/Mon|Mon,/);
      expect(result).toContain('Dec');
      expect(result).toContain('1');
    });

    it('should handle invalid input', () => {
      expect(formatDateDisplay(null)).toBe('');
      expect(formatDateDisplay(undefined)).toBe('');
      expect(formatDateDisplay('')).toBe('');
    });
  });
});
