# API Documentation

## Cloud Functions API Reference

Complete documentation of all Cloud Functions and their parameters.

---

## Payment Functions

### createCheckoutSession

**File**: `functions/src/payment/paymentFunctions.js`

Creates a Stripe checkout session for course enrollment.

**Function Type**: HTTP Callable  
**Authentication**: Required  
**Endpoint**: `/payment-createCheckoutSession`

**Parameters**:
```javascript
{
  courseId: string,      // Required: ID of course
  userId: string,        // Required: User ID
  amount: number,        // Required: Amount in cents
  userEmail: string      // Required: User email for receipt
}
```

**Response**:
```javascript
{
  success: boolean,
  sessionId: string,     // Stripe session ID
  clientSecret: string,  // Client secret for payment
  url: string           // Redirect URL for checkout
}
```

**Error Responses**:
```javascript
// Invalid parameters
{ error: 'INVALID_PARAMETERS', message: 'Missing required fields' }

// Unauthenticated
{ error: 'UNAUTHENTICATED', message: 'User must be authenticated' }

// Stripe error
{ error: 'STRIPE_ERROR', message: 'Stripe API error' }
```

**Example Usage**:
```javascript
import { httpsCallable } from 'firebase/functions';

const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');

const result = await createCheckoutSession({
  courseId: 'INTRO-101',
  userId: 'user123',
  amount: 9999,  // $99.99
  userEmail: 'user@example.com'
});

console.log('Redirect to:', result.data.url);
```

---

### createPaymentIntent

**File**: `functions/src/payment/paymentFunctions.js`

Creates a Stripe payment intent for course enrollment.

**Function Type**: HTTP Callable  
**Authentication**: Required  
**Endpoint**: `/payment-createPaymentIntent`

**Parameters**:
```javascript
{
  courseId: string,      // Required
  userId: string,        // Required
  amount: number,        // Required: In cents
  paymentMethodId: string // Optional: Stripe payment method
}
```

**Response**:
```javascript
{
  success: boolean,
  paymentIntentId: string,
  clientSecret: string,
  status: string         // 'succeeded', 'processing', 'requires_action'
}
```

**Error Responses**: Same as createCheckoutSession

---

### stripeWebhook

**File**: `functions/src/payment/paymentFunctions.js`

Handles incoming Stripe webhook events.

**Function Type**: HTTP  
**Authentication**: Webhook signature verification  
**Endpoint**: `/stripeWebhook`

**Webhook Events Handled**:
- `payment_intent.succeeded`: Payment successful
- `payment_intent.payment_failed`: Payment failed
- `charge.refunded`: Refund processed

**Response**:
```javascript
{
  received: boolean
}
```

**Note**: Set webhook endpoint in Stripe Dashboard → Webhooks

---

## Certificate Functions

### generateCertificate

**File**: `functions/src/certificate/certificateFunctions.js`

Generates a PDF certificate for course completion.

**Function Type**: HTTP Callable  
**Authentication**: Required  
**Endpoint**: `/certificate-generateCertificate`

**Parameters**:
```javascript
{
  courseId: string,      // Required
  userId: string,        // Required
  completionDate: string // Required: ISO date string
}
```

**Response**:
```javascript
{
  success: boolean,
  certificateUrl: string, // URL to PDF in Cloud Storage
  fileName: string       // PDF file name
}
```

**Error Responses**:
```javascript
{ error: 'COURSE_NOT_FOUND', message: 'Course not found' }
{ error: 'USER_NOT_FOUND', message: 'User not found' }
{ error: 'PDF_GENERATION_FAILED', message: 'Could not generate PDF' }
```

---

## Compliance Functions

### auditComplianceAccess

**File**: `functions/src/compliance/complianceFunctions.js`

Logs compliance-related access for audit trail.

**Function Type**: HTTP Callable  
**Authentication**: Admin only  
**Endpoint**: `/compliance-auditComplianceAccess`

**Parameters**:
```javascript
{
  userId: string,        // User being audited
  action: string,        // 'VIEW', 'MODIFY', 'DELETE'
  resource: string,      // Resource type
  details: object        // Additional context
}
```

**Response**:
```javascript
{
  success: boolean,
  auditLogId: string,
  timestamp: string
}
```

