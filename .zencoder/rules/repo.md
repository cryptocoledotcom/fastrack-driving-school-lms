---
description: Repository Information Overview
alwaysApply: true
---

# Fastrack Learning Management System

## Summary

A comprehensive Learning Management System (LMS) for Fastrack Driving School built with React 18 and Firebase. Features include authentication, course management, progress tracking, time tracking, certificate generation, and role-based access control (student, instructor, admin). Payment integration with Stripe for course enrollment.

## Repository Structure

This is a **monorepo** containing two main projects:

### Main Repository Components
- **React Frontend** (`src/`): React 18 SPA with Firestore integration, course management, student progress tracking, payment processing
- **Firebase Cloud Functions** (`functions/`): Node.js 20 serverless backend for PDF certificate generation, payment processing, compliance reporting
- **Public Assets** (`public/`): Static HTML and assets for React build
- **Configuration Files**: Firebase config, Firestore rules, ESLint configs
- **Documentation**: README, admin panel docs, seed data script

## Projects

### Frontend - React Learning Management System

**Configuration File**: `package.json`

#### Language & Runtime
**Language**: JavaScript (React JSX)  
**React Version**: ^18.2.0  
**Node.js**: 14+ (recommended 18+)  
**Build Tool**: Create React App (react-scripts 5.0.1)  
**Router**: React Router v6 (^6.20.0)

#### Dependencies
**Main Dependencies**:
- `react` (^18.2.0) - UI framework
- `react-dom` (^18.2.0) - React DOM rendering
- `react-router-dom` (^6.20.0) - Client-side routing
- `firebase` (^10.7.1) - Firebase SDK (auth, Firestore, storage)
- `@stripe/react-stripe-js` (^5.4.0) - Stripe payment integration
- `firebase-admin` (^13.6.0) - Admin SDK for server operations

**Development Dependencies**:
- `@testing-library/react` (^16.3.0) - React component testing
- `@testing-library/jest-dom` (^6.9.1) - Jest DOM matchers
- `babel-jest` (^30.2.0) - Babel transformer for Jest
- `@babel/preset-react` (^7.28.5) - Babel React preset

#### Build & Installation

```bash
npm install
npm start                    # Start dev server (localhost:3000)
npm run build                # Production build
npm test                     # Run tests in watch mode
npm run load-test            # Performance load testing
npm run eject                # Eject from CRA (irreversible)
```

#### Entry Points
**Main**: `src/index.js` - React app entry point  
**App**: `src/App.jsx` - Main application component  
**HTML**: `public/index.html` - HTML template

#### Key Application Structure
- **api/**: Firebase service layer (auth, courses, enrollment, compliance, progress, payment, security, student management)
- **components/**: Reusable UI components (common, layout, guards, admin, payment, scheduling)
- **context/**: Global state management (AuthContext, CourseContext, ModalContext, TimerContext)
- **hooks/**: Custom React hooks for form validation, timer management, etc.
- **pages/**: Route pages (landing, dashboard, courses, enrollment, admin, etc.)
- **utils/**: Helper functions (error handling, Firestore utilities, timestamp management, validation)
- **assets/**: Styles, images, icons
- **config/**: Firebase configuration

#### Testing

**Framework**: Jest with React Testing Library  
**Test Location**: `src/**/__tests__/` directories  
**Configuration**: `jest.config.js` with jsdom environment  
**Setup File**: `src/setupTests.js`  
**Naming Convention**: `*.test.js` or `*.test.jsx`  
**Test Timeout**: 30 seconds

**Run Tests**:

```bash
npm test                     # Interactive watch mode
npm test -- --coverage       # With coverage report
npm test -- --passWithNoTests
```

**Key Test Files**:
- `src/api/base/__tests__/` - CacheService, QueryHelper, RetryHandler, ServiceBase tests
- `src/api/enrollment/__tests__/` - Enrollment and concurrent operation tests
- `src/api/utils/__tests__/` - Error handling, Firestore, timestamp, validation utilities
- `src/api/errors/__tests__/` - API error handling tests

#### Environment Variables

Create `.env` file with Firebase and Stripe credentials:
```
REACT_APP_FIREBASE_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN
REACT_APP_FIREBASE_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID
REACT_APP_STRIPE_PUBLISHABLE_KEY
REACT_APP_STRIPE_SECRET_KEY
```

---

### Backend - Firebase Cloud Functions

**Configuration File**: `functions/package.json`

#### Language & Runtime
**Language**: JavaScript (Node.js)  
**Node.js Version**: 20  
**Runtime**: Firebase Cloud Functions  
**Main Entry**: `functions/index.js`

#### Dependencies
**Main Dependencies**:
- `firebase-functions` (^4.5.0) - Firebase Functions SDK
- `firebase-admin` (^12.0.0) - Firebase Admin SDK
- `stripe` (^14.0.0) - Stripe API for payment processing
- `pdfkit` (^0.17.2) - PDF generation for certificates
- `cors` (^2.8.5) - CORS middleware
- `@google-cloud/logging` (^10.0.0) - Google Cloud logging

**Development Dependencies**:
- `firebase-functions-test` (^3.1.0) - Firebase Functions testing

#### Build & Deployment

```bash
cd functions
npm install
npm run lint               # Run ESLint
npm run serve             # Local Firebase emulator
npm run deploy            # Deploy to Firebase
npm run logs              # View Cloud Functions logs
npm start                 # Interactive shell
```

---

## Firebase Configuration

**Project ID**: `fastrack-driving-school-lms`  
**Auth Domain**: `fastrack-driving-school-lms.firebaseapp.com`  
**Storage Bucket**: `fastrack-driving-school-lms.firebasestorage.app`

### Firestore Collections Structure

- **users**: User profiles with role-based access (student, instructor, admin)
- **courses**: Course metadata, descriptions, enrollment counts
- **modules**: Course modules organized with ordering
- **lessons**: Individual lesson content (video, reading, quiz, test, practical)
- **progress**: Student progress tracking with per-lesson and per-module granularity
- **enrollments**: Course enrollment records with payment status
- **compliance**: Compliance tracking and reporting data
- **schedules**: Lesson scheduling and availability
- **payments**: Payment transaction history and Stripe integration

**Security**: Firestore rules configured in `firestore.rules` with role-based read/write permissions.

---

## Feature Highlights

- **Authentication**: Email/password and Google OAuth via Firebase Auth
- **Course Management**: Browse, search, enroll in courses with multiple lesson types
- **Progress Tracking**: Real-time progress updates with session and daily time tracking
- **Certificates**: PDF certificate generation on course completion (via Cloud Functions)
- **Payment Processing**: Stripe integration for course enrollment payments
- **Admin Panel**: Compliance reporting and scheduling management
- **Role-Based Access**: Granular permissions for students, instructors, and admins
- **Responsive UI**: CSS Modules with mobile-first design
- **Error Handling**: Comprehensive error boundaries and user feedback
- **State Management**: React Context API for global state (auth, courses, modals, timers)

---

## Development Workflow (TDD)

1. Write tests first in `src/**/__tests__/` directories
2. Implement functionality to pass tests
3. Run `npm test` to verify coverage and passing tests
4. Build with `npm run build` for production
5. Test staging deployment before production release

---

## Key Files Reference

- `src/index.js` - React entry point
- `src/App.jsx` - Main app router and layout
- `src/api/` - All Firebase service integrations
- `jest.config.js` - Jest configuration with jsdom and path aliases
- `firebase.json` - Firebase project configuration
- `firestore.rules` - Firestore security rules
- `.env` - Environment variables (local development)
- `functions/index.js` - Cloud Functions entry point
