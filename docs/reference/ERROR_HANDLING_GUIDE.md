# Error Handling Guide

## Standardized Error Handling

Guidelines for consistent error handling across Fastrack LMS.

---

## Error Hierarchy

```
Error
├── ApiError (Custom application error)
│   ├── AuthenticationError
│   ├── AuthorizationError
│   ├── ValidationError
│   ├── NotFoundError
│   ├── ConflictError
│   └── PaymentError
└── System Errors (unhandled)
```

---

## Custom Error Classes

**File**: `src/api/errors/ApiError.js`

```javascript
class ApiError extends Error {
  constructor(code, message, statusCode = 500, originalError = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }

  // User-facing message (generic)
  getUserMessage() {
    const messages = {
      'INVALID_PARAMETERS': 'Please check your input and try again',
      'UNAUTHENTICATED': 'Please log in to continue',
      'PERMISSION_DENIED': 'You do not have permission for this action',
      'NOT_FOUND': 'The requested resource was not found',
      'INTERNAL_ERROR': 'An error occurred. Please try again later'
    };
    return messages[this.code] || messages['INTERNAL_ERROR'];
  }

  // Response object
  toResponse() {
    return {
      error: this.code,
      message: this.getUserMessage(),
      timestamp: this.timestamp
    };
  }
}

// Specific error classes
class ValidationError extends ApiError {
  constructor(message, originalError = null) {
    super('VALIDATION_ERROR', message, 400, originalError);
  }
}

class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed') {
    super('UNAUTHENTICATED', message, 401);
  }
}

class AuthorizationError extends ApiError {
  constructor(message = 'Permission denied') {
    super('PERMISSION_DENIED', message, 403);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super('NOT_FOUND', message, 404);
  }
}

class PaymentError extends ApiError {
  constructor(message, originalError = null) {
    super('PAYMENT_ERROR', message, 400, originalError);
  }
}
```

---

## Error Codes Reference

| Code | HTTP | Description | User Message |
|------|------|-------------|---------------|
| INVALID_PARAMETERS | 400 | Missing/invalid params | "Please check your input" |
| UNAUTHENTICATED | 401 | Not logged in | "Please log in to continue" |
| PERMISSION_DENIED | 403 | Insufficient permissions | "You don't have permission" |
| NOT_FOUND | 404 | Resource not found | "Resource not found" |
| CONFLICT | 409 | Resource conflict | "Action not allowed now" |
| VALIDATION_ERROR | 400 | Data validation failed | "Invalid data provided" |
| PAYMENT_ERROR | 400 | Payment processing failed | "Payment could not be processed" |
| INTERNAL_ERROR | 500 | Server error | "An error occurred" |

---

## Frontend Error Handling

### Service Error Handling

```javascript
// src/api/courses/courseServices.js
import { CourseError, ValidationError } from '../errors/ApiError.js';

export const enrollCourse = async (userId, courseId) => {
  try {
    // Validate inputs
    if (!userId || !courseId) {
      throw new ValidationError('User ID and Course ID required');
    }

    // Attempt operation
    const enrollment = await createEnrollment(userId, courseId);
    return enrollment;

  } catch (error) {
    // Handle known errors
    if (error instanceof ValidationError) {
      loggingService.logError('ENROLLMENT_VALIDATION_FAILED', error, {
        userId, courseId
      });
      throw error; // Re-throw for component
    }

    if (error.code === 'PERMISSION_DENIED') {
      throw new AuthorizationError('Cannot enroll in this course');
    }

    // Handle unexpected errors
    loggingService.logError('ENROLLMENT_FAILED', error, {
      userId, courseId
    });

    throw new CourseError(
      'Could not enroll in course. Please try again.',
      error
    );
  }
};
```

### Component Error Handling

```javascript
// src/components/courses/CourseEnrollment.jsx
export const CourseEnrollment = ({ courseId }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    setError(null);
    setLoading(true);

    try {
      await enrollCourse(userId, courseId);
      notificationService.success('Enrolled successfully');
      navigate('/dashboard');

    } catch (err) {
      // Log error for debugging
      console.error('Enrollment error:', err);

      // Show user-friendly message
      setError(err.getUserMessage?.() || 'Enrollment failed');

      // Notify user
      notificationService.error(error);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      <button onClick={handleEnroll} disabled={loading}>
        {loading ? 'Processing...' : 'Enroll Now'}
      </button>
    </div>
  );
};
```

---

## Cloud Functions Error Handling

### Function Error Patterns