---

### generateComplianceReport

**File**: `functions/src/compliance/complianceFunctions.js`

Generates compliance report for regulatory requirements.

**Function Type**: HTTP Callable  
**Authentication**: Admin/Compliance Officer  
**Endpoint**: `/compliance-generateComplianceReport`

**Parameters**:
```javascript
{
  startDate: string,     // ISO date
  endDate: string,       // ISO date
  reportType: string     // 'FULL', 'USERS', 'PAYMENTS', 'ACTIVITY'
}
```

**Response**:
```javascript
{
  success: boolean,
  reportUrl: string,     // URL to generated report
  fileName: string,
  generatedAt: string
}
```

---

## User Functions

### createUser

**File**: `functions/src/user/userFunctions.js`

Creates a new user account with temporary password.

**Function Type**: HTTP Callable  
**Authentication**: Admin only  
**Endpoint**: `/user-createUser`

**Parameters**:
```javascript
{
  email: string,         // Required: User email
  role: string,          // Required: 'student', 'instructor', 'admin'
  firstName: string,     // Optional
  lastName: string       // Optional
}
```

**Response**:
```javascript
{
  success: boolean,
  userId: string,
  temporaryPassword: string,
  createdAt: string
}
```

**Error Responses**:
```javascript
{ error: 'EMAIL_ALREADY_EXISTS', message: 'User already exists' }
{ error: 'INVALID_ROLE', message: 'Invalid role specified' }
{ error: 'UNAUTHORIZED', message: 'Only admins can create users' }
```

---

## Service Layer API

### Frontend Services (`src/api/`)

#### CourseServices

**Location**: `src/api/courses/courseServices.js`

```javascript
// Get all courses
const courses = await courseServices.getAllCourses();

// Get course by ID
const course = await courseServices.getCourseById(courseId);

// Enroll in course (payment processed first)
const enrollment = await courseServices.enrollCourse(userId, courseId);

// Get user's enrolled courses
const enrolled = await courseServices.getUserEnrolledCourses(userId);

// Update course progress
const progress = await courseServices.updateCourseProgress(userId, courseId, lessonId);
```

#### PaymentServices

**Location**: `src/api/enrollment/paymentServices.js`

```javascript
// Create payment record
const payment = await paymentServices.createPayment({
  userId,
  courseId,
  amount,
  paymentMethodId
});

// Get payment history
const history = await paymentServices.getPaymentHistory(userId);

// Process refund
const refund = await paymentServices.processRefund(paymentId);
```

#### UserServices

**Location**: `src/api/student/userServices.js`

```javascript
// Get user profile
const profile = await userServices.getUserProfile(userId);

// Update user profile
const updated = await userServices.updateUserProfile(userId, profileData);

// Get all users (admin)
const users = await userServices.getAllUsers();

// Get user stats
const stats = await userServices.getUserStats(userId);
```

---

## Context API Reference

### AuthContext

**Location**: `src/context/AuthContext.js`

```javascript
const { user, loading, login, logout, hasRole } = useAuth();

// Check if user has role
if (hasRole('admin')) {
  // Show admin features
}

// Logout user
const handleLogout = () => {
  logout();
};
```

### CourseContext

**Location**: `src/context/CourseContext.js`

```javascript
const {
  courses,
  selectedCourse,
  progress,
  enrollCourse,
  updateProgress
} = useCourse();
```

### ModalContext

**Location**: `src/context/ModalContext.js`

```javascript
const { openModal, closeModal, showConfirm } = useModal();

// Show confirmation
const confirmed = await showConfirm({
  title: 'Confirm Action',
  message: 'Are you sure?'
});
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| INVALID_PARAMETERS | 400 | Missing or invalid request parameters |
| UNAUTHENTICATED | 401 | User not authenticated |
| PERMISSION_DENIED | 403 | User lacks permission |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict (e.g., duplicate) |
| INTERNAL_ERROR | 500 | Server error |
| TIMEOUT | 504 | Request timeout |

---

## Rate Limiting

**Current Limits**:
- Payment endpoints: 10 requests/minute
- User creation: 5 requests/minute
- File uploads: 100 MB/hour

---

**Last Updated**: December 2, 2025
