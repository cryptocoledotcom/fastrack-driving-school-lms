---
description: Repository Information Overview
alwaysApply: true
---

# Fastrack Driving School LMS Information

## Summary

Production-ready Learning Management System built with React 18+ and Firebase for managing driving school education. Implements comprehensive course management, Stripe payment processing with flexible split payment options ($99 upfront + $450 remaining), lesson booking/scheduling for behind-the-wheel training, certificate generation, admin panel, and role-based access control. Full-stack application with React frontend and Firebase Cloud Functions backend.

## Structure

```
fastrack-driving-school-lms/
├── functions/                   # Firebase Cloud Functions (Backend)
│   ├── index.js                # Payment & certificate processing
│   └── package.json            # Node.js 20 dependencies
├── public/                      # Static assets
│   ├── assets/
│   ├── index.html
│   └── manifest.json
├── src/                         # React Frontend
│   ├── api/                     # Service modules (10 services)
│   │   ├── authServices.js      # Auth operations
│   │   ├── courseServices.js    # Course CRUD & search
│   │   ├── enrollmentServices.js     # Split payment enrollment
│   │   ├── lessonServices.js    # Lesson content
│   │   ├── moduleServices.js    # Module management
│   │   ├── paymentServices.js   # Stripe integration
│   │   ├── progressServices.js  # Progress tracking
│   │   ├── schedulingServices.js     # Lesson booking
│   │   ├── securityServices.js  # Permissions & audit
│   │   └── userServices.js      # User profiles
│   ├── components/              # React components
│   │   ├── admin/              # Admin dashboard
│   │   ├── payment/            # Payment forms
│   │   ├── scheduling/         # Booking components
│   │   ├── common/             # Reusable UI
│   │   ├── layout/             # Layouts
│   │   └── guards/             # Route protection
│   ├── pages/                  # 18 page components
│   │   ├── Admin/, Auth/, Certificate/, Certificates/
│   │   ├── CourseDetail/, CoursePlayer/, Courses/
│   │   ├── Dashboard/, Home/, Lesson/, MyCourses/
│   │   ├── Profile/, Progress/, Settings/, PaymentSuccess/
│   │   ├── Contact/, About/, NotFound/
│   ├── config/, constants/, context/, hooks/, utils/
│   ├── App.jsx
│   └── index.js
├── package.json                # Frontend dependencies
├── firebase.json               # Firebase config
├── firestore.rules             # Security rules
├── firestore.indexes.json
└── seed.js                     # Database seeding
```

## Language & Runtime

**Frontend**:
- **Language**: JavaScript (ES6+) with JSX
- **Framework**: React 18.2.0
- **Build Tool**: React Scripts 5.0.1
- **Routing**: React Router v6.20.0
- **State Management**: React Context API
- **Payment**: @stripe/react-stripe-js 5.4.0
- **Database Client**: Firebase 10.7.1

**Backend**:
- **Runtime**: Node.js 20
- **Cloud Functions**: firebase-functions 4.5.0
- **Admin SDK**: firebase-admin 12.0.0
- **Payment Processor**: Stripe 14.0.0

## Dependencies

**Main Frontend**:
- `react@^18.2.0` - UI framework
- `react-router-dom@^6.20.0` - Routing
- `react-dom@^18.2.0` - DOM rendering
- `firebase@^10.7.1` - Auth, Firestore, Storage
- `@stripe/react-stripe-js@^5.4.0` - Payment UI
- `react-scripts@5.0.1` - Build and test tools

**Backend (Cloud Functions)**:
- `firebase-functions@^4.5.0` - Function runtime
- `firebase-admin@^12.0.0` - Admin SDK
- `stripe@^14.0.0` - Payment processing

**Dev Dependencies**:
- `firebase-functions-test@^3.1.0` - Function testing
- ESLint configuration for both frontend and backend

## Build & Installation

**Frontend Installation & Development**:
```bash
npm install
npm start          # Development server (localhost:3000)
npm run build      # Production build
npm test           # Run tests
```

**Cloud Functions Deployment**:
```bash
cd functions
npm install
npm run serve      # Local emulator
npm run deploy     # Deploy to Firebase
npm run logs       # View function logs
```

## Main Files & Resources

**Frontend Entry Points**:
- `src/index.js` - Bootstrap React app
- `src/App.jsx` - Main routing and layout (7.49 KB)

**API Services** (10 modules in `src/api/`, 10 service files):
- `authServices.js` - Email/password auth, Google OAuth, password reset
- `userServices.js` - User profiles, preferences, role management
- `courseServices.js` - Course CRUD, search, filtering, modules
- `lessonServices.js` - Lesson content, video, reading, quiz, test
- `moduleServices.js` - Module management and ordering
- `enrollmentServices.js` - Enrollment states, split payment tracking ($99 + $450)
- `paymentServices.js` - Stripe payment operations, payment tracking
- `progressServices.js` - Progress calculation, time tracking, completion
- `schedulingServices.js` - Behind-the-wheel time slots, student bookings
- `securityServices.js` - Access verification, role checks, audit logging

