import * as Sentry from '@sentry/react';

const captureError = (error, context = {}) => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.error('Error (Sentry disabled):', error, context);
    return;
  }

  Sentry.captureException(error, {
    contexts: {
      app: context,
    },
  });
};

const captureMessage = (message, level = 'info') => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn(`[${level.toUpperCase()}] ${message}`);
    return;
  }

  Sentry.captureMessage(message, level);
};

const setUserContext = (userId, userEmail, userName) => {
  Sentry.setUser({
    id: userId,
    email: userEmail,
    username: userName,
  });
};

const clearUserContext = () => {
  Sentry.setUser(null);
};

const addBreadcrumb = (message, category, level = 'info', data = {}) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

export {
  captureError,
  captureMessage,
  setUserContext,
  clearUserContext,
  addBreadcrumb,
};
