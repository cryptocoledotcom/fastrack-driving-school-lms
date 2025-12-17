const admin = require('firebase-admin');

// Initialize for Emulator (no credentials needed if env var set, or just project ID)
// Ensure FIRESTORE_EMULATOR_HOST is set when running this, or set it here.
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

admin.initializeApp({
    projectId: 'fastrack-driving-school-lms'
});

const db = admin.firestore();

// Reuse data structures from seed-admin.js (copied here for simplicity or could require if exported)
// For now, I will define just the courses needed for the E2E test to pass.

const coursesData = {
    "fastrack-online": {
        "id": "fastrack-online",
        "title": "Fastrack Online Driving Course",
        "description": "Get Your Ohio Driver's Permit Online! Complete all modules to earn your certificate.",
        "category": "online",
        "price": 0,
        "features": ["BMV Certified", "Ohio OAC Compliant", "Video-based Learning"],
        "totalMinutes": 450,
        "createdAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString()
    }
};

const modulesData = {
    "module-intro": {
        "id": "module-intro",
        "title": "Introduction & Basics",
        "description": "Learn the fundamentals of safe driving",
        "durationMinutes": 120,
        "courseId": "fastrack-online",
        "lessonOrder": ["lesson-intro-1", "lesson-intro-2"],
        "createdAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString()
    },
    "module-highway": {
        "id": "module-highway",
        "title": "Highway & Advanced Driving",
        "description": "Master highway driving techniques",
        "durationMinutes": 150,
        "courseId": "fastrack-online",
        "lessonOrder": ["lesson-highway-1", "lesson-highway-2"],
        "createdAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString()
    },
    "module-license": {
        "id": "module-license",
        "title": "Getting Your License",
        "description": "Final preparation for your driver's license",
        "durationMinutes": 60,
        "courseId": "fastrack-online",
        "lessonOrder": ["lesson-license-1"],
        "createdAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString()
    }
};