```javascript
// functions/src/payment/paymentFunctions.js
const functions = require('firebase-functions');

exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  try {
    // 1. Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    // 2. Input validation
    if (!data.courseId || !data.amount) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required parameters'
      );
    }

    // 3. Permission check
    if (context.auth.uid !== data.userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cannot create payment for other users'
      );
    }

    // 4. Business logic with error handling
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: data.amount,
        currency: 'usd'
      });

      // Log success
      console.log('Payment intent created:', paymentIntent.id);

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret
      };

    } catch (stripeError) {
      // Handle Stripe-specific errors
      console.error('Stripe error:', stripeError.message);
      throw new functions.https.HttpsError(
        'internal',
        'Payment processing failed',
        stripeError.message
      );
    }

  } catch (error) {
    // Handle unexpected errors
    console.error('Function error:', error);

    // Return appropriate error
    if (error instanceof functions.https.HttpsError) {
      throw error; // Re-throw known errors
    }

    // Generic error for unknown exceptions
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred. Please try again.'
    );
  }
});
```

---

## Error Logging

### Logging Configuration

**File**: `src/services/loggingService.js`

```javascript
export const logError = (errorCode, error, context = {}) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    code: errorCode,
    message: error?.message || 'Unknown error',
    context,
    // Stack trace only in development
    stackTrace: process.env.NODE_ENV === 'development' ? error?.stack : undefined
  };

  console.error(JSON.stringify(errorLog));

  // Don't log sensitive data
  // Never log: passwords, tokens, credit cards, SSNs
};

export const logAuthError = (action, error, details = {}) => {
  logError(`AUTH_${action}`, error, {
    action,
    ...details,
    // Don't include password or sensitive auth data
  });
};
```

### Error Logging Best Practices

✅ **DO**:
- Log error code, message, timestamp
- Include context (which function, which user, which resource)
- Include user ID (not email/password)
- Include request details (not auth tokens)
- Log to centralized logging system

❌ **DON'T**:
- Log passwords or secret keys
- Log full credit card numbers
- Log API keys or tokens
- Log entire request bodies (passwords, PII)
- Log stack traces in production
- Log to console.error in sensitive operations

---

## User-Facing Error Messages

### Guidelines

**Good Error Messages**:
```
✓ "Please enter a valid email address"
✓ "This email is already registered"
✓ "Your password must be at least 8 characters"
✓ "Payment could not be processed. Please check your card and try again"
```

**Bad Error Messages**:
```
✗ "500 Internal Server Error"
✗ "INVALID_PARAMS_ERROR"
✗ "TypeError: Cannot read property 'id' of undefined"
✗ "Stripe API returned error: card_declined"
✗ "Connection timeout after 5000ms"
```

### Error Message Translation

```javascript
const ERROR_MESSAGES = {
  'INVALID_EMAIL': 'Please enter a valid email address',
  'EMAIL_ALREADY_REGISTERED': 'This email is already registered',
  'PASSWORD_TOO_SHORT': 'Password must be at least 8 characters',
  'INVALID_CARD': 'This card cannot be used for payment',
  'CARD_DECLINED': 'Your card was declined. Please check and try again',
  'NETWORK_ERROR': 'Connection error. Please check your internet and try again',
  'SERVER_ERROR': 'An error occurred. Our team has been notified',
  'PERMISSION_DENIED': 'You do not have permission to perform this action'
};

export const getUserErrorMessage = (errorCode) => {
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES['SERVER_ERROR'];
};
```

---

## Error Recovery Strategies

### Automatic Retry

```javascript
export const withRetry = async (
  operation,
  maxRetries = 3,
  delayMs = 1000
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry authentication errors
      if (error.statusCode === 401) throw error;

      // Don't retry validation errors
      if (error.statusCode === 400) throw error;

      // Wait before retry
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, delayMs * attempt));
      }
    }
  }

  throw lastError;
};

// Usage
const result = await withRetry(
  () => fetchUserData(userId),
  3, // max retries
  1000 // delay ms
);
```

### Graceful Degradation

```javascript
export const getCourseWithFallback = async (courseId) => {
  try {
    return await courseServices.getCourseById(courseId);
  } catch (error) {
    console.warn('Failed to fetch course, using cache:', error);

    // Try cache
    const cached = getCachedCourse(courseId);
    if (cached) return cached;

    // Fallback to empty object
    return getEmptyCourse();
  }
};
```

---

## Monitoring Errors

### Error Rate Alerts

Monitor via Firebase Console → Monitoring

- **Critical**: Error rate > 5%
- **Warning**: Error rate > 1%
- **Target**: Error rate < 0.1%

### Common Error Patterns

Track these patterns in production:

```javascript
// Track authentication failures
logError('AUTH_FAILED', error, { attempts });

// Track payment failures
logError('PAYMENT_FAILED', error, { amount, provider });

// Track quota exceeded
logError('QUOTA_EXCEEDED', error, { resource });

// Track timeout errors
logError('TIMEOUT', error, { operation, duration });
```

---

**Last Updated**: December 2, 2025
