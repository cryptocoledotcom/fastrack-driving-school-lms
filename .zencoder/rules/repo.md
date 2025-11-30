---
description: Repository Information Overview
alwaysApply: true
---

# Fastrack Driving School LMS - Repository Information

## Summary
A comprehensive Learning Management System (LMS) built with React 18+ and Firebase for driving school education. Features user authentication, course management, lesson delivery across multiple types (video, reading, quiz, test, practical), real-time progress tracking, session/daily learning time tracking with compliance verification, role-based access control (Student, Instructor, Admin), and certificate generation.

## Structure

**Root-Level Directories:**
- `src/` - Main application source code
- `public/` - Static assets and HTML template
- `build/` - Production build output
- `node_modules/` - Dependencies
- `.zencoder/` - Zencoder IDE configuration
- `functions/` - Firebase Cloud Functions (backend)
- `.vscode/` - VS Code workspace settings

**Key Source Directories:**
- `src/api/` - Firebase service functions (compliance, courses, enrollment, auth, etc.)
- `src/components/` - React components (admin, common, guards, layout, payment, scheduling)
- `src/context/` - React Context providers (Auth, Course, Modal, Timer)
- `src/pages/` - Page components (Auth, CoursePlayer, Dashboard, etc.)
- `src/hooks/` - Custom React hooks
- `src/config/` - Firebase and environment configuration
- `src/constants/` - Application constants
- `src/assets/` - Images, styles, icons
- `src/services/` - Business logic services
- `src/utils/` - Utility functions and validators

## Language & Runtime
**Language**: JavaScript (React/JSX)  
**Runtime**: Node.js 14+  
**Framework**: React 18.2.0  
**Build Tool**: Create React App / react-scripts 5.0.1  
**Package Manager**: npm  
**Backend**: Firebase (Firestore, Authentication, Storage, Cloud Functions)

## Dependencies

**Main Dependencies:**
- `react` (^18.2.0) - UI library
- `react-dom` (^18.2.0) - DOM rendering
- `react-router-dom` (^6.20.0) - Client-side routing
- `firebase` (^10.7.1) - Backend services
- `firebase-admin` (^13.6.0) - Admin SDK
- `@stripe/react-stripe-js` (^5.4.0) - Payment processing

**Development Dependencies:**
- `@testing-library/react` (^16.3.0) - Component testing
- `@testing-library/jest-dom` (^6.9.1) - DOM matchers
- `babel-jest` (^30.2.0) - Jest transformer
- `@babel/preset-react` (^7.28.5) - React preset

**Build Configuration:**
- `.babelrc` - Babel configuration with React and env presets
- `.firebaserc` - Firebase project mapping (default: fastrack-driving-school-lms)

## Build & Installation

**Installation:**
```bash
npm install
```

**Development Server:**
```bash
npm start
```
Runs at http://localhost:3000 with hot reloading.

**Production Build:**
```bash
npm build
```
Compiles to optimized production bundle in `build/` directory.

**Eject (Advanced):**
```bash
npm eject
```
Exposes Create React App configuration for custom setup (irreversible).

## Testing

**Framework**: Jest with React Testing Library  
**Test Configuration File**: `jest.config.js`  
**Setup File**: `src/setupTests.js` - Polyfills for TextEncoder, crypto, ReadableStream  
**Test Timeout**: 30 seconds  
**Test Location**: Alongside source files with `.test.js` extension  
**Environment**: jsdom (browser-like environment)

**Module Aliasing:**
- `@/` maps to `src/`

**Coverage:**
- Includes: `src/**/*.{js,jsx}`
- Excludes: Test files and index.js

**Run Tests:**
```bash
npm test
```
Runs tests in watch mode with Jest.

## Main Entry Points

- **Application Entry**: `src/index.js` - Renders React App into DOM root
- **Main App Component**: `src/App.jsx` - Route configuration and layout
- **Contexts**: 
  - `src/context/AuthContext.jsx` - Authentication state
  - `src/context/TimerContext.jsx` - Learning session timing and compliance
  - `src/context/CourseContext.jsx` - Course data management
  - `src/context/ModalContext.jsx` - Global modal management

- **Key Pages**:
  - `src/pages/CoursePlayer/` - Lesson playback with timer
  - `src/pages/Dashboard/` - User dashboard
  - `src/pages/Courses/` - Course listing and enrollment
  - `src/pages/Auth/` - Authentication pages

## Compliance & Timer System

**Architecture**: User-based subcollections (`users/{userId}/sessions`)  
**Features**:
- Real-time session tracking with atomic batch transactions
- 5-minute heartbeat mechanism for continuous updates
- Page unload handler using navigator.sendBeacon
- Activity-based timer (click, keypress, scroll detection)
- Auto-pause on tab minimize or focus loss
- Inactivity timeout with 5-minute verification modal
- Session deduplication using Promise-based locks

**API Services**: `src/api/compliance/complianceServices.js`

## Environment Configuration

**.env file** contains:
- Firebase credentials (API key, auth domain, project ID, storage bucket, etc.)
- Application metadata (name, version, environment)
- Stripe publishable/secret keys for payments

## Notable Configuration Files

- `jest.config.js` - Test environment setup and path aliasing
- `firestore.rules` - Security rules for data access
- `firestore.indexes.json` - Firestore composite index definitions
- `firebase.json` - Firebase deployment configuration
- `.gitignore` - Git exclusions (node_modules, build, .env, etc.)
