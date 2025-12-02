# Monitoring & Logging Guide

## Production Monitoring Strategy

Complete guide for monitoring the Fastrack LMS in production, including logging architecture, alert configuration, and troubleshooting strategies.

---

## Logging Architecture

### Frontend Logging

**File**: `src/services/loggingService.js`

Centralized logging service for frontend events:

```javascript
// Import logging service
import loggingService from '../services/loggingService.js';

// Log authentication events
loggingService.logAuthEvent('LOGIN_SUCCESS', userId, true);

// Log errors
loggingService.logError('COURSE_LOAD_FAILED', error, { courseId });

// Log user actions
loggingService.logUserAction('ENROLLMENT_COMPLETED', { courseId, userId });

// Log payment events
loggingService.logPaymentEvent('PAYMENT_INITIATED', { amount, courseId });
```

### Cloud Functions Logging

**File**: `functions/src/common/auditLogger.js`

Server-side logging for function execution:

```javascript
// Log to Google Cloud Logging (automatic in Cloud Functions)
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  event: 'PAYMENT_CREATED',
  userId,
  amount,
  status: 'success'
}));

// Errors logged automatically
console.error('Payment processing failed:', error);
```

---

## Log Levels

Configure logging verbosity by environment:

| Level | Description | Frontend | Backend | Use Case |
|-------|-------------|----------|---------|----------|
| ERROR | Failures & exceptions | ✓ | ✓ | Production - Critical issues |
| WARN | Potential issues | ✗ | ✓ | Production - Non-critical issues |
| INFO | Significant events | ✓ | ✓ | Production - User actions, payments |
| DEBUG | Detailed diagnostics | ✗ | ✗ | Development only |
| TRACE | Very detailed logs | ✗ | ✗ | Development only |

### Configure Log Levels

```javascript
// src/config/logging.js
const LOG_LEVELS = {
  development: 'DEBUG',
  staging: 'INFO',
  production: 'ERROR'
};

export const getLogLevel = () => {
  const env = process.env.REACT_APP_ENVIRONMENT || 'development';
  return LOG_LEVELS[env];
};
```

---

## Log Aggregation

### Google Cloud Logging

Fastrack LMS uses Google Cloud Logging (automatic for Firebase):

**View Logs**:
1. Firebase Console → Logs
2. Filter by:
   - Log level (Error, Warning, Info)
   - Function name
   - Time range
   - Search term

**Access Logs**:
```bash
firebase functions:log --lines 50
firebase functions:log --limit 100
```

### Log Retention Policy

- **Application logs**: 30 days
- **Error logs**: 90 days
- **Audit logs**: 1 year
- **Payment logs**: 7 years (compliance)

---

## Key Metrics to Monitor

### Frontend Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Page Load Time | < 3s | > 5s |
| API Response Time | < 1s | > 2s |
| Error Rate | < 0.1% | > 1% |
| Session Duration | N/A | N/A |
| User Retention | > 80% | N/A |

### Backend Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Function Execution Time | < 1s | > 3s |
| Function Error Rate | < 0.1% | > 1% |
| Database Query Time | < 500ms | > 1s |
| Cold Start Time | < 5s | > 10s |
| Memory Usage | < 256MB | > 400MB |

### Business Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Payment Success Rate | > 99% | < 98% |
| Enrollment Rate | N/A | N/A |
| Course Completion Rate | N/A | N/A |
| User Satisfaction | N/A | N/A |

---

## Alert Configuration

### Critical Alerts (Immediate Notification)

Requires immediate action:

```javascript
// Error rate > 5%
AlertThreshold.ErrorRate.Critical = 0.05;

// Response time > 5 seconds
AlertThreshold.Latency.Critical = 5000; // ms

// Database connection fails
AlertThreshold.Database.Critical = 'CONNECTION_FAILED';

// Payment processing fails
AlertThreshold.Payment.Critical = 'STRIPE_ERROR';

// Security event detected
AlertThreshold.Security.Critical = 'UNAUTHORIZED_ACCESS';
```

### Warning Alerts (Investigate)

Warrants investigation within 1 hour:

```javascript
// Error rate > 1%
AlertThreshold.ErrorRate.Warning = 0.01;

// Response time > 2 seconds
AlertThreshold.Latency.Warning = 2000; // ms

// High memory usage > 80%
AlertThreshold.Memory.Warning = 0.80;

// Unusual traffic spike
AlertThreshold.Traffic.Warning = 'SPIKE_DETECTED';
```

### Alert Channels

Configure notifications via:

- **Email**: Developer email for critical alerts
- **Firebase Console**: Real-time dashboard alerts
- **Slack** (optional): Webhook integration
- **PagerDuty** (optional): On-call escalation

**Firebase Alert Configuration**:
1. Firebase Console → Alerts
2. Click "Create Alert"
3. Set threshold and notification method
4. Save

---

## Performance Monitoring Dashboard

### Setup Firebase Analytics Dashboard

**Access**: Firebase Console → Analytics → Dashboard

**Monitor**:
- Real-time user count
- Page views by path
- User retention
- Bounce rate
- Conversion rate (enrollments)

### Custom Metrics

Track business-specific metrics:

```javascript
// Track course enrollment
firebase.analytics().logEvent('course_enrollment', {
  course_id: courseId,
  user_type: userRole,
  timestamp: Date.now()
});

// Track payment completion
firebase.analytics().logEvent('payment_completed', {
  amount: paymentAmount,
  course_id: courseId,
  timestamp: Date.now()
});

// Track course completion
firebase.analytics().logEvent('course_completed', {
  course_id: courseId,
  completion_time: durationMs,
  timestamp: Date.now()
});
```

