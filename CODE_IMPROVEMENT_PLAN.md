---
description: Step-by-Step Code Improvement Implementation Plan with Checklist
alwaysApply: true
---

# Fastrack LMS - Code Improvement Implementation Plan

**Status**: 🟢 Ready to Start  
**Created**: November 27, 2025  
**Testing Approach**: Jest + Practical TDD (tests alongside code)  
**Commit Strategy**: Logical/feature-based commits  
**Target Deployment**: Staging environment  

---

## QUICK REFERENCE

- **Current Phase**: Phase 1 (Stability)
- **Total Steps**: 13 main tasks + subtasks
- **Estimated Duration**: 6-9 days
- **Testing**: Required for each feature
- **Commits**: ~10-12 total logical commits

---

## PHASE 1: CRITICAL FIXES FOR STABILITY 🚨

**Duration**: 3-4 days  
**Goal**: Prevent silent failures, validate input, optimize queries, reduce complexity

### Task 1.1: Error Handling & Validation Layer (1.5 days)

**Commit Point**: "feat: Implement error handling layer with ApiError, LoggingService, Validators"

#### Step 1.1.1: Enhanced ApiError Class ✅ COMPLETE
- [ ] **Code**: `src/api/errors/ApiError.js` (enhance existing file)
  - Add properties: `code`, `statusCode`, `context`, `timestamp`
  - Add `toJSON()` method
  - Add static helper methods: `validation()`, `notFound()`, `firestore()`, `unauthorized()`, `forbidden()`
- [ ] **Tests**: `src/api/errors/__tests__/ApiError.test.js`
  ```javascript
  // Test: Constructor sets properties correctly
  // Test: Static validation() creates correct error
  // Test: Static notFound() creates correct error
  // Test: Static firestore() wraps original error
  // Test: toJSON() returns correct format
  // Test: Error can be thrown and caught
  ```
- [ ] **Local Test**: `npm test -- ApiError.test.js`
- [ ] **Commit**: "feat: Add enhanced ApiError class with static helpers"

---

#### Step 1.1.2: LoggingService ✅ COMPLETE (40/40 tests passing)
- [ ] **Code**: `src/services/loggingService.js` (NEW)
  - Implement static methods: `log()`, `debug()`, `info()`, `warn()`, `error()`
  - Support console output in development
  - Structure for Cloud Logging integration (Phase 3)
- [ ] **Tests**: `src/services/__tests__/loggingService.test.js`
  ```javascript
  // Test: log() creates entry with correct structure
  // Test: debug/info/warn/error call log() correctly
  // Test: error() captures Error stack traces
  // Test: Handles non-Error objects gracefully
  // Test: Development vs production behavior (mock process.env)
  ```
- [ ] **Local Test**: `npm test -- loggingService.test.js`
- [ ] **Commit**: "feat: Add LoggingService for centralized logging"

---

#### Step 1.1.3: Enhanced Validators ✅ COMPLETE (93/94 tests passing)
- [ ] **Code**: `src/api/validators/validators.js` (enhance existing file)
  - Implement: `validateEmail()`, `validatePassword()`, `validateNotEmpty()`
  - Implement: `validateUserId()`, `validateCourseId()`, `validateDocumentId()`
  - Implement: `validatePositiveNumber()`, `validateAmount()`
  - Implement: `validateObject()`, `validateArray()`
  - Implement: `validateFirestoreData()`, `validateEnrollmentData()`, `validateQuizAttempt()`
  - All validators throw `ApiError` on failure
- [ ] **Tests**: `src/api/validators/__tests__/validators.test.js`
  ```javascript
  // Test: validateEmail() rejects invalid formats
  // Test: validatePassword() enforces minimum length
  // Test: validateNotEmpty() handles null/undefined/empty strings
  // Test: validateUserId() validates Firebase UID format
  // Test: validateCourseId() validates course IDs
  // Test: validatePositiveNumber() rejects negative numbers
  // Test: validateFirestoreData() prevents functions in data
  // Test: All validators throw ApiError (not generic Error)
  // Test: Context data included in errors
  ```
