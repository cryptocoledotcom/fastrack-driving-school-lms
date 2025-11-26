---
description: Fastrack LMS Repository Information Overview
alwaysApply: true
---

# Fastrack Driving School LMS - Complete Repository Documentation

## Executive Summary

**Fastrack Driving School LMS** is a production-ready Learning Management System for driving education built with **React 18+**, **Firebase**, and **Google Cloud Functions**. The system provides comprehensive course management, real-time compliance tracking, break enforcement with 10-minute minimum validation, PVQ identity verification, and DMV-compliant certificate generation with immutable audit trails.

**Project Status**: Production Ready | Phases 1-3 Complete | Runtime Issues Fixed | Staging Ready

## Project Statistics

- **Frontend**: React 18.2+ | React Router 6.20+ | Context API | CSS Modules  
- **Backend**: Firebase Firestore | Cloud Functions (Node.js 20) | Cloud Logging
- **Services**: 13 API services with 100+ exported async functions
- **Components**: 40+ reusable components, 20+ page-level components
- **Database**: 15+ Firestore collections with immutable audit trail
- **Cloud Functions**: 7 serverless functions for backend operations
- **Code Size**: 10,000+ lines across frontend + backend
- **Compliance**: Real-time timer, break enforcement, PVQ verification, certificate validation

## Technology Stack

### Frontend
- **Framework**: React 18.2+
- **Routing**: React Router v6.20+
- **State**: React Context API (4 specialized contexts)
- **Database**: Firebase SDK v10.7+
- **Payments**: Stripe.js (@stripe/react-stripe-js v5.4+)
- **Build**: Create React App v5.0
- **Styling**: CSS Modules (.module.css pattern)

### Backend
- **Database**: Firebase Firestore (NoSQL, real-time)
- **Functions**: Google Cloud Functions v2 (Node.js 20)
- **Auth**: Firebase Authentication
- **Storage**: Google Cloud Storage
- **Logging**: Cloud Logging + Firestore auditLogs
- **Audit**: Cloud Audit Logs (90-day retention)

### Security
- **Rules**: Firestore Security Rules (role-based access)
- **Data**: Immutable compliance records (write-once pattern)
- **Logs**: Cloud Audit Logs for all access
- **Tracking**: IP address & device fingerprinting
- **Encryption**: Firebase encryption at rest (default)

## Project Structure

### Directory Organization

```
src/
├── api/                    # 13 Services (100+ functions)
│   ├── authServices.js
│   ├── complianceServices.js
│   ├── courseServices.js
│   ├── enrollmentServices.js
│   ├── lessonServices.js
│   ├── moduleServices.js
│   ├── paymentServices.js
│   ├── progressServices.js
│   ├── pvqServices.js
│   ├── quizServices.js
│   ├── schedulingServices.js
│   ├── securityServices.js
│   └── userServices.js
│
├── components/             # 40+ Components
│   ├── admin/              # ComplianceReporting, SchedulingManagement
│   ├── common/             # Badge, Button, Card, Modal, Input, etc
│   ├── guards/             # ProtectedRoute, PublicRoute, RoleBasedRoute
│   ├── layout/             # MainLayout, AuthLayout, DashboardLayout
│   ├── payment/            # Stripe integration components
│   └── scheduling/         # LessonBooking, UpcomingLessons
│
├── pages/                  # 20+ Page Components
│   ├── Admin/, Auth/, Certificate/, CoursePlayer/, Dashboard/
│   ├── Home/, MyCourses/, Progress/, Settings/, etc
│
├── context/                # 4 Context Providers
│   ├── AuthContext.jsx     # Authentication state
│   ├── CourseContext.jsx   # Course navigation state
│   ├── ModalContext.jsx    # Modal queue management
│   └── TimerContext.jsx    # Session timer & compliance
│
├── constants/              # 9 Configuration Files
│   ├── appConfig.js
│   ├── courses.js
│   ├── errorMessages.js
│   ├── lessonTypes.js
│   ├── progressStatus.js
│   ├── routes.js
│   ├── successMessages.js
│   ├── userRoles.js
│   └── validationRules.js
│
├── config/                 # Firebase & Environment
│   ├── firebase.js
│   ├── stripe.js
│   └── environment.js
│
├── assets/
│   └── styles/             # Global styles
│
├── App.jsx                 # Root component
└── index.js                # React entry point

functions/
├── index.js                # Cloud Functions (34 KB, 7 functions)
├── package.json
├── .eslintrc.js
└── README.md

public/
├── index.html              # HTML entry point
├── manifest.json
└── assets/

firestore.rules             # Security rules with immutability
firebase.json               # Project configuration
firestore.indexes.json      # Custom Firestore indexes
package.json                # Frontend dependencies
```

