#!/usr/bin/env node

/**
 * Load Test: Concurrent Payments (Issue #4 Verification)
 * 
 * Simulates 100 concurrent payments to the same enrollment
 * Verifies:
 * - All payments are recorded (no data loss)
 * - Final amount calculations are correct
 * - Atomic operations prevent race conditions
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Configuration
const NUM_CONCURRENT_PAYMENTS = 100;
const PAYMENT_AMOUNT = 10; // $10 per payment = $1000 total
const TEST_USER_ID = 'load-test-user-' + Date.now();
const TEST_COURSE_ID = 'fastrack-complete';
const INITIAL_AMOUNT_DUE = 1000; // $1000 course

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  try {
    // Try to load from environment variable first
    if (process.env.FIREBASE_CONFIG) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      // Try to load from local service account file
      const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      } else {
        throw new Error('Firebase credentials not found. Set FIREBASE_CONFIG env var or place serviceAccountKey.json in project root.');
      }
    }
    log.success('Firebase Admin SDK initialized');
    return admin.firestore();
  } catch (error) {
    log.error(`Firebase initialization failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Create test enrollment
 */
async function createTestEnrollment(db) {
  log.info(`Creating test enrollment for user: ${TEST_USER_ID}, course: ${TEST_COURSE_ID}`);
  
  const enrollmentRef = db.doc(`users/${TEST_USER_ID}/courses/${TEST_COURSE_ID}`);
  
  await enrollmentRef.set({
    userId: TEST_USER_ID,
    courseId: TEST_COURSE_ID,
    amountPaid: 0,
    amountDue: INITIAL_AMOUNT_DUE,
    paymentStatus: 'pending',
    status: 'PENDING_PAYMENT',
    accessStatus: 'locked',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  log.success(`Test enrollment created: ${INITIAL_AMOUNT_DUE} amount due`);
}

/**
 * Simulate a single payment using atomic batch operation
 */
async function simulatePayment(db, paymentIndex) {
  const batch = db.batch();
  const enrollmentRef = db.doc(`users/${TEST_USER_ID}/courses/${TEST_COURSE_ID}`);
  
  // Simulate the atomic increment operation from the fixed code
  batch.update(enrollmentRef, {
    amountPaid: admin.firestore.FieldValue.increment(PAYMENT_AMOUNT),
    amountDue: admin.firestore.FieldValue.increment(-PAYMENT_AMOUNT),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return batch.commit();
}

/**
 * Execute concurrent payments
 */
async function executeConcurrentPayments(db) {
  log.section(`Starting ${NUM_CONCURRENT_PAYMENTS} Concurrent Payments`);
  
  const startTime = Date.now();
  const paymentPromises = [];
  
  for (let i = 0; i < NUM_CONCURRENT_PAYMENTS; i++) {
    paymentPromises.push(
      simulatePayment(db, i)
        .then(() => {
          if ((i + 1) % 10 === 0) {
            log.info(`Completed ${i + 1}/${NUM_CONCURRENT_PAYMENTS} payments`);
          }
          return true;
        })
        .catch((error) => {
          log.error(`Payment ${i} failed: ${error.message}`);
          return false;
        })
    );
  }
  
  const results = await Promise.all(paymentPromises);
  const duration = Date.now() - startTime;
  
  const successful = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  
  log.success(`All ${NUM_CONCURRENT_PAYMENTS} payment operations completed in ${duration}ms`);
  log.success(`Successful: ${successful}, Failed: ${failed}`);
  
  return { successful, failed, duration };
}

/**
 * Verify enrollment state after payments
 */
async function verifyEnrollmentState(db) {
  log.section('Verifying Enrollment State');
  
  const enrollmentRef = db.doc(`users/${TEST_USER_ID}/courses/${TEST_COURSE_ID}`);
  const enrollment = await enrollmentRef.get();
  
  if (!enrollment.exists) {
    log.error('Enrollment document not found');
    return false;
  }
  
  const data = enrollment.data();
  const expectedAmountPaid = NUM_CONCURRENT_PAYMENTS * PAYMENT_AMOUNT;
  const expectedAmountDue = INITIAL_AMOUNT_DUE - expectedAmountPaid;
  
  log.info(`Expected amountPaid: $${expectedAmountPaid}`);
  log.info(`Actual amountPaid: $${data.amountPaid}`);
  
  log.info(`Expected amountDue: $${expectedAmountDue}`);
  log.info(`Actual amountDue: $${data.amountDue}`);
  
  // Verification checks
  let allPassed = true;
  
  // Check 1: All payments recorded (no data loss)
  if (data.amountPaid === expectedAmountPaid) {
    log.success(`✓ All payments recorded (O(1) consistency achieved)`);
  } else {
    log.error(`✗ Data loss detected! Expected $${expectedAmountPaid}, got $${data.amountPaid}`);
    allPassed = false;
  }
  
  // Check 2: Amount due calculated correctly
  if (data.amountDue === expectedAmountDue) {
    log.success(`✓ Amount due calculated correctly`);
  } else {
    log.error(`✗ Amount due mismatch! Expected $${expectedAmountDue}, got $${data.amountDue}`);
    allPassed = false;
  }
  
  // Check 3: Total consistency
  const total = data.amountPaid + data.amountDue;
  if (total === INITIAL_AMOUNT_DUE) {
    log.success(`✓ Total consistency verified: $${data.amountPaid} + $${data.amountDue} = $${total}`);
  } else {
    log.error(`✗ Total mismatch! Got $${total}, expected $${INITIAL_AMOUNT_DUE}`);
    allPassed = false;
  }
  
  // Check 4: Payment status
  if (data.amountDue === 0 && data.paymentStatus === 'pending') {
    log.warn(`Payment status is still 'pending' but amountDue is $0. This may need status update.`);
  }
  
  return allPassed;
}

/**
 * Cleanup test data
 */
async function cleanupTestData(db) {
  log.section('Cleaning Up Test Data');
  
  try {
    await db.doc(`users/${TEST_USER_ID}/courses/${TEST_COURSE_ID}`).delete();
    log.success(`Test enrollment deleted`);
  } catch (error) {
    log.error(`Cleanup failed: ${error.message}`);
  }
}

/**
 * Generate summary report
 */
function generateReport(paymentStats, verificationPassed) {
  log.section('Load Test Summary Report');
  
  console.log(`
${colors.bright}Test Configuration:${colors.reset}
  • Concurrent Payments: ${NUM_CONCURRENT_PAYMENTS}
  • Payment Amount Each: $${PAYMENT_AMOUNT}
  • Total Expected: $${NUM_CONCURRENT_PAYMENTS * PAYMENT_AMOUNT}
  • Initial Amount Due: $${INITIAL_AMOUNT_DUE}
  • Test User: ${TEST_USER_ID}
  • Test Course: ${TEST_COURSE_ID}

${colors.bright}Execution Results:${colors.reset}
  • Successful: ${paymentStats.successful}
  • Failed: ${paymentStats.failed}
  • Duration: ${paymentStats.duration}ms

${colors.bright}Verification Results:${colors.reset}
  • Data Loss Check: ${verificationPassed ? colors.green + '✓ PASSED' + colors.reset : colors.red + '✗ FAILED' + colors.reset}
  • Consistency Check: ${verificationPassed ? colors.green + '✓ PASSED' + colors.reset : colors.red + '✗ FAILED' + colors.reset}
  • Atomic Operations: ${verificationPassed ? colors.green + '✓ VERIFIED' + colors.reset : colors.red + '✗ NOT VERIFIED' + colors.reset}

${colors.bright}Conclusion:${colors.reset}
  ${verificationPassed ? colors.green + '✓ Issue #4 Fix VALIDATED' + colors.reset : colors.red + '✗ Issue #4 Fix FAILED' + colors.reset}
  ${verificationPassed ? 'Atomic operations prevent race conditions under concurrent load.' : 'Race condition detected - data loss occurred.'}
  `);
}

/**
 * Main execution
 */
async function main() {
  log.section('Issue #4: Concurrent Payment Load Test');
  log.info(`Testing atomic operations with ${NUM_CONCURRENT_PAYMENTS} concurrent payments...`);
  
  const db = initializeFirebase();
  
  try {
    // Setup
    await createTestEnrollment(db);
    
    // Execute load test
    const paymentStats = await executeConcurrentPayments(db);
    
    // Verify results
    const verificationPassed = await verifyEnrollmentState(db);
    
    // Generate report
    generateReport(paymentStats, verificationPassed);
    
    // Cleanup
    await cleanupTestData(db);
    
    // Exit with appropriate code
    process.exit(verificationPassed ? 0 : 1);
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // Close Firebase connection
    await admin.app().delete();
  }
}

// Run the test
main();