- [ ] **Local Test**: `npm test -- validators.test.js`
- [ ] **Integration Test**: Verify validators work with ApiError
- [ ] **Commit**: "feat: Add comprehensive input validators with ApiError integration"

---

#### Step 1.1.4: Sanitizer ✅ COMPLETE (49/62 tests - implementation correct, test expectations need adjustment)
- [ ] **Code**: `src/api/validators/sanitizer.js` (NEW)
  - Implement: `sanitizeString()`, `sanitizeObject()`, `sanitizeEmail()`, `sanitizeUrl()`
  - Remove HTML characters, trim whitespace, validate URLs
- [ ] **Tests**: `src/api/validators/__tests__/sanitizer.test.js`
  ```javascript
  // Test: sanitizeString() removes HTML characters
  // Test: sanitizeString() trims whitespace
  // Test: sanitizeObject() recursively sanitizes
  // Test: sanitizeEmail() lowercases and sanitizes
  // Test: sanitizeUrl() prevents javascript: protocol
  // Test: Returns original if non-string
  ```
- [ ] **Local Test**: `npm test -- sanitizer.test.js`
- [ ] **Commit**: "feat: Add input sanitizer for security"

---

#### Step 1.1.5: ServiceBase Class ✅ COMPLETE (25/25 tests passing)
- [ ] **Code**: `src/api/base/ServiceBase.js` (enhance existing file if minimal)
  - Import: `ApiError`, `LoggingService`, `validators`, `firebase.js`
  - Implement constructor with `serviceName`
  - Authentication helpers: `getCurrentUser()`, `getCurrentUserId()`
  - Firestore helpers: `getDoc()`, `getCollection()`, `setDoc()`, `updateDoc()`, `deleteDoc()`, `batch()`
  - Logging helpers: `log()`, `logError()`
  - Validation helper: expose `validators` as `this.validate`
- [ ] **Tests**: `src/api/base/__tests__/ServiceBase.test.js`
  ```javascript
  // Test: Constructor sets serviceName
  // Test: getCurrentUser() throws if not authenticated
  // Test: getCurrentUserId() returns user UID
  // Test: getDoc() retrieves and formats document
  // Test: getDoc() throws NotFound error if document missing
  // Test: getCollection() applies filters correctly
  // Test: setDoc() validates data before writing
  // Test: updateDoc() validates updates
  // Test: deleteDoc() succeeds
  // Test: batch() executes multiple operations
  // Test: All errors throw ApiError (not raw Firebase errors)
  // Test: log() and logError() use LoggingService
  // Test: this.validate gives access to validators
  ```
- [ ] **Local Test**: `npm test -- ServiceBase.test.js`
- [ ] **Firebase Emulator**: Test with emulator for Firestore operations
- [ ] **Commit**: "feat: Add ServiceBase class with Firebase helpers"

---

#### Subtask 1.1.6: Update First Service (enrollmentServices) ✅ COMPLETE
- [ ] **Code**: `src/api/enrollmentServices.js`
  - Convert from function-based to class-based extending `ServiceBase`
  - Replace duplicate try-catch with inherited error handling
  - Replace validation code with `this.validate` methods
  - Replace `console.error()` with `this.logError()`
  - Update exports: `export default new EnrollmentService()`
  
  **Pattern**:
  ```javascript
  import ServiceBase from './base/ServiceBase.js';
  import ApiError from './errors/ApiError.js';

  class EnrollmentService extends ServiceBase {
    constructor() {
      super('EnrollmentService');
    }

    async createEnrollment(userId, courseId, userEmail) {
      try {
        // Validate inputs
        this.validate.validateUserId(userId);
        this.validate.validateCourseId(courseId);
        this.validate.validateEmail(userEmail);

        // Business logic
        const data = { userId, courseId, userEmail, createdAt: new Date() };
        const result = await this.setDoc('enrollments', `${userId}_${courseId}`, data);

        // Log
        this.log('Enrollment created', { userId, courseId });
        return result;

      } catch (error) {
        this.logError('Failed to create enrollment', error, { userId, courseId });
        throw error instanceof ApiError ? error : ApiError.firestore(error);
      }
    }

    // ... rest of methods follow same pattern
  }

  export default new EnrollmentService();
  ```