## API Services Layer (13 Services, 100+ Functions)

### Architecture Pattern

All services follow a consistent async-first pattern with Firestore integration:
- Pure async functions returning Promises
- Consistent error handling with Firebase error mapping
- Firestore collections in lowercase with descriptive names
- Transactional operations where appropriate
- No global state mutations

### 1. Authentication Service (6 functions)
**File**: `src/api/authServices.js`

| Function | Purpose |
|----------|---------|
| `login(email, password)` | User sign-in |
| `register(email, password)` | New user registration |
| `logout()` | Sign out current user |
| `resetPassword(email)` | Send password reset email |
| `changePassword(currentPassword, newPassword)` | Update password |
| `changeEmail(currentPassword, newEmail)` | Update email |

**Collection**: `users`

### 2. Compliance Services (20 functions)
**File**: `src/api/complianceServices.js`

**Purpose**: Track all compliance activities for DMV audit trail

**Session Management**:
- `createComplianceSession(userId, courseId, data)` - Start session
- `updateComplianceSession(sessionId, updates)` - Update session
- `closeComplianceSession(sessionId, sessionData)` - End session

**Time Tracking (4-Hour Daily Limit)**:
- `getDailyTime(userId, courseId)` - Get daily session time in seconds
- `checkDailyHourLockout(userId, courseId)` - Check if locked out
- `getSessionHistory(userId, courseId, limit)` - Get session history

**Break Management (Mandatory 10-Min Break Every 2 Hours)**:
- `logBreak(sessionId, breakData)` - Record break start
- `logBreakEnd(sessionId, actualDurationSeconds)` - Record break end with validation

**Progress Logging**:
- `logLessonCompletion(sessionId, lessonCompletionData)` - Log lesson completion
- `logModuleCompletion(sessionId, moduleCompletionData)` - Log module completion
- `logIdentityVerification(userId, courseId, pvqData)` - Log PVQ attempt
- `logQuizAttempt(sessionId, quizAttemptData)` - Log quiz attempt

**Time Aggregation**:
- `getTotalSessionTime(userId, courseId)` - Sum all session durations (seconds)
- `getTotalSessionTimeInMinutes(userId, courseId)` - Sum in minutes for 1440-check

**Collections**: `complianceLogs` (IMMUTABLE), `complianceSessions` (IMMUTABLE)

### 3. Course Services (9 functions)
**File**: `src/api/courseServices.js`

| Function | Purpose |
|----------|---------|
| `getCourses()` | Get all courses |
| `getCourseById(courseId)` | Get single course |
| `getFeaturedCourses(limitCount)` | Get featured courses |
| `getCoursesByCategory(category)` | Filter by category |
| `createCourse(courseData)` | Create new course |
| `updateCourse(courseId, updates)` | Update course |
| `deleteCourse(courseId)` | Delete course |
| `searchCourses(searchTerm)` | Full-text search |
| `getCourseStats(courseId)` | Get analytics |

**Collection**: `courses`

### 4. Enrollment Services (15 functions)
**File**: `src/api/enrollmentServices.js`

**Core Enrollment**:
- `createEnrollment(userId, courseId, userEmail)` - Start enrollment
- `createCompletePackageEnrollment(userId, userEmail)` - Enroll all courses
- `getEnrollment(userId, courseId)` - Get single enrollment
- `getUserEnrollments(userId)` - Get all enrollments

**Payment Processing**:
- `createPaidEnrollment(userId, courseId, paidAmount, userEmail)`
- `createPaidCompletePackageEnrollment(userId, paidAmount, userEmail)`
- `createPaidCompletePackageSplit(userId, upfrontAmount, userEmail)`
- `payRemainingBalance(userId, courseId, amountPaid, userEmail)`
- `updateEnrollmentAfterPayment(userId, courseId, paymentAmount, paymentType)`

