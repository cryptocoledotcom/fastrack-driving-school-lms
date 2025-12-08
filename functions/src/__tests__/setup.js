import { expect, afterEach, vi } from 'vitest';

process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: 'test-project',
  storageBucket: 'test-bucket.appspot.com',
  databaseURL: 'https://test-project.firebaseio.com',
});

process.env.SENTRY_DSN = 'https://test:test@sentry.io/test';
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
process.env.CORS_ORIGINS = 'http://localhost:3000,https://fastrackdrive.com';

afterEach(() => {
  vi.clearAllMocks();
});