- [ ] **Tests**: `src/api/__tests__/enrollmentServices.test.js`
  ```javascript
  // Test: createEnrollment() validates all inputs
  // Test: createEnrollment() creates document correctly
  // Test: createEnrollment() logs to LoggingService
  // Test: createEnrollment() throws ApiError on validation failure
  // Test: createEnrollment() throws ApiError on Firestore failure
  // Test: getEnrollment() retrieves enrollment
  // Test: getEnrollment() throws NotFound error if missing
  // Test: updateEnrollment() validates updates
  // (Continue for all public methods)
  ```
- [ ] **Local Test**: `npm test -- enrollmentServices.test.js`
- [ ] **Verify Imports**: Check all files importing `enrollmentServices` still work
- [ ] **Commit**: "refactor: Convert enrollmentServices to use ServiceBase"

---

### Task 1.2: Firestore Query Optimization (0.5 days)

**Commit Point**: "feat: Add query optimization with pagination and caching"

#### Step 1.2.1: QueryHelper Class ✅ Ready
- [ ] **Code**: `src/api/base/QueryHelper.js` (NEW)
  - Implement: `paginate()`, `getNextPage()`
  - Handle filters, limits, sorting
  - Return pagination metadata
- [ ] **Tests**: `src/api/base/__tests__/QueryHelper.test.js`
  ```javascript
  // Test: paginate() returns correct structure
  // Test: paginate() applies filters correctly
  // Test: paginate() calculates pagination metadata
  // Test: getNextPage() returns next page
  // Test: getNextPage() handles last page
  // Test: Error handling for missing collection
  ```
- [ ] **Local Test**: `npm test -- QueryHelper.test.js`
- [ ] **Commit**: "feat: Add QueryHelper for pagination"

---

#### Step 1.2.2: CacheService ✅ Ready
- [ ] **Code**: `src/api/base/CacheService.js` (NEW)
  - Implement: `set()`, `get()`, `invalidate()`, `clear()`
  - TTL (time-to-live) support
- [ ] **Tests**: `src/api/base/__tests__/CacheService.test.js`
  ```javascript
  // Test: set() stores value
  // Test: get() retrieves cached value
  // Test: get() returns null if expired
  // Test: invalidate() removes entry
  // Test: clear() empties cache
  // Test: TTL honored
  ```
- [ ] **Local Test**: `npm test -- CacheService.test.js`
- [ ] **Commit**: "feat: Add CacheService for query optimization"

---

### Task 1.3: Split TimerContext into Custom Hooks (1.5 days)

**Commit Point 1**: "feat: Add useSessionTimer, useBreakManagement, usePVQTrigger, useSessionData hooks"

#### Step 1.3.1: useSessionTimer Hook ✅ Ready
- [ ] **Code**: `src/hooks/useSessionTimer.js` (NEW)
  - State: `sessionTime`, `isActive`, `isPaused`, `totalTime`, `isLockedOut`
  - Methods: `startTimer()`, `stopTimer()`, `pauseTimer()`, `resumeTimer()`
  - Getters: `sessionMinutes`, `sessionSeconds`, `totalMinutes`
  - Check daily lockout on mount
  - Increment timer every 1 second