**Certificate & Access**:
- `updateCertificateStatus(userId, courseId, certificateGenerated)` - Set cert flag
- `checkCourseAccess(userId, courseId)` - Verify access

**Admin**:
- `autoEnrollAdmin(userId, userEmail)` - Manual enrollment
- `resetEnrollmentToPending(userId, courseId)` - Reset status
- `resetUserEnrollmentsToPending(userId)` - Reset all
- `getAllUsersWithEnrollments()` - Get analytics

**Collections**: `enrollments`, `payments`, `certificates`

### 5. Lesson Services (9 functions)
**File**: `src/api/lessonServices.js`

| Function | Purpose |
|----------|---------|
| `getLessons(courseId, moduleId)` | Get module lessons |
| `getLessonById(lessonId)` | Get single lesson |
| `getAllCourseLessons(courseId)` | Get all course lessons |
| `createLesson(lessonData)` | Create lesson |
| `updateLesson(lessonId, updates)` | Update lesson |
| `deleteLesson(lessonId)` | Delete lesson |
| `markComplete(userId, lessonId, courseId)` | Mark completed |
| `reorderLessons(moduleId, lessonOrders)` | Update order |
| `getNextLesson(currentLessonId)` | Navigate next |
| `getPreviousLesson(currentLessonId)` | Navigate previous |

**Lesson Types**: VIDEO, READING, QUIZ, TEST, PRACTICAL

**Collection**: `lessons`

### 6. Module Services (7 functions)
**File**: `src/api/moduleServices.js`

| Function | Purpose |
|----------|---------|
| `getModules(courseId)` | Get course modules |
| `getModuleById(moduleId)` | Get module |
| `createModule(moduleData)` | Create module |
| `updateModule(moduleId, updates)` | Update module |
| `deleteModule(moduleId)` | Delete module |
| `reorderModules(courseId, moduleOrders)` | Update order |
| `getModuleWithStats(moduleId)` | Get with stats |

**Collection**: `modules`

### 7. Payment Services (9 functions)
**File**: `src/api/paymentServices.js`

| Function | Purpose |
|----------|---------|
| `createPaymentIntent(userId, courseId, amount, paymentType)` | Stripe intent |
| `createCheckoutSession(userId, courseId, amount, paymentType, userEmail)` | Checkout |
| `updatePaymentStatus(paymentId, status, metadata)` | Update status |
| `getPayment(paymentId)` | Get payment |
| `getUserPayments(userId)` | Get user payments |
| `getCoursePayments(userId, courseId)` | Get course payments |
| `processSuccessfulPayment(paymentId, stripePaymentIntentId)` | Mark success |
| `handlePaymentFailure(paymentId, errorMessage)` | Mark failure |
| `calculateTotalPaid(userId, courseId)` | Get total paid |

**Payment Statuses**: pending, processing, completed, failed, refunded

**Collection**: `payments`

### 8. Progress Services (10 functions)
**File**: `src/api/progressServices.js`

| Function | Purpose |
|----------|---------|
| `initializeProgress(userId, courseId, totalLessons)` | Create progress |
| `getProgress(userId, courseId)` | Get progress |
| `saveProgress(userId, courseId, progressData)` | Save progress |
| `updateProgress(userId, courseId, updates)` | Update progress |
| `markLessonComplete(userId, courseId, lessonId)` | Mark lesson done |
| `markLessonCompleteWithCompliance(...)` | Mark + log compliance |
| `markModuleComplete(userId, courseId, moduleId)` | Mark module done |
| `markModuleCompleteWithCompliance(...)` | Mark + log compliance |
| `updateLessonProgress(userId, courseId, lessonId, progressData)` | Update lesson |
| `getUserStats(userId)` | Get statistics |

**Collection**: `progress`

**Progress Statuses**: NOT_STARTED, IN_PROGRESS, COMPLETED, FAILED, LOCKED

### 9. PVQ Services - Personal Verification Questions (6 functions)
**File**: `src/api/pvqServices.js`

**Purpose**: Random identity verification during course sessions

