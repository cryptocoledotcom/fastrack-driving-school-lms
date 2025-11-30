# Complete Project Structure Reference

**Purpose:** Detailed documentation of every directory, file, and component in the Fastrack LMS

**Last Updated:** November 30, 2025

---

## Quick Navigation

- [Root Directory](#root-directory)
- [Source Code (`src/`)](#source-code-structure)
- [Public Assets (`public/`)](#public-assets)
- [Cloud Functions (`functions/`)](#cloud-functions)
- [Documentation (`docs/`)](#documentation)
- [Configuration Files](#configuration-files)
- [Testing Structure](#testing-structure)

---

## Root Directory

```
project-root/
├── src/                          Application source code
├── public/                       Static assets & HTML
├── functions/                    Firebase Cloud Functions
├── docs/                         All documentation
├── .zencoder/                    Zencoder AI configuration
├── .vscode/                      VS Code settings
├── .babelrc                      Babel transpiler config
├── .gitignore                    Git ignore rules
├── package.json                  npm dependencies & scripts
├── package-lock.json             Locked dependency versions
├── jest.config.js                Jest testing configuration
├── firebase.json                 Firebase project config
├── firestore.indexes.json        Firestore index definitions
├── firestore.rules               Firestore security rules
├── README.md                     Project overview
├── load-test.js                  Concurrent payment load test
└── seed.js                       Database seeding script
```

---

## Source Code Structure (`src/`)

### 1. **API Layer** (`src/api/`)

Business logic and backend integration.

#### **`src/api/auth/`** — Authentication
- **Purpose:** User login, registration, auth state management
- **Key Files:**
  - `authServices.js` — Firebase auth operations (sign up, sign in, sign out)
  - `sessionValidator.js` — Validates user sessions before operations
  - Related tests in `__tests__/`

#### **`src/api/base/`** — Base Services & Utilities
- **Purpose:** Shared utilities and base functionality
- **Key Files:**
  - `RetryHandler.js` — Network retry logic with exponential backoff (3 attempts, 1s/2s/4s delays)
  - `FirebaseBase.js` — Firebase connection initialization
  - `__tests__/RetryHandler.test.js` — 31 comprehensive retry tests

#### **`src/api/courses/`** — Course Management
- **Purpose:** Fetch, retrieve, and manage course data
- **Key Files:**
  - `courseServices.js` — CRUD operations for courses
  - Manages: course metadata, modules, lessons, pricing
  - Returns: course details for catalog and player

#### **`src/api/enrollment/`** — Enrollment & Payments (CRITICAL)
- **Purpose:** User enrollment, payment tracking, atomic transactions
- **Status:** ✅ Phase 2 complete (atomic operations fix)
- **Key Files:**
  - `enrollmentServices.js` — **ATOMIC OPERATIONS** for payments
    - `updateEnrollmentAfterPayment()` — Atomic batch update for payment recording
    - `payRemainingBalance()` — Atomic batch for completing payment
    - Uses `writeBatch()` for transaction safety
    - Prevents race conditions in concurrent payments
  - `__tests__/enrollmentServices.concurrent.test.js` — 16 concurrent operation tests (✅ all passing)

#### **`src/api/student/`** — Student Progress Tracking
- **Purpose:** Track course progress, lessons completed, module status
- **Key Files:**
  - `progressServices.js` — Atomic progress updates
  - `completeLesson()` — Mark lesson complete (atomic)
  - `completeModule()` — Mark module complete (atomic)
  - `recordLessonProgress()` — Update lesson metrics (atomic)

#### **`src/api/compliance/`** — Compliance Tracking
- **Purpose:** Track compliance requirements, safety certifications
- **Key Files:**
  - `complianceServices.js` — Compliance event recording
  - Tracks: safety video watched, tests passed, certifications earned
  - **Atomic operations** prevent incomplete records

#### **`src/api/security/`** — Security & Authorization
- **Purpose:** Permission checks, role-based access control
- **Key Files:**
  - `authorizationService.js` — User role verification
  - `permissionValidator.js` — Check user can perform action
  - Prevents: unauthorized payment modifications, data access

#### **`src/api/errors/`** — Custom Error Classes
- **Purpose:** Standardized error handling across API
- **Key Files:**
  - `ApiError.js` — Base error class
  - `ValidationError.js` — Input validation failures
  - `EnrollmentError.js` — Enrollment-specific errors
  - `AuthenticationError.js` — Auth failures

#### **`src/api/utils/`** — Utility Functions
- **Purpose:** Helper functions for data transformation
- **Key Files:**
  - `dataTransformers.js` — Convert API responses to component format
  - `dateUtils.js` — Date manipulation and formatting
  - `numberUtils.js` — Currency and number formatting

#### **`src/api/validators/`** — Data Validation
- **Purpose:** Validate user input before database operations
- **Key Files:**
  - `enrollmentValidator.js` — Validate enrollment data
  - `paymentValidator.js` — Validate payment amounts (positive, reasonable)
  - `userValidator.js` — Validate user input

---

### 2. **Components** (`src/components/`)

UI components organized by feature.

#### **`src/components/common/`** — Reusable Components
- `Button.jsx` — Standard button component
- `Modal.jsx` — Reusable modal dialog
- `Card.jsx` — Card container component
- `Badge.jsx` — Status badges (Paid, Partially Paid, etc.)
- Used across entire application

#### **`src/components/layout/`** — Layout Components
- `Header.jsx` — Top navigation bar
- `Sidebar.jsx` — Left navigation sidebar
- `Footer.jsx` — Footer component
- `MainLayout.jsx` — Wraps all pages

#### **`src/components/payment/`** — Payment Components (CRITICAL)
- **Purpose:** Handle payment UI and logic
- `PaymentForm.jsx` — Payment input form
- `PaymentStatus.jsx` — Display payment state (Paid, Partial, Pending)
- `PaymentHistory.jsx` — Show previous payments
- Integration with `enrollmentServices.js` for atomic operations

#### **`src/components/guards/`** — Route Guards
- `ProtectedRoute.jsx` — Require authentication
- `AdminRoute.jsx` — Require admin role
- `InstructorRoute.jsx` — Require instructor role

#### **`src/components/admin/`** — Admin Dashboard
- `AdminPanel.jsx` — Admin control center
- `UserManagement.jsx` — View/manage users
- `CourseManagement.jsx` — Manage courses

#### **`src/components/scheduling/`** — Scheduling Components
- Used for appointment scheduling features

---

### 3. **Pages** (`src/pages/`)

Full page components (routes).

#### **Key Pages:**

**`src/pages/Home/Home.jsx`**
- Entry point, hero, course highlights
- Route: `/`

**`src/pages/Courses/Courses.jsx`**
- Course catalog/browse all courses
- Route: `/courses`
- Displays all 3 courses with enrollment buttons

**`src/pages/CourseDetail/CourseDetail.jsx`**
- Individual course details, curriculum, pricing
- Route: `/courses/:courseId`
- Shows "Enroll Now" button

**`src/pages/MyCourses/MyCourses.jsx`** (CRITICAL)
- User's enrolled courses
- Route: `/my-courses`
- Shows payment status, badges, remaining balance
- Links to course player and payments

**`src/pages/CoursePlayer/CoursePlayer.jsx`** (CRITICAL)
- Interactive course content
- Route: `/courses/:courseId/player`
- Tracks lesson completion
- Creates/updates sessions in real-time
- Calls `recordLessonProgress()` atomically

**`src/pages/Payment/Payment.jsx`** (CRITICAL)
- Payment processing interface
- Route: `/payment/:enrollmentId`
- Shows remaining balance
- Accepts full or partial payments
- Calls atomic `enrollmentServices` functions

**`src/pages/Auth/`**
- `Login.jsx` — User login
- `Register.jsx` — New user signup
- `PasswordReset.jsx` — Forgot password

**`src/pages/Admin/`**
- Admin dashboard and management

**`src/pages/Profile/Profile.jsx`**
- User profile, settings
- Route: `/profile`

**`src/pages/Dashboard/Dashboard.jsx`**
- User dashboard overview

---

### 4. **Context API** (`src/context/`)

Global state management.

**`AuthContext.jsx`**
- Current user info
- Authentication state
- Sign out function
- Used in: Protected routes, header, profile

**`CourseContext.jsx`**
- Current course being viewed
- Course data
- Used in: Course player, course detail

**`ModalContext.jsx`**
- Global modal state
- Used for: Confirmation dialogs, error messages

**`TimerContext.jsx`** (CRITICAL)
- Session timer (break management for driving tests)
- Break duration tracking
- Used in: Course player, compliance tracking

---

### 5. **Custom Hooks** (`src/hooks/`)

Reusable React hooks.

**`useSessionTimer.js`**
- Manages lesson timer and breaks
- Prevents students from skipping required breaks
- Updates session in real-time

**`useBreakManagement.js`**
- Tracks break time usage
- Enforces minimum breaks between lessons

**`useSessionData.js`**
- Fetches session data from Firestore

**`usePVQTrigger.js`**
- Triggers end-of-course assessments

All hooks have corresponding `.test.js` files with comprehensive tests.

---

### 6. **Configuration** (`src/config/`)

Environment and external service configuration.

**`environment.js`**
- Environment variables
- API endpoints
- Feature flags

**`firebase.js`** (CRITICAL)
- Firebase initialization
- Database setup
- Auth configuration
- Exports: `db`, `auth`, `storage`

**`stripe.js`**
- Stripe integration (if used for payments)

---

### 7. **Constants** (`src/constants/`)

Application-wide constants.

**`courses.js`**
- Course data: titles, descriptions, prices, modules
- All 3 courses defined here

**`userRoles.js`**
- Role definitions: admin, instructor, student

**`progressStatus.js`**
- Status constants: completed, in_progress, not_started

**`errorMessages.js`**
- User-facing error messages

**`validationRules.js`**
- Input validation rules (min/max lengths, etc.)

**`appConfig.js`**
- App-wide settings

---

### 8. **Styles** (`src/assets/styles/`)

CSS/SCSS files.

**`global.css`** — Site-wide styles
**`variables.css`** — CSS variables (colors, spacing, fonts)
**`components.css`** — Component-specific styles

---

### 9. **Services** (`src/services/`)

High-level business logic services.

**`loggingService.js`**
- Application event logging
- Error tracking
- User action analytics

---

### 10. **Scripts** (`src/scripts/`)

Database and initialization scripts.

**`initializeDatabase.js`**
- Sets up Firestore collections
- Creates initial documents

**`DbInitializer.js`**
- Database initialization class

---

### 11. **Top-Level App Files**

**`App.jsx`** (CRITICAL)
- Main React component
- Route definitions
- Context providers setup
- Protected route logic
- Layout wrapper

**`index.js`**
- React entry point
- Renders `App` to DOM

**`setupTests.js`**
- Jest test configuration
- Mock setup

---

## Public Assets (`public/`)

### **`public/index.html`** (CRITICAL)
- Main HTML file
- React mounts here (`<div id="root">`)
- Meta tags, title, favicon

### **`public/manifest.json`**
- PWA manifest (if progressive web app enabled)

### **`public/robots.txt`**
- Search engine crawling rules

### **`public/assets/`**
- **`images/`** — Course images, logos, icons
- **`videos/`** — Course video files (.mp4)
  - Note: Large videos in `.gitignore` (stored locally)

---

## Cloud Functions (`functions/`)

Firebase Cloud Functions for backend operations.

### **`functions/index.js`** (34KB - CRITICAL)
- Main Cloud Functions handler
- Exports all functions deployed to Firebase

#### **Key Functions:**

**Payment Processing**
- `processPayment()` — Handle payment webhook
- `recordPayment()` — Atomic payment recording

**Enrollment**
- `createEnrollment()` — New course enrollment
- `completeEnrollment()` — Mark fully paid

**Session Management**
- `recordSession()` — Log user session
- `updateSessionProgress()` — Track progress in real-time

**Compliance**
- `recordComplianceEvent()` — Safety/compliance tracking

**Admin**
- `generateReports()` — Create admin reports
- `backupData()` — Automated backups

### **`functions/package.json`**
- Dependencies: Firebase Admin SDK, Express, etc.

---

## Documentation (`docs/`)

Organized reference documentation.

See `docs/INDEX.md` for full navigation.

### **Key Docs:**

- **`docs/phases/`** — Phase progress (Phase 1 & 2)
- **`docs/testing/`** — Test guides and verification
- **`docs/deployment/`** — Staging and production guides
- **`docs/setup/`** — Setup and architecture
- **`docs/compliance/`** — Compliance features
- **`docs/reference/`** — API and features reference

---

## Configuration Files

### **`package.json`** (CRITICAL)
```json
{
  "name": "fastrack-driving-school-lms",
  "version": "1.0.0",
  "scripts": {
    "start": "react-scripts start",         // Dev server
    "build": "react-scripts build",         // Production build
    "test": "react-scripts test",           // Run Jest tests
    "load-test": "node load-test.js"        // Load testing
  },
  "dependencies": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "firebase": "^9.0.0",
    "stripe": "^12.0.0"
  }
}
```

### **`.gitignore`** (CRITICAL)
- `node_modules/` — npm packages
- `.env` — Environment variables
- `serviceAccountKey.json` — Firebase credentials
- `*.mp4` — Large video files
- `.firebase/` — Firebase emulator files

### **`firebase.json`**
- Firebase project configuration
- Hosting, functions, database settings

### **`firestore.rules`** (CRITICAL)
- Firestore security rules
- Defines who can read/write data
- Prevents unauthorized access

### **`firestore.indexes.json`**
- Firestore query indexes
- Optimizes database queries

### **`.babelrc`**
- Babel transpiler configuration
- JavaScript version compatibility

### **`jest.config.js`**
- Jest testing framework config
- Test paths, coverage, mocks

---

## Testing Structure

### **Unit Tests**

Located with source files (`.test.js` or `__tests__/`):

- **`src/api/enrollment/__tests__/enrollmentServices.concurrent.test.js`**
  - 16 tests for atomic operations
  - ✅ All passing
  - Tests: concurrent payments, duplicate prevention, atomic consistency

- **`src/api/base/__tests__/RetryHandler.test.js`**
  - 31 tests for retry logic
  - ✅ All passing
  - Tests: exponential backoff, max retries, error handling

- **`src/hooks/__tests__/`**
  - Tests for `useSessionTimer`, `useBreakManagement`, etc.
  - ✅ All passing

- **`src/context/TimerContext.test.js`**
  - Timer context tests
  - ✅ All passing

- **`src/services/__tests__/`**
  - Logging service tests
  - ✅ All passing

### **Integration Tests** (Manual)

See `docs/testing/MANUAL_TEST_CASES.md` for 7 complete user flows.

### **Load Tests**

`load-test.js` — Simulates 100 concurrent payments
- ✅ Results: Zero data loss, $1000 total processed correctly

---

## Database Schema

### **Firestore Collections**

**`users/`**
```
users/{userId}
├── uid (string)
├── email (string)
├── displayName (string)
├── role (string: admin, instructor, student)
├── createdAt (timestamp)
└── lastLogin (timestamp)
```

**`enrollments/`**
```
enrollments/{enrollmentId}
├── userId (reference to users)
├── courseId (string)
├── amountPaid (number) ← ATOMIC UPDATE
├── amountDue (number) ← ATOMIC UPDATE
├── status (string: active, completed, cancelled)
├── paymentHistory (array of {amount, date})
├── enrolledAt (timestamp)
└── completedAt (timestamp)
```

**`sessions/`** (Subcollection under users)
```
users/{userId}/sessions/{sessionId}
├── courseId (string)
├── startTime (timestamp)
├── endTime (timestamp)
├── lessonProgress (object)
├── completionEvents (array)
└── timestamp (timestamp) ← Atomic update
```

**`courses/`**
```
courses/{courseId}
├── title (string)
├── description (string)
├── price (number)
├── modules (array)
│   ├── moduleId
│   ├── title
│   └── lessons (array)
│       ├── lessonId
│       ├── title
│       └── content
└── createdAt (timestamp)
```

**`progressTracking/`**
```
progressTracking/{userId}/
├── {courseId}
│   ├── overallProgress (number: 0-100)
│   ├── completedLessons (number)
│   ├── totalLessons (number)
│   ├── moduleProgress (object)
│   └── lastModified (timestamp) ← Atomic update
```

**`complianceSessions/`**
```
users/{userId}/sessions/{sessionId}
├── courseId (string)
├── completionEvents (array: atomic arrayUnion)
│   ├── type (string)
│   ├── moduleId (string)
│   ├── completedAt (timestamp)
│   └── timestamp (timestamp)
```

---

## Key Atomic Operations (Phase 2 Fix)

All database writes are now atomic using `writeBatch()`:

1. **Payment Recording**
   - `enrollmentServices.updateEnrollmentAfterPayment()`
   - Updates: amountPaid, amountDue, status in single transaction

2. **Progress Update**
   - `progressServices.completeModule()`
   - Updates: module status + session in single transaction

3. **Compliance Logging**
   - `complianceServices.recordComplianceEvent()`
   - Updates: compliance events + timestamp in single transaction

**Result:** Zero data loss under concurrent load (verified by load test)

---

## Data Flow Example: Course Payment

```
User clicks "Pay" 
  ↓
PaymentForm.jsx → submitPayment()
  ↓
enrollmentServices.updateEnrollmentAfterPayment()
  ↓
writeBatch() {
  - Update enrollments/{id}.amountPaid
  - Update enrollments/{id}.amountDue
  - Update enrollments/{id}.status
} → batch.commit() [ATOMIC]
  ↓
Database consistent (all or nothing)
  ↓
MyCourses.jsx re-renders with new balance
  ↓
User sees "Paid in Full" badge
```

---

## Environment Variables

Create `.env` in root:

```
REACT_APP_FIREBASE_API_KEY=xxx
REACT_APP_FIREBASE_AUTH_DOMAIN=xxx
REACT_APP_FIREBASE_PROJECT_ID=xxx
REACT_APP_FIREBASE_STORAGE_BUCKET=xxx
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=xxx
REACT_APP_FIREBASE_APP_ID=xxx
REACT_APP_STRIPE_PUBLIC_KEY=xxx (if using Stripe)
```

Never commit `.env` file (added to `.gitignore`)

---

## NPM Scripts

```bash
npm start           # Start dev server (localhost:3000)
npm run build       # Create production build
npm test            # Run Jest tests
npm run load-test   # Run 100 concurrent payment test
npm run seed        # Seed database with test data
```

---

## Deployment Artifacts

After `npm run build`:

```
build/
├── index.html
├── static/
│   ├── js/
│   │   └── main.[hash].js
│   ├── css/
│   │   └── main.[hash].css
│   └── media/
└── manifest.json
```

Deployed to Firebase Hosting by: `firebase deploy --only hosting`

---

## Performance Notes

- **Database Queries:** Indexed on `userId` for fast lookups
- **Atomic Operations:** Prevent race conditions in payments
- **Load Test:** 100 concurrent payments in 944ms
- **Caching:** React Context caches course data to reduce reads

---

## Security

- **Authentication:** Firebase Auth (email/password)
- **Authorization:** Firestore Rules + `authorizationService.js`
- **Credentials:** `serviceAccountKey.json` in `.gitignore`
- **Validation:** Input validated in `src/api/validators/`
- **SSL:** Firebase Hosting enforces HTTPS

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Nov 30, 2025 | Phase 2 complete: atomic operations, zero data loss |
| 0.9.0 | Nov 15, 2025 | Compliance features complete (Phase 1) |
| 0.8.0 | Nov 1, 2025 | Initial scaffold and setup |

---

## Support & Questions

For questions about specific parts:
- **API Layer:** See `docs/reference/API.md`
- **Architecture:** See `docs/setup/ARCHITECTURE.md`
- **Testing:** See `docs/testing/`
- **Deployment:** See `docs/deployment/`

---

**This document is the single source of truth for project structure.**

Last verified: November 30, 2025
