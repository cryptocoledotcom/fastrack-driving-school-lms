# Phase 1 Function Wrapping Guide

## Status: Imports Complete for All Services, Function Wrapping In Progress

This guide provides the exact pattern for wrapping remaining ~108 functions across 10 services.

## Universal Wrapping Pattern

Every async function follows this structure:

```javascript
// BEFORE
export const functionName = async (param1, param2) => {
  try {
    // validation logic
    if (!param1) throw new Error('param1 required');
    
    // main logic
    const result = await someOperation();
    
    return result;
  } catch (error) {
    console.error('Error message:', error);
    throw error;
  }
};

// AFTER  
export const functionName = async (param1, param2) => {
  return executeService(async () => {
    // 1. VALIDATION
    validateParam1(param1);
    if (!param2 || typeof param2 !== 'object') {
      throw new ValidationError('param2 must be non-empty object');
    }
    
    // 2. MAIN LOGIC (keep all existing code)
    const result = await someOperation();
    
    return result;
  }, 'functionName');
};
```

## Services Status and Wrapping Order

### Priority 1: Core Business Logic (Do First)

#### 1. progressServices.js (11 functions to wrap)
**Functions**: initializeProgress, getProgress, saveProgress, updateProgress, markLessonComplete, markLessonCompleteWithCompliance, markModuleComplete, markModuleCompleteWithCompliance, updateLessonProgress, getUserStats

**Pattern**:
```javascript
export const initializeProgress = async (userId, courseId, totalLessons = 0) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    if (typeof totalLessons !== 'number' || totalLessons < 0) {
      throw new ValidationError('totalLessons must be non-negative number');
    }
    // ... existing code
  }, 'initializeProgress');
};
```

#### 2. enrollmentServices.js (16 functions to wrap)
**Functions**: createEnrollment, createPaidEnrollment, getEnrollment, getUserEnrollments, updateEnrollmentAfterPayment, autoEnrollAdmin, [+11 more]

**Pattern**:
```javascript
export const createEnrollment = async (userId, courseId, userEmail = '') => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    if (userEmail && !userEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new ValidationError('Invalid email format');
    }
    // ... existing code
  }, 'createEnrollment');
};
```

#### 3. quizServices.js (12 functions to wrap)
**Functions**: submitQuizAttempt, getQuizzes, getQuizById, createQuiz, updateQuiz, deleteQuiz, getUserQuizAttempts, getAttemptDetails, [+4 more]

**Pattern**:
```javascript
export const submitQuizAttempt = async (userId, courseId, quizData) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    if (!quizData || !quizData.answers) {
      throw new ValidationError('Quiz data with answers required');
    }
    // ... existing code
  }, 'submitQuizAttempt');
};
```

### Priority 2: Administrative (Do Second)

#### 4. complianceServices.js (15 functions to wrap)
**Functions**: createComplianceSession, updateComplianceSession, closeComplianceSession, getDailyTime, checkDailyHourLockout, [+10 more]

**Pattern**:
```javascript
export const createComplianceSession = async (userId, courseId, data) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Session data required');
    }
    // ... existing code
  }, 'createComplianceSession');
};
```

#### 5. paymentServices.js (10 functions to wrap)
**Functions**: initializePayment, confirmPayment, getPaymentStatus, refundPayment, [+6 more]

**Pattern**:
```javascript
export const initializePayment = async (userId, courseId, amount, paymentType) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    if (typeof amount !== 'number' || amount <= 0) {
      throw new ValidationError('Amount must be positive number');
    }
    // ... existing code
  }, 'initializePayment');
};
```

### Priority 3: Content Management (Do Third)

#### 6. courseServices.js (9 functions to wrap)
**Functions**: getCourses, getCourseById, getFeaturedCourses, getCoursesByCategory, createCourse, updateCourse, deleteCourse, searchCourses, getCourseStats

**Pattern**:
```javascript
export const getCourseById = async (courseId) => {
  return executeService(async () => {
    validateCourseId(courseId);
    // ... existing code
  }, 'getCourseById');
};
```

#### 7. lessonServices.js (11 functions to wrap)
**Functions**: getLessons, getLessonById, createLesson, updateLesson, deleteLesson, reorderLessons, [+5 more]

**Pattern**:
```javascript
export const createLesson = async (lessonData) => {
  return executeService(async () => {
    validateLessonData(lessonData);
    if (!lessonData.moduleId) {
      throw new ValidationError('moduleId required in lessonData');
    }
    // ... existing code
  }, 'createLesson');
};
```

#### 8. moduleServices.js - ALREADY COMPLETE ✅

### Priority 4: Utility Services (Do Last)

