# Security Checklist

## Pre-Launch Security Verification

This document provides a comprehensive security audit checklist for the Fastrack LMS before production launch. Each item must be verified and signed off before deployment.

**Status**: [ ] Complete - [ ] In Progress - [ ] Not Started

---

## 1. Authentication & Authorization

### 1.1 Firebase Authentication Configuration

- [ ] Email/password authentication enabled
- [ ] Google Sign-in configured (if supported)
- [ ] Password requirements enforced:
  - Minimum 8 characters
  - Uppercase and lowercase required
  - Numbers and special characters required

**Verification**:
```bash
# Check Firebase Console
Settings → Authentication → Sign-in Method
```

### 1.2 Session Management

**File**: `src/context/AuthContext.js`

- [ ] Session timeout implemented: 30 minutes of inactivity
- [ ] Automatic logout on token expiration
- [ ] Refresh token mechanism working
- [ ] No sensitive data in localStorage (use localStorage only for non-sensitive tokens)

**Code Reference**:
```javascript
// Verify in AuthContext.js
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
// Logout mechanism implemented on timeout
```

### 1.3 Role-Based Access Control (RBAC)

**File**: `src/constants/userRoles.js`

- [ ] Role definitions correct:
  - STUDENT: Basic access only
  - INSTRUCTOR: Course management access
  - ADMIN: Full system access
  - COMPLIANCE_OFFICER: Compliance features only
  - DMV_ADMIN: DMV-specific features

**Code Reference**:
```javascript
// src/constants/userRoles.js
export const USER_ROLES = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
  COMPLIANCE_OFFICER: 'compliance_officer',
  DMV_ADMIN: 'dmv_admin'
};
```

- [ ] Role assignment logic verified
- [ ] Role validation on every protected route
- [ ] No role escalation vulnerabilities

**Route Protection Example**:
```javascript
// src/App.jsx - Protected routes verify role
const ProtectedRoute = ({ requiredRole, children }) => {
  const { user, hasRole } = useAuth();
  return hasRole(requiredRole) ? children : <Redirect to="/unauthorized" />;
};
```

### 1.4 Firebase Authentication Rules

- [ ] Only authenticated users can access Firestore
- [ ] Users cannot modify other users' data
- [ ] Admin operations protected

**Verification**:
```bash
# Check Firebase Console
Firestore Database → Rules
```

---

## 2. Firestore Security Rules

### 2.1 Security Rules File

**File**: `firestore.rules`

Critical security rules verified:

- [ ] Default deny policy: `match /{document=**} { allow read, write: if false; }`
- [ ] User data only readable by owner + admins
- [ ] Payment data immutable after creation
- [ ] Compliance data restricted to authorized users
- [ ] Audit logs append-only

**Sample Rule Verification**:
```javascript
// firestore.rules - Example verified rules

// Users can only read their own data
match /users/{userId} {
  allow read: if request.auth.uid == userId || isAdmin();
  allow write: if isAdmin(); // Users can't self-modify
}

// Payment data immutable
match /payments/{paymentId} {
  allow read: if isOwner() || isAdmin();
  allow create: if validatePayment(request.resource.data);
  allow update, delete: if false; // Never update/delete
}

// Audit logs append-only
match /auditLogs/{logId} {
  allow read: if isAdmin();
  allow create: if isServer();
  allow update, delete: if false;
}
```

### 2.2 Data Validation in Rules

- [ ] Field validation enforced at database level
- [ ] Data types validated (strings, numbers, booleans)
- [ ] Required fields checked
- [ ] Email format validated for email fields

**Example**:
```javascript
function validateEmail(email) {
  return email.matches('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
}

function validatePaymentData(data) {
  return data.amount > 0 &&
         data.amount <= 99999 &&
         data.courseId.size() > 0 &&
         data.userId.size() > 0;
}
```

### 2.3 Firestore Rules Deployment

- [ ] Rules tested locally before deployment
- [ ] Rules deployed to production
- [ ] Rules backup created

