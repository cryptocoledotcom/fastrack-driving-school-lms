---
description: Repository Information Overview
alwaysApply: true
---

# Fastrack Driving School LMS Information

## Summary

A production-ready Learning Management System (LMS) built with React 18+ and Firebase for managing driving school education. The system features comprehensive course management, user authentication with role-based access control, progress tracking, and certificate generation. The frontend is a single-page React application with responsive design, supporting students, instructors, and administrators.

## Structure

```
fastrack-driving-school-lms/
├── public/                      # Static assets and HTML
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── src/                         # Main source code
│   ├── api/                     # Firebase API service functions
│   │   ├── authServices.js
│   │   ├── courseServices.js
│   │   ├── lessonServices.js
│   │   ├── moduleServices.js
│   │   ├── progressServices.js
│   │   ├── userServices.js
│   │   └── securityServices.js
│   ├── assets/                  # Images, icons, and global styles
│   ├── components/              # Reusable UI components
│   │   ├── common/              # Button, Card, Input, Modal, etc.
│   │   ├── layout/              # MainLayout, DashboardLayout, AuthLayout
│   │   └── guards/              # ProtectedRoute, PublicRoute, RoleBasedRoute
│   ├── config/                  # Firebase and environment configuration
│   ├── constants/               # App constants and configurations
│   ├── context/                 # React Context providers (CourseContext, TimerContext)
│   ├── pages/                   # Page components (13 main pages)
│   ├── App.jsx                  # Main application component
│   └── index.js                 # Application entry point
├── package.json                 # Dependency configuration
├── seed.js                      # Database seeding script
├── README.md                    # Project documentation
├── SETUP_GUIDE.md              # Setup instructions
└── PROJECT_SUMMARY.md          # Project overview
```

**Main Components**:
- **13 Page Components**: Home, Dashboard, Courses, MyCourses, CourseDetail, CoursePlayer, Lesson, Progress, Certificates, Profile, Settings, Contact, About, NotFound, Plus Auth pages (Login, Register, ForgotPassword)
- **Layout Components**: Three distinct layouts for public, authenticated dashboard, and authentication pages
- **API Services**: Seven service modules for authentication, courses, lessons, modules, progress, users, and security
- **UI Components**: 15+ reusable components including modals, buttons, forms, progress bars, and notifications
- **Context Providers**: CourseContext and TimerContext for state management

## Language & Runtime

**Language**: JavaScript (ES6+) with JSX
**Frontend Framework**: React 18.2.0
**Runtime**: Node.js 14+ (npm)
**Build Tool**: React Scripts 5.0.1
**Routing**: React Router v6.20.0

## Dependencies

**Main Dependencies**:
- `react@^18.2.0` - UI library and component framework
- `react-dom@^18.2.0` - React DOM rendering
- `react-router-dom@^6.20.0` - Client-side routing and navigation
- `firebase@^10.7.1` - Firebase SDK for frontend (Authentication, Firestore, Storage)
- `firebase-admin@^13.6.0` - Firebase Admin SDK for backend operations
- `react-scripts@5.0.1` - Build scripts and configuration for Create React App

## Build & Installation

**Installation**:
```bash
npm install
```

**Development Server**:
```bash
npm start
```
Starts development server at `http://localhost:3000` with hot reloading.

**Production Build**:
```bash
npm run build
```
Creates optimized production build in `build/` directory.

**Available Scripts**:
- `npm start` - Run development server
- `npm test` - Run test suite (React Scripts)
- `npm run build` - Build for production
- `npm run eject` - Eject from Create React App (irreversible)

## Main Files & Resources

**Entry Points**:
- `src/index.js` - Application bootstrap and root render
- `src/App.jsx` - Main application component with routing configuration

**Configuration Files**:
- `src/config/firebase.js` - Firebase initialization and configuration
- `src/config/environment.js` - Environment-specific settings
- `src/constants/appConfig.js` - Application configuration constants
- `src/constants/routes.js` - Route definitions and paths
- `package.json` - Project metadata and dependency declarations

**API Services** (in `src/api/`):
- `authServices.js` - Authentication operations (login, register, logout, password reset)
- `courseServices.js` - Course CRUD operations and enrollment
- `lessonServices.js` - Lesson management and retrieval
- `moduleServices.js` - Module operations within courses
- `progressServices.js` - Student progress tracking and updates
- `userServices.js` - User profile and preference management
- `securityServices.js` - Security and authorization checks

**Key Constants** (in `src/constants/`):
- `userRoles.js` - Role definitions (Student, Instructor, Admin)
- `lessonTypes.js` - Lesson type constants
- `progressStatus.js` - Progress tracking status constants
- `validationRules.js` - Form validation rules
- `errorMessages.js` - Application error messages
- `successMessages.js` - Success notification messages

## Project Statistics

- **Total Components**: 30+
- **Page Components**: 13 main pages + 3 auth pages
- **Reusable UI Components**: 15+
- **API Service Modules**: 7
- **Context Providers**: 2
- **Lines of Code**: 5,000+
- **Files Created**: 100+

## Features Implemented

**Authentication & Authorization**:
- Email/Password authentication
- Google OAuth integration
- Password reset functionality
- Role-based access control (Student, Instructor, Admin)
- Protected routes with guards

**Course Management**:
- Course browsing and discovery
- Course enrollment with progress tracking
- Module and lesson organization
- Multiple lesson types (video, reading, quiz, test, practical)
- Course search and filtering

**User Dashboard & Profiles**:
- Personalized dashboard with statistics
- Enrolled courses overview
- User profile customization
- Preference management

**Progress & Learning Tracking**:
- Real-time progress monitoring
- Lesson completion tracking
- Module completion metrics
- Session time tracking
- Daily learning time statistics
- Overall course progress percentage

**Additional Features**:
- Certificate generation and download
- Responsive design for all screen sizes
- Toast notifications and modal system
- Loading states and error handling
- Accessible components with ARIA labels

## Environment Configuration

The application uses environment variables for Firebase configuration. Create a `.env` file in the root directory with:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Styling

- **CSS Methodology**: CSS Modules for component-scoped styling
- **Global Styles**: Located in `src/assets/styles/`
- **Theme**: Centralized theme and animation definitions
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox

## State Management

- **Primary Method**: React Context API with custom hooks
- **Context Providers**: 
  - `CourseContext` - Course and enrollment state
  - `TimerContext` - Session and learning time tracking

## Development Workflow

**Getting Started**:
1. Clone repository
2. Run `npm install` to install dependencies
3. Configure Firebase credentials in `.env` file
4. Run `npm start` to start development server
5. Open `http://localhost:3000` in browser

**Development Server Features**:
- Hot module reloading
- Source maps for debugging
- Console error overlay
- Fast refresh capability
