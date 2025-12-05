import * as Sentry from '@sentry/react';

const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';

  if (!dsn) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: environment === 'production' ? 0.1 : 0.5,
    replaysSessionSampleRate: environment === 'production' ? 0.1 : 0.5,
    replaysOnErrorSampleRate: 1.0,
  });
};

export default initSentry;