**Deploy Rules**:
```bash
firebase deploy --only firestore:rules
```

---

## 3. API Security

### 3.1 Cloud Functions Security

**Files**: `functions/src/payment/`, `functions/src/compliance/`

- [ ] All functions require authentication
- [ ] Input validation on all parameters
- [ ] Output sanitization before returning
- [ ] Rate limiting implemented (if applicable)

**Authentication Check Example**:
```javascript
// functions/src/payment/paymentFunctions.js
exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }
  
  // Verify user ID matches
  if (context.auth.uid !== data.userId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Cannot create payment for other users'
    );
  }
});
```

### 3.2 Input Validation

**File**: `src/utils/api/validators.js`

- [ ] All user inputs validated
- [ ] Whitelist approach used (allow known-good)
- [ ] Reject suspicious input patterns
- [ ] Length limits enforced

**Validation Example**:
```javascript
// src/utils/api/validators.js
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

export const validateCourseId = (courseId) => {
  if (typeof courseId !== 'string' || courseId.trim().length === 0) {
    throw new ValidationError('Invalid course ID');
  }
};
```

### 3.3 Output Sanitization

**File**: `src/utils/api/sanitizer.js`

- [ ] All user-generated content sanitized before display
- [ ] XSS prevention implemented
- [ ] HTML special characters escaped
- [ ] Dangerous JavaScript blocked

**Sanitization Example**:
```javascript
// src/utils/api/sanitizer.js
export const sanitizeHtml = (input) => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const sanitizeInput = (input, maxLength = 1000) => {
  if (typeof input !== 'string') return '';
  return input.trim().substring(0, maxLength);
};
```

---

## 4. Payment Security (Stripe Integration)

### 4.1 API Key Management

- [ ] Stripe publishable key in `.env` (public key, safe to expose)
- [ ] Stripe secret key in Firebase Cloud Functions (never in frontend)
- [ ] Keys never committed to repository
- [ ] Keys rotated periodically

**Verification**:
```bash
# Verify .env doesn't contain secret key
grep -i "sk_" .env  # Should return nothing

# Verify secret key only in Cloud Functions
grep -i "sk_" functions/  # Should find secret key only in appropriate files
```

### 4.2 Stripe Webhook Security

**File**: `functions/src/payment/paymentFunctions.js`

- [ ] Webhook signature verified with secret
- [ ] Webhook endpoint uses HTTPS only
- [ ] Idempotency keys implemented
- [ ] Duplicate payments prevented

**Verification Example**:
```javascript
// functions/src/payment/paymentFunctions.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

exports.stripeWebhook = functions.https.onRequest((req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Process verified event
  if (event.type === 'payment_intent.succeeded') {
    // Handle payment success
  }
  
  res.json({ received: true });
});
```

### 4.3 Payment Data Storage

- [ ] No full credit card numbers stored (Stripe handles this)
- [ ] Payment method IDs stored safely
- [ ] Amount and currency immutable
- [ ] Payment history append-only (no modifications)

---

## 5. Data Protection

### 5.1 Data Encryption

- [ ] HTTPS/TLS enforced (Firebase Hosting provides this)
- [ ] Sensitive data encrypted at rest in Firestore
- [ ] Encryption keys managed by Firebase/Google Cloud
- [ ] No sensitive data in logs

**Verification**:
```bash
# Verify Firebase Hosting uses HTTPS
curl -I https://fastrack-xxx.web.app
# Should show: Strict-Transport-Security header
```

### 5.2 PII (Personally Identifiable Information)

- [ ] User addresses not stored unnecessarily
- [ ] Phone numbers encrypted if stored
- [ ] SSNs never stored (if applicable)
- [ ] Access logs maintained for compliance
- [ ] Data retention policy defined

### 5.3 Backup & Recovery

- [ ] Automatic Firestore backups configured
- [ ] Backup schedule: Daily at 2 AM UTC
- [ ] Backup retention: 30 days
- [ ] Restore procedure documented and tested

