---
description: Issue #4 Load Test Guide - Concurrent Payment Verification
alwaysApply: true
---

# Load Test Guide: Concurrent Payments

**Test**: 100 concurrent payments to verify atomic operations prevent race conditions  
**Purpose**: Validate Issue #4 fix under production-like load  
**Location**: `load-test.js`

---

## Overview

The load test simulates 100 concurrent payments to the same enrollment, each paying $10, for a total of $1,000. This verifies that:

1. **No Data Loss**: All payments are recorded in the final amount
2. **O(1) Consistency**: The atomic operations guarantee consistency regardless of concurrency
3. **Race Condition Fix**: No overwrites occur despite simultaneous operations

---

## Prerequisites

### Firebase Service Account Credentials

The load test requires Firebase Admin SDK authentication. Provide credentials via **one** of these methods:

#### Option 1: Environment Variable (Recommended for CI/CD)
```bash
export FIREBASE_CONFIG='{"type":"service_account","project_id":"your-project",...}'
npm run load-test
```

#### Option 2: Local Service Account File
Place `serviceAccountKey.json` in the project root:
```
project-root/
├── package.json
├── load-test.js
└── serviceAccountKey.json  ← Firebase service account JSON file
```

Then run:
```bash
npm run load-test
```

### Getting Firebase Service Account Credentials

1. Go to **Firebase Console** → Your Project → **Settings** (gear icon)
2. Click **Service Accounts** tab
3. Click **Generate New Private Key** button
4. Save the downloaded JSON file

---

## Running the Load Test

### Basic Usage
```bash
npm run load-test
```

### With Environment Variable
```bash
FIREBASE_CONFIG='{"type":"service_account","project_id":"fastrack-lms",...}' npm run load-test
```

### Expected Output
```
ℹ Firebase Admin SDK initialized
ℹ Creating test enrollment for user: load-test-user-1732901000000, course: fastrack-complete
✓ Test enrollment created: 1000 amount due

Starting 100 Concurrent Payments

ℹ Completed 10/100 payments
ℹ Completed 20/100 payments
...
✓ All 100 payment operations completed in 2345ms
✓ Successful: 100, Failed: 0

Verifying Enrollment State

ℹ Expected amountPaid: $1000
ℹ Actual amountPaid: $1000
ℹ Expected amountDue: $0
ℹ Actual amountDue: $0
✓ All payments recorded (O(1) consistency achieved)
✓ Amount due calculated correctly
✓ Total consistency verified: $1000 + $0 = $1000

Load Test Summary Report

Test Configuration:
  • Concurrent Payments: 100
  • Payment Amount Each: $10
  • Total Expected: $1000
  • Initial Amount Due: $1000
  • Test User: load-test-user-1732901000000
  • Test Course: fastrack-complete

Execution Results:
  • Successful: 100
  • Failed: 0
  • Duration: 2345ms

Verification Results:
  • Data Loss Check: ✓ PASSED
  • Consistency Check: ✓ PASSED
  • Atomic Operations: ✓ VERIFIED

Conclusion:
  ✓ Issue #4 Fix VALIDATED
  Atomic operations prevent race conditions under concurrent load.
```

---

## What the Test Does

### 1. Setup Phase
- Initializes Firebase Admin SDK with provided credentials
- Creates a test enrollment with $1000 amount due
- Records initial state

### 2. Concurrent Payment Phase
- Launches 100 simultaneous payment operations
- Each operation simulates the atomic `increment()` pattern from the fix
- Tracks successful and failed operations
- Reports progress every 10 payments

### 3. Verification Phase
- Retrieves final enrollment state
- Validates all payments were recorded:
  - `amountPaid` should be exactly $1000
  - `amountDue` should be exactly $0
- Checks consistency: `amountPaid + amountDue = originalAmount`
- Verifies no data loss occurred

### 4. Cleanup Phase
- Deletes the test enrollment
- Closes Firebase connection

---

## Interpreting Results

### ✓ PASSED (Success)
```
Data Loss Check: ✓ PASSED
Consistency Check: ✓ PASSED
Atomic Operations: ✓ VERIFIED

Issue #4 Fix VALIDATED
```

**Meaning**: Atomic operations successfully prevented race conditions. All 100 concurrent payments were recorded without any data loss.

