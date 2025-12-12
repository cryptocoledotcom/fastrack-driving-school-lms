const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

admin.initializeApp({
    projectId: 'fastrack-driving-school-lms'
});

async function verifyUser() {
    const uid = 'instructor-seed-1';
    try {
        const user = await admin.auth().getUser(uid);
        console.log('User found:', user.uid);
        console.log('Email:', user.email);
        console.log('Custom Claims:', user.customClaims);
    } catch (error) {
        console.error('Error finding user:', error);
    }
}

verifyUser();