**Verify Backups**:
```bash
# Via Firebase Console
Firestore Database → Backups
```

---

## 6. Logging & Monitoring

### 6.1 Logging Configuration

**File**: `src/services/loggingService.js`

- [ ] All authentication attempts logged
- [ ] All payment transactions logged
- [ ] All admin actions logged
- [ ] All errors logged with context

**Example**:
```javascript
// src/services/loggingService.js
export const logAuthEvent = (action, userId, success, error = null) => {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    timestamp,
    event: 'AUTH',
    action,
    userId,
    success,
    error: error?.message || null
  }));
};
```

### 6.2 Sensitive Data in Logs

- [ ] Passwords never logged
- [ ] API keys never logged
- [ ] Credit card data never logged
- [ ] PII minimized in logs
- [ ] User IDs logged (not emails)

### 6.3 Log Retention

- [ ] Logs retained for 90 days minimum
- [ ] Access logs separately retained for 1 year
- [ ] Encrypted logs storage
- [ ] Audit trail immutable

---

## 7. CORS & External Requests

### 7.1 CORS Configuration

**File**: `functions/src/common/`

- [ ] CORS restricted to expected origins
- [ ] Only necessary methods allowed (GET, POST, etc.)
- [ ] Credentials properly handled
- [ ] Preflight requests configured

**Example**:
```javascript
// functions/src/common/corsConfig.js
const corsOptions = {
  origin: ['https://fastrack-xxx.web.app', 'https://fastrack-xxx.firebaseapp.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  maxAge: 3600
};

const cors = require('cors')(corsOptions);
```

### 7.2 External API Calls

- [ ] All external API calls use HTTPS
- [ ] External services validated (Stripe, Google, etc.)
- [ ] Rate limiting on external calls
- [ ] Timeouts configured (5-10 seconds)

---

## 8. Error Handling & Information Disclosure

### 8.1 Error Messages

**File**: `src/api/errors/ApiError.js`

- [ ] Generic error messages shown to users
- [ ] Detailed errors only in server logs
- [ ] Stack traces never exposed to frontend
- [ ] SQL injection error patterns hidden

**Example**:
```javascript
// src/api/errors/ApiError.js
class ApiError extends Error {
  constructor(code, message, statusCode = 500, originalError = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    
    // Log original error only server-side
    if (originalError) {
      console.error('Internal Error:', originalError);
    }
  }

  toResponse() {
    // Generic message for user
    return {
      error: this.code,
      message: 'An error occurred. Please try again later.'
    };
  }
}
```

### 8.2 Debug Mode

- [ ] Debug mode disabled in production
- [ ] Verbose logging disabled in production
- [ ] Console errors hidden from users
- [ ] Development tools not exposed

**Verification**:
```javascript
// src/config/firebase.js
const isDevelopment = process.env.NODE_ENV === 'development';
export const enableDebugMode = isDevelopment;
```

---

## 9. Dependency Security

### 9.1 Known Vulnerabilities

- [ ] No known vulnerabilities in dependencies
- [ ] npm audit clean: `npm audit`
- [ ] Regular vulnerability scanning scheduled

**Verification**:
```bash
npm audit
# Should return: "0 vulnerabilities"

# Check for production dependencies
npm audit --production

# Check Cloud Functions
cd functions
npm audit
```

### 9.2 Dependency Versions

- [ ] No experimental/unstable versions used
- [ ] Patch versions up-to-date
- [ ] No obsolete dependencies
- [ ] Pinned critical dependency versions

**Example package.json**:
```json
{
  "dependencies": {
    "react": "18.2.0",
    "firebase": "10.7.1",
    "react-router-dom": "6.20.0"
  }
}
```

---

## 10. Secret Management

### 10.1 Secrets Not Committed

- [ ] `.env` file in `.gitignore`
- [ ] `.env.local` in `.gitignore`
- [ ] No API keys in source code
- [ ] No database credentials in code

