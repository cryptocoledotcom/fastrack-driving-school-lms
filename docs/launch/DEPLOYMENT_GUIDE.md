# Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Fastrack Learning Management System to production. As a solo developer, this workflow assumes manual deployment with careful verification at each stage.

**Deployment Target**: Firebase Hosting (Frontend) + Firebase Cloud Functions (Backend)  
**Estimated Time**: 30-45 minutes  
**Frequency**: As needed after code review and testing

---

## Pre-Deployment Checklist

Before deploying, verify the following:

- [ ] All tests passing locally (`npm test`)
- [ ] Build completes without errors (`npm run build`)
- [ ] Zero ESLint warnings
- [ ] Code reviewed and merged to main branch
- [ ] Environment variables verified in `.env`
- [ ] Database backup created (manual via Firebase Console)
- [ ] Git tag created for release version
- [ ] No uncommitted changes in repository

---

## Environment Setup

### 1. Verify Environment Configuration

Your `.env` file should contain:

```env
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=fastrack-xxx.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=fastrack-xxx
REACT_APP_FIREBASE_STORAGE_BUCKET=fastrack-xxx.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc...
REACT_APP_STRIPE_PUBLIC_KEY=pk_live_...
NODE_ENV=production
```

**Location**: Project root (not committed to git)

### 2. Firebase Project Configuration

Verify Firebase project settings:

```bash
firebase projects:list
```

Expected output for Fastrack:
```
fastrack-driving-school-lms (123456789)
```

Ensure you're targeting the correct project:

```bash
firebase use fastrack-driving-school-lms
```

### 3. Verify Cloud Functions Environment

Check `functions/.env.local` (if using emulator) or configure via Firebase Console:

```bash
cd functions
firebase functions:config:get
```

Ensure these are set (if needed for your functions):
- Stripe API keys
- Admin credentials
- Any external service configurations

---

## Deployment Workflow

### Step 1: Prepare Frontend Build

```bash
# From project root
npm install
npm run build
```

**Expected Output**:
```
> react-scripts build

Creating an optimized production build...
The build folder is ready to be deployed.
...
Bundle Analysis:
main.xxx.js
```

**Verification**:
- Build completes with 0 errors
- `build/` folder created
- No console warnings displayed

### Step 2: Test Frontend Build Locally

```bash
# Install serve to test production build
npm install -g serve

# Serve the production build locally
serve -s build
```

Visit `http://localhost:3000` and verify:
- [ ] Application loads without errors
- [ ] Authentication flow works
- [ ] Dashboard renders correctly
- [ ] No console errors (F12)
- [ ] Network requests successful

**Stop serve**: Press `Ctrl+C`

### Step 3: Deploy Frontend to Firebase Hosting

```bash
# Deploy frontend only
firebase deploy --only hosting
```

**Progress Output**:
```
=== Deploying to 'fastrack-xxx'...

i  deploying hosting
i  hosting: preparing build folder for upload...
i  hosting: uploading new files [xx/xx]
✔  hosting (completed in Xs)

✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/fastrack-xxx
Hosting URL: https://fastrack-xxx.web.app
```

**Verification**:
- [ ] Deployment completes successfully
- [ ] Visit hosted URL
- [ ] Application loads from Firebase Hosting domain
- [ ] All features functional

### Step 4: Deploy Cloud Functions

```bash
# Deploy functions only
cd functions
npm install  # Ensure all dependencies updated
npm run deploy
```

**Progress Output**:
```
=== Deploying to 'fastrack-xxx'...

i  deploying functions
i  functions: ensuring required API google.cloud.functions.v2 is enabled...
i  functions: ensuring required API cloudbuild.googleapis.com is enabled...
✔ functions[payment/createCheckoutSession(us-central1)] Successful update operation.
✔ functions[payment/createPaymentIntent(us-central1)] Successful update operation.
✔ functions[payment/stripeWebhook(us-central1)] Successful update operation.
✔ functions[certificate/generateCertificate(us-central1)] Successful update operation.
✔ functions[compliance/auditComplianceAccess(us-central1)] Successful update operation.
✔ functions[compliance/generateComplianceReport(us-central1)] Successful update operation.
✔ functions[user/createUser(us-central1)] Successful update operation.

✔  Deploy complete!
```

**Verification**:
- [ ] All functions deployed successfully
- [ ] No deployment errors
- [ ] Function URLs generated

### Step 5: Verify Function Endpoints

View deployed functions via Firebase Console:

```bash
firebase functions:list
```

Expected output:
```
✔  Functions list retrieved.

NAME                                                    STATUS   TRIGGER             AVAILABLE   CREATED
payment-createCheckoutSession(us-central1)             active   http                yes         2025-12-02
payment-createPaymentIntent(us-central1)               active   http                yes         2025-12-02
payment-stripeWebhook(us-central1)                     active   http                yes         2025-12-02
certificate-generateCertificate(us-central1)          active   http                yes         2025-12-02
compliance-auditComplianceAccess(us-central1)         active   http                yes         2025-12-02
compliance-generateComplianceReport(us-central1)      active   http                yes         2025-12-02
user-createUser(us-central1)                           active   http                yes         2025-12-02
```

---

## Post-Deployment Verification

