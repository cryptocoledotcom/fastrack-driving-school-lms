import {
  getTimestamps,
  getCreatedTimestamp,
  getUpdatedTimestamp,
  getCurrentISOTimestamp,
  getCurrentTimestamp,
  createTimestampedData,
  updateWithTimestamp
} from '../timestampHelper.js';

describe('timestampHelper', () => {
  describe('getTimestamps', () => {
    it('should return object with createdAt and updatedAt', () => {
      const timestamps = getTimestamps();
      expect(timestamps).toHaveProperty('createdAt');
      expect(timestamps).toHaveProperty('updatedAt');
    });

    it('should return ISO format strings', () => {
      const timestamps = getTimestamps();
      expect(new Date(timestamps.createdAt)).not.toBeNaN();
      expect(new Date(timestamps.updatedAt)).not.toBeNaN();
    });

    it('should have valid timestamps', () => {
      const timestamps = getTimestamps();
      const now = Date.now();
      const createdTime = new Date(timestamps.createdAt).getTime();
      const updatedTime = new Date(timestamps.updatedAt).getTime();
      
      expect(Math.abs(now - createdTime)).toBeLessThan(100);
      expect(Math.abs(now - updatedTime)).toBeLessThan(100);
    });
  });

  describe('getCreatedTimestamp', () => {
    it('should return only createdAt', () => {
      const timestamp = getCreatedTimestamp();
      expect(timestamp).toHaveProperty('createdAt');
      expect(timestamp).not.toHaveProperty('updatedAt');
    });

    it('should have valid ISO format', () => {
      const timestamp = getCreatedTimestamp();
      expect(new Date(timestamp.createdAt)).not.toBeNaN();
    });
  });

  describe('getUpdatedTimestamp', () => {
    it('should return updatedAt and lastUpdated', () => {
      const timestamp = getUpdatedTimestamp();
      expect(timestamp).toHaveProperty('updatedAt');
      expect(timestamp).toHaveProperty('lastUpdated');
    });

    it('should not have createdAt', () => {
      const timestamp = getUpdatedTimestamp();
      expect(timestamp).not.toHaveProperty('createdAt');
    });
  });

  describe('getCurrentISOTimestamp', () => {
    it('should return ISO string', () => {
      const timestamp = getCurrentISOTimestamp();
      expect(typeof timestamp).toBe('string');
      expect(new Date(timestamp)).not.toBeNaN();
    });

    it('should be close to now', () => {
      const timestamp = getCurrentISOTimestamp();
      const diff = Math.abs(Date.now() - new Date(timestamp).getTime());
      expect(diff).toBeLessThan(100);
    });
  });

  describe('getCurrentTimestamp', () => {
    it('should return milliseconds timestamp', () => {
      const timestamp = getCurrentTimestamp();
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);
    });

    it('should be close to now', () => {
      const timestamp = getCurrentTimestamp();
      const diff = Math.abs(Date.now() - timestamp);
      expect(diff).toBeLessThan(100);
    });
  });

  describe('createTimestampedData', () => {
    it('should merge data with timestamps', () => {
      const data = { name: 'test', age: 25 };
      const result = createTimestampedData(data);
      
      expect(result).toHaveProperty('name', 'test');
      expect(result).toHaveProperty('age', 25);
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should preserve original data', () => {
      const data = { id: '123', status: 'active' };
      const result = createTimestampedData(data);
      
      expect(result.id).toBe('123');
      expect(result.status).toBe('active');
    });

    it('should handle empty object', () => {
      const result = createTimestampedData({});
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });
  });

  describe('updateWithTimestamp', () => {
    it('should add update timestamps', () => {
      const data = { name: 'test' };
      const result = updateWithTimestamp(data);
      
      expect(result).toHaveProperty('name', 'test');
      expect(result).toHaveProperty('updatedAt');
      expect(result).toHaveProperty('lastUpdated');
    });

    it('should not add createdAt', () => {
      const result = updateWithTimestamp({ field: 'value' });
      expect(result).not.toHaveProperty('createdAt');
    });

    it('should preserve all original fields', () => {
      const data = { userId: '123', status: 'active', count: 5 };
      const result = updateWithTimestamp(data);
      
      expect(result.userId).toBe('123');
      expect(result.status).toBe('active');
      expect(result.count).toBe(5);
    });
  });
});
