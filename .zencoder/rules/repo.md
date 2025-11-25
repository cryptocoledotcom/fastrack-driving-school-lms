---
description: Repository Information Overview
alwaysApply: true
---

# Fastrack Driving School LMS - Repository Information

## Summary
**Fastrack Driving School LMS** is a comprehensive Learning Management System built with React 18+ and Firebase. It provides course management, enrollment, progress tracking, lesson delivery (video, reading, quiz, test, practical), certificate generation, and role-based access control for students, instructors, and administrators. The system includes a Firebase-based backend with Cloud Functions for compliance reporting and audit logging.

## Repository Structure
This is a **monorepo** with two main components:

- **Frontend** (`src/`): React application with responsive UI, course management, and user dashboard
- **Cloud Functions** (`functions/`): Serverless backend for compliance reporting, data processing, and audit events
- **Configuration**: Firebase setup (Firestore, Auth, Storage) with security rules and deployment configuration
- **Documentation**: Comprehensive guides for setup, architecture, and feature implementation

### Main Directories
- **src/**: React frontend application with components, pages, hooks, context, and utilities
- **functions/**: Node.js Cloud Functions for backend operations
- **public/**: Static assets and HTML entry point
- **config/**: Firebase and environment configuration

## Projects

### Frontend (React Application)
**Configuration File**: `package.json`

#### Language & Runtime
**Language**: JavaScript (JSX)
**Node Version**: 14+ (recommended 18+)
**Runtime Environment**: Browser (React 18+)
**Build System**: Create React App (react-scripts)
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- `react@^18.2.0`: UI framework
- `react-dom@^18.2.0`: React DOM rendering
- `react-router-dom@^6.20.0`: Client-side routing
- `firebase@^10.7.1`: Firebase SDK (Auth, Firestore, Storage)
- `firebase-admin@^13.6.0`: Firebase Admin SDK
- `@stripe/react-stripe-js@^5.4.0`: Stripe payment integration

**Development Dependencies**:
- `react-scripts@5.0.1`: CRA build tooling and development server

#### Build & Installation
```bash
npm install
npm start              # Start development server (localhost:3000)
npm run build         # Build for production
npm test              # Run tests
npm run eject         # Eject from CRA (irreversible)
```

#### Directory Structure
- **components/**: Reusable UI components organized by type (common, layout, admin, payment, scheduling, guards)
- **pages/**: Page-level components (Admin, Dashboard, Auth pages)
- **context/**: React Context providers (Auth, Course, Modal, Timer contexts)
- **api/**: Firebase service functions and API integration
- **hooks/**: Custom React hooks for state and logic
- **utils/**: Utility functions for formatting, validation, data manipulation
- **config/**: Firebase configuration and constants
- **assets/**: Images, styles, and static resources

### Cloud Functions (Backend)
**Configuration File**: `functions/package.json`

#### Language & Runtime
**Language**: JavaScript (Node.js)
**Node Version**: 20
**Runtime**: Google Cloud Functions (2nd gen)
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- `firebase-admin@^12.0.0`: Firebase Admin SDK
- `firebase-functions@^4.5.0`: Cloud Functions framework

**Development Dependencies**:
- `eslint@^8.57.0`: Code quality
- `firebase-functions-test@^3.1.0`: Testing utilities

#### Build & Installation
```bash
cd functions
npm install
npm run serve          # Run local emulator
npm run deploy         # Deploy to Firebase
npm run logs           # View cloud function logs
npm run shell          # Interactive functions shell
```

#### Key Features
- **generateComplianceReport**: Exports course/student compliance data to CSV/JSON/PDF
- **Audit Logging**: Records all compliance-related operations to Firestore
- **Error Handling**: Comprehensive error tracking with structured logging
- **Authentication**: Firebase Auth context integration with dual-path extraction
- **Data Validation**: Metadata filtering and parameter validation

#### Configuration
- **ESLint**: `.eslintrc.js` - Google style guide with ES2018 support
- **Entry Point**: `functions/index.js` (32.6 KB)
- **Predeploy**: Linting and validation before deployment
- **Service Account**: Cloud Function runs under project service account (645776521848-compute@developer.gserviceaccount.com)

## Deployment & Infrastructure

### Firebase Configuration
**File**: `firebase.json`
- **Firestore**: Database in us-east5 region with security rules and custom indexes
- **Functions**: Deployed from `functions/` directory with predeploy linting
- **Hosting**: Web app hosting configuration included

### Storage
- **Default Bucket**: `gs://fastrack-driving-school-lms-default`
- **Purpose**: Stores compliance reports (JSON, CSV, PDF exports)
- **Access**: Restricted to authenticated Cloud Functions service account

### Security & Rules
**File**: `firestore.rules`
- User data: Private per-user access control
- Courses: Public read access for authenticated users
- Admin resources: Restricted to admin role
- Audit logs: Write-only for backend, read-restricted for compliance

### Indexes
**File**: `firestore.indexes.json` - Custom indexes for efficient querying

## Testing & Validation

### Testing Framework
**Frontend**: React Scripts built-in testing (Jest + React Testing Library)
```bash
npm test               # Run frontend tests in watch mode
```

**Backend**: Firebase Functions Test SDK available but not currently configured

### Code Quality
**ESLint** (Backend):
- Google style guide
- ES2018 ECMAScript version
- Required before deployment
```bash
cd functions
npm run lint          # Run ESLint checks
```

## Build & Deployment Commands

```bash
# Frontend Development
npm start             # Start dev server on port 3000

# Frontend Production
npm run build         # Build optimized bundle

# Cloud Functions
npm run deploy        # Deploy all functions to Firebase
firebase deploy --only functions  # Deploy functions only
firebase emulators:start --only functions  # Local testing

# Logs & Monitoring
firebase functions:log  # Stream function logs
firebase functions:shell  # Interactive shell
```

## Key Configuration Files
- **firebase.json**: Firebase project configuration (Firestore, Functions, Hosting)
- **.env**: Environment variables (Firebase credentials, API keys)
- **firestore.rules**: Security rules for database access
- **firestore.indexes.json**: Custom Firestore indexes
- **functions/.eslintrc.js**: Linting rules for backend code

## Main Entry Points
- **Frontend**: `src/index.js` → `src/App.jsx` (React application root)
- **Backend**: `functions/index.js` → Cloud Functions exports
- **Web**: `public/index.html` (HTML entry point for React)

## Architecture Highlights
- **Authentication**: Firebase Auth with email/password and Google OAuth
- **Database**: Firestore with real-time updates and security rules
- **State Management**: React Context API (Auth, Course, Modal, Timer)
- **Styling**: CSS Modules for component-scoped styles
- **Payments**: Stripe integration for course enrollment
- **Audit Trail**: Comprehensive logging of all administrative operations
- **Role-Based Access**: Student, Instructor, and Admin roles with route guards