### 1. Frontend Verification

Visit production URL: `https://fastrack-xxx.web.app`

Test each major feature:

```
✓ Homepage loads
✓ Authentication (login/signup)
✓ Dashboard accessible
✓ Course listing visible
✓ Student enrollment flow
✓ Admin panel accessible
✓ Analytics dashboard
✓ Compliance reporting
✓ User management
```

### 2. Backend Verification

Test API calls from the deployed frontend:

```bash
# Monitor function logs in real-time
firebase functions:log --lines 50
```

Verify in logs:
- [ ] No error entries
- [ ] Expected function calls executing
- [ ] Response times acceptable (<2 seconds)

### 3. Database Verification

Check Firestore via Firebase Console:

```
Dashboard → Firestore Database → Data
```

Verify:
- [ ] Collections present (users, courses, enrollments, etc.)
- [ ] No corruption visible
- [ ] Expected data exists

### 4. Monitoring & Alerts

Set up monitoring in Firebase Console:

```
Functions → function name → Monitoring
```

Verify:
- [ ] Execution time charts loading
- [ ] Error rates at 0%
- [ ] No function timeouts

---

## Rollback Procedures

### Quick Rollback (Last Deployment)

If critical issues detected immediately:

```bash
# Rollback to previous version
firebase hosting:channel:deploy --only hosting rollback

# Or redeploy previous build manually
firebase deploy --only hosting
```

### Complete Rollback

If full rollback needed:

```bash
# 1. Switch back to previous frontend version
git checkout <previous-commit>

# 2. Rebuild and deploy
npm run build
firebase deploy --only hosting

# 3. Redeploy previous Cloud Functions
cd functions
npm run deploy
```

### Manual Function Rollback

To rollback individual functions without frontend redeployment:

1. Via Firebase Console: Functions → Select Function → Delete & Redeploy Previous
2. Via CLI: Redeploy from previous code commit

---

## Monitoring Post-Deployment

### Daily Checks

After deployment, monitor for 24 hours:

1. **Check Logs** (Morning)
   ```bash
   firebase functions:log --lines 100
   ```

2. **Verify Error Rate** (Throughout Day)
   - Visit Firebase Console
   - Functions → Monitoring
   - Verify error rates remain at 0%

3. **User Feedback** (Ongoing)
   - Monitor for reported issues
   - Check error tracking system
   - Verify no data corruption

### Weekly Review

```bash
# Generate deployment report
firebase deploy:report
```

Review:
- [ ] All deployments successful
- [ ] Function execution times stable
- [ ] No performance degradation
- [ ] Database growth within expectations

---

## Common Issues & Solutions

### Issue: "Build folder not found"

**Solution**:
```bash
npm install
npm run build
```

Ensure `build/` folder exists before deploying.

### Issue: "Functions timeout during deployment"

**Solution**:
```bash
# Increase timeout in firebase.json
{
  "functions": {
    "timeoutSeconds": 540
  }
}

# Then redeploy
firebase deploy --only functions
```

### Issue: "CORS errors in production"

**Solution**: Verify CORS configuration in `functions/src/common/`:

```javascript
// Check corsOptions in function files
const corsOptions = {
  origin: 'https://fastrack-xxx.web.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};
```

### Issue: "Environment variables not loading"

**Solution**: Verify `.env` file location and content:

```bash
# Check file exists in project root
ls -la .env

# Verify format (no quotes needed)
cat .env | grep REACT_APP_
```

Restart dev server or rebuild after changing `.env`.

### Issue: "Firebase authentication fails"

**Solution**: Verify credentials in `.env`:

```bash
# Test connection
firebase login
firebase projects:list
```

Ensure project ID matches between `.env` and `firebase.json`.

---

## Performance Benchmarks

After successful deployment, establish baseline metrics:

| Metric | Target | Current |
|--------|--------|---------|
| Frontend Load Time | < 3s | _____ |
| API Response Time | < 1s | _____ |
| Database Query Time | < 500ms | _____ |
| Function Cold Start | < 5s | _____ |
| Uptime | 99.9% | _____ |

---

## Deployment Checklist Template

Use this for each deployment:

```
DEPLOYMENT CHECKLIST - [DATE]
================================
Pre-Deployment:
  ☐ Tests passing
  ☐ Build successful
  ☐ No ESLint warnings
  ☐ Environment verified
  ☐ Backup created
  ☐ Git tag created

Deployment:
  ☐ Frontend build created
  ☐ Frontend build tested locally
  ☐ Frontend deployed to hosting
  ☐ Cloud functions deployed
  ☐ Function endpoints verified

Post-Deployment:
  ☐ Production URL tested
  ☐ All features working
  ☐ No errors in logs
  ☐ Database integrity verified
  ☐ Performance acceptable

Sign-Off:
  Deployed By: ________________
  Date/Time: ___________________
  Status: ☐ Successful ☐ Rolled Back
```

---

## Additional Resources

- [Firebase Deployment Documentation](https://firebase.google.com/docs/hosting/deploying)
- [Cloud Functions Deployment](https://firebase.google.com/docs/functions/write-deploy-run)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

**Last Updated**: December 2, 2025  
**Maintained By**: Solo Developer
