# Fastrack LMS Architecture

## System Overview

**Fastrack** is a **full-stack Learning Management System** with a React frontend and Firebase Cloud Functions backend. The architecture separates concerns into client-side rendering, real-time data synchronization, and serverless backend processing.

```
┌─────────────────────────────────────────────────────────────┐
│                    React 18 Frontend                        │
│  (Browser - SPA with client-side routing and state)         │
└──────────────────┬──────────────────────────────────────────┘
                   │ REST/Cloud Functions
┌──────────────────▼──────────────────────────────────────────┐
│           Firebase Cloud Functions (Node.js 20)             │
│  (Payment processing, Certificate generation)               │
└──────────────────┬──────────────────────────────────────────┘
                   │ Admin SDK
┌──────────────────▼──────────────────────────────────────────┐
│  Firebase Backend (Firestore, Auth, Storage)                │
│  + Stripe Integration for Payment Processing                │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Layers

**1. Pages Layer** (`src/pages/`)
- 18 page components handling different user views
- Divided into functional areas: Auth, Courses, Admin, Payments, Scheduling
- Examples: `CoursesPage`, `MyCourses`, `AdminPage`, `CertificateGenerationPage`

**2. Component Layer** (`src/components/`)
- **common/**: Reusable UI components (Button, Card, Modal, Form inputs)
- **layout/**: Page layout wrappers (MainLayout, DashboardLayout, AuthLayout)
- **guards/**: Route protection (ProtectedRoute, RoleBasedRoute, PublicRoute)
- **admin/**: Admin-specific components (user tables, payment tracking)
- **payment/**: Payment forms (CheckoutForm, RemainingPaymentCheckoutForm, PaymentModal)
- **scheduling/**: Booking interface (TimeSlotPicker, LessonBooking, ScheduleCalendar)

**3. Service Layer** (`src/api/`)
- 10 service modules for data operations
- Each module encapsulates Firebase operations and API calls
- Handles authentication, CRUD operations, business logic

**4. State Management** (`src/context/`)
- **CourseContext**: Manages course enrollments, selections, filter state
- **TimerContext**: Tracks session time for behind-the-wheel lessons
- Custom hooks expose context with computed properties

**5. Configuration** (`src/config/`, `src/constants/`)
- Firebase initialization and configuration
- Route definitions
- User roles, lesson types, validation rules
- Error and success messages

### Data Flow

```
User Action → Page Component → Service Module → Firebase
                    ↑                                ↓
            Context Updates ← Data Response ←─────────
```

## Backend Architecture

### Firebase Cloud Functions (`functions/index.js`)

**Payment Processing Functions**:
- `createCheckoutSession(userId, courseId, amount, paymentType)` 
  - Creates Stripe session for checkout redirect
  - Supports: upfront payment ($549), split payment ($99 + $450), remaining balance ($450)
  
- `createPaymentIntent(userId, courseId, amount, paymentType)`
  - Creates payment intent for client-side processing
  - Returns Stripe client secret for form submission
  
- `stripeWebhook()`
  - Handles Stripe webhook events (payment success, failure, refund)
  - Updates enrollment status in Firestore
  - Triggers post-payment actions (unlock course, send confirmation)

**Certificate Generation**:
- `generateCertificate(userId, courseId)`
  - Creates PDF certificate after full payment + lesson completion
  - Uses document generation library
  - Stores in Firebase Storage
  - Updates enrollment with certificate metadata

### Firestore Database Schema

**Collections**:
- `users` - User profiles, roles, preferences
- `courses` - Course definitions, metadata
- `modules` - Course modules and lessons
- `lessons` - Individual lesson content
- `enrollments` - User course enrollment state
  - `enrollmentStatus`: PENDING, PARTIALLY_PAID, ACTIVE, COMPLETED
  - `paymentHistory`: Array of payment transactions
  - `lessonBookings`: Scheduled behind-the-wheel lessons
  - `certificateGenerated`: Boolean flag
  
- `payments` - Payment transaction records
  - `amount`, `paymentType`, `stripePaymentId`, `status`
  - `timestamp`, `metadata` (billing address, etc.)
  
- `timeSlots` - Available lesson time slots
  - `startTime`, `endTime`, `instructor`, `isBooked`
  - `studentId`, `courseId` (when booked)
  
- `progress` - Lesson completion tracking
  - `lessonId`, `userId`, `completionStatus`, `timestamp`

## API Services Overview

### Core Services

| Service | Purpose |
|---------|---------|
| `authServices.js` | Login, registration, logout, password reset, Google OAuth |
| `courseServices.js` | Course CRUD, search, filtering, metadata |
| `userServices.js` | Profile management, preferences, role assignment |

### Enrollment & Payment Services

| Service | Purpose |
|---------|---------|
| `enrollmentServices.js` | Manages enrollment lifecycle, split payment states, course access |
| `paymentServices.js` | Stripe integration, payment status tracking, transaction history |
| `schedulingServices.js` | Time slot management, booking, cancellation |

### Learning Services

| Service | Purpose |
|---------|---------|
| `lessonServices.js` | Fetch lesson content, metadata, multimedia |
| `moduleServices.js` | Module organization, progression logic |
| `progressServices.js` | Track completion, learning time, milestone events |
| `securityServices.js` | Verify course access, authorization checks |

## Key Workflows

### 1. Course Enrollment with Split Payment

```
User selects course
    ↓