### ✗ FAILED (Failure)
```
Data Loss Check: ✗ FAILED
Expected amountPaid: $1000
Actual amountPaid: $900 (or any value < $1000)

Issue #4 Fix FAILED
```

**Meaning**: Some payments were lost due to race conditions. This indicates the atomic operations fix is not working properly.

---

## Test Configuration

Modify these constants in `load-test.js` to adjust test parameters:

```javascript
const NUM_CONCURRENT_PAYMENTS = 100;      // Number of concurrent payments
const PAYMENT_AMOUNT = 10;                 // Amount per payment ($)
const INITIAL_AMOUNT_DUE = 1000;          // Starting course price ($)
```

### Example Configurations

**Light Load** (10 payments):
```javascript
const NUM_CONCURRENT_PAYMENTS = 10;
const PAYMENT_AMOUNT = 100;
```

**Medium Load** (50 payments):
```javascript
const NUM_CONCURRENT_PAYMENTS = 50;
const PAYMENT_AMOUNT = 20;
```

**Heavy Load** (500 payments):
```javascript
const NUM_CONCURRENT_PAYMENTS = 500;
const PAYMENT_AMOUNT = 2;
```

---

## Troubleshooting

### "Firebase credentials not found"
```
✗ Firebase initialization failed: Firebase credentials not found.
Set FIREBASE_CONFIG env var or place serviceAccountKey.json in project root.
```

**Solution**: 
- Download service account JSON from Firebase Console
- Save as `serviceAccountKey.json` in project root, OR
- Set `FIREBASE_CONFIG` environment variable

### "Missing or insufficient permissions"
```
✗ Payment X failed: PERMISSION_DENIED: Missing or insufficient permissions
```

**Solution**:
- Verify service account has Firestore read/write permissions
- Check Firebase Security Rules allow the test user to write
- Ensure Firestore is enabled in Firebase project

### "Enrollment document not found"
```
✗ Enrollment document not found
```

**Solution**:
- Verify database path: `users/{userId}/courses/{courseId}`
- Check Firestore database exists and has correct structure
- Ensure service account can access the database

### Test takes too long
```
⚠ All 100 payment operations completed in 15000ms
```

**Solution**:
- This is normal - Firestore has rate limits
- For faster tests, reduce `NUM_CONCURRENT_PAYMENTS`
- For production load testing, use a distributed load testing tool

---

## Integration Testing Workflow

1. **Run unit tests** (verify atomic operations in isolation):
   ```bash
   npm test -- enrollmentServices.concurrent.test.js --watchAll=false
   ```

2. **Run load test** (verify atomic operations under concurrent load):
   ```bash
   npm run load-test
   ```

3. **Manual integration testing** (see ISSUE4_INTEGRATION_VERIFICATION.md):
   - Test 1: Single payment processing
   - Test 2: Concurrent payments in browser
   - Test 3: Full payment scenario
   - Test 4: Partial payment sequence
   - Test 5: Error scenarios

4. **Staging deployment**:
   - Deploy to staging environment
   - Monitor payment processing for 24 hours
   - Verify no data loss in production data

---

## Success Criteria

| Check | Expected | Pass/Fail |
|-------|----------|-----------|
| All payments committed | 100/100 | ✓ |
| amountPaid = $1000 | Exact match | ✓ |
| amountDue = $0 | Exact match | ✓ |
| Total = $1000 | Exact consistency | ✓ |
| No data loss | 0 payments lost | ✓ |
| Duration | < 30 seconds | ✓ |

---

## Next Steps After Load Test Passes

1. ✅ **Unit Tests**: All 16 concurrent tests pass
2. ✅ **Load Test**: 100 concurrent payments verified
3. 📋 **Integration Testing**: Manual testing of 5 scenarios
4. 📋 **Staging Deployment**: 24-hour monitoring
5. 📋 **Production Deployment**: Phased rollout with monitoring

---

## Contact & Support

If the load test fails:
1. Check troubleshooting section above
2. Review ISSUE4_RACE_CONDITION_AUDIT.md for technical details
3. Verify firebase-admin package version is ≥13.6.0
4. Ensure project has Firestore enabled and initialized

---

**Test Status**: Ready to Run  
**Issue #4 Progress**: Unit Tests ✓ → Load Test → Integration Testing → Production

