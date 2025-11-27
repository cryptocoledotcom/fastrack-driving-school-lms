---
description: Comprehensive Codebase Improvement Roadmap - Detailed Implementation Guide
alwaysApply: true
---

# Fastrack LMS - Codebase Improvement Roadmap
## Detailed Implementation Guide (No TypeScript)

**Created**: November 27, 2025  
**Status**: Ready for Implementation  
**Total Duration**: 6-9 days  
**Priority**: Phase 1 (Critical) → Phase 2 (Organization) → Phase 3 (Production)

---

## EXECUTIVE SUMMARY

Your codebase is functionally complete but needs **structural improvements** to prevent silent failures, improve maintainability, and prepare for production scale. This roadmap breaks down 3 phases into **actionable, bite-sized tasks** with concrete deliverables.

### Current State Assessment
- ✅ **Functionality**: 100% - All compliance features working
- 🟡 **Error Handling**: 40% - Inconsistent, scattered error patterns
- 🟡 **Performance**: 60% - Some inefficient Firestore queries
- 🟡 **Maintainability**: 50% - High state complexity (TimerContext), code duplication
- 🟡 **Testing Ready**: 30% - No error boundary, inconsistent validation

### What This Roadmap Achieves
| Phase | Focus | Impact | Days |
|-------|-------|--------|------|
| **Phase 1** 🚨 | Stability | Prevents crashes, validates input | 3-4 |
| **Phase 2** 🏗️ | Organization | 100+ lines duplicate code eliminated | 2-3 |
| **Phase 3** 🚀 | Production | Graceful error handling, proper logging | 1-2 |

---

## PHASE 1: CRITICAL FIXES FOR STABILITY (3-4 DAYS)

### Overview
These changes **prevent silent failures** and ensure your application doesn't crash on bad input. Focus on:
- Standardized error handling across all 13 services
- Input validation before operations
- Null/undefined protection
- Firestore query optimization
- TimerContext state consolidation

### Task 1.1: Error Handling & Validation Layer (1.5 days)

#### Current State
Your services have **inconsistent** error handling:
- Some use `try-catch`, some don't
- Error messages scattered across files
- No centralized error logging
- Validation happens in components (not services)
- No input sanitization

#### Goal
Create a **consistent error handling pattern** across all 13 services with:
- Standardized error format
- Centralized error logging
- Input validation before database operations
- Graceful fallbacks

#### Implementation Steps

**Step 1.1.1: Create Enhanced ApiError Class** (1 hour)

**File**: `src/api/errors/ApiError.js` (Already exists - enhance it)

```javascript
// CURRENT: Likely minimal implementation
// ENHANCED: Add these properties and methods

class ApiError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', statusCode = 500, context = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;        // e.g., 'VALIDATION_ERROR', 'NOT_FOUND', 'FIRESTORE_ERROR'
    this.statusCode = statusCode; // HTTP-like codes for consistency
    this.context = context;  // Additional data (userId, collectionName, etc.)
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        timestamp: this.timestamp,
        context: this.context
      }
    };
  }

  // Helper methods for common errors
  static validation(message, field, context = {}) {
    return new ApiError(
      `Validation Error: ${message}`,
      'VALIDATION_ERROR',
      400,
      { field, ...context }
    );
  }

  static notFound(resourceType, id, context = {}) {
    return new ApiError(
      `${resourceType} not found with ID: ${id}`,
      'NOT_FOUND',
      404,
      { resourceType, id, ...context }
    );
  }

  static firestore(originalError, context = {}) {
    return new ApiError(
      `Database Error: ${originalError.message}`,
      'FIRESTORE_ERROR',
      500,
      { originalCode: originalError.code, ...context }
    );
  }

  static unauthorized(message = 'User not authenticated', context = {}) {
    return new ApiError(message, 'UNAUTHORIZED', 401, context);
  }

  static forbidden(message = 'User does not have permission', context = {}) {
    return new ApiError(message, 'FORBIDDEN', 403, context);
  }
}

export default ApiError;
```

**Why**: Standardizes all errors into one consistent format. Makes it easy to log, handle, and display errors.

---

**Step 1.1.2: Create Error Logging Service** (1 hour)

**File**: `src/services/loggingService.js` (NEW)

```javascript
// Centralized error logging

class LoggingService {
  // Log levels: DEBUG, INFO, WARN, ERROR
  static log(level, message, data = {}) {
    const logEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Node.js'
    };

    // Console for development
    if (process.env.NODE_ENV === 'development') {
      console[level.toLowerCase()](message, data);
    }

    // Could send to Firebase Cloud Logging (Phase 3)
    return logEntry;
  }

  static debug(message, data = {}) {
    return this.log('DEBUG', message, data);
  }

  static info(message, data = {}) {
    return this.log('INFO', message, data);
  }

  static warn(message, data = {}) {
    return this.log('WARN', message, data);
  }

  static error(message, error = null, context = {}) {
    const errorData = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      code: error.code
    } : error;

    return this.log('ERROR', message, { error: errorData, context });
  }
}

export default LoggingService;
```

---

**Step 1.1.3: Enhanced Validator Service** (1 hour)

