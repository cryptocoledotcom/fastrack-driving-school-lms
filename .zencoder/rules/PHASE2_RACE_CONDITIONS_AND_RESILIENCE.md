---
description: Phase 2 Implementation - Race Conditions, Timestamps & Network Resilience
alwaysApply: true
---

# Phase 2: Race Conditions & Network Resilience

**Created**: November 30, 2025  
**Status**: Ready for Implementation  
**Duration**: 4 hours total  
**Priority**: HIGH - Critical for multi-tab concurrent access

---

## Executive Summary

Phase 2 addresses three remaining critical robustness gaps:

| Issue | Problem | Solution | Status |
|-------|---------|----------|--------|
| **#4** | Race conditions in concurrent updates | Atomic operations (increment, arrayUnion) | ⏳ Needs audit |
| **#5** | Client-side timestamp manipulation | Server timestamps (DONE) | ✅ Complete |
| **#6** | Network failures without retry | Exponential backoff retry logic | ❌ Missing |

---

## Issue #4: Race Conditions - Comprehensive Audit & Fix

### Problem
When multiple tabs/windows update the same Firestore document simultaneously:
- ❌ One tab's `attempts++` overwrites another tab's count
- ❌ Array appends can be lost (`completionEvents` partially updated)
- ❌ Score updates conflict, creating data inconsistency

### Current State: Partial Mitigation
✅ Some code uses atomic operations in progressServices and complianceServices

❌ Other services may have vulnerability patterns

### Files Requiring Audit & Fix

**Priority order**:
1. `src/api/enrollment/enrollmentServices.js` - Enrollment counts
2. `src/api/courses/quizServices.js` - Quiz attempt counts  
3. `src/api/student/pvqServices.js` - PVQ attempt tracking
4. `src/api/student/userServices.js` - User stats

### Fix Patterns

**Pattern 1: Counter increments**
```javascript
// BEFORE (❌ Race condition)
const enrollment = await getDoc(enrollmentRef);
const newCount = enrollment.data().enrolledCourses + 1;
await updateDoc(enrollmentRef, { enrolledCourses: newCount });

// AFTER (✅ Atomic)
const batch = writeBatch(db);
batch.update(enrollmentRef, {
  enrolledCourses: increment(1),
  updatedAt: serverTimestamp()
});
await batch.commit();
```

**Pattern 2: Array appends**
```javascript
// BEFORE (❌ Possible race condition)
await updateDoc(quizRef, {
  attemptHistory: [...oldHistory, newAttempt]  // Could lose concurrent appends
});

// AFTER (✅ Atomic)
const batch = writeBatch(db);
batch.update(quizRef, {
  attempts: increment(1),
  attemptHistory: arrayUnion(newAttempt)  // Safe concurrent append
});
await batch.commit();
```

---

## Issue #5: Server Timestamps - Status ✅ COMPLETE

✅ All code uses `serverTimestamp()` - VERIFIED  
✅ No client-side timestamp manipulation possible  
✅ No action needed

---

## Issue #6: Network Retry Logic - Implementation

### Problem
When network fails during Firestore update:
- ❌ Error thrown immediately, no retry
- ❌ User thinks update failed
- ❌ Inconsistent state possible

### Solution: Exponential Backoff Retry

**File**: `src/api/base/RetryHandler.js` (NEW)

```javascript
import ApiError from '../errors/ApiError.js';

export class RetryHandler {
  constructor(maxAttempts = 3, initialDelayMs = 100, maxDelayMs = 5000) {
    this.maxAttempts = maxAttempts;
    this.initialDelayMs = initialDelayMs;
    this.maxDelayMs = maxDelayMs;
  }

  getDelayMs(attemptNumber) {
    const exponentialDelay = this.initialDelayMs * Math.pow(2, attemptNumber - 1);
    const cappedDelay = Math.min(exponentialDelay, this.maxDelayMs);
    const jitter = Math.random() * cappedDelay * 0.1;
    return cappedDelay + jitter;
  }

  async execute(operation, operationName = 'Operation') {
    let lastError;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        console.log(`[${operationName}] Attempt ${attempt}/${this.maxAttempts}`);
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`[${operationName}] ✅ Succeeded after ${attempt} attempts`);
        }
        return result;

      } catch (error) {
        lastError = error;
        
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        if (attempt === this.maxAttempts) {
          break;
        }

        const delayMs = this.getDelayMs(attempt);
        console.log(`[${operationName}] ⏱️ Retrying in ${Math.round(delayMs)}ms...`);
        await this.sleep(delayMs);
      }
    }

    throw new ApiError(
      `${operationName} failed after ${this.maxAttempts} attempts`,
      'RETRY_EXHAUSTED',
      500,
      { operationName, attempts: this.maxAttempts }
    );
  }

  isNonRetryableError(error) {
    const nonRetryableCodes = [
      'PERMISSION_DENIED',
      'UNAUTHENTICATED',
      'INVALID_ARGUMENT',
      'NOT_FOUND',
      'ALREADY_EXISTS'
    ];

    const code = error.code || error.message;
    return nonRetryableCodes.some(c => code.includes(c));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const defaultRetryHandler = new RetryHandler(3, 100, 5000);

export const retryAsync = (operation, operationName) => {
  return defaultRetryHandler.execute(operation, operationName);
};
```

---

## Implementation Steps

### Step 1: Create RetryHandler (45 mins)
- Create `src/api/base/RetryHandler.js`
- Implement exponential backoff logic
- Add comprehensive comments

### Step 2: Test Retry Logic (45 mins)
- Create `src/api/base/__tests__/RetryHandler.test.js`
- Test success/failure scenarios
- Verify backoff timing

### Step 3: Audit & Fix Race Conditions (1.5 hours)
- Scan enrollmentServices.js for unsafe patterns
- Convert to atomic operations with increment/arrayUnion
- Update quiz and PVQ services similarly

### Step 4: Integration (30 mins)
- Export RetryHandler for use in services
- Add to critical operations
- Verify tests pass

---

## Validation Checklist

- [ ] RetryHandler.js created with exponential backoff
- [ ] Retry tests passing
- [ ] All counters use increment()
- [ ] All arrays use arrayUnion()
- [ ] No read-modify-write patterns
- [ ] All timestamps serverTimestamp()
- [ ] Concurrent operations tested

---

**Status**: Ready to begin Phase 2 implementation

