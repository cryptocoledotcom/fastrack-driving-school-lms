# Quick Fix Template: How to Update Other Services

Copy this template and adapt to each service. Should take ~15-20 minutes per service.

---

## Template for Service Refactor

### Step 1: Add Imports at Top

```javascript
// Add these imports to your service file
import { executeService } from './base/ServiceWrapper';
import { 
  validateUserId, 
  validateCourseId,
  // ADD OTHER VALIDATORS YOU NEED
} from './validators/validators';
import { YourServiceError } from './errors/ApiError'; // e.g., EnrollmentError, PaymentError
```

### Step 2: Convert Each Function

**Pattern A: Simple Function (Gets data)**
```javascript
// BEFORE
export const getEnrollment = async (userId, courseId) => {
  try {
    const enrollmentRef = doc(db, 'users', userId, 'courses', courseId);
    const enrollmentDoc = await getDoc(enrollmentRef);
    if (enrollmentDoc.exists()) {
      return { id: courseId, ...enrollmentDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting enrollment:', error);
    throw error;
  }
};

// AFTER
export const getEnrollment = async (userId, courseId) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);

    const enrollmentRef = doc(db, 'users', userId, 'courses', courseId);
    const enrollmentDoc = await getDoc(enrollmentRef);
    
    if (!enrollmentDoc.exists()) {
      throw new EnrollmentError(`No enrollment found for user ${userId} in course ${courseId}`);
    }

    return { id: courseId, ...enrollmentDoc.data() };
  }, 'getEnrollment');
};
```

**Pattern B: Create/Update Function (Writes data)**
```javascript
// BEFORE
export const createEnrollment = async (userId, courseId, userEmail = '') => {
  try {
    const enrollmentRef = doc(db, 'users', userId, 'courses', courseId);
    const enrollmentData = { /* ... */ };
    await setDoc(enrollmentRef, enrollmentData);
    return enrollmentData;
  } catch (error) {
    console.error('Error creating enrollment:', error);
    throw error;
  }
};

// AFTER
export const createEnrollment = async (userId, courseId, userEmail = '') => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    if (userEmail && !userEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new ValidationError('Invalid email format');
    }

    const enrollmentRef = doc(db, 'users', userId, 'courses', courseId);
    const enrollmentData = { /* ... */ };
    await setDoc(enrollmentRef, enrollmentData);
    return enrollmentData;
  }, 'createEnrollment');
};
```

**Pattern C: Function with Custom Validation**
```javascript
// BEFORE
export const submitQuizAttempt = async (userId, courseId, quizData) => {
  try {
    // logic...
  } catch (error) {
    console.error('Error submitting quiz:', error);
    throw error;
  }
};

// AFTER
export const submitQuizAttempt = async (userId, courseId, quizData) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    
    // Custom validation for this function
    if (!quizData || !quizData.answers) {
      throw new ValidationError('Quiz data with answers is required');
    }
    if (quizData.score === undefined || quizData.score < 0 || quizData.score > 100) {
      throw new ValidationError('Score must be between 0 and 100');
    }

    // Rest of logic...
  }, 'submitQuizAttempt');
};
```

---

## Per-Service Checklist

### 📋 enrollmentServices.js (25KB)

**Required Validators** (add to `validators.js` if missing):
```javascript
export const validateEnrollmentData = (userId, courseId, userEmail) => {
  const errors = [];
  if (!userId) errors.push('userId is required');
  if (!courseId) errors.push('courseId is required');
  if (userEmail && !userEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push('userEmail must be valid format');
  }
  if (errors.length > 0) {
    throw new ValidationError('Invalid enrollment data: ' + errors.join('; '), errors);
  }
};
```

**Functions to Update**:
- [ ] `createEnrollment()`
- [ ] `createPaidEnrollment()`
- [ ] `getEnrollment()`
- [ ] `getUserEnrollments()`
- [ ] `updateEnrollmentAfterPayment()`
- [ ] `autoEnrollAdmin()`
- [ ] ALL other functions

**Error Type to Create**:
```javascript
// Add to ApiError.js
export class EnrollmentError extends ApiError {
  constructor(message, enrollment = null) {
    super('ENROLLMENT_ERROR', message);
    this.enrollment = enrollment;
  }
}
```