const lessonsData = {
    "lesson-intro-1": {
        "id": "lesson-intro-1",
        "title": "Introduction to Safe Driving",
        "description": "Get started with the fundamentals",
        "type": "video",
        "videoUrl": "/assets/videos/homepage-logo-video.mp4",
        "durationSeconds": 10,
        "moduleId": "module-intro",
        "courseId": "fastrack-online",
        "lessonNumber": 1,
        "createdAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString()
    },
    "lesson-intro-2": {
        "id": "lesson-intro-2",
        "title": "Driver Education Value",
        "description": "Understand the importance of driver education",
        "type": "video",
        "videoUrl": "/assets/videos/homepage-logo-video.mp4",
        "durationSeconds": 10,
        "moduleId": "module-intro",
        "courseId": "fastrack-online",
        "lessonNumber": 2,
        "createdAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString()
    },
    "lesson-highway-1": {
        "id": "lesson-highway-1",
        "title": "The Highway Transportation System",
        "description": "Learn about highway systems and safe practices",
        "type": "video",
        "videoUrl": "/assets/videos/homepage-logo-video.mp4",
        "durationSeconds": 10,
        "moduleId": "module-highway",
        "courseId": "fastrack-online",
        "lessonNumber": 3,
        "createdAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString()
    },
    "lesson-highway-2": {
        "id": "lesson-highway-2",
        "title": "Key Takeaways for Highway Driving",
        "description": "Critical points to remember on the highway",
        "type": "video",
        "videoUrl": "/assets/videos/homepage-logo-video.mp4",
        "durationSeconds": 10,
        "moduleId": "module-highway",
        "courseId": "fastrack-online",
        "lessonNumber": 4,
        "createdAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString()
    },
    "lesson-license-1": {
        "id": "lesson-license-1",
        "title": "Getting Your Driver's License",
        "description": "Final steps to obtain your driver's license",
        "type": "video",
        "videoUrl": "/assets/videos/homepage-logo-video.mp4",
        "durationSeconds": 10,
        "moduleId": "module-license",
        "courseId": "fastrack-online",
        "lessonNumber": 5,
        "createdAt": new Date().toISOString(),
        "updatedAt": new Date().toISOString()
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

    // Seed Student User
    const studentId = "student-seed-1";
    const studentEmail = "student@example.com";
    const studentPassword = "password123";

    try {
        await admin.auth().getUser(studentId);
        console.log(`Student ${studentId} already exists in Auth.`);
    } catch (e) {
        if (e.code === 'auth/user-not-found') {
            await admin.auth().createUser({
                uid: studentId,
                email: studentEmail,
                password: studentPassword,
                displayName: "Test Student",
                emailVerified: true
            });
            console.log(`Created Auth user: ${studentId}`);
        }
    }

    await admin.auth().setCustomUserClaims(studentId, { role: 'student' });
    console.log(`Set 'student' claim for: ${studentId}`);

    const studentRef = db.collection('users').doc(studentId);
    batch.set(studentRef, {
        uid: studentId,
        email: studentEmail,
        displayName: "Test Student",
        role: "student",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`Queued Firestore profile for: ${studentId}`);


    // Seed Super Admin (Cole) - with provided credentials
    const coleId = "cole-admin-seed";
    const coleEmail = "colebowersock@gmail.com";
    const colePassword = "B0w3r$0ckC013";

    try {
        await admin.auth().getUser(coleId);
        console.log(`Admin ${coleId} already exists in Auth.`);
        // Update password to ensure it matches
        await admin.auth().updateUser(coleId, { password: colePassword });
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

    // Seed Test Student (Cole) - with provided credentials
    const testStudentId = "cole-student-seed";
    const testStudentEmail = "cole@fastrackdrive.com";
    const testStudentPassword = "B0w3r$0ckC013";

    try {
        await admin.auth().getUser(testStudentId);
        console.log(`Student ${testStudentId} already exists in Auth.`);
        // Update password to ensure it matches
        await admin.auth().updateUser(testStudentId, { password: testStudentPassword });
    } catch (e) {
        if (e.code === 'auth/user-not-found') {
            await admin.auth().createUser({
                uid: testStudentId,
                email: testStudentEmail,
                password: testStudentPassword,
                displayName: "Cole Test Student",
                emailVerified: true
            });
            console.log(`Created Auth user: ${testStudentId}`);
        }
    }

    await admin.auth().setCustomUserClaims(testStudentId, { role: 'student' });
    console.log(`Set 'student' claim for: ${testStudentId}`);

    const testStudentRef = db.collection('users').doc(testStudentId);
    batch.set(testStudentRef, {
        uid: testStudentId,
        email: testStudentEmail,
        displayName: "Cole Test Student",
        role: "student",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log(`Queued Firestore profile for: ${testStudentId}`);

    // Create enrollment for test student
    const enrollmentRef = db.collection('enrollments').doc();
    batch.set(enrollmentRef, {
        userId: testStudentId,
        courseId: "fastrack-online",
        enrolledAt: new Date().toISOString(),
        status: "active",
        percentComplete: 0
    });
    console.log(`Queued enrollment for: ${testStudentId} in fastrack-online`);

    // Create initial progress record
    const progressRef = db.collection('progress').doc();
    batch.set(progressRef, {
        userId: testStudentId,
        courseId: "fastrack-online",
        currentLessonId: "lesson-intro-1",
        currentModuleId: "module-intro",
        lessonsCompleted: [],
        videosWatched: [],
        totalMinutesWatched: 0,
        lastAccessedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    console.log(`Queued progress record for: ${testStudentId}`);

    await batch.commit();
    console.log('\n✅ Seeding Complete!\n');
    console.log('🎓 Test Credentials:');
    console.log('  Super Admin: colebowersock@gmail.com / B0w3r$0ckC013');
    console.log('  Student:     cole@fastrackdrive.com / B0w3r$0ckC013');
    console.log('\n📚 Available Content:');
    console.log('  Course: Fastrack Online Driving Course (5 lessons, 3 modules)');
    console.log('  Videos: Introduction, Driver Education, Highway, Key Takeaways, License');
}

seed().catch(console.error);
