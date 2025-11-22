---
description: Repository Information Overview
alwaysApply: true
---

# Fastrack Driving School LMS Information

## Summary

A production-ready Learning Management System (LMS) built with React 18+ and Firebase for managing driving school education. Implements comprehensive course management, Stripe payment processing with split payment arrangements, lesson booking/scheduling for behind-the-wheel training, certificate generation, admin panel, and role-based access control. Full-stack application with React frontend and Firebase Cloud Functions backend.

## Structure

```
fastrack-driving-school-lms/
├── functions/                   # Firebase Cloud Functions (Backend)
│   ├── index.js                # Payment & certificate processing functions
│   └── package.json            # Node.js 20 dependencies
├── public/                      # Static assets
├── src/                         # React Frontend
│   ├── api/                     # Service modules (10 services)
│   │   ├── authServices.js
│   │   ├── courseServices.js
│   │   ├── enrollmentServices.js     # NEW: Split payment enrollment
│   │   ├── paymentServices.js        # NEW: Stripe integration
│   │   ├── schedulingServices.js     # NEW: Lesson booking
│   │   ├── lessonServices.js
│   │   ├── moduleServices.js
│   │   ├── progressServices.js
│   │   ├── userServices.js
│   │   └── securityServices.js
│   ├── components/
│   │   ├── admin/              # NEW: Admin dashboard components
│   │   ├── payment/            # NEW: Payment forms & modals
│   │   ├── scheduling/         # NEW: Lesson booking components
│   │   ├── common/             # Reusable UI components
│   │   ├── layout/             # Page layouts
│   │   └── guards/             # Route guards
│   ├── pages/                  # 18 page components
│   │   ├── Admin/              # NEW: Admin panel
│   │   ├── Certificate/        # NEW: Certificate generation
│   │   ├── Courses/
│   │   ├── CoursePlayer/
│   │   ├── Dashboard/
│   │   └── ... (other pages)
│   └── config/, constants/, context/
├── package.json                # Frontend dependencies
└── (config files and docs)
```

## Language & Runtime

**Frontend**:
- **Language**: JavaScript (ES6+) with JSX
- **Framework**: React 18.2.0
- **Build Tool**: React Scripts 5.0.1
- **Routing**: React Router v6.20.0
- **Payment**: Stripe (@stripe/react-stripe-js 5.4.0)

**Backend**:
- **Runtime**: Node.js 20
- **Firebase Functions**: v4.5.0
- **Firebase Admin**: v12.0.0 (functions), v13.6.0 (frontend)
- **Stripe**: v14.0.0

## Dependencies

**Main Frontend**:
- `react@^18.2.0` - UI framework
- `react-router-dom@^6.20.0` - Routing
- `firebase@^10.7.1` - Auth, Firestore, Storage
- `@stripe/react-stripe-js@^5.4.0` - Payment processing

**Backend (Cloud Functions)**:
- `firebase-functions@^4.5.0` - Function runtime
- `firebase-admin@^12.0.0` - Admin SDK
- `stripe@^14.0.0` - Payment processing

## Build & Installation

**Frontend**:
```bash
npm install
npm start          # Development server at localhost:3000
npm run build      # Production build
```

**Cloud Functions**:
```bash
cd functions
npm install
npm run serve      # Local emulator
npm run deploy     # Deploy to Firebase
```

## Main Files & Resources

**Frontend Entry**:
- `src/index.js` - Bootstrap application
- `src/App.jsx` - Routing and layout

**API Services** (10 modules in `src/api/`):
- `enrollmentServices.js` - Enrollment with split payments ($99 upfront, $450 balance)
- `paymentServices.js` - Stripe integration and payment status tracking
- `schedulingServices.js` - Lesson booking and time slot management
- `authServices.js`, `courseServices.js`, `lessonServices.js`, `progressServices.js`, `userServices.js`, `moduleServices.js`, `securityServices.js`

**Cloud Functions** (`functions/index.js`):
- `createCheckoutSession` - Stripe checkout for split/full payments
- `createPaymentIntent` - Direct payment processing
- `stripeWebhook` - Webhook handler for payment events
- `generateCertificate` - Certificate PDF generation

**Pages** (18 total):
- `Admin/AdminPage.jsx` - Admin dashboard (user management, payments, scheduling)
- `Certificate/CertificateGenerationPage.jsx` - Certificate generation interface
- `Courses/`, `CoursePlayer/`, `Dashboard/`, `MyCourses/`, `Profile/`, `Settings/`, plus Auth pages

## Key Features

**Payment System**:
- Stripe integration with split payment option ($99 upfront + $450 remaining)
- Multiple payment types: upfront, split, remaining balance
- Complete payment flow tracking and audit logging

**Lesson Scheduling** (Behind-the-Wheel):
- Time slot creation and availability management
- Student lesson booking with conflict detection
- Admin scheduling interface with booking history
- Automated confirmation and reminder workflow

**Certificate Generation**:
- Auto-trigger after full payment and lesson completion
- PDF generation via Cloud Functions
- Download and archive management in MyCourses

**Admin Panel**:
- User management and role assignment
- Payment monitoring and split payment tracking
- Lesson scheduling administration
- Enrollment and course access control

**Authentication**:
- Email/password and Google OAuth
- Role-based access (Student, Instructor, Admin)
- Protected routes with guards

## Environment Configuration

**.env** file (Firebase + Stripe):
```
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_STRIPE_PUBLIC_KEY=...
```

**Firestore Security Rules**: `firestore.rules`
**Indexes**: `firestore.indexes.json`
