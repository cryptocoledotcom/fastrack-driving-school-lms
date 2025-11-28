class CacheService {
  constructor() {
    this.cache = new Map();
    this.timeouts = new Map();
  }

  set(key, value, ttl = null) {
    const stringKey = String(key);

    if (this.timeouts.has(stringKey)) {
      clearTimeout(this.timeouts.get(stringKey));
      this.timeouts.delete(stringKey);
    }

    this.cache.set(stringKey, {
      value,
      expiresAt: ttl ? Date.now() + ttl : null
    });

    if (ttl) {
      const timeoutId = setTimeout(() => {
        this.cache.delete(stringKey);
        this.timeouts.delete(stringKey);
      }, ttl);

      this.timeouts.set(stringKey, timeoutId);
    }
  }

  get(key) {
    const stringKey = String(key);
    const entry = this.cache.get(stringKey);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(stringKey);
      if (this.timeouts.has(stringKey)) {
        clearTimeout(this.timeouts.get(stringKey));
        this.timeouts.delete(stringKey);
      }
      return null;
    }

    return entry.value;
  }

  invalidate(key) {
    const stringKey = String(key);

    if (this.timeouts.has(stringKey)) {
      clearTimeout(this.timeouts.get(stringKey));
      this.timeouts.delete(stringKey);
    }

    this.cache.delete(stringKey);
  }

  clear() {
    this.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.timeouts.clear();
    this.cache.clear();
  }
}

const cacheServiceInstance = new CacheService();
export default cacheServiceInstance;