---

## Error Tracking

### Error Patterns to Monitor

```javascript
// Authentication errors
"AUTH_INVALID_CREDENTIALS"
"AUTH_USER_NOT_FOUND"
"AUTH_TOO_MANY_ATTEMPTS"

// Payment errors
"STRIPE_PAYMENT_FAILED"
"STRIPE_INVALID_CARD"
"STRIPE_RATE_LIMIT"

// Database errors
"FIRESTORE_PERMISSION_DENIED"
"FIRESTORE_DOCUMENT_NOT_FOUND"
"FIRESTORE_QUOTA_EXCEEDED"

// Server errors
"INTERNAL_SERVER_ERROR"
"TIMEOUT_ERROR"
"FUNCTION_EXECUTION_TIMEOUT"
```

### Error Log Format

```javascript
// Standard error log
{
  timestamp: "2025-12-02T10:30:45.123Z",
  event: "ERROR",
  error_code: "STRIPE_PAYMENT_FAILED",
  error_message: "Card declined",
  user_id: "user123",
  context: {
    courseId: "course456",
    amount: 99.99,
    attempt: 1
  },
  stack_trace: "..." // Server-side only
}
```

---

## Database Monitoring

### Firestore Usage

Monitor via Firebase Console → Firestore → Stats:

- **Reads/day**: Track read operations
- **Writes/day**: Track write operations
- **Deletes/day**: Track deletions
- **Storage**: Total database size
- **Network**: Data transferred

### Performance Monitoring

```javascript
// Monitor query performance
const startTime = Date.now();
const snapshot = await db.collection('users').doc(userId).get();
const duration = Date.now() - startTime;

console.log(`Firestore query: ${duration}ms`);

if (duration > 1000) {
  console.warn(`Slow query detected: ${duration}ms`);
}
```

### Index Optimization

View required indexes in Firebase Console → Firestore → Indexes:

- Verify all indexes created
- Monitor index usage
- Delete unused indexes (improves write performance)

---

## Security Monitoring

### Failed Authentication Attempts

```javascript
// Monitor failed logins
logAuthEvent('LOGIN_FAILED', userId, false, {
  reason: 'INVALID_PASSWORD',
  attempts: failedAttempts,
  ip_address: clientIp
});

// Alert if multiple failures
if (failedAttempts > 5) {
  notifySecurityTeam('Potential brute force attack', {
    userId,
    attempts: failedAttempts
  });
}
```

### Unauthorized Access Attempts

```javascript
// Log permission denials
if (!userHasPermission(action)) {
  logAuditEvent('UNAUTHORIZED_ACCESS', userId, {
    action,
    resource,
    ip_address: clientIp
  });
  
  // Alert on repeated attempts
  if (checkRepeatedViolations(userId)) {
    notifySecurityTeam('Repeated unauthorized access', { userId });
  }
}
```

### Suspicious Activity Detection

Monitor for:
- Multiple failed logins
- Unusual API patterns
- Abnormal transaction amounts
- Geographic anomalies
- Data export attempts

---

## Regular Monitoring Tasks

### Daily (Morning)

- [ ] Check error rate: Dashboard → Monitoring
- [ ] Review critical alerts: Firebase Console
- [ ] Verify functions operational: `firebase functions:list`
- [ ] Check database health: Firestore → Stats
- [ ] Review payment transactions: Payment logs

### Weekly

- [ ] Review performance trends: Analytics
- [ ] Check security logs: Audit trail
- [ ] Verify backups: Firebase Console → Backups
- [ ] Review user feedback: Support channels
- [ ] Check budget: Firebase Console → Billing

### Monthly

- [ ] Full security audit: SECURITY_CHECKLIST.md
- [ ] Performance review: All metrics
- [ ] Dependency updates: `npm audit`
- [ ] Database optimization: Indexes, queries
- [ ] Disaster recovery test: Restore from backup

---

## Troubleshooting Guide

### High Error Rate

**Symptoms**: Error rate > 1%

**Steps**:
1. Check recent logs: `firebase functions:log --lines 100`
2. Identify error pattern: Most common error?
3. Check affected users: Filter logs by user
4. Determine root cause:
   - Code change deployed?
   - External service down (Stripe)?
   - Database issue?
5. Implement fix or rollback if necessary

### Slow Response Times

**Symptoms**: API response time > 2 seconds

**Steps**:
1. Check Firebase Functions logs for slow functions
2. Check database query performance:
   - Use composite indexes
   - Reduce data retrieved
   - Add field filters
3. Check network latency: Geographic distribution
4. Profile function execution:
   - Add timing logs
   - Identify bottlenecks
   - Optimize queries

### Payment Processing Failures

**Symptoms**: Payment success rate < 98%

**Steps**:
1. Check Stripe webhook logs: Webhook delivery status
2. Verify Stripe API key: Correct credentials?
3. Check payment function logs: Error messages?
4. Verify database permissions: Can write to payments?
5. Test payment flow: Use test card

---

## Scaling Indicators

Monitor these indicators for scaling needs:

| Indicator | Action Needed | Current |
|-----------|---------------|---------|
| Concurrent users > 1000 | Increase Cloud Functions memory | _____ |
| Database read/writes > 100K/day | Optimize indexes, add caching | _____ |
| Memory usage > 80% | Increase function memory | _____ |
| Latency > 3 seconds | Investigate slow queries | _____ |
| Errors > 1% | Investigate root cause | _____ |

---

**Last Updated**: December 2, 2025