#### 9. schedulingServices.js (9 functions to wrap)
**Functions**: createTimeSlot, getTimeSlots, updateTimeSlot, deleteTimeSlot, [+5 more]

**Pattern**:
```javascript
export const createTimeSlot = async (timeSlotData) => {
  return executeService(async () => {
    validateTimeSlotData(timeSlotData);
    // ... existing code
  }, 'createTimeSlot');
};
```

#### 10. pvqServices.js (7 functions to wrap)
**Functions**: submitPVQData, getPVQResults, updateVerificationStatus, [+4 more]

**Pattern**:
```javascript
export const submitPVQData = async (data) => {
  return executeService(async () => {
    validatePVQData(data);
    if (!data.userId) {
      throw new ValidationError('userId required in PVQ data');
    }
    // ... existing code
  }, 'submitPVQData');
};
```

#### 11. securityServices.js (8 functions to wrap)
**Functions**: getSecurityProfile, updateSecurityQuestions, verifySecurityAnswers, [+5 more]

**Pattern**:
```javascript
export const updateSecurityQuestions = async (userId, questions) => {
  return executeService(async () => {
    validateUserId(userId);
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new ValidationError('Security questions must be non-empty array');
    }
    // ... existing code
  }, 'updateSecurityQuestions');
};
```

## Quick Reference: Validators Available

```javascript
// User/Course IDs
validateUserId(userId)
validateCourseId(courseId)
validateEmail(email)

// Data Objects
validateSessionId(sessionId)
validateQuizAttemptData(data)
validateEnrollmentData(userId, courseId, userEmail)
validateBreakData(breakData)
validateLessonCompletionData(data)
validatePVQData(data)
validatePaymentData(userId, courseId, amount, paymentType)
validateProgressData(userId, courseId, totalLessons)
validateLessonData(lessonData)
validateModuleData(moduleData)
validateCourseData(courseData)
validateTimeSlotData(slotData)
```

## Quick Reference: Error Classes Available

```javascript
// All throw appropriate error type
ValidationError('message')
AuthError('message')
ComplianceError('message', sessionId)
EnrollmentError('message', enrollmentId)
PaymentError('message', paymentId)
QuizError('message', quizId)
ProgressError('message', courseId)
LessonError('message', lessonId)
ModuleError('message', moduleId)
CourseError('message', courseId)
PVQError('message', questionId)
SchedulingError('message', slotId)
```

## Testing Pattern After Wrapping

```javascript
// Test 1: Invalid input
try {
  await functionName(null, 'invalid');
  console.log('❌ Should have thrown ValidationError');
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('✅ Correctly caught ValidationError');
  }
}

// Test 2: Valid input
try {
  const result = await functionName(validId, validData);
  console.log('✅ Valid input worked:', result);
} catch (error) {
  console.log('❌ Unexpected error:', error.message);
}

// Test 3: Error format
try {
  await invalidOperation();
} catch (error) {
  console.log('Error JSON:', JSON.stringify(error.toJSON(), null, 2));
}
```

## Completion Tracking

- [x] Infrastructure complete (validators, errors, wrapper)
- [x] Imports added to all 13 services
- [x] userServices: 10/10 wrapped ✅
- [x] moduleServices: 7/7 wrapped ✅
- [x] authServices: 8/8 wrapped ✅
- [ ] progressServices: 0/11 wrapped
- [ ] enrollmentServices: 1/16 wrapped
- [ ] quizServices: 1/12 wrapped
- [ ] complianceServices: 1/15 wrapped
- [ ] paymentServices: 1/10 wrapped
- [ ] courseServices: 0/9 wrapped
- [ ] lessonServices: 0/11 wrapped
- [ ] schedulingServices: 0/9 wrapped
- [ ] pvqServices: 0/7 wrapped
- [ ] securityServices: 0/8 wrapped

**Total: 25/133 wrapped (18.8%)**

## Steps to Complete Remaining ~108 Functions

1. **For each service:**
   - Open the file (e.g., `src/api/progressServices.js`)
   - Copy the wrapping pattern from this guide
   - For each `export const functionName = async...` block:
     - Change `try {...} catch (error) {...}` to `return executeService(async () => {...}, 'functionName')`
     - Add validation at top of executeService block
     - Remove `console.error` lines
     - Remove `throw error` lines (error is auto-thrown by executeService)

2. **After wrapping each service:**
   - Run: `npm run lint` to check syntax
   - Run: `npm test` to verify no breaks
   - Commit with message: "Phase 1: Wrap [ServiceName] functions with error handling"

3. **When all wrapped:**
   - Run full test suite
   - Update PHASE1_COMPLETION_REPORT.md to 100%
   - Create PR for review
   - Deploy to staging

---

**Estimated time to complete remaining functions: 3-4 hours (manual)**
