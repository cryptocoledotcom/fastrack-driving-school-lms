const { onCall } = require('firebase-functions/v2/https');
const { logAuditEvent } = require('../common/auditLogger');
const { getDb, getAuth } = require('../common/firebaseUtils');

const createUser = onCall(async (data, context) => {
  try {
    const { email, password, displayName, role = 'student' } = data;

    if (!email || !password || !displayName) {
      throw new Error('Missing required fields: email, password, displayName');
    }

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

module.exports = { createUser };