**Imports for enrollmentServices.js**:
```javascript
import { executeService } from './base/ServiceWrapper';
import { 
  validateUserId, 
  validateCourseId,
  validateEmail,
  validateEnrollmentData
} from './validators/validators';
import { EnrollmentError } from './errors/ApiError';
```

---

### 💳 paymentServices.js (6.8KB)

**Required Validators** (add to `validators.js` if missing):
```javascript
export const validatePaymentData = (userId, courseId, amount, paymentType) => {
  const errors = [];
  if (!userId) errors.push('userId is required');
  if (!courseId) errors.push('courseId is required');
  if (typeof amount !== 'number' || amount <= 0) errors.push('amount must be positive number');
  if (!paymentType) errors.push('paymentType is required');
  if (errors.length > 0) {
    throw new ValidationError('Invalid payment data: ' + errors.join('; '), errors);
  }
};
```

**Error Type to Create**:
```javascript
export class PaymentError extends ApiError {
  constructor(message, paymentId = null) {
    super('PAYMENT_ERROR', message);
    this.paymentId = paymentId;
  }
}
```

**Imports**:
```javascript
import { executeService } from './base/ServiceWrapper';
import { 
  validateUserId, 
  validateCourseId,
  validatePaymentData
} from './validators/validators';
import { PaymentError } from './errors/ApiError';
```

**Functions to Update**:
- [ ] `createPaymentIntent()`
- [ ] `createCheckoutSession()`
- [ ] `updatePaymentStatus()`
- [ ] `getPayment()`
- [ ] `processSuccessfulPayment()`
- [ ] `handlePaymentFailure()`
- [ ] ALL others

---

### 📝 quizServices.js (8.3KB)

**Required Validators** (add to `validators.js` if missing):
```javascript
export const validateQuizAttemptData = (data) => {
  const errors = [];
  if (!data.userId) errors.push('userId is required');
  if (!data.courseId) errors.push('courseId is required');
  if (!data.quizId) errors.push('quizId is required');
  if (data.score === undefined || data.score < 0 || data.score > 100) {
    errors.push('score must be number between 0-100');
  }
  if (errors.length > 0) {
    throw new ValidationError('Invalid quiz data: ' + errors.join('; '), errors);
  }
};
```

**Error Type to Create**:
```javascript
export class QuizError extends ApiError {
  constructor(message, quizId = null) {
    super('QUIZ_ERROR', message);
    this.quizId = quizId;
  }
}
```

**Imports**:
```javascript
import { executeService } from './base/ServiceWrapper';
import { 
  validateUserId, 
  validateCourseId,
  validateQuizAttemptData
} from './validators/validators';
import { QuizError } from './errors/ApiError';
```

**Functions to Update**:
- [ ] `createQuizAttempt()`
- [ ] `submitQuizAttempt()`
- [ ] `getQuizAttempts()`
- [ ] `canRetakeQuiz()`
- [ ] ALL others

---

### 📊 progressServices.js (11.2KB)

**Error Type to Create**:
```javascript
export class ProgressError extends ApiError {
  constructor(message, courseId = null) {
    super('PROGRESS_ERROR', message);
    this.courseId = courseId;
  }
}
```

**Imports**:
```javascript
import { executeService } from './base/ServiceWrapper';
import { 
  validateUserId, 
  validateCourseId
} from './validators/validators';
import { ProgressError } from './errors/ApiError';
```

**Functions to Update**:
- [ ] `initializeProgress()`
- [ ] `getProgress()`
- [ ] `markLessonComplete()`
- [ ] `updateProgress()`
- [ ] ALL others

---

## Time Estimates

| Service | LOC | Est. Time | Difficulty |
|---------|-----|-----------|------------|
| enrollmentServices.js | 650 | 25 min | 🟡 Medium |
| paymentServices.js | 220 | 15 min | 🟢 Easy |
| quizServices.js | 270 | 20 min | 🟡 Medium |
| progressServices.js | 365 | 20 min | 🟡 Medium |
| lessonServices.js | 195 | 12 min | 🟢 Easy |
| moduleServices.js | 120 | 8 min | 🟢 Easy |
| courseServices.js | 170 | 12 min | 🟢 Easy |
| authServices.js | 90 | 8 min | 🟢 Easy |
| pvqServices.js | 190 | 12 min | 🟢 Easy |
| schedulingServices.js | 195 | 12 min | 🟢 Easy |
| securityServices.js | 190 | 12 min | 🟢 Easy |
| userServices.js | 170 | 12 min | 🟢 Easy |

