class StorageService {
  static storageType = 'localStorage';
  static prefix = 'fastrack_';
  static encryptionEnabled = false;

  constructor() {
    throw new Error('StorageService is a static utility class and should not be instantiated');
  }

  static setStorageType(type) {
    if (type === 'localStorage' || type === 'sessionStorage') {
      this.storageType = type;
    } else {
      throw new Error('Invalid storage type. Use "localStorage" or "sessionStorage"');
    }
  }

  static getStorage() {
    if (typeof window !== 'undefined') {
      return this.storageType === 'localStorage' ? window.localStorage : window.sessionStorage;
    }
    return null;
  }

  static getKey(key) {
    return `${this.prefix}${key}`;
  }

  static set(key, value, options = {}) {
    const storage = this.getStorage();
    if (!storage) return false;

    try {
      const fullKey = this.getKey(key);
      let dataToStore = value;

      if (typeof value === 'object') {
        dataToStore = JSON.stringify({
          value,
          timestamp: new Date().toISOString(),
          expiresAt: options.expiresIn ? new Date(Date.now() + options.expiresIn).toISOString() : null
        });
      } else {
        dataToStore = JSON.stringify({
          value,
          timestamp: new Date().toISOString(),
          expiresAt: options.expiresIn ? new Date(Date.now() + options.expiresIn).toISOString() : null
        });
      }

      storage.setItem(fullKey, dataToStore);
      return true;
    } catch (error) {
      console.error(`Failed to set storage item "${key}":`, error);
      return false;
    }
  }

  static get(key, options = {}) {
    const storage = this.getStorage();
    if (!storage) return null;

    try {
      const fullKey = this.getKey(key);
      const stored = storage.getItem(fullKey);

      if (!stored) {
        return options.defaultValue !== undefined ? options.defaultValue : null;
      }

      const parsed = JSON.parse(stored);

      if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
        this.remove(key);
        return options.defaultValue !== undefined ? options.defaultValue : null;
      }

      return parsed.value;
    } catch (error) {
      console.error(`Failed to get storage item "${key}":`, error);
      return options.defaultValue !== undefined ? options.defaultValue : null;
    }
  }

  static remove(key) {
    const storage = this.getStorage();
    if (!storage) return false;

    try {
      const fullKey = this.getKey(key);
      storage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error(`Failed to remove storage item "${key}":`, error);
      return false;
    }
  }

  static clear() {
    const storage = this.getStorage();
    if (!storage) return false;

    try {
      const keys = Object.keys(storage).filter(key => key.startsWith(this.prefix));
      keys.forEach(key => storage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }

  static getAll() {
    const storage = this.getStorage();
    if (!storage) return {};

    try {
      const items = {};
      const keys = Object.keys(storage).filter(key => key.startsWith(this.prefix));

      keys.forEach(key => {
        const cleanKey = key.replace(this.prefix, '');
        items[cleanKey] = this.get(cleanKey);
      });

      return items;
    } catch (error) {
      console.error('Failed to get all storage items:', error);
      return {};
    }
  }

  static exists(key) {
    const storage = this.getStorage();
    if (!storage) return false;

    try {
      const fullKey = this.getKey(key);
      return storage.getItem(fullKey) !== null;
    } catch (error) {
      console.error(`Failed to check if storage item exists "${key}":`, error);
      return false;
    }
  }

  static saveUserData(userData) {
    return this.set('user_data', userData);
  }

  static getUserData(defaultValue = null) {
    return this.get('user_data', { defaultValue });
  }

  static clearUserData() {
    return this.remove('user_data');
  }

  static saveAuthToken(token, expiresIn = null) {
    return this.set('auth_token', token, { expiresIn });
  }

  static getAuthToken() {
    return this.get('auth_token');
  }

  static clearAuthToken() {
    return this.remove('auth_token');
  }

  static savePreferences(preferences) {
    return this.set('preferences', preferences);
  }

  static getPreferences(defaultValue = {}) {
    return this.get('preferences', { defaultValue });
  }

  static clearPreferences() {
    return this.remove('preferences');
  }

  static getStorageInfo() {
    const storage = this.getStorage();
    if (!storage) return null;

    try {
      const keys = Object.keys(storage).filter(key => key.startsWith(this.prefix));
      let totalSize = 0;

      keys.forEach(key => {
        totalSize += storage.getItem(key).length;
      });

      return {
        type: this.storageType,
        itemCount: keys.length,
        approximateSizeBytes: totalSize,
        approximateSizeKB: (totalSize / 1024).toFixed(2)
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return null;
    }
  }
}

export default StorageService;