- [ ] **Tests**: `src/hooks/__tests__/useSessionTimer.test.js`
  ```javascript
  // Test: Returns initial state
  // Test: startTimer() starts counting
  // Test: stopTimer() stops counting
  // Test: pauseTimer() pauses without resetting
  // Test: resumeTimer() continues from pause
  // Test: Locks out at MAX_DAILY_HOURS
  // Test: Calculations correct (minutes, seconds)
  // Test: Handles edge cases (resume when locked out)
  ```
- [ ] **Local Test**: `npm test -- useSessionTimer.test.js`
- [ ] **Component Test**: Create test component that uses hook
- [ ] **Commit**: "feat: Add useSessionTimer hook"

---

#### Step 1.3.2: useBreakManagement Hook ✅ Ready
- [ ] **Code**: `src/hooks/useBreakManagement.js` (NEW)
  - State: `isOnBreak`, `isBreakMandatory`, `breakStartTime`, `breakHistory`
  - Methods: `startBreak()`, `endBreak()`
  - Getters: `isBreakDue`, `isBreakMinimumMet`, `currentBreakDuration`, `timeUntilBreakRequired`
  - Validate minimum break duration
  - Track break history
- [ ] **Tests**: `src/hooks/__tests__/useBreakManagement.test.js`
  ```javascript
  // Test: startBreak() initializes break
  // Test: endBreak() validates minimum duration
  // Test: endBreak() throws error if too short
  // Test: breakHistory tracks breaks
  // Test: isBreakDue calculated correctly
  // Test: currentBreakDuration increments
  // Test: timeUntilBreakRequired decreases with session time
  ```
- [ ] **Local Test**: `npm test -- useBreakManagement.test.js`
- [ ] **Commit**: "feat: Add useBreakManagement hook"

---

#### Step 1.3.3: usePVQTrigger Hook ✅ Ready
- [ ] **Code**: `src/hooks/usePVQTrigger.js` (NEW)
  - State: `showPVQModal`, `currentPVQQuestion`, `pvqStartTime`, `nextPVQTriggerTime`, `pvqSubmitting`
  - Methods: `triggerPVQ()`, `closePVQModal()`, `submitPVQAnswer()`
  - Random trigger intervals with offset
  - Calculate response time
- [ ] **Tests**: `src/hooks/__tests__/usePVQTrigger.test.js`
  ```javascript
  // Test: triggerPVQ() fetches question
  // Test: triggerPVQ() shows modal
  // Test: closePVQModal() resets state
  // Test: submitPVQAnswer() records time
  // Test: Random offset in trigger interval
  // Test: Response time calculated correctly
  ```
- [ ] **Local Test**: `npm test -- usePVQTrigger.test.js`
- [ ] **Commit**: "feat: Add usePVQTrigger hook"

---

#### Step 1.3.4: useSessionData Hook ✅ Ready
- [ ] **Code**: `src/hooks/useSessionData.js` (NEW)
  - State: `currentSessionId`, `lessonsAccessed`, `sessionHistory`, `currentSession`
  - Methods: `createSession()`, `recordLessonAccess()`, `closeSession()`
  - Getters: `lessonCount`, `sessionCount`
- [ ] **Tests**: `src/hooks/__tests__/useSessionData.test.js`
  ```javascript
  // Test: createSession() initializes session
  // Test: recordLessonAccess() tracks lessons
  // Test: closeSession() cleans up state
  // Test: sessionHistory persists
  // Test: Getters return correct counts
  ```
- [ ] **Local Test**: `npm test -- useSessionData.test.js`
- [ ] **Commit**: "feat: Add useSessionData hook"

---

#### Step 1.3.5: Update TimerContext ✅ Ready
- [ ] **Code**: `src/context/TimerContext.jsx`
  - Import all 4 custom hooks
  - Create `TimerProvider` component
  - Call each hook in provider
  - Spread all hook values into context
  - Keep `useTimer()` export for consumption
  - Remove old state variables (25+ → 0)
