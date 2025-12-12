const admin = require('firebase-admin');

// Initialize for Emulator (no credentials needed if env var set, or just project ID)
// Ensure FIRESTORE_EMULATOR_HOST is set when running this, or set it here.
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

admin.initializeApp({
    projectId: 'demo-test'
});

const db = admin.firestore();

// Reuse data structures from seed-admin.js (copied here for simplicity or could require if exported)
// For now, I will define just the courses needed for the E2E test to pass.

const coursesData = {
    "fastrack-online": {
        "id": "fastrack-online",
        "title": "Fastrack Online Driving Course",
        "description": "Get Your Ohio Driver's Permit Online!",
        "category": "online",
        "price": 0,
        "features": ["BMV Certified"],
        "createdAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString()
    }
};

const modulesData = {
    "module-intro": {
        "title": "Introduction",
        "durationMinutes": 30,
        "courseId": "fastrack-online",
        "lessonOrder": ["lesson-intro-1"]
    }
};

const lessonsData = {
    "lesson-intro-1": {
        "title": "Introduction",
        "content": "Welcome to the course!",
        "videoUrl": "/assets/introduction.mp4",
        "moduleId": "module-intro",
        "courseId": "fastrack-online"
    }
};

async function seed() {
    console.log('Seeding Emulator...');
    const batch = db.batch();

    // Seed Courses
    for (const [id, data] of Object.entries(coursesData)) {
        const ref = db.collection('courses').doc(id);
        batch.set(ref, data, { merge: true });
        console.log(`Queued course: ${id}`);
    }

    // Seed Modules
    for (const [id, data] of Object.entries(modulesData)) {
        const ref = db.collection('modules').doc(id);
        batch.set(ref, data, { merge: true });
        console.log(`Queued module: ${id}`);
    }

    // Seed Lessons
    for (const [id, data] of Object.entries(lessonsData)) {
        const ref = db.collection('lessons').doc(id);
        batch.set(ref, data, { merge: true });
        console.log(`Queued lesson: ${id}`);
    }

    // Seed Instructor
    const instructorId = "instructor-seed-1";
    const instructorEmail = "instructor@fastrackdrive.com";
    const instructorPassword = "password123";

    try {
        await admin.auth().getUser(instructorId);
        // Ensure email is up to date (fix for legacy seeded data)
        await admin.auth().updateUser(instructorId, { email: instructorEmail });
        console.log(`Instructor ${instructorId} already exists in Auth. (Email synced)`);
    } catch (e) {
        if (e.code === 'auth/user-not-found') {
            await admin.auth().createUser({
                uid: instructorId,
                email: instructorEmail,
                password: instructorPassword,
                displayName: "Seeded Instructor",
                emailVerified: true
            });
            console.log(`Created Auth user: ${instructorId}`);
        }
    }

    await admin.auth().setCustomUserClaims(instructorId, { role: 'instructor' });
    console.log(`Set 'instructor' claim for: ${instructorId}`);

    const userRef = db.collection('users').doc(instructorId);
    batch.set(userRef, {
        uid: instructorId,
        email: instructorEmail,
        displayName: "Seeded Instructor",
        role: "instructor",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`Queued Firestore profile for: ${instructorId}`);

    // Seed Super Admin (Generic)
    const adminId = "super-admin-seed-1";
    const adminEmail = "admin@fastrackdrive.com";
    const adminPassword = "password123";

    try {
        await admin.auth().getUser(adminId);
        console.log(`Admin ${adminId} already exists in Auth.`);
    } catch (e) {
        if (e.code === 'auth/user-not-found') {
            await admin.auth().createUser({
                uid: adminId,
                email: adminEmail,
                password: adminPassword,
                displayName: "Super Admin",
                emailVerified: true
            });
            console.log(`Created Auth user: ${adminId}`);
        }
    }

    await admin.auth().setCustomUserClaims(adminId, { role: 'super_admin' });
    console.log(`Set 'super_admin' claim for: ${adminId}`);

    const adminRef = db.collection('users').doc(adminId);
    batch.set(adminRef, {
        uid: adminId,
        email: adminEmail,
        displayName: "Super Admin",
        role: "super_admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`Queued Firestore profile for: ${adminId}`);


    // Seed Super Admin (Cole)
    // Seeding this as an email/password user so it can be used locally even without Google Sign-In working
    const coleId = "cole-admin-seed";
    const coleEmail = "colebowersock@gmail.com";
    const colePassword = "password123";

    try {
        await admin.auth().getUser(coleId);
        console.log(`Admin ${coleId} already exists in Auth.`);
    } catch (e) {
        if (e.code === 'auth/user-not-found') {
            await admin.auth().createUser({
                uid: coleId,
                email: coleEmail,
                password: colePassword,
                displayName: "Cole Bowersock",
                emailVerified: true
            });
            console.log(`Created Auth user: ${coleId}`);
        }
    }

    await admin.auth().setCustomUserClaims(coleId, { role: 'super_admin' });
    console.log(`Set 'super_admin' claim for: ${coleId}`);

    const coleRef = db.collection('users').doc(coleId);
    batch.set(coleRef, {
        uid: coleId,
        email: coleEmail,
        displayName: "Cole Bowersock",
        role: "super_admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`Queued Firestore profile for: ${coleId}`);

    await batch.commit();
    console.log('Seeding Complete.');
}

seed().catch(console.error);