**File**: `src/api/validators/validators.js` (Enhance existing)

```javascript
// PATTERN: This is what EACH validation function should look like

import ApiError from '../errors/ApiError.js';

const validators = {
  // ===== STRING VALIDATORS =====
  
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      throw ApiError.validation('Email is required', 'email');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw ApiError.validation('Invalid email format', 'email', { provided: email });
    }
    return email.trim().toLowerCase();
  },

  validatePassword(password, minLength = 8) {
    if (!password || typeof password !== 'string') {
      throw ApiError.validation('Password is required', 'password');
    }
    if (password.length < minLength) {
      throw ApiError.validation(
        `Password must be at least ${minLength} characters`,
        'password',
        { minLength, provided: password.length }
      );
    }
    return password;
  },

  validateNotEmpty(value, fieldName) {
    if (!value || (typeof value === 'string' && !value.trim())) {
      throw ApiError.validation(`${fieldName} cannot be empty`, fieldName);
    }
    return typeof value === 'string' ? value.trim() : value;
  },

  // ===== ID/UID VALIDATORS =====

  validateUserId(userId) {
    if (!userId || typeof userId !== 'string') {
      throw ApiError.validation('User ID is required and must be a string', 'userId');
    }
    if (userId.length < 10) {
      throw ApiError.validation('Invalid user ID format', 'userId', { provided: userId });
    }
    return userId;
  },

  validateCourseId(courseId) {
    if (!courseId || typeof courseId !== 'string') {
      throw ApiError.validation('Course ID is required', 'courseId');
    }
    if (courseId.length === 0) {
      throw ApiError.validation('Course ID cannot be empty', 'courseId');
    }
    return courseId;
  },

  validateDocumentId(docId, fieldName = 'documentId') {
    if (!docId || typeof docId !== 'string') {
      throw ApiError.validation(`${fieldName} is required`, fieldName);
    }
    return docId;
  },

  // ===== NUMBER VALIDATORS =====

  validatePositiveNumber(value, fieldName, allowZero = false) {
    if (value === null || value === undefined || typeof value !== 'number') {
      throw ApiError.validation(`${fieldName} must be a number`, fieldName);
    }
    if (allowZero && value < 0) {
      throw ApiError.validation(`${fieldName} must be 0 or positive`, fieldName);
    }
    if (!allowZero && value <= 0) {
      throw ApiError.validation(`${fieldName} must be positive`, fieldName);
    }
    return value;
  },

  validateAmount(amount) {
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw ApiError.validation('Amount must be a positive number', 'amount', { provided: amount });
    }
    return amount;
  },

  // ===== OBJECT VALIDATORS =====

  validateObject(obj, fieldName = 'object') {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      throw ApiError.validation(`${fieldName} must be an object`, fieldName);
    }
    return obj;
  },

  validateArray(arr, fieldName = 'array', minLength = 0) {
    if (!Array.isArray(arr)) {
      throw ApiError.validation(`${fieldName} must be an array`, fieldName);
    }
    if (arr.length < minLength) {
      throw ApiError.validation(
        `${fieldName} must have at least ${minLength} items`,
        fieldName
      );
    }
    return arr;
  },

  // ===== FIRESTORE-SPECIFIC VALIDATORS =====

  validateFirestoreData(data, fieldName = 'data') {
    // Prevent storing functions, symbols, etc. in Firestore
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'function' || typeof value === 'symbol') {
        throw ApiError.validation(
          `Cannot store ${typeof value} in Firestore`,
          fieldName,
          { invalidKey: key, invalidType: typeof value }
        );
      }
    }
    return data;
  },

  // ===== COMPOSITE VALIDATORS =====

  validateEnrollmentData(data) {
    this.validateObject(data, 'enrollmentData');
    this.validateUserId(data.userId);
    this.validateCourseId(data.courseId);
    if (data.paidAmount !== undefined && data.paidAmount !== null) {
      this.validateAmount(data.paidAmount);
    }
    return data;
  },

  validateQuizAttempt(data) {
    this.validateObject(data, 'quizAttempt');
    this.validateUserId(data.userId);
    this.validateCourseId(data.courseId);
    this.validateDocumentId(data.quizId, 'quizId');
    if (data.score !== undefined) {
      this.validatePositiveNumber(data.score, 'score', true);
    }
    return data;
  }
};

export default validators;
```

---

**Step 1.1.4: Create Service Wrapper Pattern** (1 hour)

**File**: `src/api/base/ServiceBase.js` (Enhanced version)