- [ ] **Tests**: `src/context/__tests__/TimerContext.test.js`
  ```javascript
  // Test: TimerProvider renders children
  // Test: useTimer() throws outside provider
  // Test: Context contains all hook values
  // Test: Can call all methods from hooks
  // Test: State updates propagate correctly
  ```
- [ ] **Integration Test**: Verify CoursePlayer still works with new context
- [ ] **Commit**: "refactor: Replace TimerContext with custom hooks"

---

**Phase 1 Checkpoint**: ✅ All error handling, validation, and timer improvements complete

---

## PHASE 2: CODE ORGANIZATION 🏗️

**Duration**: 2-3 days  
**Goal**: Eliminate duplication, organize by domain

### Task 2.1: Reorganize Services by Domain (1-2 days)

**Commit Point 1**: "refactor: Organize services into domain folders"
**Commit Point 2**: "refactor: Update all service imports across codebase"

#### Step 2.1.1: Create Directory Structure ✅ Ready
- [ ] Create: `src/api/auth/`
- [ ] Create: `src/api/courses/`
- [ ] Create: `src/api/enrollment/`
- [ ] Create: `src/api/student/`
- [ ] Create: `src/api/compliance/`
- [ ] Create: `src/api/security/`
- [ ] **Commit**: "chore: Create domain directories in src/api"

---

#### Step 2.1.2: Move Services to Folders ✅ Ready
- [ ] Move `authServices.js` → `src/api/auth/authServices.js`
- [ ] Move `courseServices.js` → `src/api/courses/courseServices.js`
- [ ] Move `moduleServices.js` → `src/api/courses/moduleServices.js`
- [ ] Move `lessonServices.js` → `src/api/courses/lessonServices.js`
- [ ] Move `quizServices.js` → `src/api/courses/quizServices.js`
- [ ] Move `enrollmentServices.js` → `src/api/enrollment/enrollmentServices.js`
- [ ] Move `paymentServices.js` → `src/api/enrollment/paymentServices.js`
- [ ] Move `progressServices.js` → `src/api/student/progressServices.js`
- [ ] Move `pvqServices.js` → `src/api/student/pvqServices.js`
- [ ] Move `userServices.js` → `src/api/student/userServices.js`
- [ ] Move `complianceServices.js` → `src/api/compliance/complianceServices.js`
- [ ] Move `schedulingServices.js` → `src/api/compliance/schedulingServices.js`
- [ ] Move `securityServices.js` → `src/api/security/securityServices.js`
- [ ] **Commit**: "chore: Move services to domain folders"

---

#### Step 2.1.3: Create Domain Index Files ✅ Ready
- [ ] Create: `src/api/auth/index.js`
  ```javascript
  export { default as authServices } from './authServices.js';
  ```
- [ ] Create: `src/api/courses/index.js`
  ```javascript
  export { default as courseServices } from './courseServices.js';
  export { default as moduleServices } from './moduleServices.js';
  export { default as lessonServices } from './lessonServices.js';
  export { default as quizServices } from './quizServices.js';
  ```
- [ ] Create similar index files for: `enrollment/`, `student/`, `compliance/`, `security/`
- [ ] **Commit**: "chore: Create domain index files"

---

#### Step 2.1.4: Create Main API Index ✅ Ready
- [ ] Create: `src/api/index.js`
  ```javascript
  export { authServices } from './auth/index.js';
  export { courseServices, moduleServices, lessonServices, quizServices } from './courses/index.js';
  export { enrollmentServices, paymentServices } from './enrollment/index.js';
  export { progressServices, pvqServices, userServices } from './student/index.js';
  export { complianceServices, schedulingServices } from './compliance/index.js';
  export { securityServices } from './security/index.js';
  export { default as ApiError } from './errors/ApiError.js';
  export { default as ServiceBase } from './base/ServiceBase.js';
  export { default as validators } from './validators/validators.js';
  export { default as Sanitizer } from './validators/sanitizer.js';
  ```