**Verification**:
```bash
# Check .gitignore contains .env
grep "\.env" .gitignore

# Verify no secrets in git history (returns nothing is good)
git log -p -- . | grep -i "STRIPE_SECRET\|FIREBASE_KEY" | head
```

### 10.2 Environment Variables

- [ ] All secrets managed via environment variables
- [ ] Different secrets for dev/production
- [ ] Secrets never printed to console
- [ ] Secrets not passed as URL parameters

### 10.3 Firebase Service Account

- [ ] Service account key never committed
- [ ] Service account key secured
- [ ] Key rotation policy defined
- [ ] Only necessary permissions granted

---

## 11. Compliance & Legal

### 11.1 Privacy Policy

- [ ] Privacy policy created and published
- [ ] Privacy policy URL in footer: `/privacy`
- [ ] Privacy policy addresses:
  - Data collection practices
  - Data usage
  - Data retention
  - User rights

### 11.2 Terms of Service

- [ ] Terms of Service created
- [ ] TOS URL in footer: `/terms`
- [ ] TOS covers:
  - Acceptable use
  - Liability limitations
  - Payment terms

### 11.3 GDPR Compliance (if applicable)

- [ ] User data export functionality available
- [ ] User data deletion functionality available
- [ ] Data processing agreement with Firebase
- [ ] Right to be forgotten implemented

### 11.4 Audit Trail

**File**: `functions/src/common/auditLogger.js`

- [ ] All admin actions logged
- [ ] All data modifications logged
- [ ] Logs retained for compliance period
- [ ] Audit logs immutable

**Example**:
```javascript
// functions/src/common/auditLogger.js
export const logAuditEvent = async (action, actor, resource, changes) => {
  const auditLog = {
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    action,
    actor,
    resource,
    changes,
    ipAddress: getClientIp() // Track source
  };

  await admin.firestore().collection('auditLogs').add(auditLog);
};
```

---

## 12. Security Testing

### 12.1 Manual Testing

- [ ] Tested SQL injection attempts (should fail gracefully)
- [ ] Tested XSS attempts (should be sanitized)
- [ ] Tested authentication bypass (should fail)
- [ ] Tested authorization bypass (should fail)
- [ ] Tested CSRF attacks (should fail)

### 12.2 Automated Testing

- [ ] Security tests integrated in CI/CD
- [ ] Dependency scanning automated
- [ ] SAST (Static Analysis) configured
- [ ] Results reviewed before deployment

### 12.3 Penetration Testing

- [ ] Professional penetration test considered (future)
- [ ] Internal security review completed
- [ ] Known vulnerabilities addressed

---

## 13. Production Hardening

### 13.1 Environment Variables

- [ ] Production environment explicitly set: `NODE_ENV=production`
- [ ] Debug mode disabled
- [ ] Console logging minimized in production
- [ ] Performance monitoring enabled

### 13.2 Rate Limiting

- [ ] API rate limiting configured (if needed)
- [ ] Auth attempts limited: 5 failed attempts → 15 min lockout
- [ ] Payment attempts monitored for anomalies
- [ ] DDoS protection via Firebase/Cloudflare (if applicable)

### 13.3 Monitoring & Alerting

- [ ] Error rate alerts configured (> 1%)
- [ ] Latency alerts configured (> 3 seconds)
- [ ] Security event alerts configured
- [ ] Alert recipients configured
- [ ] On-call procedures defined

---

## Sign-Off

**Security Review Completed By**: _________________  
**Date**: _________________  
**Status**: 
- [ ] All items verified - Ready for production
- [ ] Items pending - Cannot launch yet
- [ ] Issues found - See notes below

**Notes**:
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

**Issues Requiring Resolution**:
1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

**Resolved Issues**:
1. _________________________________________________________________
2. _________________________________________________________________

---

## Post-Launch Review

Schedule security review:
- **1 Week Post-Launch**: Initial monitoring review
- **1 Month Post-Launch**: Full security audit
- **Quarterly**: Ongoing security reviews

**Last Updated**: December 2, 2025
