---
description: Repository Information Overview
alwaysApply: true
---

# Fastrack Driving School LMS - Repository Information

## Summary

Fastrack is a comprehensive Learning Management System (LMS) for driving school education. It features a React-based frontend with a Firebase backend, enabling course enrollment, payment processing, lesson management, progress tracking, time tracking, and certificate generation with DMV compliance support.

## Repository Structure

**Main Directories**:
- **src/**: React frontend application with pages, components, services, context, and utilities
- **functions/**: Firebase Cloud Functions backend with payment processing and certificate generation
- **public/**: Static assets (HTML, manifest, robots.txt)
- **.zencoder/**: Documentation and rules for development
- **Root**: Configuration files (Firebase, ESLint, environment files)

**Architecture**: Multi-tier system with React SPA frontend, Firebase Firestore database, and serverless backend functions.

## Projects

### Frontend - React 18+ Application

**Configuration File**: `package.json` (root)

#### Language & Runtime
**Language**: JavaScript/JSX
**Version**: Node.js 22.20.0, npm 10.9.3
**Build System**: Create React App (react-scripts 5.0.1)
**Package Manager**: npm

#### Dependencies

**Main Dependencies**:
- **react** (^18.2.0): UI library for building components
- **react-dom** (^18.2.0): DOM rendering for React
- **react-router-dom** (^6.20.0): Client-side routing and navigation
- **firebase** (^10.7.1): Firebase SDK for authentication, Firestore, Storage
- **firebase-admin** (^13.6.0): Firebase Admin SDK for backend operations
- **@stripe/react-stripe-js** (^5.4.0): Stripe payment integration

**Development Dependencies**:
- **react-scripts** (5.0.1): Build scripts and webpack configuration

#### Build & Installation

```bash
npm install
npm start              # Start development server (http://localhost:3000)
npm run build          # Build for production
npm test               # Run tests
npm run eject          # Eject from Create React App
```

#### Main Structure

**Pages** (20 components): Home, Dashboard, Courses, MyCourses, CourseDetail, CoursePlayer, Admin, Certificates, Profile, Settings, PaymentSuccess, NotFound, and more

**Components**:
- **common/**: Button, Card, Input, Select, Modal, ProgressBar, Badge, LoadingSpinner, Tooltip
- **layout/**: MainLayout, DashboardLayout, AuthLayout, Header, Sidebar, Footer
- **guards/**: ProtectedRoute, RoleBasedRoute, PublicRoute
- **payment/**: CheckoutForm, PaymentModal, EnrollmentCard
- **scheduling/**: LessonBooking, UpcomingLessons
- **admin/**: SchedulingManagement and admin-specific utilities

**Services** (13 modules):
- **authServices.js**: Authentication (login, register, logout, OAuth)
- **courseServices.js**: Course CRUD and retrieval
- **enrollmentServices.js**: Enrollment lifecycle and payment states
- **paymentServices.js**: Stripe integration and payment tracking
- **lessonServices.js**, **moduleServices.js**, **progressServices.js**: Lesson and progress management
- **schedulingServices.js**: Time slot management and booking
- **userServices.js**, **quizServices.js**, **pvqServices.js**: User and assessment management
- **complianceServices.js**: DMV compliance and audit logging
- **securityServices.js**: Authorization and access control

**Context** (4 providers):
- **AuthContext**: Authentication state and user data
- **CourseContext**: Course selections and enrollments
- **TimerContext**: Session and daily learning time tracking
- **ModalContext**: Global modal management

---

### Firebase Cloud Functions (Node.js 20)

**Configuration File**: `functions/package.json`

#### Language & Runtime
**Language**: JavaScript
**Node.js Version**: 20
**Package Manager**: npm
**Main Entry**: `functions/index.js` (22.81 KB)

#### Dependencies

**Main Dependencies**:
- **firebase-functions** (^4.5.0): Firebase Cloud Functions runtime
- **firebase-admin** (^12.0.0): Firebase Admin SDK for database operations
- **@google-cloud/logging** (^10.0.0): Cloud Logging integration for audit trails
- **stripe** (^14.0.0): Stripe API client for payment processing

**Development Dependencies**:
- **firebase-functions-test** (^3.1.0): Testing utilities for Cloud Functions

**Development Tool**:
- **ESLint** (.eslintrc.js): Code linting and quality checks

#### Build & Installation

```bash
npm run lint              # Run ESLint checks (predeploy hook)
npm run serve             # Start Firebase emulator (functions only)
npm run shell             # Interactive Firebase functions shell
npm run start             # Start shell
npm run deploy            # Deploy to Firebase
npm run logs              # View live function logs
```

#### Main Functions

**Payment Processing**:
- `createCheckoutSession()`: Stripe checkout session creation
- `createPaymentIntent()`: Payment intent for split/remaining payments
- `stripeWebhook()`: Webhook handler for Stripe events

**Certificate Generation**:
- `generateCertificate(userId, courseId)`: PDF certificate creation and upload

**Audit Logging**:
- `logAuditEvent()`: Helper function for audit trail logging
- `auditComplianceAccess()`: Callable function for compliance access tracking

#### Configuration
**Firebase Config**: `firebase.json`
- Firestore location: us-east5
- Rules file: `firestore.rules`
- Predeploy: ESLint validation before deployment
- Ignores: node_modules, .git, logs

---

## Firestore Database & Rules

**Database Location**: us-east5  
**Rules File**: `firestore.rules` (5.55 KB)  
**Indexes**: `firestore.indexes.json`

### Collections

- **users**: User profiles (uid, email, role, displayName)
- **courses**: Course metadata (title, description, modules, lessons)
- **modules**: Course organization and progression
- **lessons**: Individual lesson content (video, reading, quiz, test)
- **enrollments**: User enrollment state with payment tracking
- **payments**: Payment transaction records with Stripe metadata
- **timeSlots**: Behind-the-wheel lesson scheduling
- **progress**: User lesson completion and learning time
- **certificates**: Generated certificate metadata
- **auditLogs**: Immutable compliance audit trail (Phase 2)
- **complianceLogs**: Compliance verification records (Phase 2)
- **quizAttempts**, **identityVerifications**, **complianceSessions**: Compliance data (Phase 2)

### Security Rules

- **Users**: Read own data, admins read all
- **Courses/Modules/Lessons**: Read all, write restricted to admins/instructors
- **Enrollments/Progress**: Users access own data, admins read all
- **Audit Collections**: Admin-read-only with immutability enforcement
- **Role-Based Access**: STUDENT, INSTRUCTOR, ADMIN role hierarchy

---

## Build & Deployment

### Local Development

```bash
npm install                    # Install frontend dependencies
cd functions && npm install    # Install function dependencies
npm start                      # Start frontend dev server (port 3000)
cd functions && npm run serve  # Start emulator in separate terminal
```

### Production Deployment

```bash
firebase deploy --only firestore:rules    # Deploy Firestore rules
firebase deploy --only functions          # Deploy Cloud Functions
npm run build                             # Build optimized frontend
firebase deploy --only hosting            # Deploy static frontend
```

### Pre-deployment Validation

```bash
firebase deploy --dry-run                 # Validate deployment
cd functions && npm run lint              # ESLint checks
node -c functions/index.js                # Syntax validation
```

---

## Environment Configuration

**Environment Variables** (`.env`):
- REACT_APP_FIREBASE_API_KEY
- REACT_APP_FIREBASE_AUTH_DOMAIN
- REACT_APP_FIREBASE_PROJECT_ID
- REACT_APP_FIREBASE_STORAGE_BUCKET
- REACT_APP_FIREBASE_MESSAGING_SENDER_ID
- REACT_APP_FIREBASE_APP_ID

---

## Key Features

- **Authentication**: Email/password and Google OAuth via Firebase Auth
- **Course Management**: Browse, enroll, track progress in courses
- **Lesson System**: Video, reading, quiz, test, practical lesson types
- **Progress Tracking**: Real-time monitoring with statistics
- **Time Tracking**: Session and daily learning time for behind-the-wheel lessons
- **Payment Processing**: Stripe integration with split payment support ($99 initial, $450 remaining)
- **Certificate Generation**: PDF generation and download after course completion
- **User Roles**: Student, Instructor, Admin with role-based access control
- **Scheduling**: Time slot management for behind-the-wheel instruction
- **Compliance**: DMV audit logging and immutable compliance records (Phase 2)

---

## Technology Stack Summary

**Frontend**: React 18, React Router 6, Firebase SDK, Stripe.js, CSS Modules  
**Backend**: Firebase Cloud Functions (Node.js 20), Firebase Admin SDK, Google Cloud Logging  
**Database**: Firestore (NoSQL)  
**Authentication**: Firebase Authentication (Email, Google OAuth)  
**Storage**: Firebase Cloud Storage (certificates, media)  
**Payment**: Stripe API  
**Deployment**: Firebase Hosting, Cloud Functions  
**Code Quality**: ESLint, react-scripts build optimization