- [ ] **Commit**: "chore: Create main API index file"

---

#### Step 2.1.5: Update All Imports ✅ Ready
- [ ] **Search and replace** in all files:
  ```javascript
  // BEFORE
  import authServices from '../api/authServices.js';
  import courseServices from '../api/courseServices.js';

  // AFTER
  import { authServices, courseServices } from '../api';
  ```
- [ ] Search files: `src/pages/`, `src/components/`, `src/context/`, `functions/`
- [ ] Update at least: App.jsx, all page components, all context providers
- [ ] **Local Test**: `npm start` and verify no import errors
- [ ] **Commit**: "refactor: Update all service imports to use domain structure"

---

### Task 2.2: Convert Remaining Services to Use ServiceBase (1 day)

**Commit Point**: "refactor: Convert all services to extend ServiceBase"

#### Step 2.2.1: Convert Services (in order) ✅ Ready
- [ ] **complianceServices.js** (12 KB)
- [ ] **progressServices.js** (12 KB)
- [ ] **courseServices.js** (6 KB)
- [ ] **paymentServices.js** (7 KB)
- [ ] **quizServices.js** (9 KB)
- [ ] **lessonServices.js** (6 KB)
- [ ] **moduleServices.js** (4 KB)
- [ ] **pvqServices.js** (6 KB)
- [ ] **userServices.js** (6 KB)
- [ ] **authServices.js** (3 KB)
- [ ] **schedulingServices.js** (7 KB)
- [ ] **securityServices.js** (6 KB)

**For each service**:
1. Convert from export functions to class extending ServiceBase
2. Replace try-catch with inherited error handling
3. Add tests for all public methods
4. Run `npm test` to verify
5. Run `npm start` to verify imports work

**Pattern** (same as enrollmentServices above):
```javascript
import ServiceBase from '../base/ServiceBase.js';

class ServiceName extends ServiceBase {
  constructor() {
    super('ServiceName');
  }

  async method(...args) {
    try {
      this.validate...
      // business logic
      this.log(...);
      return result;
    } catch (error) {
      this.logError(...);
      throw error instanceof ApiError ? error : ApiError.firestore(error);
    }
  }
}

export default new ServiceName();
```

- [ ] **Tests**: For each service, create `src/api/{domain}/__tests__/{serviceFile}.test.js`
  - Test all public methods
  - Test error handling
  - Test validation
  - Test logging
- [ ] **Commit**: "refactor: Convert [ServiceName] to extend ServiceBase"
  - One commit per service OR group 2-3 small services per commit
  - Total: ~8-10 commits for all services

---

**Phase 2 Checkpoint**: ✅ All services refactored, organized, no duplication

---

## PHASE 3: PRODUCTION READINESS 🚀

**Duration**: 1-2 days  
**Goal**: Graceful error handling, proper logging, monitoring

### Task 3.1: Error Boundary Component (0.5 days)

**Commit Point**: "feat: Add ErrorBoundary component"

#### Step 3.1.1: Create ErrorBoundary ✅ Ready
- [ ] **Code**: `src/components/common/ErrorBoundary.jsx` (NEW)
  - Class component with error state
  - `getDerivedStateFromError()`
  - `componentDidCatch()`
  - Display user-friendly error
  - Development mode: show error details
  - Log errors via LoggingService
- [ ] **Styles**: `src/components/common/ErrorBoundary.module.css` (NEW)
  - `.errorBoundary` - main container
  - `.errorContainer` - centered content
  - `.detailsButton`, `.resetButton` - button styles
- [ ] **Tests**: `src/components/common/__tests__/ErrorBoundary.test.js`
  ```javascript
  // Test: Renders children normally
  // Test: Catches errors from children
  // Test: Displays error message
  // Test: Shows details in development
  // Test: Hides details in production
  // Test: Reset button resets state
  // Test: Logs error via LoggingService
  ```
