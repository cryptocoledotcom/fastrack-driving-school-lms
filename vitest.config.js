import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    testTimeout: 10000,
    css: true,
    exclude: [
      'node_modules',
      'functions/node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      'tests/e2e/**'
    ],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    env: {
      NODE_ENV: 'test',
      VITE_FIREBASE_API_KEY: 'test-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'test-project',
      VITE_FIREBASE_STORAGE_BUCKET: 'test-bucket.appspot.com',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
      VITE_FIREBASE_APP_ID: '1:123456789:web:test',
      VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
      VITE_STRIPE_SECRET_KEY: 'sk_test_123',
      VITE_NAME: 'Fastrack LMS',
      VITE_VERSION: '1.0.0',
      VITE_ENVIRONMENT: 'test',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.test.{js,jsx}',
        'src/index.jsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