| Function | Purpose |
|----------|---------|
| `getPVQQuestions()` | Get question bank |
| `getRandomPVQQuestion()` | Get random question |
| `logIdentityVerification(userId, courseId, sessionId, pvqData)` | Log attempt |
| `getVerificationHistory(userId, courseId, limit)` | Get history |
| `getUserAnsweredPVQ(userId, courseId, questionId)` | Get answer |
| `validatePVQAnswer(userId, courseId, questionId, userAnswer)` | Validate |

**PVQ Configuration**:
- **Trigger**: Every 30 minutes
- **Random Offset**: 5-10 minutes
- **Requirement**: Minimum 1 correct answer for certificate
- **Selection**: Random question from pool

**Collections**: `pvqQuestions`, `identityVerifications` (IMMUTABLE)

### 10. Quiz Services - NEW Phase 1 (11 functions)
**File**: `src/api/quizServices.js` (243 lines)

**Purpose**: Quiz and final exam management with compliance validation

**Attempt Lifecycle**:
- `createQuizAttempt(userId, courseId, quizData)` - Start attempt
- `updateQuizAttempt(attemptId, attemptData)` - Save progress
- `submitQuizAttempt(attemptId, submissionData)` - Submit & score

**Attempt Retrieval**:
- `getQuizAttempts(userId, courseId, quizId)` - Get all attempts
- `getAttemptCount(userId, courseId, quizId, isFinalExam)` - Get count
- `getLastAttemptData(userId, courseId, quizId)` - Get recent
- `getQuizAttemptHistory(userId, courseId, limit)` - Audit trail

**Validation & Status**:
- `canRetakeQuiz(userId, courseId, quizId, isFinalExam)` - Check eligibility
- `markQuizPassed(attemptId)` - Mark passed
- `getFinalExamStatus(userId, courseId)` - Get exam metadata
- `getQuizScore(userId, courseId, quizId)` - Get score & status

**Rules**:
- **PASSING_SCORE**: 70% (hard-coded)
- **MAX_ATTEMPTS**: 3 (final exam only)
- **Prevents retakes** after passing
- **Tracks** final exam separately from module quizzes

**Collection**: `quizAttempts` (IMMUTABLE)

### 11. Scheduling Services (7+ functions)
**File**: `src/api/schedulingServices.js`

| Function | Purpose |
|----------|---------|
| `createTimeSlot(timeSlotData)` | Create slot |
| `getTimeSlots(filters)` | Get slots |
| `getAvailableTimeSlots(startDate, endDate)` | Get open slots |
| More slot management functions... |

**Collection**: `timeSlots`

### 12. Security Services (5+ functions)
**File**: `src/api/securityServices.js`

- Role-based access checks
- Permission validation
- IP address logging
- Device fingerprinting

### 13. User Services (6+ functions)
**File**: `src/api/userServices.js`

- Get/update user profile
- User statistics
- Preference management

**Collection**: `users`

---

## State Management - React Context API

### 4 Specialized Contexts

#### AuthContext (`src/context/AuthContext.jsx`)
**Purpose**: User authentication and authorization state

**State**:
- `user` - Firebase user object
- `userProfile` - User profile with role
- `loading` - Auth initialization status
- `error` - Error message if any

**Methods**:
- `login(email, password)`
- `register(email, password)`
- `logout()`
- `getCurrentUser()`
- `hasPermission(permission)`
- `hasRole(roles)`

**Usage**:
```javascript
const { user, userProfile, login, logout } = useAuth();
```

#### CourseContext (`src/context/CourseContext.jsx`)
**Purpose**: Course, module, and lesson navigation state

**State**:
- `courses` - List of all courses
- `currentCourse` - Selected course
- `currentModule` - Selected module
- `currentLesson` - Selected lesson
- `modules` - Lessons in module
- `lessons` - Lessons in module
- `courseProgress` - Progress data
- `loading`, `error` - Status

**Methods**:
- `fetchCourses()`
- `selectCourse(courseId)`
- `selectModule(moduleId)`
- `selectLesson(lessonId)`
- `updateProgress()`

#### ModalContext (`src/context/ModalContext.jsx`)
**Purpose**: Modal/notification queue management

**State**:
- `modals` - Stack of open modals

