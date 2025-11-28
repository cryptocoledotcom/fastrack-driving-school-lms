import CacheService from '../CacheService.js';

describe('CacheService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllTimers();
    CacheService.clear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('set()', () => {
    it('should store a value in cache', () => {
      CacheService.set('key1', { data: 'value1' });
      expect(CacheService.get('key1')).toEqual({ data: 'value1' });
    });

    it('should overwrite existing key', () => {
      CacheService.set('key1', 'initial');
      CacheService.set('key1', 'updated');
      expect(CacheService.get('key1')).toBe('updated');
    });

    it('should store different types of values', () => {
      CacheService.set('string', 'value');
      CacheService.set('number', 42);
      CacheService.set('boolean', true);
      CacheService.set('array', [1, 2, 3]);
      CacheService.set('object', { nested: 'data' });

      expect(CacheService.get('string')).toBe('value');
      expect(CacheService.get('number')).toBe(42);
      expect(CacheService.get('boolean')).toBe(true);
      expect(CacheService.get('array')).toEqual([1, 2, 3]);
      expect(CacheService.get('object')).toEqual({ nested: 'data' });
    });

    it('should store null values', () => {
      CacheService.set('nullKey', null);
      expect(CacheService.get('nullKey')).toBeNull();
    });

    it('should handle numeric keys by converting to string', () => {
      CacheService.set(1, 'numeric key');
      expect(CacheService.get('1')).toBe('numeric key');
    });
  });

  describe('get()', () => {
    it('should retrieve cached value', () => {
      CacheService.set('key1', 'stored value');
      expect(CacheService.get('key1')).toBe('stored value');
    });

    it('should return null if key does not exist', () => {
      expect(CacheService.get('nonexistent')).toBeNull();
    });

    it('should return null if entry has expired', () => {
      const ttl = 5000;
      CacheService.set('expiring', 'value', ttl);

      expect(CacheService.get('expiring')).toBe('value');

      jest.advanceTimersByTime(ttl + 1);

      expect(CacheService.get('expiring')).toBeNull();
    });

    it('should return value before TTL expires', () => {
      const ttl = 5000;
      CacheService.set('key1', 'value', ttl);

      jest.advanceTimersByTime(ttl - 1);

      expect(CacheService.get('key1')).toBe('value');
    });

    it('should return value if no TTL provided', () => {
      CacheService.set('permanent', 'value');

      jest.advanceTimersByTime(10000);

      expect(CacheService.get('permanent')).toBe('value');
    });

    it('should automatically clean up expired entries on get()', () => {
      const ttl = 5000;
      CacheService.set('expiring', 'value', ttl);

      jest.advanceTimersByTime(ttl + 1);

      CacheService.get('expiring');

      expect(CacheService.get('expiring')).toBeNull();
    });
  });

  describe('invalidate()', () => {
    it('should remove a single entry from cache', () => {
      CacheService.set('key1', 'value1');
      CacheService.set('key2', 'value2');

      CacheService.invalidate('key1');

      expect(CacheService.get('key1')).toBeNull();
      expect(CacheService.get('key2')).toBe('value2');
    });

    it('should handle invalidating non-existent key gracefully', () => {
      expect(() => {
        CacheService.invalidate('nonexistent');
      }).not.toThrow();
    });

    it('should remove TTL timeout when invalidating', () => {
      const ttl = 5000;
      CacheService.set('key1', 'value', ttl);

      CacheService.invalidate('key1');

      jest.advanceTimersByTime(ttl + 1);

      expect(CacheService.get('key1')).toBeNull();
    });

    it('should not affect other cache entries', () => {
      CacheService.set('key1', 'value1', 5000);
      CacheService.set('key2', 'value2', 5000);
      CacheService.set('key3', 'value3');

      CacheService.invalidate('key2');

      expect(CacheService.get('key1')).toBe('value1');
      expect(CacheService.get('key3')).toBe('value3');
    });
  });

  describe('clear()', () => {
    it('should remove all entries from cache', () => {
      CacheService.set('key1', 'value1');
      CacheService.set('key2', 'value2');
      CacheService.set('key3', 'value3');

      CacheService.clear();

      expect(CacheService.get('key1')).toBeNull();
      expect(CacheService.get('key2')).toBeNull();
      expect(CacheService.get('key3')).toBeNull();
    });

    it('should clear all TTL timeouts', () => {
      const ttl = 5000;
      CacheService.set('key1', 'value1', ttl);
      CacheService.set('key2', 'value2', ttl);

      CacheService.clear();

      jest.advanceTimersByTime(ttl + 1);

      expect(CacheService.get('key1')).toBeNull();
      expect(CacheService.get('key2')).toBeNull();
    });

    it('should allow adding new entries after clearing', () => {
      CacheService.set('key1', 'value1');
      CacheService.clear();
      CacheService.set('key2', 'value2');

      expect(CacheService.get('key2')).toBe('value2');
    });
  });

  describe('TTL (time-to-live)', () => {
    it('should use default TTL if provided', () => {
      const ttl = 3000;
      CacheService.set('key1', 'value', ttl);

      jest.advanceTimersByTime(ttl - 1);
      expect(CacheService.get('key1')).toBe('value');

      jest.advanceTimersByTime(1);
      expect(CacheService.get('key1')).toBeNull();
    });

    it('should honor different TTLs for different entries', () => {
      CacheService.set('shortKey', 'value', 2000);
      CacheService.set('longKey', 'value', 5000);

      jest.advanceTimersByTime(3000);

      expect(CacheService.get('shortKey')).toBeNull();
      expect(CacheService.get('longKey')).toBe('value');
    });

    it('should not expire entries without TTL', () => {
      CacheService.set('permanent', 'value');

      jest.advanceTimersByTime(10000);

      expect(CacheService.get('permanent')).toBe('value');
    });

    it('should expire exactly at TTL boundary', () => {
      const ttl = 5000;
      CacheService.set('key1', 'value', ttl);

      jest.advanceTimersByTime(ttl);

      expect(CacheService.get('key1')).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle cache hits and misses in sequence', () => {
      CacheService.set('key1', 'value1');

      expect(CacheService.get('key1')).toBe('value1');
      expect(CacheService.get('key1')).toBe('value1');
      expect(CacheService.get('key2')).toBeNull();
      expect(CacheService.get('key1')).toBe('value1');
    });

    it('should handle rapid set and get operations', () => {
      for (let i = 0; i < 10; i++) {
        CacheService.set(`key${i}`, `value${i}`);
      }

      for (let i = 0; i < 10; i++) {
        expect(CacheService.get(`key${i}`)).toBe(`value${i}`);
      }
    });

    it('should handle special characters in keys', () => {
      const specialKeys = [
        'key-with-dash',
        'key_with_underscore',
        'key:with:colon',
        'key.with.dot',
        'key/with/slash'
      ];

      specialKeys.forEach((key, index) => {
        CacheService.set(key, `value${index}`);
        expect(CacheService.get(key)).toBe(`value${index}`);
      });
    });

    it('should handle large objects', () => {
      const largeObj = {
        data: Array(1000).fill('data'),
        nested: {
          deep: {
            value: 'found'
          }
        }
      };

      CacheService.set('large', largeObj);
      expect(CacheService.get('large')).toEqual(largeObj);
    });

    it('should not interfere with prototype chain', () => {
      const obj = Object.create({ inherited: 'property' });
      obj.own = 'property';

      CacheService.set('obj', obj);
      const retrieved = CacheService.get('obj');

      expect(retrieved.own).toBe('property');
    });
  });

  describe('integration scenarios', () => {
    it('should handle cache invalidation and re-population', () => {
      CacheService.set('key1', 'original');
      expect(CacheService.get('key1')).toBe('original');

      CacheService.invalidate('key1');
      expect(CacheService.get('key1')).toBeNull();

      CacheService.set('key1', 'updated');
      expect(CacheService.get('key1')).toBe('updated');
    });

    it('should handle mixed TTL and non-TTL entries', () => {
      const ttl = 3000;
      CacheService.set('withTTL', 'expires', ttl);
      CacheService.set('withoutTTL', 'permanent');

      jest.advanceTimersByTime(ttl + 1);

      expect(CacheService.get('withTTL')).toBeNull();
      expect(CacheService.get('withoutTTL')).toBe('permanent');
    });

    it('should handle multiple clears', () => {
      CacheService.set('key1', 'value1');
      CacheService.clear();
      expect(CacheService.get('key1')).toBeNull();

      CacheService.set('key2', 'value2');
      CacheService.clear();
      expect(CacheService.get('key2')).toBeNull();

      CacheService.set('key3', 'value3');
      expect(CacheService.get('key3')).toBe('value3');
    });

    it('should handle invalidate after expiration', () => {
      const ttl = 3000;
      CacheService.set('key1', 'value', ttl);

      jest.advanceTimersByTime(ttl + 1);
      expect(CacheService.get('key1')).toBeNull();

      expect(() => {
        CacheService.invalidate('key1');
      }).not.toThrow();
    });

    it('should maintain cache between get operations', () => {
      CacheService.set('counter', 0);
      const value1 = CacheService.get('counter');
      const value2 = CacheService.get('counter');

      expect(value1).toBe(value2);
      expect(value1).toBe(0);
    });
  });
});