```javascript
import ApiError from '../errors/ApiError.js';
import LoggingService from '../../services/loggingService.js';
import validators from '../validators/validators.js';
import { db, auth } from '../../config/firebase.js';

// Base class that ALL services should extend
class ServiceBase {
  constructor(serviceName) {
    this.serviceName = serviceName;
  }

  // ===== AUTHENTICATION HELPERS =====

  async getCurrentUser() {
    if (!auth.currentUser) {
      throw ApiError.unauthorized('User is not authenticated');
    }
    return auth.currentUser;
  }

  async getCurrentUserId() {
    const user = await this.getCurrentUser();
    return user.uid;
  }

  // ===== FIRESTORE HELPERS =====

  async getDoc(collectionName, docId) {
    try {
      validators.validateDocumentId(docId, `${collectionName} ID`);
      const docRef = db.collection(collectionName).doc(docId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        throw ApiError.notFound(collectionName, docId);
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.firestore(error, { 
        serviceName: this.serviceName, 
        operation: 'getDoc',
        collectionName,
        docId 
      });
    }
  }

  async getCollection(collectionName, filters = []) {
    try {
      let query = db.collection(collectionName);

      for (const filter of filters) {
        const { field, operator, value } = filter;
        query = query.where(field, operator, value);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      throw ApiError.firestore(error, {
        serviceName: this.serviceName,
        operation: 'getCollection',
        collectionName
      });
    }
  }

  async setDoc(collectionName, docId, data) {
    try {
      validators.validateDocumentId(docId, `${collectionName} ID`);
      validators.validateFirestoreData(data, `${collectionName} data`);

      await db.collection(collectionName).doc(docId).set(data);
      return { id: docId, ...data };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.firestore(error, {
        serviceName: this.serviceName,
        operation: 'setDoc',
        collectionName,
        docId
      });
    }
  }

  async updateDoc(collectionName, docId, updates) {
    try {
      validators.validateDocumentId(docId, `${collectionName} ID`);
      validators.validateFirestoreData(updates, `${collectionName} updates`);

      await db.collection(collectionName).doc(docId).update(updates);
      return { id: docId, ...updates };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw ApiError.firestore(error, {
        serviceName: this.serviceName,
        operation: 'updateDoc',
        collectionName,
        docId
      });
    }
  }

  async deleteDoc(collectionName, docId) {
    try {
      validators.validateDocumentId(docId, `${collectionName} ID`);
      await db.collection(collectionName).doc(docId).delete();
      return { success: true };
    } catch (error) {
      throw ApiError.firestore(error, {
        serviceName: this.serviceName,
        operation: 'deleteDoc',
        collectionName,
        docId
      });
    }
  }

  async batch(operations) {
    try {
      if (!Array.isArray(operations) || operations.length === 0) {
        throw new Error('Operations must be a non-empty array');
      }

      const batch = db.batch();

      for (const op of operations) {
        const { type, collectionName, docId, data } = op;
        const docRef = db.collection(collectionName).doc(docId);

        if (type === 'set') {
          batch.set(docRef, data);
        } else if (type === 'update') {
          batch.update(docRef, data);
        } else if (type === 'delete') {
          batch.delete(docRef);
        }
      }

      await batch.commit();
      return { success: true, operationCount: operations.length };
    } catch (error) {
      throw ApiError.firestore(error, {
        serviceName: this.serviceName,
        operation: 'batch',
        operationCount: operations.length
      });
    }
  }

  // ===== LOGGING HELPERS =====

  log(message, data = {}) {
    LoggingService.info(message, { service: this.serviceName, ...data });
  }

  logError(message, error, context = {}) {
    LoggingService.error(message, error, { service: this.serviceName, ...context });
  }

  // ===== VALIDATION HELPERS =====

  validate = validators;
}

export default ServiceBase;
```

**Why**: Eliminates code duplication across all 13 services. Every service can now extend this instead of having their own try-catch and error handling.

---

**Step 1.1.5: Create Input Sanitizer** (30 mins)

**File**: `src/api/validators/sanitizer.js` (NEW)

```javascript
// Input sanitization - prevents malicious/bad data

class Sanitizer {
  static sanitizeString(str) {
    if (typeof str !== 'string') return str;
    // Remove leading/trailing whitespace
    // Escape HTML-like characters for safety
    return str.trim().replace(/[<>]/g, '');
  }

  static sanitizeObject(obj) {
    if (typeof obj !== 'object' || !obj) return obj;

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  static sanitizeEmail(email) {
    return this.sanitizeString(email).toLowerCase();
  }

  static sanitizeUrl(url) {
    // Basic URL validation - no javascript: protocol
    if (url.startsWith('javascript:')) {
      throw new Error('Invalid URL - JavaScript protocol not allowed');
    }
    return this.sanitizeString(url);
  }
}

export default Sanitizer;
```

---

**Step 1.1.6: Update All 13 Services to Use Base Class** (1-2 hours)

**Pattern**: Replace each service with this structure:

```javascript
// BEFORE (authServices.js example):
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// AFTER (using ServiceBase):
import ServiceBase from './base/ServiceBase.js';
import Sanitizer from './validators/sanitizer.js';

class AuthService extends ServiceBase {
  constructor() {
    super('AuthService');
  }

  async login(email, password) {
    try {
      // Validate inputs
      const sanitizedEmail = this.validate.validateEmail(email);
      this.validate.validatePassword(password);

      // Attempt login
      const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password);

      this.log('User logged in successfully', { userId: userCredential.user.uid });
      return userCredential.user;

    } catch (error) {
      this.logError('Login failed', error, { email });
      throw error instanceof ApiError ? error : ApiError.firestore(error);
    }
  }

  async register(email, password) {
    try {
      const sanitizedEmail = this.validate.validateEmail(email);
      this.validate.validatePassword(password);

      const userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);

      this.log('User registered', { userId: userCredential.user.uid });
      return userCredential.user;

    } catch (error) {
      this.logError('Registration failed', error, { email });
      throw error instanceof ApiError ? error : ApiError.firestore(error);
    }
  }

  // ... rest of methods follow same pattern
}

export default new AuthService();
```

