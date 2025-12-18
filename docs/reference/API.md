# Fastrack LMS - API Services Documentation

## Overview

The API layer (`src/api/`) provides 10 service modules that handle all communication with Firebase and external services (Stripe, Cloud Functions).

Each service module exports functions for specific domain operations. Services follow consistent patterns for error handling, async/await, and data validation.

---

## 1. Authentication Services (`authServices.js`)

### User Registration
```javascript
registerUser(email, password, displayName)
// Returns: { uid, email, displayName, createdAt }
// Throws: FirebaseAuthError (invalid email, weak password, existing account)
```

### User Login
```javascript
loginUser(email, password)
// Returns: { uid, email, displayName, role }
// Throws: FirebaseAuthError (invalid credentials, account disabled)
```

### Google Sign-In/Sign-Up
```javascript
signInWithGoogle()
// Returns: { uid, email, displayName, photoURL }
// Auto-creates account if first time signing in
```

### Logout
```javascript
logoutUser()
// Returns: void
// Clears session and auth state
```

### Password Reset
```javascript
resetPassword(email)
// Returns: void
// Sends password reset email to address
// Email expires in 1 hour
```

### Update User Profile
```javascript
updateUserProfile(uid, profileData)
// profileData: { displayName, photoURL, phone, address }
// Returns: void
```

### Verify Email
```javascript
sendEmailVerification(uid)
// Returns: void
// Sends verification email to user's address
```

---

## 2. User Services (`userServices.js`)

### Get User Profile
```javascript
getUserProfile(uid)
// Returns: { 
//   uid, email, displayName, photoURL,
//   role, createdAt, preferences, phone, address
// }
```

### Update Preferences
```javascript
updateUserPreferences(uid, preferences)
// preferences: { 
//   darkMode: boolean,
//   emailNotifications: boolean,
//   reminderFrequency: 'daily' | 'weekly'
// }
// Returns: void
```

### Get User Preferences
```javascript
getUserPreferences(uid)
// Returns: { darkMode, emailNotifications, reminderFrequency, ... }
```

### Update User Role (Admin Only)
```javascript
updateUserRole(uid, newRole)
// newRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
// Returns: void
// Throws: PermissionError if caller not admin
```

### Search Users (Admin)
```javascript
searchUsers(query, filters = {})
// query: search term (name, email)
// filters: { role, status, enrolledCourse, registrationDate }
// Returns: [{ uid, email, displayName, role, registrationDate }, ...]
```

### Get All Users (Admin)
```javascript
getAllUsers(limit = 100, offset = 0)
// Returns: { users: [...], total, hasMore }
```

### Deactivate User (Admin)
```javascript
deactivateUser(uid)
// Returns: void
// User cannot login; can be reactivated
```

---

## 3. Course Services (`courseServices.js`)

### Get All Courses
```javascript
getAllCourses(filters = {}, sortBy = 'popularity')
// filters: { difficulty, duration, priceRange, category }
// sortBy: 'popularity' | 'newest' | 'price_asc' | 'price_desc'
// Returns: [{ courseId, title, description, price, duration, ... }, ...]
```

### Get Single Course
```javascript
getCourse(courseId)
// Returns: {
//   courseId, title, description, price, duration,
//   instructor, level, modules: [...], reviews: [...]
// }
```

### Search Courses
```javascript
searchCourses(searchTerm, filters = {})
// searchTerm: search by title or description
// Returns: [{ courseId, title, ... }, ...]
```

### Create Course (Admin)
```javascript
createCourse(courseData)
// courseData: { 
//   title, description, price, duration,
//   instructor, level, category, thumbnail
// }
// Returns: { courseId, ... }
```

### Update Course (Admin)
```javascript
updateCourse(courseId, updates)
// updates: partial courseData
// Returns: void
```

### Delete Course (Admin)
```javascript
deleteCourse(courseId)
// Returns: void
// Warning: also removes all enrollments
```

### Get Course Modules
```javascript
getCourseModules(courseId)
// Returns: [{ moduleId, title, order, lessons: [...] }, ...]
```

### Create Module (Admin)
```javascript
createModule(courseId, moduleData)
// moduleData: { title, description, order }
// Returns: { moduleId, ... }
```

---