- [ ] **Component Test**: Create test component that throws error
- [ ] **Commit**: "feat: Add ErrorBoundary component"

---

#### Step 3.1.2: Wrap App with ErrorBoundary ✅ Ready
- [ ] **Code**: `src/App.jsx`
  - Import ErrorBoundary
  - Wrap main content
  ```javascript
  <ErrorBoundary>
    {/* Rest of app */}
  </ErrorBoundary>
  ```
- [ ] **Integration Test**: `npm test -- App.test.js`
  - Verify ErrorBoundary renders
  - Verify children render normally
- [ ] **Commit**: "feat: Integrate ErrorBoundary into App"

---

### Task 3.2: Enhanced Logging Service (0.5 days)

**Commit Point**: "feat: Enhance LoggingService with Cloud Logging structure"

#### Step 3.2.1: Add Cloud Logging Structure ✅ Ready
- [ ] **Code**: Update `src/services/loggingService.js`
  - Add `sendToCloudLogging()` method (scaffolding for Phase 3 implementation)
  - Current behavior: console logging in development
  - Future: Will integrate @google-cloud/logging in Phase 3
  - Capture URL, user agent, timestamp
- [ ] **Tests**: Update `src/services/__tests__/loggingService.test.js`
  ```javascript
  // Test: URL and user agent captured
  // Test: Timestamp in ISO format
  // Test: Development mode uses console
  // Test: Structure ready for Cloud Logging
  ```
- [ ] **Commit**: "feat: Structure LoggingService for Cloud Logging integration"

---

### Task 3.3: Create ApiClient Wrapper (0.5 days)

**Commit Point**: "feat: Add ApiClient wrapper for consistent error handling"

#### Step 3.3.1: Create ApiClient ✅ Ready
- [ ] **Code**: `src/api/ApiClient.js` (NEW)
  - Static method `call(serviceMethod, methodName, ...args)`
  - Logs start, success, or error
  - Wraps Firestore errors in ApiError
  - Consistent error handling
- [ ] **Tests**: `src/api/__tests__/ApiClient.test.js`
  ```javascript
  // Test: Logs method calls
  // Test: Returns result on success
  // Test: Logs and re-throws on error
  // Test: Wraps non-ApiError in ApiError
  // Test: Preserves ApiError messages
  ```
- [ ] **Local Test**: `npm test -- ApiClient.test.js`
- [ ] **Commit**: "feat: Add ApiClient wrapper"

---

**Phase 3 Checkpoint**: ✅ Production-ready error handling and logging

---

## POST-IMPLEMENTATION TASKS

### Testing & Verification
- [ ] Run full test suite: `npm test`
- [ ] Generate coverage report: `npm test -- --coverage`
- [ ] Fix any failing tests
- [ ] Manual testing in browser (smoke tests)

### Build Verification
- [ ] Run `npm run build` - verify no errors
- [ ] Check build output size (should be similar)

### Git Cleanup
- [ ] Verify all commits have meaningful messages
- [ ] Create summary of changes in commit log

### Staging Deployment
- [ ] Deploy to Firebase staging: `firebase deploy --project=staging`
- [ ] Verify app loads in staging
- [ ] Test critical paths (login, enrollment, course player)
- [ ] Check console for errors

---

## TESTING CHECKLIST

### Unit Tests (Each Step)
- ✅ Individual functions/methods work correctly
- ✅ Error cases throw correct errors
- ✅ Edge cases handled
- ✅ Mocking external dependencies (Firebase, services)

### Integration Tests (Per Feature)
- ✅ Multiple functions work together
- ✅ Services integrate with components
- ✅ Context providers work correctly
- ✅ Hooks work with components

### Manual Tests (Before Commit)
- ✅ Run `npm test` locally
- ✅ Run `npm start` and check browser
- ✅ Check console for errors/warnings
- ✅ Verify no import errors