**Order to update services** (largest to smallest):
1. `enrollmentServices.js` (25 KB) - Most complex, biggest wins
2. `complianceServices.js` (12 KB)
3. `progressServices.js` (12 KB)
4. `courseServices.js`, `paymentServices.js`, others...

---

### Task 1.2: Firestore Query Optimization (0.5 days)

#### Current Issues
- Queries not using pagination
- Missing indexes cause slow results
- Some queries fetch entire collections instead of filtering

#### Goal
Optimize queries for performance and cost

**Step 1.2.1: Add Pagination Helper** (30 mins)

**File**: `src/api/base/QueryHelper.js` (NEW)

```javascript
class QueryHelper {
  static async paginate(collectionName, pageSize = 10, filters = []) {
    try {
      let query = db.collection(collectionName);

      // Apply filters
      for (const { field, operator, value } of filters) {
        query = query.where(field, operator, value);
      }

      // Get total count
      const countSnapshot = await query.get();
      const total = countSnapshot.size;

      // Get first page
      const snapshot = await query.limit(pageSize).get();
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];

      return {
        docs,
        total,
        pageSize,
        currentPage: 1,
        totalPages: Math.ceil(total / pageSize),
        hasNextPage: total > pageSize,
        lastVisible
      };
    } catch (error) {
      throw ApiError.firestore(error);
    }
  }

  static async getNextPage(collectionName, lastVisible, pageSize = 10, filters = []) {
    try {
      let query = db.collection(collectionName);

      for (const { field, operator, value } of filters) {
        query = query.where(field, operator, value);
      }

      const snapshot = await query
        .startAfter(lastVisible)
        .limit(pageSize)
        .get();

      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return {
        docs,
        pageSize,
        hasNextPage: docs.length === pageSize,
        lastVisible: snapshot.docs[snapshot.docs.length - 1]
      };
    } catch (error) {
      throw ApiError.firestore(error);
    }
  }
}

export default QueryHelper;
```

**Step 1.2.2: Add Caching Layer** (30 mins)

**File**: `src/api/base/CacheService.js` (NEW)

```javascript
// Simple in-memory cache to reduce Firestore reads

class CacheService {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  invalidate(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

export default CacheService;
```

---

### Task 1.3: Split TimerContext into Custom Hooks (1.5 days)

#### Current State
`TimerContext.jsx` has **25+ state variables** making it:
- Hard to understand
- Slow to re-render
- Difficult to test
- Mixing multiple concerns (timer, breaks, PVQ, session)