**Cloud Functions** (`functions/index.js`, 15.16 KB):
- `createCheckoutSession()` - Stripe checkout for split/full payments
- `createPaymentIntent()` - Direct payment processing
- `stripeWebhook()` - Webhook handler for payment events (payment_intent.succeeded, failed, etc.)
- `generateCertificate()` - Certificate generation after full payment
- Helper functions: `handleCheckoutSessionCompleted`, `handlePaymentIntentSucceeded`, `handlePaymentIntentFailed`, `updateEnrollmentAfterPayment`

**Page Components** (18 total in `src/pages/`):
- **Auth**: LoginPage, RegisterPage, ForgotPasswordPage
- **Courses**: Courses (browse), CourseDetail (info), CoursePlayer (learning interface)
- **Dashboard**: Dashboard, Home, About, Contact
- **User**: Profile (edit info), Settings (preferences, dark mode, notifications)
- **Learning**: Lesson (individual lessons), Progress (tracking), MyCourses (enrolled)
- **Management**: Admin (admin panel), Certificate, Certificates (download)
- **Payment**: PaymentSuccess (confirmation)
- **Errors**: NotFound

**Configuration Files**:
- `firebase.json` - Firebase project config
- `firestore.rules` - Firestore security rules (1.97 KB)
- `firestore.indexes.json` - Composite indexes
- `.env` - Environment variables (Firebase keys, Stripe keys)

## Key Features

**Payment System**:
- Full upfront payment ($549)
- Split payment ($99 upfront + $450 remaining balance)
- Remaining balance payment option
- Stripe integration with secure checkout
- Payment webhook processing with automatic status updates
- PCI-DSS compliance (Stripe handles card data)
- Transaction audit trail and receipts

**Enrollment Management**:
- Enrollment states: PENDING, PARTIALLY_PAID, ACTIVE, COMPLETED, SUSPENDED
- Automatic enrollment to Complete Package (covers online + behind-the-wheel)
- Payment history tracking
- Status transitions based on payment completion
- Course access unlocking at different payment stages

**Lesson Scheduling (Behind-the-Wheel)**:
- Admin time slot creation with batch capabilities
- Student booking interface with conflict detection
- Instructor assignment and load balancing
- Automated confirmation and reminder emails
- Cancellation handling with rescheduling
- Calendar view and time picker

**Certificate Generation**:
- Auto-trigger after full payment and course completion
- PDF generation via Cloud Functions
- Certificate numbering and archival
- Download and storage in MyCourses
- Triggers remaining balance payment completion

**Admin Panel**:
- User management (create, edit, role assignment, deactivate)
- Payment monitoring and split payment tracking
- Lesson scheduling administration and booking oversight
- Enrollment and course access control
- Audit logging of administrative actions
- System health monitoring

**Authentication & Access Control**:
- Email/password registration and login
- Google OAuth single sign-on
- Password reset via email
- Email verification workflow
- Role-based access control (Student, Instructor, Admin)
- Protected routes and route guards
- Session management

**User Experience**:
- Dark mode with system detection and manual toggle
- Responsive design (mobile, tablet, desktop)
- Progress tracking with completion percentages
- Time tracking (session and daily aggregation)
- Toast notifications and modal dialogs
- Keyboard navigation and accessibility features
- WCAG AA color contrast compliance

**Search & Filtering**:
- Course search by name and description
- Multi-criteria filtering (difficulty, duration, price, instructor)
- Sorting (popularity, newest, price)
- Admin filtering for enrollments, payments, users, time slots

## Testing

**Frontend Testing**:
- Test framework: Jest (via React Scripts)
- Configuration: ESLint in `src/` directory
- Run command: `npm test`
- Test naming: Standard `.test.js` and `.spec.js` files

**Backend Testing**:
- Framework: `firebase-functions-test@^3.1.0`
- Configuration: `functions/.eslintrc.js`
- Linting: `npm run lint` (functions)

## Environment Configuration

**.env File**:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

**Cloud Functions Secrets**:
- `STRIPE_SECRET_KEY` - Stripe API secret (managed via Firebase Secret Manager)

**Firestore Collections**:
- `users` - User profiles and preferences
- `courses` - Course information and metadata
- `modules` - Course modules with ordering
- `lessons` - Individual lessons with content
- `progress` - Student progress tracking
- `enrollments` - Enrollment records with payment status
- `payments` - Payment transactions and history
- `certificates` - Generated certificates
- `timeSlots` - Behind-the-wheel lesson time slots
- `bookings` - Student lesson bookings
- `auditLogs` - Administrative action tracking

## Deployment

**Frontend**:
- Build: `npm run build`
- Deploy to Firebase Hosting: `firebase deploy --only hosting`

**Backend**:
- Deploy Cloud Functions: `firebase deploy --only functions`
- Emulator for local testing: `npm run serve` (in functions directory)
- Secret setup: `firebase functions:config:set stripe.secret_key=...`

## Documentation

- **README.md** - Project overview and setup guide
- **FEATURES.md** - Comprehensive feature documentation (17.79 KB)
- **API.md** - Service module API documentation (18.31 KB)
- **ARCHITECTURE.md** - System architecture and design (10.9 KB)
- **IMPLEMENTATION_SUMMARY.md** - Recent implementation details (11.16 KB)
- **SETUP_GUIDE.md** - Installation and configuration steps (6.94 KB)
- **PROJECT_SUMMARY.md** - Project specifications (9.39 KB)