**Methods**:
- `openModal(config)`
- `closeModal(modalId)`
- `closeAllModals()`
- `closeTopModal()`
- `showConfirmation(config)`
- `showNotification(config)`
- `showSuccess(message, duration)`
- `showError(message, duration)`
- `showWarning(message, duration)`
- `showInfo(message, duration)`

#### TimerContext (`src/context/TimerContext.jsx`) - COMPLIANCE TRACKING
**Purpose**: Real-time session timing, break enforcement, compliance logging

**State** (40+ properties):
- Session timing: `sessionTime`, `totalTime`, `isActive`, `isPaused`
- Break tracking: `breakTime`, `isOnBreak`, `isBreakMandatory`, `breakHistory`
- Daily limits: `isLockedOut`, `lastActivityTime`
- PVQ: `showPVQModal`, `currentPVQQuestion`, `nextPVQTriggerTime`, `pvqSubmitting`
- Session: `currentSessionId`, `lessonsAccessed`, `sessionHistory`, `currentSession`

**Key Constants**:
```javascript
MAX_DAILY_HOURS = 14400 seconds (4 hours)
BREAK_REQUIRED_AFTER = 7200 seconds (2 hours)
MIN_BREAK_DURATION = 600 seconds (10 minutes)
PVQ_TRIGGER_INTERVAL = 1800 seconds (30 minutes)
PVQ_RANDOM_OFFSET_MIN = 300 seconds (5 minutes)
PVQ_RANDOM_OFFSET_MAX = 600 seconds (10 minutes)
```

**Methods**:
- `startTimer(courseId, sessionData)` - Start timer
- `stopTimer()` - Stop timer
- `pauseTimer()` - Pause timer
- `resumeTimer()` - Resume timer
- `startBreak(breakType)` - Start break
- `endBreak()` - End break with validation
- `triggerPVQ()` - Trigger PVQ modal
- `checkDailyHourLockout()` - Check 4-hour limit
- `getDailyTime()` - Get daily total

**Real-Time Features**:
- Timer increments every 1 second
- 4-hour daily limit enforced with automatic lockout
- 10-minute break minimum validated on break end
- PVQ triggers at randomized 30-minute intervals (±5-10 minutes)
- Session data persisted to Firestore in real-time
- All breaks logged with duration and type
- All sessions logged with timestamps

**Compliance Logging**:
- All breaks logged to complianceLogs
- All sessions logged with timestamps
- All lessons accessed tracked
- All PVQs logged for audit trail

---

## Component Architecture (40+ Components)

### Component Categories

**Common UI Components** (14 total):
- `Badge` - Status indicator
- `Button` - Interactive button
- `Card` - Container component
- `Checkbox` - Toggle input
- `ErrorMessage` - Error display
- `Input` - Text input field
- `LoadingSpinner` - Loading indicator
- `BaseModal`, `ConfirmModal`, `NotificationModal`, `PVQModal` - Modal variants
- `ProgressBar` - Progress visualization
- `Select` - Dropdown selector
- `SuccessMessage` - Success notification
- `ToggleSwitch` - Binary toggle
- `Tooltip` - Help text

**Layout Components** (3 main):
- `MainLayout` - Main site layout
- `AuthLayout` - Authentication layout
- `DashboardLayout` - Dashboard layout
- Plus: `Header`, `Sidebar`, `Footer` sub-components

**Guard Components** (3 HOCs):
- `ProtectedRoute` - Requires authentication
- `PublicRoute` - Redirects if authenticated
- `RoleBasedRoute` - Role-based access control

**Admin Components** (2):
- `ComplianceReporting` - Compliance data export
- `SchedulingManagement` - Schedule management

**Payment Components** (5):
- `CheckoutForm` - Stripe checkout
- `CompletePackageCheckoutForm` - Multi-course checkout
- `EnrollmentCard` - Enrollment display
- `PaymentModal` - Payment modal
- `RemainingPaymentCheckoutForm` - Remaining balance form

**Scheduling Components** (2):
- `LessonBooking` - Book lesson
- `UpcomingLessons` - View upcoming

### Naming Conventions & Styling Pattern