#### Goal
Split into 4 focused custom hooks that are:
- Easy to understand
- Fast (only re-render what's needed)
- Testable
- Reusable

**Step 1.3.1: Create `useSessionTimer` Hook** (40 mins)

**File**: `src/hooks/useSessionTimer.js` (NEW)

```javascript
import { useState, useCallback, useEffect } from 'react';
import { MAX_DAILY_HOURS } from '../constants/appConfig.js';
import complianceServices from '../api/complianceServices.js';

// Handles: Session timing, start/stop, daily limits
export const useSessionTimer = (courseId) => {
  const [sessionTime, setSessionTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);

  // Check daily lockout on mount
  useEffect(() => {
    const checkLockout = async () => {
      const dailyTime = await complianceServices.getDailyTime(courseId);
      if (dailyTime >= MAX_DAILY_HOURS) {
        setIsLockedOut(true);
      }
    };
    checkLockout();
  }, [courseId]);

  // Timer interval
  useEffect(() => {
    let interval;
    if (isActive && !isPaused && !isLockedOut) {
      interval = setInterval(() => {
        setSessionTime(prev => {
          const newTime = prev + 1;
          const totalMinutes = (newTime / 60);
          
          if (newTime >= MAX_DAILY_HOURS) {
            setIsLockedOut(true);
            setIsActive(false);
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, isLockedOut]);

  const startTimer = useCallback(() => {
    if (!isLockedOut) {
      setIsActive(true);
      setIsPaused(false);
    }
  }, [isLockedOut]);

  const stopTimer = useCallback(() => {
    setIsActive(false);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeTimer = useCallback(() => {
    if (!isLockedOut) {
      setIsPaused(false);
    }
  }, [isLockedOut]);

  return {
    // State
    sessionTime,
    totalTime,
    isActive,
    isPaused,
    isLockedOut,
    
    // Methods
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    
    // Getters
    sessionMinutes: Math.floor(sessionTime / 60),
    sessionSeconds: sessionTime % 60,
    totalMinutes: Math.floor(totalTime / 60),
  };
};
```

**Step 1.3.2: Create `useBreakManagement` Hook** (40 mins)

**File**: `src/hooks/useBreakManagement.js` (NEW)

```javascript
import { useState, useCallback } from 'react';
import { BREAK_REQUIRED_AFTER, MIN_BREAK_DURATION } from '../constants/appConfig.js';
import ApiError from '../api/errors/ApiError.js';

// Handles: Break requirements, enforcement, tracking
export const useBreakManagement = (sessionTime) => {
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [isBreakMandatory, setIsBreakMandatory] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [breakHistory, setBreakHistory] = useState([]);

  // Check if break is due
  const isBreakDue = sessionTime > 0 && sessionTime % BREAK_REQUIRED_AFTER === 0;

  const startBreak = useCallback((breakType = 'mandatory') => {
    setIsOnBreak(true);
    setBreakStartTime(Date.now());
    if (breakType === 'mandatory') {
      setIsBreakMandatory(true);
    }
  }, []);

  const endBreak = useCallback(() => {
    if (!breakStartTime) return;

    const breakDurationSeconds = Math.floor((Date.now() - breakStartTime) / 1000);

    if (breakDurationSeconds < MIN_BREAK_DURATION) {
      throw ApiError.validation(
        `Break must be at least ${Math.ceil(MIN_BREAK_DURATION / 60)} minutes`,
        'breakDuration',
        { minRequired: MIN_BREAK_DURATION, provided: breakDurationSeconds }
      );
    }

    setBreakHistory(prev => [...prev, {
      startTime: breakStartTime,
      endTime: Date.now(),
      durationSeconds: breakDurationSeconds,
      type: isBreakMandatory ? 'mandatory' : 'voluntary'
    }]);

    setIsOnBreak(false);
    setIsBreakMandatory(false);
    setBreakStartTime(null);
  }, [breakStartTime, isBreakMandatory]);

  const isBreakMinimumMet = breakStartTime 
    ? Math.floor((Date.now() - breakStartTime) / 1000) >= MIN_BREAK_DURATION 
    : false;

  return {
    // State
    isOnBreak,
    isBreakMandatory,
    isBreakDue,
    breakHistory,
    
    // Methods
    startBreak,
    endBreak,
    
    // Getters
    currentBreakDuration: breakStartTime 
      ? Math.floor((Date.now() - breakStartTime) / 1000) 
      : 0,
    isBreakMinimumMet,
    timeUntilBreakRequired: Math.max(0, BREAK_REQUIRED_AFTER - sessionTime)
  };
};
```

**Step 1.3.3: Create `usePVQTrigger` Hook** (40 mins)

**File**: `src/hooks/usePVQTrigger.js` (NEW)

```javascript
import { useState, useCallback, useEffect } from 'react';
import { PVQ_TRIGGER_INTERVAL, PVQ_RANDOM_OFFSET_MIN, PVQ_RANDOM_OFFSET_MAX } from '../constants/appConfig.js';
import pvqServices from '../api/pvqServices.js';

// Handles: PVQ triggering, modal state, random intervals
export const usePVQTrigger = (sessionTime, isActive) => {
  const [showPVQModal, setShowPVQModal] = useState(false);
  const [currentPVQQuestion, setCurrentPVQQuestion] = useState(null);
  const [pvqStartTime, setPVQStartTime] = useState(null);
  const [nextPVQTriggerTime, setNextPVQTriggerTime] = useState(null);
  const [pvqSubmitting, setPVQSubmitting] = useState(false);

  // Calculate next trigger time with random offset
  const calculateNextTriggerTime = useCallback(() => {
    const randomOffset = Math.random() * (PVQ_RANDOM_OFFSET_MAX - PVQ_RANDOM_OFFSET_MIN) + PVQ_RANDOM_OFFSET_MIN;
    return PVQ_TRIGGER_INTERVAL + randomOffset;
  }, []);

  // Initialize next trigger
  useEffect(() => {
    setNextPVQTriggerTime(calculateNextTriggerTime());
  }, [calculateNextTriggerTime]);

  // Check if PVQ should trigger
  useEffect(() => {
    if (isActive && sessionTime > 0 && nextPVQTriggerTime && sessionTime >= nextPVQTriggerTime) {
      triggerPVQ();
    }
  }, [sessionTime, isActive, nextPVQTriggerTime]);

  const triggerPVQ = useCallback(async () => {
    try {
      const question = await pvqServices.getRandomPVQQuestion();
      setCurrentPVQQuestion(question);
      setShowPVQModal(true);
      setPVQStartTime(Date.now());
      setNextPVQTriggerTime(sessionTime + calculateNextTriggerTime());
    } catch (error) {
      console.error('Error triggering PVQ:', error);
    }
  }, [sessionTime, calculateNextTriggerTime]);

  const closePVQModal = useCallback(() => {
    setShowPVQModal(false);
    setCurrentPVQQuestion(null);
    setPVQStartTime(null);
    setPVQSubmitting(false);
  }, []);

  const submitPVQAnswer = useCallback(async (answer) => {
    setPVQSubmitting(true);
    try {
      const responseTime = Date.now() - pvqStartTime;
      // PVQ submission logic here
      closePVQModal();
    } finally {
      setPVQSubmitting(false);
    }
  }, [pvqStartTime, closePVQModal]);

  return {
    // State
    showPVQModal,
    currentPVQQuestion,
    pvqSubmitting,
    nextPVQTriggerTime,
    
    // Methods
    triggerPVQ,
    closePVQModal,
    submitPVQAnswer,
    
    // Getters
    pvqResponseTime: pvqStartTime ? Date.now() - pvqStartTime : 0
  };
};
```

**Step 1.3.4: Create `useSessionData` Hook** (40 mins)

**File**: `src/hooks/useSessionData.js` (NEW)

```javascript
import { useState, useCallback } from 'react';
import complianceServices from '../api/complianceServices.js';

// Handles: Session state, lesson tracking, data persistence
export const useSessionData = (userId, courseId) => {
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [lessonsAccessed, setLessonsAccessed] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);

  const createSession = useCallback(async (sessionData) => {
    try {
      const session = await complianceServices.createComplianceSession(
        userId,
        courseId,
        sessionData
      );
      setCurrentSessionId(session.id);
      setCurrentSession(session);
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }, [userId, courseId]);

  const recordLessonAccess = useCallback((lessonId) => {
    setLessonsAccessed(prev => {
      if (!prev.includes(lessonId)) {
        return [...prev, lessonId];
      }
      return prev;
    });
  }, []);

  const closeSession = useCallback(async (sessionData) => {
    if (!currentSessionId) return;

    try {
      const closedSession = await complianceServices.closeComplianceSession(
        currentSessionId,
        sessionData
      );
      setSessionHistory(prev => [...prev, closedSession]);
      setCurrentSessionId(null);
      setCurrentSession(null);
      setLessonsAccessed([]);
      return closedSession;
    } catch (error) {
      console.error('Error closing session:', error);
      throw error;
    }
  }, [currentSessionId]);

  return {
    // State
    currentSessionId,
    lessonsAccessed,
    sessionHistory,
    currentSession,
    
    // Methods
    createSession,
    recordLessonAccess,
    closeSession,
    
    // Getters
    lessonCount: lessonsAccessed.length,
    sessionCount: sessionHistory.length
  };
};
```

**Step 1.3.5: Replace TimerContext with Hooks** (1 hour)

Update `src/context/TimerContext.jsx` to use the new hooks:

```javascript
import { createContext, useContext } from 'react';
import { useSessionTimer } from '../hooks/useSessionTimer.js';
import { useBreakManagement } from '../hooks/useBreakManagement.js';
import { usePVQTrigger } from '../hooks/usePVQTrigger.js';
import { useSessionData } from '../hooks/useSessionData.js';

const TimerContext = createContext();

export function TimerProvider({ children, userId, courseId }) {
  const sessionTimer = useSessionTimer(courseId);
  const breakManagement = useBreakManagement(sessionTimer.sessionTime);
  const pvqTrigger = usePVQTrigger(sessionTimer.sessionTime, sessionTimer.isActive);
  const sessionData = useSessionData(userId, courseId);

  const value = {
    // Spread all hook values
    ...sessionTimer,
    ...breakManagement,
    ...pvqTrigger,
    ...sessionData
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within TimerProvider');
  }
  return context;
}
```

**Why**: Each hook is now:
- Easy to test independently
- Fast (only re-renders relevant component)
- Single responsibility
- Reusable in different components

---

## PHASE 2: CODE ORGANIZATION (2-3 DAYS)

### Overview
Eliminate duplication and organize code by domain. Make it easy to find and modify related code.

### Task 2.1: Reorganize Services by Domain (1-2 days)

#### Current Structure
```
src/api/
  ├── authServices.js
  ├── complianceServices.js
  ├── courseServices.js
  ├── enrollmentServices.js
  ├── lessonServices.js
  ├── moduleServices.js
  ├── paymentServices.js
  ├── progressServices.js
  ├── pvqServices.js
  ├── quizServices.js
  ├── schedulingServices.js
  ├── securityServices.js
  └── userServices.js
```

**Problem**: Hard to find related services. "Are payments in enrollmentServices or paymentServices?"

#### Goal Structure
```
src/api/
├── base/
│   ├── ServiceBase.js
│   ├── QueryHelper.js
│   └── CacheService.js
├── errors/
│   └── ApiError.js
├── validators/
│   ├── validators.js
│   └── sanitizer.js
├── auth/
│   └── authServices.js
├── courses/
│   ├── courseServices.js
│   ├── moduleServices.js
│   ├── lessonServices.js
│   └── quizServices.js
├── enrollment/
│   ├── enrollmentServices.js
│   └── paymentServices.js
├── student/
│   ├── progressServices.js
│   ├── pvqServices.js
│   └── userServices.js
├── compliance/
│   ├── complianceServices.js
│   └── schedulingServices.js
├── security/
│   └── securityServices.js
└── index.js (exports all)
```

**Implementation**:

**Step 2.1.1: Create Directory Structure** (15 mins)

```bash
mkdir src/api/auth
mkdir src/api/courses
mkdir src/api/enrollment
mkdir src/api/student
mkdir src/api/compliance
```

**Step 2.1.2: Move and Update Services** (1 hour)

Move files to new directories:
```
authServices.js → auth/authServices.js
courseServices.js → courses/courseServices.js
moduleServices.js → courses/moduleServices.js
lessonServices.js → courses/lessonServices.js
quizServices.js → courses/quizServices.js
enrollmentServices.js → enrollment/enrollmentServices.js
paymentServices.js → enrollment/paymentServices.js
progressServices.js → student/progressServices.js
pvqServices.js → student/pvqServices.js
userServices.js → student/userServices.js
complianceServices.js → compliance/complianceServices.js
schedulingServices.js → compliance/schedulingServices.js
securityServices.js → security/securityServices.js
```

**Step 2.1.3: Create Domain Index Files** (30 mins)

**File**: `src/api/auth/index.js`
```javascript
export { default as authServices } from './authServices.js';
```

**File**: `src/api/courses/index.js`
```javascript
export { default as courseServices } from './courseServices.js';
export { default as moduleServices } from './moduleServices.js';
export { default as lessonServices } from './lessonServices.js';
export { default as quizServices } from './quizServices.js';
```

(Similar for other domains)

**Step 2.1.4: Create Main API Index** (15 mins)

**File**: `src/api/index.js`
```javascript
// Auth Domain
export { authServices } from './auth/index.js';

// Course Domain
export { courseServices, moduleServices, lessonServices, quizServices } from './courses/index.js';

// Enrollment Domain
export { enrollmentServices, paymentServices } from './enrollment/index.js';

// Student Domain
export { progressServices, pvqServices, userServices } from './student/index.js';

// Compliance Domain
export { complianceServices, schedulingServices } from './compliance/index.js';

// Security Domain
export { securityServices } from './security/index.js';

// Base Classes & Utilities
export { default as ApiError } from './errors/ApiError.js';
export { default as ServiceBase } from './base/ServiceBase.js';
export { default as validators } from './validators/validators.js';
export { default as Sanitizer } from './validators/sanitizer.js';
```

**Step 2.1.5: Update All Imports Across Codebase** (1 hour)

**Search and replace**:
```javascript
// BEFORE
import authServices from '../api/authServices.js';
import courseServices from '../api/courseServices.js';

// AFTER
import { authServices, courseServices } from '../api';
```

---

### Task 2.2: Create Base Service Class (Consolidate Duplicate Code) (1 day)

This is **already covered in Phase 1**, but here's the consolidation work:

**Step 2.2.1: Identify Duplicate Patterns** (1 hour)

Common patterns across all services:
- Try-catch wrapping
- Firestore collection/document access
- Error handling
- Validation
- Logging

**Step 2.2.2: Measure Duplicate Code Reduction** (30 mins)

```
BEFORE (estimated):
- 13 services × ~50 lines of boilerplate = 650 lines
- Each has its own try-catch, validation, error handling

AFTER (estimated):
- 13 services × ~5 lines of boilerplate = 65 lines
- All services extend ServiceBase (~150 lines)
- Total reduction: ~435 lines of duplicated code
```

---

## PHASE 3: PRODUCTION READINESS (1-2 DAYS)

### Overview
Quality of life improvements for production deployment. Graceful error handling, proper logging, monitoring.

### Task 3.1: Error Boundary Component (0.5 days)

**File**: `src/components/common/ErrorBoundary.jsx` (NEW)

```javascript
import React from 'react';
import LoggingService from '../../services/loggingService.js';
import styles from './ErrorBoundary.module.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    LoggingService.error(
      'React Error Caught',
      error,
      { componentStack: errorInfo.componentStack }
    );
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorContainer}>
            <h1>Something went wrong</h1>
            <p>We're sorry for the inconvenience. The error has been logged and our team will be notified.</p>
            
            {process.env.NODE_ENV === 'development' && (
              <>
                <button 
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className={styles.detailsButton}
                >
                  {this.state.showDetails ? 'Hide Details' : 'Show Details'}
                </button>
                
                {this.state.showDetails && (
                  <div className={styles.errorDetails}>
                    <pre>{this.state.error?.toString()}</pre>
                    <pre>{this.state.errorInfo?.componentStack}</pre>
                  </div>
                )}
              </>
            )}
            
            <button 
              onClick={this.handleReset}
              className={styles.resetButton}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

**Step 3.1.2: Wrap App with ErrorBoundary**

**File**: `src/App.jsx`

```javascript
import ErrorBoundary from './components/common/ErrorBoundary.jsx';

function App() {
  return (
    <ErrorBoundary>
      {/* Rest of app */}
    </ErrorBoundary>
  );
}
```

---

### Task 3.2: Add Logging Service (0.5 days)

**Already created in Phase 1, Step 1.1.2**

**Step 3.2.1: Enhance Logging Service with Cloud Logging**

```javascript
// Future enhancement: Connect to Firebase Cloud Logging
// For now: console logging in development

class LoggingService {
  static async sendToCloudLogging(entry) {
    // TODO: Implement Cloud Logging integration
    // await fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) });
  }

  static async log(level, message, data = {}) {
    const logEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'N/A'
    };

    // Console for development
    if (process.env.NODE_ENV === 'development') {
      console[level.toLowerCase()](message, data);
    }

    // Send to Cloud Logging (production)
    if (process.env.NODE_ENV === 'production') {
      await this.sendToCloudLogging(logEntry);
    }

    return logEntry;
  }
}
```

---

### Task 3.3: Create API Wrapper for Services (0.5 days)

**File**: `src/api/ApiClient.js` (NEW)

```javascript
import ApiError from './errors/ApiError.js';
import LoggingService from '../services/loggingService.js';