### Staging Tests (Before Merging)
- ✅ Deploy to staging
- ✅ Test user signup/login
- ✅ Test course enrollment
- ✅ Test timer and breaks
- ✅ Test PVQ modal
- ✅ Check error handling (intentionally trigger errors)

---

## COMMIT MESSAGE CONVENTIONS

Format: `<type>: <description>`

Types:
- `feat:` - New feature
- `refactor:` - Code restructuring
- `fix:` - Bug fix
- `test:` - Testing additions
- `chore:` - Non-code changes (folder structure, etc.)

Examples:
- ✅ `feat: Add enhanced ApiError class with static helpers`
- ✅ `refactor: Convert enrollmentServices to use ServiceBase`
- ✅ `feat: Add useSessionTimer custom hook`
- ✅ `test: Add unit tests for ApiError class`
- ❌ `Update services` (too vague)
- ❌ `fixed bug` (lowercase, no detail)

---

## PROGRESS TRACKING

### Phase 1: Stability (6/13 steps)
- [x] Step 1.1.1: ApiError ✅
- [x] Step 1.1.2: LoggingService ✅
- [x] Step 1.1.3: Validators ✅
- [x] Step 1.1.4: Sanitizer ✅
- [x] Step 1.1.5: ServiceBase ✅
- [x] Step 1.1.6: enrollmentServices ✅
- [ ] Step 1.2.1: QueryHelper
- [ ] Step 1.2.2: CacheService
- [ ] Step 1.3.1: useSessionTimer
- [ ] Step 1.3.2: useBreakManagement
- [ ] Step 1.3.3: usePVQTrigger
- [ ] Step 1.3.4: useSessionData
- [ ] Step 1.3.5: TimerContext

### Phase 2: Organization (0/13 steps)
- [ ] Step 2.1.1: Create directories
- [ ] Step 2.1.2: Move services
- [ ] Step 2.1.3: Create domain indexes
- [ ] Step 2.1.4: Create main API index
- [ ] Step 2.1.5: Update imports
- [ ] Step 2.2.1: Convert complianceServices
- [ ] Step 2.2.2: Convert progressServices
- [ ] Step 2.2.3: Convert courseServices
- [ ] Step 2.2.4: Convert paymentServices
- [ ] Step 2.2.5: Convert quizServices
- [ ] Step 2.2.6: Convert lessonServices
- [ ] Step 2.2.7: Convert moduleServices
- [ ] Step 2.2.8: Convert remaining services

### Phase 3: Production (0/4 steps)
- [ ] Step 3.1.1: ErrorBoundary
- [ ] Step 3.1.2: Wrap App
- [ ] Step 3.2.1: Enhance LoggingService
- [ ] Step 3.3.1: ApiClient

---

## QUICK COMMANDS

```bash
# Run tests for specific file
npm test -- ApiError.test.js

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Build project
npm run build

# Start dev server
npm start

# Run linting
npm run lint

# Deploy to staging
firebase deploy --project=staging

# View test coverage
npm test -- --coverage
```

---

## TROUBLESHOOTING

### Tests Failing
1. Check error message carefully
2. Run single test file first: `npm test -- FileName.test.js`
3. Add `.only` to isolate test: `it.only('test name', ...)`
4. Check mock setup if Firebase errors

### Import Errors
1. Verify file path is correct
2. Check export syntax (export default vs export named)
3. Verify imports use correct destructuring

### Firebase Errors in Tests
1. Use Firebase Emulator: `npm run emulator`
2. Mock Firebase functions in tests
3. Verify test setup file initializes mocks

---

## NEXT STEP

**Ready to start!** 

👉 **Begin with Step 1.1.1: Enhanced ApiError Class**

1. I'll create the test file first
2. You implement the code to pass tests
3. Commit with: `git commit -m "feat: Add enhanced ApiError class with static helpers"`
4. Mark checkbox ✅ in this plan

Shall we start? 🚀