**File Naming**:
- Component: PascalCase (e.g., `Button.jsx`)
- Styles: Matching CSS Module (e.g., `Button.module.css`)
- Exports: `export default ComponentName`

**CSS Module Pattern**:
- BEM naming convention
- Block: `.btn`
- Modifier: `.btn-primary`, `.btn-secondary`
- Element: `.btn__text`
- State: `.btn:disabled`, `.btn--active`

**Example (Button.module.css)**:
```css
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## Configuration & Constants

### appConfig.js
```javascript
APP_NAME: 'Fastrack Driving School LMS'
FIREBASE_PROJECT_ID: 'fastrack-driving-school-lms'
MAX_DAILY_HOURS: 4
MANDATORY_BREAK_AFTER: 2
MIN_BREAK_DURATION: 10
PVQ_TRIGGER_INTERVAL: 30
TOTAL_HOURS_REQUIRED: 24
ITEMS_PER_PAGE: 10
ENABLE_SCHEDULING: true
ENABLE_PAYMENTS: true
ENABLE_COMPLIANCE: true
```

### userRoles.js
```javascript
USER_ROLES = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin'
}

ROLE_PERMISSIONS = {
  student: ['view_courses', 'take_quizzes', 'view_progress'],
  instructor: ['manage_courses', 'grade_quizzes', 'view_students'],
  admin: ['all']
}
```

### courses.js
```javascript
COURSE_IDS = {
  BASIC: 'course_basic_01',
  ADVANCED: 'course_advanced_01',
  FULL_PACKAGE: 'course_package_01'
}

COURSE_PRICING = {
  BASIC: 9900,        // $99.00
  ADVANCED: 14900,    // $149.00
  FULL_PACKAGE: 24900 // $249.00
}

ENROLLMENT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  SUSPENDED: 'suspended'
}
```

### lessonTypes.js
```javascript
LESSON_TYPES = {
  VIDEO: 'video',
  READING: 'reading',
  QUIZ: 'quiz',
  TEST: 'test',
  PRACTICAL: 'practical'
}
```

### progressStatus.js
```javascript
PROGRESS_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  LOCKED: 'locked'
}
```

### validationRules.js
```javascript
VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  PHONE: /^[0-9]{10}$/,
  ZIP_CODE: /^[0-9]{5}$/
}
```

---

## Cloud Functions (7 Serverless Functions)

**File**: `functions/index.js` (34 KB)
**Framework**: Firebase Cloud Functions v2 (Node.js 20)
**Dependencies**: firebase-admin, firebase-functions, @google-cloud/logging, stripe, cors

### Exported Functions

#### 1. createCheckoutSession (onCall)
- **Purpose**: Create Stripe Checkout session
- **Input**: userId, courseId, amount, paymentType
- **Output**: sessionId, clientSecret

#### 2. createPaymentIntent (onCall)
- **Purpose**: Create Stripe PaymentIntent
- **Input**: Same as createCheckoutSession
- **Output**: client secret

#### 3. stripeWebhook (onRequest)
- **Purpose**: Handle Stripe webhook events
- **Events**:
  - payment_intent.succeeded
  - payment_intent.payment_failed
  - charge.refunded

#### 4. generateCertificate (onCall) - Phase 1
- **6-Step Validation**:
  1. Course completion (100%)
  2. 24-hour requirement (1440+ minutes)
  3. Final exam passage (≤3 attempts)
  4. All module quizzes passed
  5. PVQ verification (≥1 correct)
  6. Archive compliance data
- **Input**: userId, courseId
- **Output**: certificateId, complianceData{}

#### 5. auditComplianceAccess (onCall) - Phase 2
- **Purpose**: Log compliance record access
- **Input**: action, resource, resourceId, details
- **Output**: auditId
- **Logging**: Cloud Logging + auditLogs collection

#### 6. generateComplianceReport (onCall) - Phase 3
- **Purpose**: Export DMV-ready compliance data
- **Input**: userId, courseId, format (csv|json|pdf), dateRange
- **Output**: Report URL or data

---

## Firestore Security Rules & Collections

### Security Pattern: Role-Based Access with Immutability

**Immutable Collections** (Write-Once, Update/Delete DENIED):
- `complianceLogs` - Session audit trail
- `quizAttempts` - Quiz/exam history (scores locked)
- `identityVerifications` - PVQ attempts (responses locked)
- `certificates` - Issued certificates
- `auditLogs` - Access audit trail (admin read-only)

### Helper Functions
```firestore
function isAdmin() {
  return request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid))
    .data.role == 'admin';
}

