const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onCall } = require('firebase-functions/v2/https');
const { logAuditEvent } = require('../common/auditLogger');

const db = getFirestore();
const auth = admin.auth();

const createUser = onCall(async (request) => {
  try {
    const { email, password, displayName, role = 'student' } = request.data;

    if (!email || !password || !displayName) {
      throw new Error('Missing required fields: email, password, displayName');
    }

    const userRecord = await auth.createUser({
      email,
      password,
      displayName
    });

    const userDocRef = db.collection('users').doc(userRecord.uid);
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

module.exports = { createUser };
