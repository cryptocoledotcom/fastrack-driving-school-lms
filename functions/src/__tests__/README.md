# Cloud Functions Test Structure

This directory contains shared test utilities and setup for all Cloud Functions tests.

## Directory Structure

```
functions/
├── src/
│   ├── __tests__/                    # Shared test utilities
│   │   ├── setup.js                 # Global test setup (environment, mocks)
│   │   ├── mocks.js                 # Firebase mock factories
│   │   └── README.md                # This file
│   │
│   ├── compliance/
│   │   ├── __tests__/               # Compliance function tests
│   │   │   └── sessionHeartbeat.test.js
│   │   ├── complianceFunctions.js   # Implementation
│   │   └── ...
│   │
│   ├── payment/
│   │   ├── __tests__/               # Payment function tests
│   │   │   └── paymentFunctions.test.js
│   │   ├── paymentFunctions.js      # Implementation
│   │   └── ...
│   │
│   ├── certificate/
│   ├── user/
│   └── ...
│
├── vitest.config.js                 # Vitest configuration for functions
├── package.json                      # Dependencies with test scripts
└── ...
```

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode - re-run tests on file changes
npm run test:watch

# Interactive UI dashboard
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Creating New Tests

### 1. Create a `__tests__` directory in your feature directory

```
functions/src/payment/
├── __tests__/
│   └── paymentFunctions.test.js
├── paymentFunctions.js
└── index.js
```

### 2. Import test utilities

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockFirestore, createMockRequest } from '../../__tests__/mocks';
```

### 3. Use mock factories

```javascript
const mockFirestore = createMockFirestore();
const mockRequest = createMockRequest(
  { courseId: 'course-123' },
  { uid: 'user-123' }
);
```

## Mock Utilities

All Firebase mocks are available in `src/__tests__/mocks.js`:

### Available Factories

- **`createMockFirestore()`** - Complete Firestore instance mock
- **`createMockDocumentSnapshot(data, exists)`** - Document snapshot
- **`createMockQuerySnapshot(docs)`** - Query result snapshot
- **`createMockDocumentReference()`** - Document reference
- **`createMockCollectionReference()`** - Collection reference
- **`createMockWriteBatch()`** - Batch write operation
- **`createMockAuth()`** - Firebase Auth instance
- **`createMockRequest(data, auth)`** - HTTP Cloud Function request object

### Example Usage

```javascript
import { createMockFirestore, createMockRequest } from '../../__tests__/mocks';

// Setup
const mockDb = createMockFirestore();
const mockData = { userId: 'user-123', courseId: 'course-456' };
const mockRequest = createMockRequest(mockData, { uid: 'user-123' });

// Mock a document read
mockDb.collection = vi.fn(() => ({
  doc: vi.fn(() => ({
    get: vi.fn(() => Promise.resolve(
      createMockDocumentSnapshot({ name: 'John', role: 'student' })
    ))
  }))
}));

// Test the function
const result = await myFunction(mockRequest);
expect(result).toBeDefined();
```

## Test Organization

Tests are organized by concern:

```javascript
describe('functionName Cloud Function', () => {
  describe('Authentication Validation', () => {
    it('should throw error if not authenticated', () => {});
    it('should throw error if user ID mismatch', () => {});
  });

  describe('Input Validation', () => {
    it('should reject missing required fields', () => {});
  });

  describe('Business Logic', () => {
    it('should perform expected operation', () => {});
  });

  describe('Error Handling', () => {
    it('should handle Firestore errors gracefully', () => {});
  });
});
```

## Configuration

### Environment Variables (from `__tests__/setup.js`)

Tests run with these environment variables pre-set:

```javascript
FIREBASE_CONFIG = { projectId: 'test-project', ... }
SENTRY_DSN = 'https://test:test@sentry.io/test'
STRIPE_SECRET_KEY = 'sk_test_123'
CORS_ORIGINS = 'http://localhost:3000,https://fastrackdrive.com'
```

### Vitest Configuration (from `vitest.config.js`)

```javascript
{
  globals: true,              // Global test API (describe, it, etc)
  environment: 'node',        // Node.js test environment
  setupFiles: ['...setup.js'], // Auto-run setup.js before tests
  testTimeout: 10000,         // 10 second timeout per test
  include: [                  // Test file patterns
    'src/**/__tests__/**/*.test.js',
    'src/**/*.test.js'
  ]
}
```

## Test Naming Convention

- **Test files**: `functionName.test.js` in `__tests__` subdirectory
- **Test suites**: `describe('functionName Cloud Function', ...)`
- **Test cases**: `it('should [expected behavior] [when condition]', ...)`

Good examples:
- ✅ `should increment daily minutes on successful heartbeat`
- ✅ `should throw error if user ID mismatch`
- ✅ `should lock user when 240 minutes is reached`

Avoid:
- ❌ `test 1`
- ❌ `works`
- ❌ `error handling`

## Common Patterns

### Testing Async Functions

```javascript
it('should update document successfully', async () => {
  const mockDb = createMockFirestore();
  mockDb.collection('users').doc('user-1').update = vi.fn(
    () => Promise.resolve()
  );

  const result = await updateUser(mockDb, 'user-1', { age: 25 });
  
  expect(mockDb.collection('users').doc('user-1').update).toHaveBeenCalledWith({
    age: 25,
  });
});
```

### Testing Error Throwing

```javascript
it('should throw error if user not found', async () => {
  const mockDb = createMockFirestore();
  mockDb.collection('users').doc('user-1').get = vi.fn(
    () => Promise.resolve(createMockDocumentSnapshot(null, false))
  );

  await expect(getUser(mockDb, 'user-1')).rejects.toThrow('User not found');
});
```

### Mocking Cloud Function Behavior

```javascript
it('should validate CORS headers', async () => {
  const mockRequest = createMockRequest(
    { courseId: 'course-123' },
    { uid: 'user-123' }
  );

  const result = await myFunction(mockRequest);
  expect(result).toBeDefined();
});
```

## Debugging Tests

### Run Single Test File
```bash
npm test -- sessionHeartbeat.test.js
```

### Run Tests Matching Pattern
```bash
npm test -- --grep "should lock user"
```

### Debug Mode with Inspector
```bash
node --inspect-brk ./node_modules/vitest/vitest.mjs run
```

### UI Debug Mode
```bash
npm run test:ui
# Opens browser at http://localhost:51204
```

## Tips & Tricks

1. **Use `beforeEach`** to reset mocks between tests
2. **Use `vi.clearAllMocks()`** to clear all mock calls and implementations
3. **Use `vi.mock()`** at the top of test file to mock modules
4. **Use `vi.spyOn()`** to spy on existing methods
5. **Use `.toHaveBeenCalledWith()`** to assert function calls
6. **Use `.rejects.toThrow()`** for async error testing

## Best Practices

✅ **DO**:
- Test one thing per test
- Use descriptive test names
- Mock external dependencies (Firebase, Stripe, etc)
- Test error cases alongside happy paths
- Use factories for complex mock objects
- Organize tests by concern (Authentication, Validation, Business Logic)

❌ **DON'T**:
- Create real Firebase connections in tests
- Test multiple concepts in one test
- Make tests dependent on each other
- Forget to reset mocks between tests
- Skip error handling tests
- Hard-code mock data (use factories)

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Firebase Admin SDK Testing](https://firebase.google.com/docs/functions/unit-testing)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