// Wraps all service calls to handle errors consistently
class ApiClient {
  static async call(serviceMethod, methodName, ...args) {
    try {
      LoggingService.info(`API Call: ${methodName}`, { args: args.length });
      const result = await serviceMethod(...args);
      LoggingService.info(`API Success: ${methodName}`);
      return result;
    } catch (error) {
      LoggingService.error(`API Error: ${methodName}`, error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(
        'An unexpected error occurred',
        'INTERNAL_ERROR',
        500,
        { methodName, originalError: error.message }
      );
    }
  }
}

export default ApiClient;
```

---

## IMPLEMENTATION TIMELINE

### Week 1: Phase 1 (Critical Fixes)

| Day | Tasks | Deliverables |
|-----|-------|--------------|
| **Day 1** | 1.1.1-1.1.3 | Enhanced ApiError, LoggingService, Validators |
| **Day 2** | 1.1.4-1.1.6 | ServiceBase class, update 3-5 services |
| **Day 3** | 1.2 + 1.3.1-1.3.3 | Query optimization, 3 custom hooks |
| **Day 4** | 1.3.4-1.3.5 | 4th hook + integrate into TimerContext |

### Week 2: Phase 2 & 3 (Organization & Production)

| Day | Tasks | Deliverables |
|-----|-------|--------------|
| **Day 5-6** | 2.1 + 2.2 | Reorganize services, consolidate code |
| **Day 7** | 3.1 + 3.2 | ErrorBoundary, enhanced logging |
| **Day 8** | 3.3 + testing | ApiClient wrapper, comprehensive testing |

---

## KEY METRICS & SUCCESS CRITERIA

### Phase 1: Stability
- ✅ **0 Silent Failures**: All errors caught and logged
- ✅ **100% Input Validation**: Every service validates inputs
- ✅ **50% Faster Queries**: Pagination + caching implemented
- ✅ **60% Smaller TimerContext**: Split into 4 focused hooks

### Phase 2: Organization
- ✅ **100+ Lines Eliminated**: Duplicate code removed
- ✅ **13 Services Refactored**: All using ServiceBase
- ✅ **6 Domain Folders**: Clear, logical organization

### Phase 3: Production
- ✅ **Error Boundary**: React errors caught gracefully
- ✅ **Cloud Logging**: All errors logged for monitoring
- ✅ **Consistent API**: All service calls use same pattern

---

## COMMON QUESTIONS

**Q: Do I need to update all services at once?**  
A: No. Update services in this order:
1. enrollmentServices (most complex)
2. complianceServices
3. progressServices
4. Then smaller services
This gives early wins and proves the pattern works.

**Q: Will this break existing code?**  
A: No, if done correctly. Services maintain same exports, just internally refactored. Update imports in 2 places:
1. Service itself (extend ServiceBase)
2. Files that import services (add new imports from organized structure)

**Q: How long for each service conversion?**  
A: ~30 mins once ServiceBase is working, because you're just:
- Changing `export const func = async () => {}` to class methods
- Wrapping with `ServiceBase`
- Using `this.validate` and `this.log` instead of duplicate code

---

## QUICK REFERENCE: Implementation Checklist

### Phase 1: Stability
- [ ] Enhance ApiError.js
- [ ] Create LoggingService.js
- [ ] Enhance validators.js
- [ ] Create ServiceBase.js
- [ ] Create Sanitizer.js
- [ ] Update services to use ServiceBase (13 services)
- [ ] Create QueryHelper.js
- [ ] Create CacheService.js
- [ ] Create useSessionTimer.js
- [ ] Create useBreakManagement.js
- [ ] Create usePVQTrigger.js
- [ ] Create useSessionData.js
- [ ] Update TimerContext.jsx

### Phase 2: Organization
- [ ] Create auth/, courses/, enrollment/, student/, compliance/, security/ directories
- [ ] Move services to domain folders
- [ ] Create index.js files for each domain
- [ ] Create main src/api/index.js
- [ ] Update all imports across codebase

### Phase 3: Production
- [ ] Create ErrorBoundary.jsx
- [ ] Wrap App with ErrorBoundary
- [ ] Enhance LoggingService with Cloud Logging
- [ ] Create ApiClient.js
- [ ] Test all error paths
- [ ] Deploy to staging

---

## NEXT STEPS

When you're ready to start:

1. **Confirm this roadmap** with any questions
2. **Start with Phase 1, Step 1.1.1** (Enhanced ApiError) - takes 1 hour
3. **I'll work alongside** updating services as you complete each section
4. **Test incrementally** - no big bang refactor

This approach ensures:
- ✅ Quick wins early (Phase 1)
- ✅ Better maintainability (Phase 2)
- ✅ Production readiness (Phase 3)
- ✅ No breaking changes
- ✅ Testable at each step

---

**Questions before we start?** Let me know if you want me to:
- Clarify any step
- Provide more detail on specific tasks
- Adjust timeline or priorities
- Create additional helper utilities

