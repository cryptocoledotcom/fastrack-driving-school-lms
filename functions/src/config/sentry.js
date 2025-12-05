const Sentry = require('@sentry/node');
const { captureException, captureMessage } = require('@sentry/node');

const initSentry = () => {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'production';

  if (!dsn) {
    console.warn('Sentry DSN not configured. Error tracking disabled for Cloud Functions.');
    return {
      captureException: (error) => console.error('Captured error:', error),
      captureMessage: (message, level) => console.log(`[${level}]`, message),
    };
  }

  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    serverName: 'fastrack-cloud-functions',
  });

  return Sentry;
};

module.exports = { initSentry, Sentry, captureException, captureMessage };
