# Staging Deployment Guide

**Purpose:** Deploy to staging environment for 24-hour pre-production testing

---

## Pre-Deployment Checklist

- [ ] All code committed and pushed to GitHub
- [ ] `npm run test` passes (16/16 enrollment tests)
- [ ] `npx eslint src/` shows no warnings
- [ ] Manual test cases all passing (see `docs/testing/MANUAL_TEST_CASES.md`)
- [ ] Error scenarios reviewed (see `docs/testing/ERROR_SCENARIOS.md`)
- [ ] Load test verified (see `docs/testing/LOAD_TEST_GUIDE.md`)
- [ ] Staging Firebase project configured
- [ ] Staging environment variables set up

---

## Step 1: Prepare Staging Environment

### 1.1 Create/Verify Staging Firebase Project

```bash
# If using Firebase CLI
firebase projects:list

# Create new project if needed
firebase projects:create fastrack-staging
```

### 1.2 Set Staging Environment Variables

Create `.env.staging` in root:

```
REACT_APP_FIREBASE_API_KEY=YOUR_STAGING_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN=fastrack-staging.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=fastrack-staging
REACT_APP_FIREBASE_STORAGE_BUCKET=fastrack-staging.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=YOUR_STAGING_ID
REACT_APP_FIREBASE_APP_ID=YOUR_STAGING_APP_ID
```

### 1.3 Create Staging Database with Test Data

```bash
# Use Firebase Console or script to populate:
# - 2-3 test users
# - All 3 test courses
# - Sample enrollments
```

---

## Step 2: Build for Staging

```bash
# Build production bundle with staging config
REACT_APP_ENVIRONMENT=staging npm run build

# Output: ./build directory ready for deployment
```

---

## Step 3: Deploy to Staging Server

### Option A: Firebase Hosting (Recommended for small projects)

```bash
# Install Firebase CLI if needed
npm install -g firebase-tools

# Deploy to staging
firebase deploy --only hosting:fastrack-staging
```

### Option B: Vercel (If using Vercel)

```bash
vercel --prod --env staging
```

### Option C: Traditional Server

```bash
# Copy build folder to server
scp -r build/ user@staging-server:/var/www/fastrack/

# Restart application server (nginx/apache)
```

---

## Step 4: 24-Hour Monitoring & Testing

### 4.1 Daily Test Script (Run Each Day)

```bash
# Run at: 9am, 12pm, 3pm, 6pm, 9pm

# 1. Check all services are running
curl https://staging.fastrack-lms.com/health

# 2. Run manual test cases
# See: docs/testing/MANUAL_TEST_CASES.md

# 3. Check Firebase logs
firebase functions:log --only staging

# 4. Monitor for errors in browser console
# - No JavaScript errors
# - No network failures
# - No auth issues
```

### 4.2 Real User Simulation (if possible)

- Have 2-3 team members test:
  - Full enrollment flow
  - Course access
  - Payment handling
  - Session creation
  - Multiple courses

### 4.3 Monitor Metrics

- **Response Time:** Track average page load times
- **Error Rate:** Watch Firebase logs and browser console
- **Database Performance:** Check read/write latency
- **User Sessions:** Verify proper creation and tracking

---

## Step 5: Error Handling Testing

Before moving to production, manually test error scenarios:

```
Run through docs/testing/ERROR_SCENARIOS.md

Priority testing (must pass):
✅ Invalid payment amounts
✅ Duplicate payment attempts
✅ Network interruption recovery
✅ User authentication checks
✅ Permission validation
```

---

## Step 6: Sign-Off Checklist

**After 24 hours of successful staging testing:**

- [ ] All manual test cases passed
- [ ] No JavaScript errors in console
- [ ] All error scenarios handled correctly
- [ ] Database queries performant
- [ ] Authentication working
- [ ] Payment flow reliable
- [ ] Course access reliable
- [ ] Session tracking accurate
- [ ] Compliance features working
- [ ] No security issues detected

**Approved By:** _______________
**Date:** _______________

---

## Step 7: Production Deployment

Once staging sign-off complete, see `docs/deployment/PRODUCTION_CHECKLIST.md`

---

## Rollback Plan

If issues found during staging:

```bash
# Revert to previous version
git revert [commit-hash]

# Rebuild and redeploy
npm run build
firebase deploy --only hosting:fastrack-staging

# Or use previous build
firebase deploy --only hosting:fastrack-staging --archive previous-build.tar
```

---

## Common Issues & Solutions

### Issue: Firebase Config Mismatch
**Solution:** Double-check `.env.staging` matches Firebase console

### Issue: CORS Errors
**Solution:** Update Firebase security rules for staging domain

### Issue: Database Migration Failed
**Solution:** Manually verify Firestore collections and indexes exist

### Issue: Slow Performance
**Solution:** Check Firebase quota limits and upgrade if needed

---

## Monitoring Dashboard

**Recommended Tools:**
- Firebase Console (logs, metrics)
- Google Cloud Monitoring (if on GCP)
- Browser DevTools (performance, network)
- Custom logging if needed

---

## Contact & Escalation

**Issues found in staging?**

1. Document in GitHub issue
2. Notify development team
3. Do NOT proceed to production until resolved
4. Re-test after fix on staging

---

**Expected Timeline:** 24-48 hours from deployment

**Status:** [ ] Ready for staging / [ ] In progress / [ ] Complete

**Last Updated:** November 30, 2025