## 4. Lesson Services (`lessonServices.js`)

### Get Lesson Content
```javascript
getLesson(courseId, moduleId, lessonId)
// Returns: {
//   lessonId, title, description, duration,
//   content: { video, reading, quiz, test },
//   resources: [...]
// }
```

### Get All Lessons in Module
```javascript
getModuleLessons(courseId, moduleId)
// Returns: [{ lessonId, title, duration, order }, ...]
```

### Create Lesson (Instructor/Admin)
```javascript
createLesson(courseId, moduleId, lessonData)
// lessonData: {
//   title, description, duration, type,
//   content: { video, reading, quiz },
//   resources: []
// }
// Returns: { lessonId, ... }
```

### Update Lesson (Instructor/Admin)
```javascript
updateLesson(courseId, moduleId, lessonId, updates)
// Returns: void
```

### Mark Lesson Complete (Student)
```javascript
markLessonComplete(uid, courseId, lessonId, timeSpent)
// timeSpent: minutes spent on lesson
// Returns: void
```

### Get Lesson Completion Status
```javascript
getLessonStatus(uid, courseId, lessonId)
// Returns: {
//   isComplete: boolean,
//   completedAt: timestamp,
//   timeSpent: minutes
// }
```

---

## 5. Module Services (`moduleServices.js`)

### Get Module Details
```javascript
getModule(courseId, moduleId)
// Returns: {
//   moduleId, title, description, order,
//   lessons: [...],
//   completionPercentage: number
// }
```

### Create Module (Admin)
```javascript
createModule(courseId, moduleData)
// moduleData: { title, description, order }
// Returns: { moduleId, ... }
```

### Update Module (Admin)
```javascript
updateModule(courseId, moduleId, updates)
// Returns: void
```

### Delete Module (Admin)
```javascript
deleteModule(courseId, moduleId)
// Returns: void
```

### Reorder Modules (Admin)
```javascript
reorderModules(courseId, moduleOrders)
// moduleOrders: [{ moduleId, newOrder }, ...]
// Returns: void
```

---

## 6. Progress Services (`progressServices.js`)

### Get Course Progress
```javascript
getCourseProgress(uid, courseId)
// Returns: {
//   courseId, completionPercentage, totalLessons, completedLessons,
//   totalTimeSpent, estimatedTimeRemaining,
//   moduleProgress: [{ moduleId, percentage }, ...]
// }
```

### Get Overall Progress
```javascript
getUserProgress(uid)
// Returns: {
//   totalCoursesEnrolled, coursesCompleted, inProgress,
//   totalTimeSpent, averageCompletionRate,
//   recentActivity: [...]
// }
```

### Update Progress
```javascript
updateProgress(uid, courseId, lessonId, progressData)
// progressData: { isComplete, timeSpent, score }
// Returns: void
```

### Get Progress Report
```javascript
getProgressReport(uid, courseId)
// Returns detailed PDF-ready report of course progress
```

### Get Learning Analytics
```javascript
getLearningAnalytics(uid, timeRange = '30days')
// timeRange: '7days' | '30days' | '90days' | 'all'
// Returns: {
//   dailyTimeSpent: [...], weeklyTrend: [...],
//   lessonCompletionTrend: [...],
//   averageSessionDuration: minutes,
//   consistencyScore: percentage
// }
```

---

## 7. Enrollment Services (`enrollmentServices.js`)

### Create Standard Enrollment
```javascript
createEnrollment(uid, courseId, userEmail = '')
// Creates enrollment with status PENDING
// User must complete payment
// Returns: { enrollmentId, status: 'PENDING' }
```

### Create Paid Enrollment (Upfront)
```javascript
createPaidEnrollment(uid, courseId, paidAmount, userEmail = '')
// Creates enrollment with status ACTIVE after payment
// paidAmount: full course price ($549)
// Returns: { enrollmentId, status: 'ACTIVE' }
```

### Create Split Payment Enrollment
```javascript
createPaidCompletePackageSplit(uid, upfrontAmount, userEmail = '')
// Creates enrollment with status PARTIALLY_PAID
// upfrontAmount: $99 (initial payment)
// Returns: { enrollmentId, status: 'PARTIALLY_PAID', remainingBalance: 450 }
```

