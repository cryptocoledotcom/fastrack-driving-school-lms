---
description: Repository Information Overview
alwaysApply: true
---

# Fastrack Driving School LMS - Repository Information

## Summary

Fastrack is a comprehensive Learning Management System (LMS) for driving school education with DMV compliance support. It features a React-based frontend with a Firebase backend, enabling course enrollment, payment processing, lesson management, real-time progress tracking, session time tracking with break enforcement, randomized identity verification (PVQs), quiz/exam management with attempt limits, and certificate generation with multi-step compliance validation.

## Repository Structure

**Main Directories**:
- **src/**: React frontend application with pages, components, services, context, and utilities
- **functions/**: Firebase Cloud Functions backend with payment processing and certificate generation
- **public/**: Static assets (HTML, manifest, robots.txt)
- **.zencoder/**: Development documentation and compliance rules
- **Root**: Configuration files (Firebase, ESLint, environment files)

**Architecture**: Multi-tier system with React 18 SPA frontend, Firebase Firestore database, Cloud Functions backend, and Stripe payment integration.

---

## Projects

### Frontend - React 18+ Application

**Configuration File**: `package.json` (root)

#### Language & Runtime
**Language**: JavaScript/JSX  
**Node.js Version**: 22.20.0  
**npm Version**: 10.9.3  
**Build System**: Create React App (react-scripts 5.0.1)  
**Package Manager**: npm

#### Dependencies

**Main Dependencies**:
- **react** (^18.2.0): UI library for building components
- **react-dom** (^18.2.0): DOM rendering for React
- **react-router-dom** (^6.20.0): Client-side routing and navigation
- **firebase** (^10.7.1): Firebase SDK for authentication, Firestore, Storage, Functions
- **firebase-admin** (^13.6.0): Firebase Admin SDK for backend operations
- **@stripe/react-stripe-js** (^5.4.0): Stripe payment integration
- **@stripe/stripe-js** (^3.0.0+): Stripe JavaScript library

**Development Dependencies**:
- **react-scripts** (5.0.1): Create React App build scripts and webpack configuration

#### Build & Installation

```bash
npm install                       # Install all dependencies
npm start                         # Start development server (http://localhost:3000)
npm run build                     # Build for production (optimized bundle)
npm test                          # Run tests
npm run eject                     # Eject from Create React App (irreversible)
npm run lint                      # Run ESLint (when configured)
```

#### Main Structure & Services

**Pages** (20+ components):
- Auth pages: Login, Register, ForgotPassword
- Dashboard & courses: Home, Dashboard, Courses, MyCourses, CourseDetail
- Learning: CoursePlayer (with timer, PVQ modal, lesson progression)
- Management: Admin, Certificates, Profile, Settings
- Support: PaymentSuccess, NotFound, About, Contact

**Components**:
- **common/**: Button, Card, Input, Select, Modal, ProgressBar, Badge, LoadingSpinner, Tooltip, PVQModal
- **layout/**: MainLayout, DashboardLayout, AuthLayout, Header, Sidebar, Footer
- **guards/**: ProtectedRoute, RoleBasedRoute, PublicRoute
- **payment/**: CheckoutForm, PaymentModal, EnrollmentCard
- **scheduling/**: LessonBooking, UpcomingLessons
- **admin/**: SchedulingManagement, UserManagement

**Services** (14+ modules):
- **authServices.js**: Firebase authentication (email/password, Google OAuth, logout)
- **courseServices.js**: Course CRUD operations and retrieval
- **enrollmentServices.js**: Enrollment lifecycle, payment states, course access
- **paymentServices.js**: Stripe integration, payment tracking, split payments
- **lessonServices.js**: Lesson content, video/reading/quiz types, sequencing
- **moduleServices.js**: Module organization and progression
- **progressServices.js**: Lesson/module completion tracking
- **schedulingServices.js**: Behind-the-wheel time slot management and booking
- **userServices.js**: User profile management and settings
- **quizServices.js** (**NEW - 243 lines**): Quiz/exam attempt management (11 functions):
  - `createQuizAttempt()`: Start quiz attempt
  - `submitQuizAttempt()`: Submit and score quiz (PASSING_SCORE = 70%)
  - `getQuizAttempts()`: Retrieve attempt history
  - `getAttemptCount()`: Get total attempts for limit enforcement
  - `getFinalExamStatus()`: Check exam metadata and canRetake flag
  - `canRetakeQuiz()`: Validate retake eligibility (≤3 attempts, not passed)
  - `getLastAttemptData()`: Get most recent attempt
  - `markQuizPassed()`: Mark quiz as passed
  - `getQuizScore()`: Get score and passed status
  - `getQuizAttemptHistory()`: Audit trail of attempts
- **pvqServices.js**: PVQ (Personal Verification Question) service (6 functions):
  - `getPVQQuestions()`: Retrieve question bank from Firestore
  - `getRandomPVQQuestion()`: Select random question for modal
  - `validatePVQAnswer()`: Check answer correctness
  - `logIdentityVerification()`: Record verification attempt
  - `getVerificationHistory()`: Audit trail of PVQ attempts
- **complianceServices.js** (**ENHANCED - +66 lines, 13 functions**):
  - Session management: `createSession()`, `endSession()`, `getSessionHistory()`
  - Time tracking: `getDailyTime()`, `getTotalSessionTime()`, `getTotalSessionTimeInMinutes()`
  - Break logging: `logBreak()`, `validateBreak()`
  - Compliance logging: `logLessonCompletion()`, `logModuleCompletion()`, `logQuizAttempt()`
- **securityServices.js**: Authorization, role validation, access control

**Context Providers** (4):
- **AuthContext**: Authentication state, user data, login/logout
- **CourseContext**: Course selections, enrollments, course data
- **TimerContext**: Session time tracking, break enforcement, PVQ triggers
- **ModalContext**: Global modal state management

**TimerContext Enhancements** (NEW):
- Real-time session timer incrementing every 1 second
- 4-hour daily lockout: `MAX_DAILY_HOURS = 14400` seconds
- Mandatory 2-hour break: `BREAK_REQUIRED_AFTER = 7200` seconds
- 10-minute minimum break: `MIN_BREAK_DURATION = 600` seconds
- PVQ random triggers: Every 30 minutes (±5-10 min random offset)
- Break validation with error messages
- Daily reset at midnight (00:00:00)

---

### Firebase Cloud Functions (Node.js 20)

**Configuration File**: `functions/package.json`

#### Language & Runtime
**Language**: JavaScript (Node.js)  
**Node.js Version**: 20  
**Package Manager**: npm  
**Main Entry**: `functions/index.js` (31 KB)

#### Dependencies

**Main Dependencies**:
- **firebase-functions** (^4.5.0): Cloud Functions runtime and deployment
- **firebase-admin** (^12.0.0): Firebase Admin SDK for Firestore, Auth, Storage access
- **@google-cloud/logging** (^10.0.0) (**NEW - Phase 2**): Cloud Logging for audit trails
- **stripe** (^14.0.0): Stripe API client for payment processing

**Development Dependencies**:
- **firebase-functions-test** (^3.1.0): Testing utilities for Cloud Functions
- **eslint** (^8.0.0+): Code linting via .eslintrc.js

#### Build & Installation

```bash
npm install                          # Install dependencies
npm run lint                         # ESLint code validation (pre-deploy hook)
npm run serve                        # Start Firebase emulator (functions only)
npm run shell                        # Interactive functions shell
npm run start                        # Start functions shell
firebase deploy --only functions    # Deploy to Firebase
firebase functions:list             # List deployed functions
firebase functions:log              # View live function logs
```

#### Cloud Functions

**Payment Processing** (3 functions):
- `createCheckoutSession()`: Create Stripe checkout session ($99 initial payment)
- `createPaymentIntent()`: Create payment intent for remaining balance ($450)
- `stripeWebhook()`: Handle Stripe webhook events (payment success, failures)

**Certificate Generation** (1 function - **ENHANCED Phase 1**):
- `generateCertificate(userId, courseId)`: Multi-step validation and certificate creation
  - [Step 1] Verify 100% lesson completion
  - [Step 2] Validate 1440+ minutes (24 hours) logged instruction time
  - [Step 3] Verify all module quizzes passed + final exam passed (≤3 attempts)
  - [Step 4] Confirm PVQ identity verification (≥1 question, ≥1 correct)
  - [Step 5] Create certificate with compliance metadata
  - [Step 6] Update enrollment with `complianceVerified` flag
  - Returns: certificateId, compliance data summary

**Audit Logging** (NEW - Phase 2):
- `logAuditEvent()` (helper): Logs compliance actions to Cloud Logging and auditLogs collection
  - Parameters: userId, action (read/create/update/delete), resource, resourceId, status, metadata
  - Logs to: Cloud Logging (viewable in GCP Console) + Firestore auditLogs collection
- `auditComplianceAccess()` (callable): Public function for tracking compliance record access
  - Logs when users/admins view or access compliance records

#### Firestore Security Rules

**File**: `firestore.rules` (5.3 KB)

**Collections with Immutability** (Phase 2):
- **complianceLogs**: Write-once, no update/delete, role-based read access
- **quizAttempts**: Write-once, admin-readable, no update/delete
- **identityVerifications**: Write-once, no modification, audit trail locked
- **certificates**: Write-once, immutable after issuance, admin-readable
- **complianceSessions**: Session lifecycle locked, write-once only
- **auditLogs**: Admin-read-only, immutable (append-only audit trail)

**Helper Functions**:
- `isAdmin()`: Check if user has admin role
- `isInstructor()`: Check if user has instructor role
- `isOwnerOrAdmin()`: Check if user owns document or is admin

---

## Firestore Database

**Location**: us-east5  
**Configuration File**: `firebase.json`  
**Rules File**: `firestore.rules`  
**Indexes**: `firestore.indexes.json`

### Collections

**Authentication & Users**:
- **users**: User profiles (uid, email, displayName, role, createdAt)

**Course Content**:
- **courses**: Course metadata (title, description, modules array, instructor)
- **modules**: Module organization (courseId, title, lessons array, order)
- **lessons**: Individual lessons (moduleId, title, type, content, videoUrl, readingUrl)

**Enrollment & Payments**:
- **enrollments**: Student enrollment state (userId, courseId, status, certificateGenerated, complianceVerified)
- **payments**: Payment transactions (userId, courseId, amount, status, stripeId, paymentType)

**Progress & Learning**:
- **progress**: Lesson/module completion (userId, courseId, lessonsCompleted, modulesCompleted, overallProgress)
- **complianceLogs**: Session activity audit trail (userId, courseId, sessionId, status, duration, startTime, endTime)
- **complianceSessions**: Session lifecycle (userId, courseId, startedAt, completedAt, totalTime)

**Assessments** (NEW - Phase 1):
- **quizAttempts**: Quiz/exam attempts (userId, courseId, quizId, isFinalExam, score, passed, attemptNumber, timestamps)
- **identityVerifications**: PVQ attempts (userId, courseId, pvqId, question, answer, correct, timestamp)
- **pvqQuestions**: Question bank (question, correctAnswer, difficulty)

**Certificates & Auditing**:
- **certificates**: Issued certificates (userId, courseId, certificateId, issuedAt, complianceData)
- **auditLogs**: Compliance audit trail (userId, action, resource, timestamp, status, metadata)

**Scheduling**:
- **timeSlots**: Behind-the-wheel lesson slots (instructorId, startTime, endTime, availability, booked)

---

## Testing & Verification

**Test Framework**: Jest (via react-scripts)  
**Linting**: ESLint (.eslintrc.js in functions/)

**Test Commands**:
```bash
npm test                            # Run React component tests
npm run lint                        # Run ESLint validation
firebase emulators:start            # Start local emulator for Firestore/Functions
firebase emulators:start --only firestore,functions  # Emulator subset
```

**Current Test Coverage**:
- ✅ Cloud Functions: ESLint passes, syntax validation
- ⏳ React components: Coverage gaps in quiz and compliance components
- ⏳ Integration tests: Quiz flow, certificate generation validation

**Recommended Test Files**:
- `src/api/__tests__/quizServices.test.js`: Quiz service unit tests
- `src/api/__tests__/complianceServices.test.js`: Compliance logging tests
- `src/context/__tests__/TimerContext.test.js`: Timer and break enforcement tests
- `functions/__tests__/generateCertificate.test.js`: Certificate validation flow

---

## Build & Deployment

### Local Development Setup

```bash
npm install                         # Install frontend dependencies
cd functions && npm install         # Install function dependencies
cd ..
npm start                           # Terminal 1: Start React dev server (port 3000)
cd functions && npm run serve       # Terminal 2: Start Firebase emulator
```

### Production Deployment

```bash
# Validate before deployment
firebase deploy --dry-run           # Dry-run validation
npm run build                       # Build optimized React bundle
cd functions && npm run lint        # Validate Cloud Functions

# Deploy to production
firebase deploy --only firestore:rules    # Deploy Firestore rules
firebase deploy --only functions         # Deploy Cloud Functions
firebase deploy --only hosting           # Deploy frontend (auto-optimized)
firebase deploy                          # Deploy all at once
```

### Pre-Deployment Checks

```bash
# Frontend validation
npm run build                       # Check build succeeds
npm test                            # Run available tests

# Backend validation
cd functions
npm run lint                        # ESLint validation
node -c index.js                    # Node.js syntax check
npm install                         # Verify dependencies
cd ..
```

---

## Environment Configuration

**Frontend** (`.env` file - root):
```
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

**Backend** (Cloud Functions - set in Firebase Console):
- `STRIPE_SECRET_KEY`: Stripe API secret key (auto-set for production)
- Other keys managed via Firebase Console → Functions → Runtime environment

---

## Key Features

### Core LMS
- **Authentication**: Email/password and Google OAuth via Firebase Auth
- **Course Management**: Browse, enroll, track progress with detailed statistics
- **Lesson System**: Video, reading, quiz, test lesson types with sequential progression
- **Progress Tracking**: Real-time completion percentage and lesson history

### Learning & Compliance (DMV-Specific)
- **Session Time Tracking**: Real-time timer with automatic persistence to Firestore
- **Daily Hour Lockout**: 4-hour daily maximum with automatic enforcement at midnight
- **Mandatory Breaks**: 2-hour break requirement with 10-minute minimum validation
- **Identity Verification (PVQs)**: Randomized pop-up questions every 30 minutes (±5-10 min)
  - Random question selection from bank
  - Response time tracking
  - Correct/incorrect answer logging
  - Audit trail for DMV compliance

### Assessment System (NEW - Phase 1)
- **Quiz/Exam Management**: Full attempt tracking with scoring (70% passing threshold)
- **Final Exam Limits**: Maximum 3 attempts per student
- **Quiz Passage Requirement**: All module quizzes must pass before certificate
- **Attempt History**: Complete audit trail with timestamps and scores

### Certificate Generation
- **Multi-Step Validation** (6 checks):
  1. 100% lesson completion required
  2. 1440+ minutes (24 hours) instruction time verified
  3. All module quizzes must be passed
  4. Final exam must be passed (≤3 attempts)
  5. Identity verification (PVQ) completed with ≥1 correct answer
  6. Certificate issued with compliance metadata
- **PDF Generation**: Certificate download support
- **Audit Trail**: Compliance data archived with certificate

### Payment Processing
- **Stripe Integration**: Secure payment processing with split payments
  - Initial enrollment: $99 payment
  - Remaining balance: $450 payment
- **Payment Tracking**: Full transaction history with Stripe metadata
- **Webhook Handling**: Automatic payment status updates

### Access Control
- **Role-Based Access**: STUDENT, INSTRUCTOR, ADMIN role hierarchy
- **Firestore Security Rules**: Document-level access control
- **Protected Routes**: React routing with role validation

### Audit & Compliance (Phase 2)
- **Immutable Records**: Compliance data cannot be deleted or modified
- **Cloud Audit Logging**: All access tracked in Cloud Logging (90-day retention)
- **Access Alerts**: Deletion attempts trigger admin notifications
- **Compliance Export**: Data available for DMV audit trails

---

## Technology Stack Summary

**Frontend**:
- React 18, React Router 6
- Firebase Authentication, Firestore SDK, Cloud Storage
- Stripe.js for payments
- CSS Modules for styling

**Backend**:
- Firebase Cloud Functions (Node.js 20)
- Firebase Admin SDK for Firestore/Auth/Storage access
- Google Cloud Logging for audit trails
- Stripe API for payment processing

**Database**:
- Firestore (NoSQL, real-time)
- Auto-scaling, zero-maintenance

**Infrastructure**:
- Firebase Hosting (CDN, auto-SSL)
- Cloud Functions (serverless, auto-scaling)
- Cloud Logging (audit trails, 90-day retention)
- Google Cloud Storage (certificates, media)

**Code Quality**:
- ESLint for JavaScript/Node.js linting
- Firebase deployment validation
- Pre-deploy syntax checks

---

## Compliance Implementation Status

**Phase 1** ✅ COMPLETE (Nov 24, 2025):
- Quiz service with 11 functions
- Certificate validation with 24-hour check, quiz passage, exam limits, PVQ verification
- Compliance logging and session tracking
- Runtime error fixes (CoursePlayer loads correctly)

**Phase 2** 🔄 IN PROGRESS:
- Firestore immutability rules for compliance collections (ready to deploy)
- Cloud Audit Logging integration (code ready, GCP setup required)
- Access tracking and deletion alerts

**Phase 3** 📋 PLANNED:
- Compliance reporting and DMV export formats (CSV, JSON, PDF)

**Phase 4** 📋 PLANNED:
- Data retention policy documentation
- Automated archival to cold storage

---

## Recent Updates (Nov 23-24, 2025)

1. **Quiz Service Created**: `src/api/quizServices.js` (243 lines, 11 functions)
   - Full quiz/exam lifecycle management
   - Attempt counting and final exam 3-limit enforcement
   - 70% passing score validation

2. **Compliance Services Enhanced**: `src/api/complianceServices.js` (+66 lines)
   - Quiz attempt logging to compliance audit trail
   - Total session time calculations for 24-hour verification
   - Module/lesson completion logging

3. **Certificate Generation Enhanced**: `functions/index.js` (+161 lines)
   - 6-step compliance validation process
   - 24-hour time requirement (1440 minutes) check
   - Quiz passage and final exam limit enforcement
   - PVQ verification requirement
   - Compliance metadata archived with certificate

4. **Runtime Issues Fixed**:
   - Fixed `prevTotal is not defined` ReferenceError
   - Optimized Firestore queries to avoid composite index requirements
   - CoursePlayer now loads without errors

5. **Phase 2 Implementation Ready**:
   - Firestore rules with immutable compliance collections
   - Cloud Logging integration via `logAuditEvent()` helper
   - Audit trail function: `auditComplianceAccess()`
   - Dependency added: `@google-cloud/logging`

---

## Quick Reference

**Start Development**:
```bash
npm install && npm start                    # Frontend
cd functions && npm install && npm run serve # Backend (separate terminal)
```

**Deploy to Production**:
```bash
firebase deploy
```

**Validate Before Deploy**:
```bash
firebase deploy --dry-run
npm run build
cd functions && npm run lint
```

**View Cloud Logs**:
```bash
firebase functions:log
# Or in GCP Console → Logging → Logs Explorer
```
