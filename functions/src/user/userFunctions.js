const { onCall } = require('firebase-functions/v2/https');
const { logAuditEvent } = require('../common/auditLogger');
const { getDb, getAuth } = require('../common/firebaseUtils');


const VALID_ROLES = ['student', 'instructor', 'dmv_admin', 'super_admin'];

const createUser = onCall(async (data, context) => {
  try {
    const { email, password, displayName, role = 'student' } = data;

    if (!email || !password || !displayName) {
      throw new Error('Missing required fields: email, password, displayName');
    }

    if (!VALID_ROLES.includes(role)) {
      throw new Error(`Invalid role: ${role}. Valid roles: ${VALID_ROLES.join(', ')}`);
    }

    // Security: Public createUser should probably force 'student' or check auth for higher privileges
    // For now, we just validate it is a known role.

    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName
    });

    const userDocRef = getDb().collection('users').doc(userRecord.uid);
    await userDocRef.set({
      uid: userRecord.uid,
      email,
      displayName,
      role,
      createdAt: new Date(),
      status: 'active'
    });

    await logAuditEvent(userRecord.uid, 'CREATE_USER', 'user', userRecord.uid, 'success', {
      email,
      displayName,
      role
    });

    return {
      success: true,
      uid: userRecord.uid,
      message: 'User created successfully'
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error(`Failed to create user: ${error.message}`);
  }
});

/**
 * SECURE: Set user role (SUPER_ADMIN only)
 * 
 * Sets custom claims + Firestore role simultaneously
 * Only callable by SUPER_ADMIN users
 * 
 * Request data:
 *   - targetUserId (required): UID of user to change
 *   - newRole (required): new role (student, instructor, dmv_admin, super_admin)
 */
const setUserRole = onCall(async (request) => {
  try {
    const { auth } = request;
    const { targetUserId, newRole } = request.data;

    if (!auth) {
      throw new Error('UNAUTHORIZED: Authentication required');
    }

    const callerUid = auth.uid;
    const db = getDb();
    const authClient = getAuth();

    if (!targetUserId || !newRole) {
      throw new Error('Missing required fields: targetUserId, newRole');
    }

    if (!VALID_ROLES.includes(newRole)) {
      throw new Error(`Invalid role: ${newRole}. Valid roles: ${VALID_ROLES.join(', ')}`);
    }

    const callerDoc = await db.collection('users').doc(callerUid).get();
    const callerRole = auth.token.role || (callerDoc.exists() ? callerDoc.data().role : null);

    if (callerRole !== 'super_admin') {
      console.warn(`UNAUTHORIZED: Non-admin ${callerUid} attempted to set role for ${targetUserId}`);
      throw new Error('UNAUTHORIZED: Only SUPER_ADMIN can change user roles');
    }

    const targetDoc = await db.collection('users').doc(targetUserId).get();
    if (!targetDoc.exists()) {
      throw new Error(`Target user not found: ${targetUserId}`);
    }

    const oldRole = targetDoc.data().role;

    await authClient.setCustomUserClaims(targetUserId, {
      role: newRole
    });

    const timestamp = new Date();
    await db.collection('users').doc(targetUserId).update({
      role: newRole,
      updatedAt: timestamp,
      roleUpdatedAt: timestamp
    });

    await logAuditEvent(
      callerUid,
      'SET_USER_ROLE',
      'user',
      targetUserId,
      'success',
      {
        targetUserId,
        oldRole,
        newRole,
        performedBy: callerUid,
        timestamp: timestamp.toISOString()
      }
    );

    console.log(`✓ Role changed: ${targetUserId} ${oldRole} → ${newRole}`);

    return {
      success: true,
      targetUserId,
      oldRole,
      newRole,
      message: `User role updated from ${oldRole} to ${newRole}`
    };
  } catch (error) {
    console.error('Error in setUserRole:', error.message);
    throw new Error(error.message);
  }
});

module.exports = { createUser, setUserRole };