### Update Enrollment After Payment
```javascript
updateEnrollmentAfterPayment(uid, courseId, paymentAmount, paymentType)
// paymentType: 'upfront' | 'split' | 'remaining_balance'
// Updates enrollment status and payment history
// Returns: { enrollmentId, status: 'ACTIVE' | 'PARTIALLY_PAID' }
```

### Pay Remaining Balance
```javascript
payRemainingBalance(uid, courseId, amountPaid, userEmail = '')
// Completes split payment enrollment
// amountPaid: $450 (remaining balance)
// Returns: { enrollmentId, status: 'ACTIVE' }
// Triggers certificate generation eligibility
```

### Get User Enrollments
```javascript
getUserEnrollments(uid)
// Returns: [{
//   courseId, title, enrollmentDate, status,
//   completionPercentage, paymentStatus,
//   totalPaid, remainingBalance
// }, ...]
```

### Get Single Enrollment
```javascript
getEnrollment(uid, courseId)
// Returns: {
//   enrollmentId, status, enrollmentDate,
//   paymentHistory: [{ amount, date, type, stripeId }],
//   lessonBookings: [...],
//   certificateGenerated: boolean
// }
```

### Update Certificate Status
```javascript
updateCertificateStatus(uid, courseId, certificateGenerated = true)
// Updates enrollment with certificate metadata
// Returns: void
```

### Check Course Access
```javascript
checkCourseAccess(uid, courseId)
// Returns: boolean (true if enrolled and active)
// Throws: PermissionError if access denied
```

### Reset Enrollment to Pending (Admin)
```javascript
resetEnrollmentToPending(uid, courseId)
// Resets status to PENDING, requires re-payment
// Returns: void
```

---

## 8. Payment Services (`paymentServices.js`)

### Create Payment Intent
```javascript
createPaymentIntent(uid, courseId, amount, paymentType = 'upfront')
// Creates Stripe PaymentIntent via Cloud Function
// paymentType: 'upfront' | 'split' | 'remaining_balance'
// amount: in cents (549000 = $549)
// Returns: { 
//   clientSecret, paymentIntentId, status,
//   metadata: { courseId, userId, type }
// }
```

### Create Checkout Session
```javascript
createCheckoutSession(uid, courseId, amount, paymentType, userEmail)
// Creates Stripe Checkout Session via Cloud Function
// Redirects to Stripe hosted checkout
// Returns: { sessionId, url }
```

### Get Payment
```javascript
getPayment(paymentId)
// Returns: {
//   paymentId, userId, courseId, amount,
//   paymentType, status, stripePaymentIntentId,
//   timestamp, metadata: { billingAddress, ... }
// }
```

### Get User Payments
```javascript
getUserPayments(uid, limit = 100)
// Returns: [{ paymentId, courseId, amount, status, date }, ...]
```

### Get Course Payments
```javascript
getCoursePayments(uid, courseId)
// Returns payment history for specific enrollment
// Returns: [{ amount, date, type, status }, ...]
```

### Update Payment Status
```javascript
updatePaymentStatus(paymentId, status, metadata = {})
// status: 'pending' | 'succeeded' | 'failed' | 'refunded'
// Called by webhook handler
// Returns: void
```

### Process Successful Payment
```javascript
processSuccessfulPayment(paymentId, stripePaymentIntentId = null)
// Called when Stripe payment succeeds
// Updates enrollment, stores payment, sends confirmation email
// Returns: { enrollmentId, newStatus }
```

### Handle Payment Failure
```javascript
handlePaymentFailure(paymentId, errorMessage = '')
// Called when Stripe payment fails
// Updates payment status, logs error, sends notification
// Returns: void
```

### Calculate Total Paid
```javascript
calculateTotalPaid(uid, courseId)
// Returns: { totalPaid, remainingBalance, paymentPercentage }
```

---

## 9. Scheduling Services (`schedulingServices.js`)

### Create Time Slot (Admin)
```javascript
createTimeSlot(timeSlotData)
// timeSlotData: {
//   courseId, lessonType, startTime, endTime,
//   instructor, location, maxStudents = 1
// }
// startTime, endTime: ISO 8601 format (2024-01-15T14:00:00Z)
// Returns: { slotId, ... }
```

