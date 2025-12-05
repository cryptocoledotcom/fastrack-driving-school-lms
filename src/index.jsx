// Application Entry Point

import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import initSentry from './config/sentry';
import App from './App';

initSentry();

const SentryApp = Sentry.withProfiler(App);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SentryApp />
  </React.StrictMode>
);