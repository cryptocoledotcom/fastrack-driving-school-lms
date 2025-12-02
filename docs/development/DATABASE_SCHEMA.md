# Database Schema

## Firestore Collections Reference

Complete documentation of Firestore database structure for Fastrack LMS.

---

## users Collection

Stores user account information.

**Path**: `/users/{userId}`

```javascript
{
  email: string,                    // User email (indexed)
  firstName: string,                // First name
  lastName: string,                 // Last name
  role: string,                     // student|instructor|admin|compliance_officer|dmv_admin
  profileImage: string,             // URL to profile image (optional)
  phoneNumber: string,              // Phone number (optional)
  address: string,                  // Address (optional, encrypted)
  createdAt: timestamp,             // Account creation time
  updatedAt: timestamp,             // Last profile update
  lastLogin: timestamp,             // Last login time (optional)
  requiresPasswordChange: boolean,  // Force password change on next login
  isActive: boolean,                // Account active status
  preferences: {
    emailNotifications: boolean,    // Enable email notifications
    pushNotifications: boolean      // Enable push notifications
  }
}
```

**Indexes**:
- email (single-field)
- role (single-field)
- createdAt (descending)

---

## courses Collection

Stores course information.

**Path**: `/courses/{courseId}`

```javascript
{
  title: string,                    // Course title
  description: string,              // Course description
  instructor: string,               // Instructor user ID
  category: string,                 // Course category
  price: number,                    // Price in cents
  duration: number,                 // Duration in hours
  maxStudents: number,              // Max students (optional, 0 = unlimited)
  enrolledCount: number,            // Current enrolled count
  status: string,                   // draft|published|archived
  modules: [
    {
      id: string,
      title: string,
      order: number
    }
  ],
  requirements: [string],           // Prerequisites
  certificateTemplate: string,      // Certificate template path
  createdAt: timestamp,
  updatedAt: timestamp,
  publishedAt: timestamp            // Publication time
}
```

**Subcollections**:
- `lessons`: Individual lessons within modules
- `assessments`: Quizzes and assessments
- `resources`: Course materials

---

## enrollments Collection

Stores student course enrollments.

**Path**: `/enrollments/{enrollmentId}`

```javascript
{
  userId: string,                   // Student user ID
  courseId: string,                 // Course ID
  status: string,                   // active|completed|dropped
  enrolledAt: timestamp,            // Enrollment date
  completedAt: timestamp,           // Completion date (optional)
  progress: number,                 // Progress percentage (0-100)
  lastAccessedAt: timestamp,        // Last accessed lesson
  currentLesson: string,            // Current lesson ID
  certificateIssued: boolean,       // Certificate generated?
  certificateUrl: string            // Certificate URL (optional)
}
```

**Indexes**:
- userId, courseId (composite)
- status
- completedAt

---

## payments Collection

Stores payment transactions.

**Path**: `/payments/{paymentId}`

```javascript
{
  userId: string,                   // Student user ID
  courseId: string,                 // Course ID
  amount: number,                   // Amount in cents
  currency: string,                 // USD
  status: string,                   // pending|succeeded|failed|refunded
  stripePaymentIntentId: string,   // Stripe PI ID
  stripeCustomerId: string,         // Stripe customer ID
  paymentMethod: string,            // Card type
  lastFour: string,                 // Last 4 digits of card
  receiptEmail: string,             // Receipt sent to this email
  createdAt: timestamp,             // Transaction time
  completedAt: timestamp,           // Completion time (optional)
  refundedAt: timestamp,            // Refund time (optional)
  refundAmount: number              // Refund amount if applicable
}
```

**Security**: Immutable after creation, no updates allowed

**Indexes**:
- userId, createdAt (composite)
- status
- stripePaymentIntentId

---

## certificates Collection

Stores issued certificates.

**Path**: `/certificates/{certificateId}`

```javascript
{
  userId: string,                   // Student ID
  courseId: string,                 // Course ID
  courseName: string,               // Course name (snapshot)
  studentName: string,              // Student full name
  issueDate: timestamp,             // Issue date
  certificateUrl: string,           // URL to PDF
  verificationCode: string,         // Unique verification code
  isValid: boolean                  // Certificate validity
}
```