**Total Estimated Time**: 4-5 hours to update all 12 services

---

## Copy-Paste Validators (Add to validators.js as needed)

```javascript
export const validatePaymentData = (userId, courseId, amount, paymentType) => {
  const errors = [];
  if (!userId) errors.push('userId is required');
  if (!courseId) errors.push('courseId is required');
  if (typeof amount !== 'number' || amount <= 0) errors.push('amount must be positive number');
  if (!paymentType) errors.push('paymentType is required');
  if (errors.length > 0) {
    throw new ValidationError('Invalid payment data: ' + errors.join('; '), errors);
  }
};

export const validateQuizAttemptData = (data) => {
  const errors = [];
  if (!data.userId) errors.push('userId is required');
  if (!data.courseId) errors.push('courseId is required');
  if (!data.quizId) errors.push('quizId is required');
  if (data.score === undefined || data.score < 0 || data.score > 100) {
    errors.push('score must be number between 0-100');
  }
  if (errors.length > 0) {
    throw new ValidationError('Invalid quiz data: ' + errors.join('; '), errors);
  }
};

export const validateProgressData = (userId, courseId, totalLessons) => {
  const errors = [];
  if (!userId) errors.push('userId is required');
  if (!courseId) errors.push('courseId is required');
  if (typeof totalLessons !== 'number' || totalLessons < 0) {
    errors.push('totalLessons must be non-negative number');
  }
  if (errors.length > 0) {
    throw new ValidationError('Invalid progress data: ' + errors.join('; '), errors);
  }
};
```

---

## Error Types to Add to ApiError.js

```javascript
export class EnrollmentError extends ApiError {
  constructor(message, enrollment = null) {
    super('ENROLLMENT_ERROR', message);
    this.enrollment = enrollment;
  }
}

export class PaymentError extends ApiError {
  constructor(message, paymentId = null) {
    super('PAYMENT_ERROR', message);
    this.paymentId = paymentId;
  }
}

export class QuizError extends ApiError {
  constructor(message, quizId = null) {
    super('QUIZ_ERROR', message);
    this.quizId = quizId;
  }
}

export class ProgressError extends ApiError {
  constructor(message, courseId = null) {
    super('PROGRESS_ERROR', message);
    this.courseId = courseId;
  }
}

export class LessonError extends ApiError {
  constructor(message, lessonId = null) {
    super('LESSON_ERROR', message);
    this.lessonId = lessonId;
  }
}

export class ModuleError extends ApiError {
  constructor(message, moduleId = null) {
    super('MODULE_ERROR', message);
    this.moduleId = moduleId;
  }
}

export class CourseError extends ApiError {
  constructor(message, courseId = null) {
    super('COURSE_ERROR', message);
    this.courseId = courseId;
  }
}

export class PVQError extends ApiError {
  constructor(message, questionId = null) {
    super('PVQ_ERROR', message);
    this.questionId = questionId;
  }
}

export class SchedulingError extends ApiError {
  constructor(message, slotId = null) {
    super('SCHEDULING_ERROR', message);
    this.slotId = slotId;
  }
}
```

---

## How to Test Your Changes

```javascript
// Test 1: Try with invalid userId
try {
  await getEnrollment(null, 'course-123');
} catch (error) {
  console.log('✅ Caught:', error.code, error.message);
}

// Test 2: Try with valid data
try {
  const result = await getEnrollment('user-123', 'course-123');
  console.log('✅ Success:', result);
} catch (error) {
  console.log('❌ Error:', error.message);
}

// Test 3: Check error format
try {
  await someFunction(invalidData);
} catch (error) {
  console.log('Error JSON:', JSON.stringify(error.toJSON(), null, 2));
}
```

---

**Recommended Order to Complete**:
1. enrollmentServices.js (most critical)
2. paymentServices.js (transactions)
3. quizServices.js (compliance-critical)
4. progressServices.js (important)
5. All others

Each service typically takes 12-25 minutes. You can do 2-3 per session.
