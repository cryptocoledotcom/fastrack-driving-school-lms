# Sentry Setup Guide

## Overview

Sentry provides real-time error tracking, performance monitoring, and session replay for the Fastrack LMS application. This guide covers setup, configuration, and usage.

---

## Step 1: Create Sentry Account & Project

1. Go to [sentry.io](https://sentry.io)
2. Sign up for a free account
3. Create a new organization for Fastrack Driving School
4. Create two projects:
   - **Project 1**: `fastrack-lms-web` (React frontend)
   - **Project 2**: `fastrack-lms-functions` (Cloud Functions backend)

---

## Step 2: Configure Frontend DSN

### Get Frontend DSN
1. In Sentry dashboard, select the `fastrack-lms-web` project
2. Go to **Settings** → **Projects** → **Client Keys (DSN)**
3. Copy the DSN (looks like: `https://your_key@your_id.ingest.sentry.io/your_number`)

### Add to .env
```bash
VITE_SENTRY_DSN=https://your_key@your_id.ingest.sentry.io/your_number
```

### Optional: Enable Session Replay
1. In Sentry, go to **Project Settings** → **Performance**
2. Enable "Session Replay"
3. Set replay sample rate (recommended: 10% for production, 100% for staging)

---

## Step 3: Configure Cloud Functions DSN

### Get Backend DSN
1. In Sentry dashboard, select the `fastrack-lms-functions` project
2. Go to **Settings** → **Projects** → **Client Keys (DSN)**
3. Copy the DSN

### Add as Firebase Secret
```bash
cd functions

# Add the secret to Firebase
firebase functions:config:set sentry.dsn="https://your_key@your_id.ingest.sentry.io/your_number"

# Deploy functions
firebase deploy --only functions
```

**Alternatively**, if using `.env.local` for local development:
```bash
# In functions/.env.local
SENTRY_DSN=https://your_key@your_id.ingest.sentry.io/your_number
```

---

## Step 4: Verify Integration

### Frontend
1. Start dev server: `npm run dev`
2. Open browser console and trigger a test error:
   ```javascript
   throw new Error('Test error from Sentry');
   ```
3. Check Sentry dashboard → Issues → Recent. You should see your error.

### Cloud Functions
1. Trigger a Cloud Function that throws an error
2. Check Sentry dashboard → `fastrack-lms-functions` → Issues

---

## Usage in Code

### Capturing Errors (Automatic)
Most errors are captured automatically via the Sentry integration. No additional code needed.

### Capturing Errors (Manual)
```javascript
import { captureError } from '@/services/errorTrackingService';

try {
  // some code
} catch (error) {
  captureError(error, {
    component: 'EnrollmentForm',
    action: 'submitPayment',
    courseId: '123',
  });
}
```

### Sending Messages
```javascript
import { captureMessage } from '@/services/errorTrackingService';

captureMessage('Payment processing started', 'info');
```

### Setting User Context (After Login)
```javascript
import { setUserContext } from '@/services/errorTrackingService';

// After successful authentication
setUserContext(userId, userEmail, userName);
```

### Clearing User Context (On Logout)
```javascript
import { clearUserContext } from '@/services/errorTrackingService';

clearUserContext();
```

### Adding Breadcrumbs (User Actions)
```javascript
import { addBreadcrumb } from '@/services/errorTrackingService';

addBreadcrumb('User started course', 'user-action', 'info', {
  courseId: '123',
  courseName: 'Ohio Driving Rules',
});
```

---

## Sentry Dashboard Features

### Issues
- View all errors and exceptions
- Group related errors
- Assign to team members
- Set status (Resolved, Ignored, etc.)

### Performance
- Monitor transaction duration
- Identify slow endpoints
- Track performance trends

### Session Replay
- Watch user sessions that resulted in errors
- Replay interactions leading to crashes
- Privacy-safe (blocks sensitive data)

### Alerts
Configure alerts for:
- Error spike (e.g., 10 errors in 5 minutes)
- New issues
- Critical errors in production

---

## Best Practices

1. **Set Environment**: Configure `VITE_ENVIRONMENT` in `.env` (development/staging/production)
2. **User Context**: Always set user context after authentication
3. **Breadcrumbs**: Add breadcrumbs for critical user actions
4. **Sampling**: Use lower sample rates in production to control costs
5. **Ignoring Errors**: Configure Sentry to ignore known, non-critical errors
6. **Privacy**: Enable `maskAllText` in Sentry config to hide sensitive user data

---

## Troubleshooting

### Errors not appearing in Sentry?
1. Check that `VITE_SENTRY_DSN` is set in `.env`
2. Verify DSN is correct (no typos)
3. Check browser DevTools → Network tab for `sentry.io` requests
4. Ensure browser allows CORS requests to `sentry.io`

### Cloud Functions errors not captured?
1. Verify `SENTRY_DSN` environment variable is set
2. Check Cloud Functions logs: `firebase functions:log`
3. Ensure `initSentry()` is called before other imports

### Session Replay not working?
1. Enable "Session Replay" in Sentry project settings
2. Check sample rate is > 0%
3. Verify replay integration is included in `src/config/sentry.js`

---

## Cost Management

**Sentry Free Plan** includes:
- 5,000 errors/month
- 10,000 transactions/month
- 100 session replays/month

**For Production**: Consider paid plan when limits are exceeded.

**To reduce costs**:
- Lower `tracesSampleRate` (e.g., 0.05 = 5%)
- Lower `replaysSessionSampleRate`
- Increase error filtering rules
- Use "Release Tracking" to deduplicate errors

---

## Documentation
- [Sentry Docs](https://docs.sentry.io/)
- [Sentry React Integration](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Node.js Integration](https://docs.sentry.io/platforms/node/)