### Get Available Time Slots
```javascript
getAvailableTimeSlots(startDate, endDate, filters = {})
// startDate, endDate: ISO dates (2024-01-15)
// filters: { courseId, instructor, lessonType }
// Returns only unbooked slots
// Returns: [{
//   slotId, startTime, endTime, instructor,
//   courseId, isAvailable: true
// }, ...]
```

### Get All Time Slots
```javascript
getTimeSlots(filters = {})
// filters: { courseId, instructor, bookingStatus }
// bookingStatus: 'available' | 'booked' | 'all'
// Returns: [{ slotId, startTime, endTime, bookedBy, ... }, ...]
```

### Book Time Slot (Student)
```javascript
bookTimeSlot(uid, slotId, userEmail)
// Performs transaction:
//   1. Verify slot not already booked
//   2. Create lesson booking record
//   3. Update time slot with studentId
//   4. Send confirmation email
// Returns: {
//   bookingId, slotId, studentId, confirmationCode,
//   startTime, endTime, instructor
// }
// Throws: error if slot unavailable or user not eligible
```

### Get User Bookings
```javascript
getUserBookings(uid, status = 'all')
// status: 'upcoming' | 'past' | 'all'
// Returns: [{
//   bookingId, courseId, lessonType,
//   startTime, endTime, instructor,
//   location, confirmationCode
// }, ...]
```

### Cancel Booking (Student/Admin)
```javascript
cancelBooking(uid, lessonId, slotId)
// Cancels booking and releases time slot
// Sends cancellation email to student and instructor
// Returns: void
```

### Update Time Slot (Admin)
```javascript
updateTimeSlot(slotId, updates)
// updates: { startTime, endTime, instructor, location }
// Returns: void
// If slot is booked, student is notified
```

### Delete Time Slot (Admin)
```javascript
deleteTimeSlot(slotId)
// Returns: void
// If booked, student and instructor notified
// Offers rescheduling
```

---

## 10. Security Services (`securityServices.js`)

### Personal Security Questions (Identity Verification)

#### Set Security Questions
```javascript
setSecurityQuestions(userId, securityData)
// securityData: {
//   question1: 'q1', answer1: 'answer',
//   question2: 'q2', answer2: 'answer',
//   question3: 'q3', answer3: 'answer'
// }
// Security: Answers are hashed with SHA-256 before storage
// Returns: { success: true, message: 'Security questions set successfully' }
```

#### Verify Security Answer
```javascript
verifySecurityAnswer(userId, questionNumber, providedAnswer)
// questionNumber: 1 | 2 | 3
// providedAnswer: user's provided answer
// Security: Compares SHA-256 hash, case-insensitive
// Returns: { verified: boolean, message: string }
```

#### Get Random Personal Security Question
```javascript
getRandomPersonalSecurityQuestion(userId)
// Returns: {
//   questionNumber: 1-3,
//   question: 'What was your first pet\'s name?'
// }
// Used by PersonalVerificationModal for 2-hour compliance checkpoint
```

#### Verify Multiple Security Answers
```javascript
verifySecurityAnswers(userId, answers)
// answers: { answer1: 'ans', answer2: 'ans', answer3: 'ans' }
// Returns: {
//   verified: boolean (true if ≥2 of 3 correct),
//   correctAnswers: number,
//   requiredCorrect: 2,
//   message: string
// }
```

#### Check If Security Questions Set
```javascript
hasSecurityQuestions(userId)
// Returns: boolean
```

#### Get Security Questions for Recovery
```javascript
getSecurityQuestionsForRecovery(userId)
// Returns: {
//   question1: 'text', question2: 'text', question3: 'text'
// }
// NOTE: Does NOT return answers (hashes only stored)
```

### Access Control

#### Verify Course Access
```javascript
verifyCourseAccess(uid, courseId)
// Returns: boolean
// Checks: user is enrolled AND enrollment is ACTIVE or COMPLETED
```

#### Verify User Role
```javascript
verifyUserRole(uid, requiredRole)
// requiredRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
// Returns: boolean
// Throws: PermissionError if insufficient permissions
```

#### Verify Payment Verified
```javascript
verifyPaymentVerified(uid, courseId)
// Returns: boolean
// Checks if user has made at least initial payment
```

