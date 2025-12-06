# Environment Configuration Guide

## Overview

This guide explains all environment variables needed for development, staging, and production deployments of the Fastrack LMS. Proper configuration is critical for security and functionality.

---

## Environment Variables Location

```
Project Root/
├── .env                    # Production environment (NOT committed)
├── .env.local             # Local development overrides (NOT committed)
├── .env.example           # Template for new developers (COMMITTED)
└── functions/
    └── .env.local         # Cloud Functions config (NOT committed)
```

**IMPORTANT**: Never commit `.env` or `.env.local` to git. Both are in `.gitignore`.

---

## Frontend Environment Variables (.env)

### Firebase Configuration

All Firebase credentials are found in Firebase Console → Project Settings

```env
# NOTE: Fastrack uses Vite, so all variables use VITE_ prefix (not REACT_APP_)
VITE_FIREBASE_API_KEY=AIzaSy...your-api-key...
VITE_FIREBASE_AUTH_DOMAIN=fastrack-xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fastrack-driving-school-lms
VITE_FIREBASE_STORAGE_BUCKET=fastrack-xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcd1234efgh5678ijkl
```

**How to Get These Values**:

1. Visit [Firebase Console](https://console.firebase.google.com)
2. Select project: **fastrack-driving-school-lms**
3. Click settings icon (⚙️) → Project Settings
4. Scroll to "Your apps" section
5. Select Web app (Icon: `</>`)
6. Copy all values from the config and paste into `.env`:

**Example .env file** (values are examples):
```env
# Firebase Configuration (Vite prefix)
VITE_FIREBASE_API_KEY=AIzaSyA1b2C3d4E5f6G7h8I9j0K1L2M3N4O5P6Q7R
VITE_FIREBASE_AUTH_DOMAIN=fastrack-lms.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fastrack-driving-school-lms
VITE_FIREBASE_STORAGE_BUCKET=fastrack-lms.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456ghi789jkl

# Stripe Configuration (Public Key ONLY - Safe to expose)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_abcd1234efgh5678ijkl9mno0pqr

# Sentry Error Tracking (Frontend)
VITE_SENTRY_DSN=https://your-key@o4510483033292800.ingest.us.sentry.io/4510483046727680

# Environment
VITE_ENVIRONMENT=production


# Environment
REACT_APP_ENVIRONMENT=production
NODE_ENV=production
```

### Stripe Configuration

Stripe provides public and secret keys for payment processing.

**Public Key** (safe to expose in frontend):
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**How to Get Stripe Public Key**:
1. Visit [Stripe Dashboard](https://dashboard.stripe.com)
2. Developers → API Keys
3. Copy "Publishable key (Live)"

**Secret Key** (NEVER in frontend - Cloud Functions only):
- Keep secret key in Cloud Functions environment only
- Store in Firebase Cloud Functions environment variables
- Never expose in `.env` or frontend code

### Environment Flags

```env
# Development: Full logging, warnings visible
VITE_ENVIRONMENT=development
NODE_ENV=development

# Staging: Production-like, enhanced logging
VITE_ENVIRONMENT=staging
NODE_ENV=production

# Production: Optimized, minimal logging
VITE_ENVIRONMENT=production
NODE_ENV=production
```

---

### Sentry Configuration (Error Tracking)

Sentry provides real-time error tracking and performance monitoring for both frontend and backend.

**Frontend DSN** (safe to expose - only logs errors to your Sentry project):
```env
VITE_SENTRY_DSN=https://2fba5c7771aef0df5b638c87a349920f@o4510483033292800.ingest.us.sentry.io/4510483046727680
```


## Cloud Functions Environment Variables

Cloud Functions environment variables are stored in **Firebase** (not `.env`).

### Accessing Cloud Functions Env Vars

```bash
cd functions
firebase functions:config:get
```

### Setting Cloud Functions Env Vars

```bash
# Set Stripe secret key
firebase functions:config:set stripe.secret_key="sk_live_..."

# Set Stripe webhook secret
firebase functions:config:set stripe.webhook_secret="whsec_..."

# Deploy with new config
npm run deploy
```

### Required Cloud Functions Configuration

```bash
# Stripe Payment Processing
firebase functions:config:set stripe.secret_key="sk_live_abc123..."
firebase functions:config:set stripe.webhook_secret="whsec_test_abc123..."

# Admin SDK (Firebase handles automatically)
# No additional configuration needed - uses service account
```

### Access Config in Cloud Functions

```javascript
// functions/src/payment/paymentFunctions.js
const functions = require('firebase-functions');

const stripeSecretKey = functions.config().stripe.secret_key;
const stripe = require('stripe')(stripeSecretKey);
```

---

## Production Environment Setup

### Production Checklist

- [ ] All values in `.env` are production values
- [ ] Stripe public key is live key (pk_live_*)
- [ ] Firebase project is production project
- [ ] NODE_ENV=production
- [ ] Debug mode disabled
- [ ] Analytics enabled
- [ ] Error tracking enabled
- [ ] Logging configured for production

### Production .env Template

```env
# PRODUCTION ENVIRONMENT - DO NOT MODIFY LIGHTLY

# Firebase Production Configuration (Vite prefix)
VITE_FIREBASE_API_KEY=AIzaSy...production-key...
VITE_FIREBASE_AUTH_DOMAIN=fastrack-xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fastrack-driving-school-lms
VITE_FIREBASE_STORAGE_BUCKET=fastrack-xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:production-id

# Stripe Live Key (Public - Safe to expose)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SUtdlFqT72Uaf78YrNlJbMsCwxQnDrGFAsRNKAxFJ5pY70xjMhc1GsIl0BloT0JL88ph1e5xNE6EX2Lg4reVN0100ve6AvzqS

# Sentry Error Tracking (Production - 10% sampling)
VITE_SENTRY_DSN=https://2fba5c7771aef0df5b638c87a349920f@o4510483033292800.ingest.us.sentry.io/4510483046727680

# Production Settings
VITE_ENVIRONMENT=production
NODE_ENV=production

```

---

## Verification Checklist

### Before Production Deployment

- [ ] Production `.env` created with live values
- [ ] All values triple-checked (especially Stripe keys)
- [ ] Firebase production project verified
- [ ] Backup of `.env` created
- [ ] No debug flags enabled
- [ ] All values secured in password manager

---

**Last Updated**: December 6, 2025 (Vite/Sentry updates)