function isInstructor() {
  return request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid))
    .data.role == 'instructor';
}

function isOwner() {
  return request.auth.uid == resource.data.userId;
}
```

### Collections (15+)

| Collection | Type | Purpose | Immutable |
|-----------|------|---------|----------|
| users | Document | User profiles, roles | No |
| courses | Collection | Course definitions | No |
| enrollments | Collection | Student enrollments | No |
| complianceLogs | Collection | Session audit trail | **YES** |
| complianceSessions | Collection | Session lifecycle | **YES** |
| quizAttempts | Collection | Quiz/exam history | **YES** |
| identityVerifications | Collection | PVQ attempts | **YES** |
| certificates | Collection | Issued certificates | **YES** |
| auditLogs | Collection | Access audit trail | **YES** |
| progress | Collection | Student progress | No |
| lessons | Collection | Course lessons | No |
| modules | Collection | Course modules | No |
| payments | Collection | Payment records | No |
| pvqQuestions | Collection | PVQ question bank | No |
| timeSlots | Collection | Scheduling slots | No |

---

## Dependencies

### Frontend (package.json)

| Package | Version | Documentation |
|---------|---------|---|
| react | ^18.2.0 | https://react.dev |
| react-dom | ^18.2.0 | https://react.dev/reference/react-dom |
| react-router-dom | ^6.20.0 | https://reactrouter.com |
| firebase | ^10.7.1 | https://firebase.google.com/docs |
| @stripe/react-stripe-js | ^5.4.0 | https://stripe.com/docs/stripe-js |
| react-scripts | 5.0.1 | https://create-react-app.dev |

### Backend (functions/package.json)

| Package | Version | Documentation |
|---------|---------|---|
| firebase-admin | ^12.0.0 | https://firebase.google.com/docs/admin |
| firebase-functions | ^4.5.0 | https://firebase.google.com/docs/functions |
| @google-cloud/logging | ^10.0.0 | https://cloud.google.com/logging/docs |
| stripe | ^12+ | https://stripe.com/docs/libraries/node |
| cors | Latest | https://www.npmjs.com/package/cors |

---

## Compliance Implementation Status

### ✅ Phase 1: COMPLETE (Nov 23, 2025)
- Quiz Service (11 functions, 243 lines)
- 24-hour instruction requirement (1440 minutes)
- Final exam 3-attempt limit
- Module quiz passage requirement
- PVQ verification (≥1 correct answer)
- Compliance logging infrastructure

### ✅ Phase 2: COMPLETE (Nov 24, 2025)
- Firestore immutability rules (5 collections)
- Cloud Audit Logs integration
- Access tracking & audit logging
- Deletion prevention
- Audit trail for certificate operations

### ✅ Phase 3: COMPLETE (Nov 24, 2025)
- Compliance report generation
- CSV/JSON export formats
- DMV-ready compliance reporting
- Audit trail extraction

### ⏳ Phase 4: PLANNED
- Data retention policy documentation
- Automated archival to cold storage

---

## Key Features

- **Real-Time Session Timer**: 1-second increments with automatic Firestore logging
- **4-Hour Daily Limit**: Enforced with automatic account lockout
- **Mandatory 2-Hour Breaks**: 10-minute minimum break requirement validation
- **PVQ Identity Verification**: Random questions every 30 minutes (±5-10 min offset)
- **Certificate Generation**: 6-step validation with compliance data archiving
- **Immutable Audit Trail**: All compliance operations logged and locked
- **Role-Based Access**: Student, Instructor, Admin with specific permissions
- **Stripe Payment Integration**: Multiple payment options (upfront, installment, split)
- **Progress Tracking**: Lesson/module completion with real-time progress
- **DMV Compliance Reporting**: Export-ready compliance data

---

**Last Updated**: November 26, 2025
**Version**: 2.0
**Status**: Production Ready
**Compliance**: Phases 1-3 Complete
**Next**: Phase 4 (Data Retention & Archival)