#### Check Admin Permission
```javascript
checkAdminPermission(uid)
// Returns: boolean
// Throws: PermissionError if user is not admin
```

### Audit Log
```javascript
auditLog(uid, action, details = {})
// Logs administrative or sensitive action
// action: 'USER_CREATED', 'PAYMENT_PROCESSED', 'ENROLLMENT_RESET', etc.
// details: additional context
// Returns: void
```

### Get Audit Trail
```javascript
getAuditTrail(filters = {})
// filters: { userId, action, dateRange, limit }
// Admin only
// Returns: [{
//   timestamp, userId, action, details,
//   userEmail, userRole
// }, ...]
```

---

## Cloud Functions (`functions/index.js`)

### createCheckoutSession (Callable Function)
```javascript
// Frontend call:
const result = await functions.httpsCallable('createCheckoutSession')({
  courseId, amount, paymentType, userEmail
});
// result.data: { sessionId, url }
// Redirect to result.data.url for Stripe checkout
```

### createPaymentIntent (Callable Function)
```javascript
// Frontend call:
const result = await functions.httpsCallable('createPaymentIntent')({
  courseId, amount, paymentType
});
// result.data: { clientSecret, paymentIntentId }
// Use clientSecret with Stripe Elements
```

### stripeWebhook (HTTP Function)
```javascript
// Called by Stripe (webhook endpoint)
// Validates webhook signature
// Processes events:
//   - payment_intent.succeeded
//   - payment_intent.payment_failed
//   - charge.refunded
// Updates Firestore enrollments and payments
// Sends confirmation emails
```

### generateCertificate (Callable Function)
```javascript
// Frontend call:
const result = await functions.httpsCallable('generateCertificate')({
  courseId
});
// result.data: {
//   certificateUrl, downloadUrl,
//   certificateGeneratedAt,
//   filename
// }
// User can download PDF from downloadUrl
```

---

## Error Handling Patterns

All services follow consistent error handling:

```javascript
try {
  const result = await someService(params);
  // Use result
} catch (error) {
  if (error.code === 'permission-denied') {
    // User lacks permission
  } else if (error.code === 'not-found') {
    // Resource doesn't exist
  } else if (error.code === 'already-exists') {
    // Resource already exists
  } else if (error.code === 'invalid-argument') {
    // Parameter validation failed
  } else if (error.code === 'failed-precondition') {
    // Business logic validation failed (e.g., can't book twice)
  } else {
    // Generic error
  }
}
```

---

## Authentication Pattern

All services require Firebase authentication:

```javascript
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;

if (!user) {
  throw new Error('User not authenticated');
}

// Call services with user.uid
await enrollmentServices.getUserEnrollments(user.uid);
```

---

## 10. Inactivity Timeout & Activity Tracking

### Activity Tracking Hook (`useActivityTracking`)
Monitors user interactions and persists last activity timestamp to localStorage.

```javascript
const { lastActivity, getTimeSinceLastActivity, resetActivity } = useActivityTracking(enabled);

// lastActivity: Timestamp (milliseconds) of last user interaction
// getTimeSinceLastActivity(): Returns elapsed milliseconds since last activity
// resetActivity(): Manually reset the activity timer

// Detects: mousemove, mousedown, keydown, scroll events
// Throttle: 30-60 seconds between updates (prevents spam logging)
// Persistence: localStorage survives page refresh (real inactivity detection)
```

### Inactivity Timeout Hook (`useInactivityTimeout`)
Manages a 15-minute idle timer with warning at 13 minutes.

```javascript
const {
  showWarning,        // Boolean - true when warning modal should show
  hasTimedOut,        // Boolean - true when 15 minutes reached
  secondsRemaining,   // Number - countdown timer for display
  handleContinueLesson,  // Function - reset timer when "Continue Lesson" clicked
  resetTimeout        // Function - manually reset timeout
} = useInactivityTimeout({
  enabled: true,
  lastActivityTime: activityTracking.lastActivity,
  onWarning: () => {},    // Callback when 13 minutes reached
  onTimeout: async () => {}, // Callback when 15 minutes reached (enforce logout)
  onReset: () => {}       // Callback when timer reset
});
```

### Inactivity Warning Modal (`InactivityWarningModal`)
UI component displayed at 13-minute mark.