**Indexes**:
- userId
- verificationCode

---

## timeTracking Collection

Stores time tracking for compliance.

**Path**: `/timeTracking/{trackingId}`

```javascript
{
  userId: string,                   // Student ID
  courseId: string,                 // Course ID
  sessionStart: timestamp,          // Session start time
  sessionEnd: timestamp,            // Session end time
  duration: number,                 // Duration in minutes
  breaksTaken: [
    {
      startTime: timestamp,
      endTime: timestamp,
      duration: number
    }
  ],
  totalBreakTime: number,          // Total break time in minutes
  netStudyTime: number,            // Net study time (duration - breaks)
  verifyReq: boolean               // Verification required?
  IPAddress: string                // Session IP
  timestamp: timestamp
}
```

---

## compliance Collection

Stores compliance records and rules.

**Path**: `/compliance/{complianceId}`

```javascript
{
  name: string,                     // Compliance rule name
  type: string,                     // study_hours|break_requirements|age_restriction
  description: string,
  requirement: object,              // Requirements specific to type
  status: string,                   // active|inactive
  enforcedAt: timestamp,
  createdAt: timestamp
}
```

**Example Compliance Rules**:
```javascript
{
  name: "Minimum 6 hours per day",
  type: "study_hours",
  requirement: {
    minHoursPerDay: 6,
    maxHoursPerDay: 12
  }
}
```

---

## auditLogs Collection

Stores audit trail for compliance.

**Path**: `/auditLogs/{logId}`

```javascript
{
  timestamp: timestamp,             // Event time
  action: string,                   // User action
  actor: string,                    // User performing action
  actorRole: string,                // Role of actor
  resource: string,                 // Resource type (user|course|payment)
  resourceId: string,               // Resource ID
  changes: {
    fieldName: {
      oldValue: any,
      newValue: any
    }
  },
  ipAddress: string,                // Source IP
  userAgent: string,                // Browser info
  status: string                    // success|failure
}
```

**Immutable**: Append-only, never modified

**Retention**: 1 year minimum

---

## Collection Relationships

```
users
├── enrollments (user's courses)
├── payments (user's transactions)
├── timeTracking (user's study sessions)
└── certificates (user's certificates)

courses
├── modules (course structure)
├── lessons (lesson content)
├── assessments (quizzes)
└── resources (materials)

payments
└── → users (reference)
└── → courses (reference)

enrollments
└── → users (reference)
└── → courses (reference)
```

---

## Field Types & Validation

| Type | Example | Notes |
|------|---------|-------|
| string | "course-101" | Max 1024 chars |
| number | 99.99 | Integers for cents |
| boolean | true/false | |
| timestamp | Firestore.Timestamp | Use server timestamp |
| array | ["id1", "id2"] | Max 100 elements |
| map | {key: value} | Nested max 20 levels |
| reference | → users/user123 | For relationships |

---

## Indexes

**Required Indexes** (auto-created if not present):

```
users:
  email (ASC)
  role (ASC)
  createdAt (DESC)

courses:
  status (ASC)
  publishedAt (DESC)

enrollments:
  userId (ASC), courseId (ASC)
  status (ASC)
  completedAt (DESC)

payments:
  userId (ASC), createdAt (DESC)
  status (ASC)
```

---

## Data Retention Policy

| Collection | Retention | Archive After |
|-----------|-----------|----------------|
| users | Indefinite | Inactive 2 years |
| courses | Indefinite | Archived only |
| enrollments | Indefinite | 7 years after completion |
| payments | 7 years | Per PCI compliance |
| certificates | Indefinite | Validity period |
| timeTracking | 1 year | Delete after 1 year |
| auditLogs | 1 year | Archive after 1 year |
| compliance | Indefinite | Version as updated |

---

## Backup & Recovery

**Automatic Backups**: Daily at 2 AM UTC  
**Retention**: 30 days  
**Location**: Google Cloud Storage  

**Manual Restore**:
```bash
gcloud firestore restore <backup-path> \
  --project=fastrack-driving-school-lms
```

---

**Last Updated**: December 2, 2025
