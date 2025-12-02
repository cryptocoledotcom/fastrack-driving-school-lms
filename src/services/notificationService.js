class NotificationService {
  static notifications = [];
  static listeners = [];
  static notificationId = 0;
  static defaultDuration = 5000;

  constructor() {
    throw new Error('NotificationService is a static utility class and should not be instantiated');
  }

  static subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
      return () => {
        this.listeners = this.listeners.filter(listener => listener !== callback);
      };
    }
  }

  static notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener([...this.notifications]);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  static generateId() {
    return `notification_${++this.notificationId}`;
  }

  static createNotification(message, type = 'info', options = {}) {
    const notification = {
      id: this.generateId(),
      message,
      type,
      duration: options.duration !== undefined ? options.duration : this.defaultDuration,
      title: options.title || null,
      icon: options.icon || null,
      action: options.action || null,
      position: options.position || 'top-right',
      timestamp: new Date().toISOString(),
      dismissible: options.dismissible !== false,
      ...options
    };

    return notification;
  }

  static add(notification, autoDismiss = true) {
    this.notifications.push(notification);
    this.notifyListeners();

    if (autoDismiss && notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, notification.duration);
    }

    return notification.id;
  }

  static show(message, type = 'info', options = {}) {
    const notification = this.createNotification(message, type, options);
    return this.add(notification);
  }

  static success(message, options = {}) {
    return this.show(message, 'success', {
      ...options,
      icon: options.icon || '✓'
    });
  }

  static error(message, options = {}) {
    return this.show(message, 'error', {
      ...options,
      duration: options.duration !== undefined ? options.duration : 7000,
      icon: options.icon || '✕',
      dismissible: true
    });
  }

  static warning(message, options = {}) {
    return this.show(message, 'warning', {
      ...options,
      icon: options.icon || '⚠'
    });
  }

  static info(message, options = {}) {
    return this.show(message, 'info', {
      ...options,
      icon: options.icon || 'ℹ'
    });
  }

  static loading(message, options = {}) {
    return this.show(message, 'loading', {
      ...options,
      duration: 0,
      dismissible: false,
      icon: options.icon || '⟳'
    });
  }

  static dismiss(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  static dismissAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  static update(notificationId, updates) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      Object.assign(notification, updates);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  static getNotifications() {
    return [...this.notifications];
  }

  static getNotificationCount() {
    return this.notifications.length;
  }

  static hasNotifications() {
    return this.notifications.length > 0;
  }

  static getNotificationsByType(type) {
    return this.notifications.filter(n => n.type === type);
  }

  static clearByType(type) {
    const beforeCount = this.notifications.length;
    this.notifications = this.notifications.filter(n => n.type !== type);
    if (this.notifications.length !== beforeCount) {
      this.notifyListeners();
    }
  }

  static showWithAction(message, type, actionText, onAction, options = {}) {
    return this.show(message, type, {
      ...options,
      action: {
        text: actionText,
        callback: onAction
      }
    });
  }

  static confirm(message, onConfirm, onCancel, options = {}) {
    return this.show(message, 'confirm', {
      ...options,
      duration: 0,
      dismissible: false,
      onConfirm,
      onCancel
    });
  }

  static async asyncOperation(operationPromise, loadingMessage, options = {}) {
    const loadingId = this.loading(loadingMessage);

    try {
      const result = await operationPromise;
      this.dismiss(loadingId);
      this.success(options.successMessage || 'Operation completed successfully', options);
      return result;
    } catch (error) {
      this.dismiss(loadingId);
      const errorMessage = error.message || options.errorMessage || 'An error occurred';
      this.error(errorMessage, {
        ...options,
        duration: 7000
      });
      throw error;
    }
  }

  static clearAll() {
    this.notifications = [];
    this.listeners = [];
    this.notificationId = 0;
  }

  static getListenerCount() {
    return this.listeners.length;
  }
}

export default NotificationService;