Payment Modal opens (Courses page)
    ↓
User chooses: Pay Full ($549) | Pay Now ($99 split)
    ↓
Stripe Checkout Session created via Cloud Function
    ↓
Stripe payment processed
    ↓
Webhook received & verified
    ↓
Enrollment created with PARTIALLY_PAID status (if split)
    ↓
Remaining balance due notification sent
    ↓
User can start course immediately OR pay remaining later
    ↓
After full payment → enrollment → ACTIVE
```

### 2. Lesson Booking (Behind-the-Wheel)

```
User navigates to lesson details
    ↓
Available time slots displayed (from timeSlots collection)
    ↓
User selects preferred slot
    ↓
Booking confirmation modal appears
    ↓
bookTimeSlot() called with userId, slotId, email
    ↓
Firestore transaction:
  - Verify time slot not already booked
  - Create lesson booking record in enrollment.lessonBookings
  - Update time slot with studentId
  - Generate confirmation email
    ↓
Booking confirmed, calendar updated
```

### 3. Certificate Generation

```
User completes all lessons + pays full amount
    ↓
Progress tracking detects completion
    ↓
User navigates to Certificate page
    ↓
"Generate Certificate" button becomes available
    ↓
Cloud Function triggered: generateCertificate(userId, courseId)
    ↓
Function:
  - Fetches user data, course info, completion timestamps
  - Generates PDF using document library
  - Uploads to Firebase Storage
  - Updates enrollment.certificateGenerated = true
  - Returns download URL
    ↓
User can download PDF certificate
```

### 4. Admin Payment Tracking

```
Admin opens Admin Panel
    ↓
Views all enrollments with payment status
    ↓
Filters by: Student, Course, Payment Status, Date Range
    ↓
Sees:
  - Who paid full vs split
  - Outstanding balances
  - Lesson booking history
  - Certificates generated
    ↓
Can manually adjust enrollment status if needed
Can view audit trail of all transactions
```

## State Management Patterns

### Context API with Hooks

```javascript
// CourseContext provides
- selectedCourse
- enrolledCourses
- filteredCourses
- enrollCourse(userId, courseId)
- updateProgress(userId, courseId, lessonId)

// TimerContext provides
- sessionTime
- dailyTime
- startSession()
- endSession()
```

### Local Component State

- Form inputs and validation
- UI state (modals, dropdowns, loading)
- Temporary filtering/sorting

## Authentication & Authorization

### Protected Routes
- `ProtectedRoute`: Redirects unauthenticated users to login
- `RoleBasedRoute`: Restricts access by user role (STUDENT, INSTRUCTOR, ADMIN)
- `PublicRoute`: Prevents logged-in users from accessing auth pages

### Role Hierarchy
- **STUDENT**: Access own courses, progress, certificates
- **INSTRUCTOR**: Manage lessons, view student progress
- **ADMIN**: Full system access, user management, payment tracking, scheduling

## Styling Strategy

**CSS Modules**: Each component has scoped styles
- `ComponentName.module.css` imported into `ComponentName.jsx`
- Prevents style conflicts across pages

**Global Styles**: `src/assets/styles/`
- Theme variables (colors, spacing, fonts)
- Global resets and base styles
- Dark mode support via CSS variables

**Responsive Design**: Mobile-first approach
- Flexbox and CSS Grid for layout
- Breakpoints for tablet and desktop
- Touch-friendly buttons and inputs

## Performance Considerations

1. **Code Splitting**: Pages lazy-loaded via React Router
2. **Firestore Queries**: Indexed for fast lookups on enrollment, payment status
3. **Image Optimization**: Course thumbnails, avatars compressed
4. **Bundle Size**: React Scripts handles minification and tree-shaking

## Security Measures

1. **Firestore Rules**: Row-level access control
   - Users can only read/write their own data
   - Admins have elevated permissions
   - Payments only writeable via verified Cloud Functions

2. **Environment Variables**: Sensitive keys in `.env`
   - Firebase config keys
   - Stripe public key
   - API endpoints

3. **Cloud Function Verification**: 
   - Payment intents verified with Stripe API
   - Webhook signatures authenticated
   - Enrollment updates only via validated transactions

4. **Rate Limiting**: Firebase security rules prevent abuse
   - Payment requests throttled
   - Booking spam prevention
   - Query limits per user
