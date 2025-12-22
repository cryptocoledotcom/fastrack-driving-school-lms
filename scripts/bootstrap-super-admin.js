#!/usr/bin/env node

/**
 * SECURITY BOOTSTRAP SCRIPT
 * 
 * One-time script to set the initial super admin user.
 * This MUST be run BEFORE deploying setUserRole Cloud Function.
 * 
 * Usage:
 *   node set-super-admin.js
 * 
 * IMPORTANT:
 * - Only run this ONCE (has safety checks)
 * - Requires service account key.json in root directory
 * - Sets custom claims + Firestore role simultaneously
 * - Creates immutable SUPER_ADMIN audit trail
 */

const fs = require('fs');
const path = require('path');

const admin = require('firebase-admin');

const SUPER_ADMIN_UID = 'DF0sczbZtKZ8Bclm1cvoIh1hNAg1';
const SUPER_ADMIN_EMAIL = 'colebowersock@gmail.com';
const PROJECT_ID = 'fastrack-driving-school-lms';

/**
 * Initialize Firebase Admin SDK
 */
async function initializeAdmin() {
  try {
    const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
    
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`Service account key not found at: ${serviceAccountPath}`);
    }

    const serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: PROJECT_ID
    });

    console.log('✓ Firebase Admin SDK initialized');
    return true;
  } catch (error) {
    console.error('✗ Failed to initialize Firebase Admin SDK:', error.message);
    process.exit(1);
  }
}

/**
 * Verify the user exists in Firebase Auth
 */
async function verifyUserExists() {
  try {
    const userRecord = await admin.auth().getUser(SUPER_ADMIN_UID);
    
    if (userRecord.email !== SUPER_ADMIN_EMAIL) {
      throw new Error(
        `Email mismatch! Auth email: ${userRecord.email}, Expected: ${SUPER_ADMIN_EMAIL}`
      );
    }

    console.log(`✓ User verified: ${userRecord.email} (${SUPER_ADMIN_UID})`);
    return userRecord;
  } catch (error) {
    console.error(`✗ User not found or error verifying user:`, error.message);
    process.exit(1);
  }
}

/**
 * Check if user already has super admin role (safety check)
 */
async function checkExistingRole() {
  try {
    const auth = admin.auth();
    const idTokenResult = await auth.getUser(SUPER_ADMIN_UID);
    
    if (idTokenResult.customClaims && idTokenResult.customClaims.role === 'super_admin') {
      console.log('⚠ User already has SUPER_ADMIN role in custom claims');
      return true;
    }

    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(SUPER_ADMIN_UID).get();
    
    if (userDoc.exists && userDoc.data().role === 'super_admin') {
      console.log('⚠ User already has SUPER_ADMIN role in Firestore');
      return true;
    }

    return false;
  } catch (error) {
    console.warn('Warning checking existing role:', error.message);
    return false;
  }
}

/**
 * Set custom claims for super admin user
 */
async function setCustomClaim() {
  try {
    await admin.auth().setCustomUserClaims(SUPER_ADMIN_UID, {
      role: 'super_admin'
    });

    console.log('✓ Custom claim set: role = super_admin');
    return true;
  } catch (error) {
    console.error('✗ Failed to set custom claim:', error.message);
    throw error;
  }
}

/**
 * Update Firestore user document with role
 */
async function updateFirestoreRole() {
  try {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(SUPER_ADMIN_UID);
    
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    
    await userRef.set(
      {
        uid: SUPER_ADMIN_UID,
        email: SUPER_ADMIN_EMAIL,
        role: 'super_admin',
        updatedAt: timestamp,
        superAdminSetAt: timestamp,
        superAdminBootstrapScript: true
      },
      { merge: true }
    );

    console.log('✓ Firestore role updated: role = super_admin');
    return true;
  } catch (error) {
    console.error('✗ Failed to update Firestore role:', error.message);
    throw error;
  }
}

/**
 * Log the bootstrap action to audit logs
 */
async function logBootstrapEvent() {
  try {
    const db = admin.firestore();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    
    await db.collection('auditLogs').add({
      userId: SUPER_ADMIN_UID,
      eventType: 'BOOTSTRAP_SUPER_ADMIN',
      resourceType: 'auth',
      resourceId: SUPER_ADMIN_UID,
      status: 'success',
      timestamp,
      createdAt: new Date().toISOString(),
      metadata: {
        email: SUPER_ADMIN_EMAIL,
        method: 'set-super-admin.js',
        customClaimSet: true,
        firestoreRoleSet: true
      }
    });

    console.log('✓ Audit log created: BOOTSTRAP_SUPER_ADMIN');
    return true;
  } catch (error) {
    console.error('⚠ Warning: Failed to log bootstrap event:', error.message);
    return false;
  }
}

/**
 * Main bootstrap function
 */
async function bootstrap() {
  try {
    console.log('\n=== FASTRACK LMS - SUPER ADMIN BOOTSTRAP ===\n');
    
    console.log(`Super Admin Setup:`);
    console.log(`  Email: ${SUPER_ADMIN_EMAIL}`);
    console.log(`  UID:   ${SUPER_ADMIN_UID}`);
    console.log(`  Role:  super_admin\n`);

    // Initialize
    await initializeAdmin();

    // Verify user exists
    await verifyUserExists();

    // Check if already set (safety)
    const alreadySet = await checkExistingRole();
    if (alreadySet) {
      console.log('\n⚠ Super admin role already set. No changes made.\n');
      process.exit(0);
    }

    // Set custom claim
    await setCustomClaim();

    // Update Firestore
    await updateFirestoreRole();

    // Log the bootstrap
    await logBootstrapEvent();

    console.log('\n✓ BOOTSTRAP COMPLETE\n');
    console.log('Next steps:');
    console.log('  1. Deploy setUserRole Cloud Function');
    console.log('  2. Implement RBAC architecture');
    console.log('  3. Test role-based access control\n');

    process.exit(0);
  } catch (error) {
    console.error('\n✗ BOOTSTRAP FAILED:', error.message);
    console.log('\nCleanup required - custom claim may be partially set');
    process.exit(1);
  }
}

bootstrap();