```javascript
<InactivityWarningModal
  isOpen={showInactivityWarning}
  secondsRemaining={inactivitySecondsRemaining}
  onContinue={handleInactivityContinue}
/>

// Features:
// - Cannot close via escape or overlay click (forced interaction)
// - Live countdown timer with pulsing animation
// - "Continue Lesson" button resets 15-minute timer
// - "I'm Still Here" confirmation required for compliance
```

### Server-Side Enforcement (`enforceInactivityTimeout`)
Cloud Function that marks session as idle and deducts idle time from daily limit.

```javascript
// Cloud Function v2 API
enforceInactivityTimeout({
  userId: string,
  courseId: string,
  sessionId: string,
  idleDurationSeconds: number
})

// Returns:
// {
//   success: true,
//   message: 'Inactivity timeout enforced',
//   sessionId: string,
//   idleDurationSeconds: number,
//   timedOutAt: ISO8601 timestamp
// }

// Side Effects:
// - Marks session.status = 'idle_timeout'
// - Deducts idle minutes from adjusted_minutes_completed (4-hour daily limit)
// - Sets excluded_from_daily_limit = true on daily_activity_logs
// - Logs SESSION_IDLE_TIMEOUT_ENFORCED audit event
```

### Activity Tracking Service (`complianceServices.js`)
Wrapper for calling the Cloud Function.

```javascript
enforceInactivityTimeout(userId, courseId, sessionId, idleDurationSeconds)
// Returns: Promise<result>
// Throws: ApiError on validation or Firebase errors
```

### Integration Points

**TimerContext.jsx** (Activity Orchestration):
- Initializes `useActivityTracking()` 
- Initializes `useInactivityTimeout()` with callback handlers
- `onTimeout` async function:
  1. Calls `enforceInactivityTimeout()` Cloud Function
  2. Clears localStorage of activity timestamp
  3. Calls `signOut(auth)` to terminate session
- Exports to context: `showInactivityWarning`, `inactivitySecondsRemaining`, `handleInactivityContinue`, `inactivityTimedOut`

**CoursePlayerPage.jsx** (State Handling):
- Destructures inactivity state from `useTimer()`
- Renders `<InactivityWarningModal />` 
- Checks `inactivityTimedOut` and returns `null` to prevent dashboard flash before redirect
- After `signOut()` completes, ProtectedRoute redirects to login

### Security Measures

✅ **Inactivity Detection**:
- localStorage persists timeout state (survives page refresh - real inactivity)
- Server enforces timeout on Cloud Function (client cannot manipulate)
- Stale timestamp detection (auto-clears >20 min old activity on re-login)

✅ **Logout Flow**:
- Clears `lastActivityTime` from localStorage on timeout
- Blank page rendering prevents brief dashboard visibility
- React hooks ordering ensures proper re-render behavior
- PublicRoute guard prevents authenticated user redirect loop

✅ **Compliance**:
- Warning modal at exactly 13 minutes of inactivity
- Auto-logout at exactly 15 minutes (no grace period)
- Idle time mathematically deducted from 4-hour daily limit
- Session marked `idle_timeout` prevents resumption
- Audit event `SESSION_IDLE_TIMEOUT_ENFORCED` logged (3-year retention)

---

## Common Parameters

- **uid**: User ID (from Firebase Auth)
- **courseId**: Course identifier (Firestore document ID)
- **paymentType**: 'upfront' | 'split' | 'remaining_balance'
- **status**: 'PENDING' | 'PARTIALLY_PAID' | 'ACTIVE' | 'COMPLETED'
- **timestamps**: ISO 8601 format (e.g., 2024-01-15T14:00:00Z)
- **amounts**: In cents for Stripe (549000 = $549.00)

---

## Rate Limiting & Quotas

**Firestore**: 
- 50,000 writes per day (free tier)
- 1 write per second per document (hard limit)

**Cloud Functions**:
- 2 million invocations per month (free tier)
- 5 minute maximum execution time

**Stripe**:
- No explicit rate limit, but reasonable limits enforced
- Test mode: 100 test cards available

**Email**: 
- Firebase: 100 emails per day (free tier, via Cloud Functions)
- SendGrid integration possible for higher volumes
