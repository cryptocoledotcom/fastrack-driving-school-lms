// Environment Configuration Wrapper
// Provides centralized access to environment variables

const environment = {
  // Firebase Configuration
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  },

  // Application Configuration
  app: {
    name: import.meta.env.VITE_NAME || 'Fastrack Driving School LMS',
    version: import.meta.env.VITE_VERSION || '1.0.0',
    environment: import.meta.env.VITE_ENVIRONMENT || 'development'
  },

  // Helper methods
  isDevelopment: () => import.meta.env.MODE === 'development',
  isProduction: () => import.meta.env.MODE === 'production',
  isTest: () => import.meta.env.MODE === 'test'
};

export default environment;