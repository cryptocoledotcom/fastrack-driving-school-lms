const admin = require('firebase-admin');
const { onCall, onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logAuditEvent, deleteExpiredAuditLogs, AUDIT_EVENT_TYPES } = require('../common/auditLogger');
const { getDb } = require('../common/firebaseUtils');

// Constants for compliance enforcement
const MAX_DAILY_MINUTES = 240; // 4 hours
const TIMEZONE = 'America/New_York';

async function getStudentIdByName(studentName) {
  const usersRef = getDb().collection('users');
  const snapshot = await usersRef.where('displayName', '==', studentName).get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].id;
}

async function getComplianceDataForStudent(userId, courseId) {
  const sessionHistoryRef = getDb().collection('sessions').where('userId', '==', userId).where('courseId', '==', courseId);
  const sessionSnapshot = await sessionHistoryRef.get();

  const quizAttemptsRef = getDb().collection('quizAttempts').where('userId', '==', userId).where('courseId', '==', courseId);
  const quizSnapshot = await quizAttemptsRef.get();

  const pvqRecordsRef = getDb().collection('pvqRecords').where('userId', '==', userId).where('courseId', '==', courseId);
  const pvqSnapshot = await pvqRecordsRef.get();

  return {
    userId,
    courseId,
    totalSessions: sessionSnapshot.size,
    totalQuizAttempts: quizSnapshot.size,
    totalPVQRecords: pvqSnapshot.size,
    sessionData: sessionSnapshot.docs.map(doc => doc.data()),
    quizData: quizSnapshot.docs.map(doc => doc.data()),
    pvqData: pvqSnapshot.docs.map(doc => doc.data())
  };
}

async function getComplianceDataForCourse(courseId) {
  const enrollmentsRef = getDb().collection('enrollments').where('courseId', '==', courseId);
  const enrollmentSnapshot = await enrollmentsRef.get();

  const enrollments = enrollmentSnapshot.docs.map(doc => doc.data());
  const complianceData = [];

  for (const enrollment of enrollments) {
    const studentData = await getComplianceDataForStudent(enrollment.userId, courseId);
    complianceData.push(studentData);
  }

  return {
    courseId,
    totalStudents: enrollments.length,
    complianceData
  };
}

async function getStudentSessionHistory(userId, courseId) {
  const sessionsRef = getDb().collection('sessions').where('userId', '==', userId).where('courseId', '==', courseId);
  const snapshot = await sessionsRef.get();

  return snapshot.docs.map(doc => doc.data());
}

async function getStudentQuizAttempts(userId, courseId) {
  const quizRef = getDb().collection('quizAttempts').where('userId', '==', userId).where('courseId', '==', courseId);
  const snapshot = await quizRef.get();

  return snapshot.docs.map(doc => doc.data());
}

async function getStudentPVQRecords(userId, courseId) {
  const pvqRef = getDb().collection('pvqRecords').where('userId', '==', userId).where('courseId', '==', courseId);
  const snapshot = await pvqRef.get();

  return snapshot.docs.map(doc => doc.data());
}

async function getStudentCertificate(userId, courseId) {
  const certRef = getDb().collection('certificates').where('userId', '==', userId).where('courseId', '==', courseId);
  const snapshot = await certRef.get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data();
}

function convertToCSV(data) {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row =>
    headers.map(header => {
      const value = row[header];
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return value;
    }).join(',')
  );

  return `${csvHeaders}\n${csvRows.join('\n')}`;
}

async function convertToPDF(data, courseId) {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument();

  doc.fontSize(20).text(`Compliance Report - Course ${courseId}`, 100, 100);
  doc.fontSize(12);

  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      doc.text(`Entry ${index + 1}:`, 100, 150 + (index * 20));
      doc.text(JSON.stringify(item, null, 2), 120, 170 + (index * 20), { width: 400 });
    });
  } else {
    doc.text(JSON.stringify(data, null, 2), 100, 150, { width: 400 });
  }

  return doc;
}

/**
 * Server-side heartbeat for session time tracking
 * Enforces 4-hour daily limit per Ohio compliance requirements
 * 
 * Called every 60 seconds from frontend to validate server time
 * Returns remaining minutes or 403 if daily limit reached
 */
const sessionHeartbeat = onCall(
  { enforceAppCheck: false },
  async (request) => {
    try {
      const { auth, data } = request;
      if (!auth) {
        throw new Error('Authentication required');
      }

      const { userId, courseId, sessionId } = data;

      if (!userId || !courseId || !sessionId) {
        throw new Error('Missing required parameters: userId, courseId, sessionId');
      }

      const authenticatedUserId = auth.uid;
      if (authenticatedUserId !== userId) {
        throw new Error('User ID mismatch - cannot log heartbeat for another user');
      }

      // Get current server timestamp in EST/EDT timezone
      const now = new Date();
      const estDate = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
      
      // Create date key for daily activity log: YYYY-MM-DD
      const year = estDate.getFullYear();
      const month = String(estDate.getMonth() + 1).padStart(2, '0');
      const day = String(estDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      // Reference to daily activity log document
      const dailyLogDocId = `${userId}_${dateKey}`;
      const dailyLogRef = getDb().collection('daily_activity_logs').doc(dailyLogDocId);
      
      // Get current session document (subcollection)
      const sessionRef = getDb().collection('users').doc(userId).collection('sessions').doc(sessionId);
      const sessionDoc = await sessionRef.get();

      if (!sessionDoc.exists()) {
        throw new Error('Session not found');
      }

      const sessionData = sessionDoc.data();
      if (sessionData.courseId !== courseId) {
        throw new Error('Course ID mismatch for this session');
      }

      // Check for idle timeout (15 minutes of inactivity)
      const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
      if (sessionData.lastHeartbeatTimestamp) {
        const timeSinceLastHeartbeat = Date.now() - sessionData.lastHeartbeatTimestamp;
        if (timeSinceLastHeartbeat > IDLE_TIMEOUT_MS) {
          // Session is idle - log and reject
          await logAuditEvent(
            userId,
            'SESSION_IDLE_TIMEOUT',
            'compliance',
            courseId,
            'error',
            { 
              sessionId, 
              idleMinutes: Math.floor(timeSinceLastHeartbeat / 60000),
              lastHeartbeat: new Date(sessionData.lastHeartbeatTimestamp).toISOString()
            }
          );

          const err = new Error('SESSION_IDLE_TIMEOUT: Session terminated due to 15 minutes of inactivity');
          err.code = 'UNAUTHENTICATED';
          throw err;
        }
      }

      // Atomic batch operation: update both daily log and session
      const batch = getDb().batch();

      // 1. Get or create daily activity log
      const dailyLogDoc = await dailyLogRef.get();
      let minutesCompleted = 0;
      let isNewDay = false;

      if (!dailyLogDoc.exists()) {
        isNewDay = true;
        // Initialize new daily log
        batch.set(dailyLogRef, {
          userId,
          courseId,
          date: dateKey,
          minutesCompleted: 1, // First heartbeat = 1 minute
          sessionCount: 1,
          sessions: [sessionId],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastHeartbeat: admin.firestore.FieldValue.serverTimestamp(),
          status: 'active'
        });
        minutesCompleted = 1;
      } else {
        // Update existing daily log
        const currentData = dailyLogDoc.data();
        minutesCompleted = (currentData.minutesCompleted || 0) + 1;
        
        batch.update(dailyLogRef, {
          minutesCompleted,
          lastHeartbeat: admin.firestore.FieldValue.serverTimestamp(),
          sessions: admin.firestore.FieldValue.arrayUnion(sessionId)
        });
      }

      // 2. Update session last heartbeat
      batch.update(sessionRef, {
        lastHeartbeat: admin.firestore.FieldValue.serverTimestamp(),
        lastHeartbeatTimestamp: admin.firestore.Timestamp.now().toMillis()
      });

      // Commit batch operation
      await batch.commit();

      // Check if user has exceeded daily limit
      const remainingMinutes = MAX_DAILY_MINUTES - minutesCompleted;
      const isLocked = minutesCompleted >= MAX_DAILY_MINUTES;

      // If locked out, update user status and log audit event
      if (isLocked) {
        await getDb().collection('users').doc(userId).update({
          dailyStatus: 'locked_daily_limit',
          dailyLockedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await logAuditEvent(
          userId,
          'DAILY_LIMIT_REACHED',
          'compliance',
          courseId,
          'success',
          { minutesCompleted, sessionId }
        );

        // Return 403 error to trigger client-side lockout
        throw new Error('DAILY_LIMIT_REACHED: You have reached the 4-hour daily training limit');
      }

      // Log successful heartbeat to audit trail
      await logAuditEvent(
        userId,
        'SESSION_HEARTBEAT',
        'compliance',
        courseId,
        'success',
        { minutesCompleted, remainingMinutes, sessionId }
      );

      return {
        success: true,
        minutesCompleted,
        remainingMinutes,
        isNewDay,
        dateKey,
        serverTimestamp: admin.firestore.Timestamp.now().toMillis()
      };
    } catch (error) {
      console.error('Error processing session heartbeat:', error);
      
      // Audit failure
      try {
        const { userId, courseId, sessionId } = data;
        if (userId && courseId) {
          await logAuditEvent(
            userId,
            'SESSION_HEARTBEAT_FAILED',
            'compliance',
            courseId,
            'error',
            { error: error.message, sessionId }
          );
        }
      } catch (auditError) {
        console.error('Failed to log audit event:', auditError);
      }

      // Check if this is the daily limit error (should not throw, return 403 instead)
      if (error.message === 'DAILY_LIMIT_REACHED: You have reached the 4-hour daily training limit') {
        const err = new Error(error.message);
        err.code = 'RESOURCE_EXHAUSTED'; // Maps to HTTP 429/403
        throw err;
      }

      throw new Error(`Heartbeat processing failed: ${error.message}`);
    }
  }
);

const auditComplianceAccess = onCall(async (request) => {
  try {
    const { auth, data } = request;
    if (!auth) {
      throw new Error('Authentication required');
    }

    const { userId, action } = data;

    if (!userId || !action) {
      throw new Error('Missing required parameters: userId, action');
    }

    await logAuditEvent(auth.uid, action, 'compliance', userId, 'success', {
      accessedBy: auth.uid
    });

    return { success: true, message: 'Compliance access logged' };
  } catch (error) {
    console.error('Error auditing compliance access:', error);
    throw new Error(`Failed to audit compliance access: ${error.message}`);
  }
});

const trackPVQAttempt = onCall(
  { enforceAppCheck: false },
  async (request) => {
    try {
      const { auth, data } = request;
      if (!auth) {
        throw new Error('Authentication required');
      }

      const { userId, courseId, sessionId, isCorrect } = data;

      if (!userId || !courseId || !sessionId || typeof isCorrect !== 'boolean') {
        throw new Error('Missing required parameters: userId, courseId, sessionId, isCorrect');
      }

      if (auth.uid !== userId) {
        throw new Error('User ID mismatch - cannot track attempts for another user');
      }

      const userRef = getDb().collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      // Check if user is currently locked out from PVQ
      const userData = userDoc.data();
      const now = new Date();
      if (userData.pvqLockoutUntil && userData.pvqLockoutUntil.toDate() > now) {
        const remainingMinutes = Math.ceil((userData.pvqLockoutUntil.toDate() - now) / 60000);
        throw new Error(`PVQ_LOCKED_OUT: You are locked out from identity verification for ${remainingMinutes} more minutes`);
      }

      // Get or create PVQ verification record for this session
      const pvqRef = getDb().collection('pvq_verification').doc(`${userId}_${sessionId}`);
      const pvqDoc = await pvqRef.get();

      let attemptCount = 0;
      let failureCount = 0;

      if (pvqDoc.exists()) {
        const pvqData = pvqDoc.data();
        attemptCount = pvqData.attemptCount || 0;
        failureCount = pvqData.failureCount || 0;
      }

      // Only increment counters if not correct
      if (!isCorrect) {
        failureCount += 1;

        // If 2 failed attempts, lock user for 24 hours
        if (failureCount >= 2) {
          const lockoutUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          await userRef.update({
            pvqLockoutUntil: lockoutUntil,
            pvqLockedOutAt: admin.firestore.FieldValue.serverTimestamp()
          });

          await logAuditEvent(
            userId,
            'PVQ_LOCKOUT_ACTIVATED',
            'identity_verification',
            courseId,
            'error',
            {
              sessionId,
              failureCount,
              lockoutDuration: '24 hours',
              lockoutUntil: lockoutUntil.toISOString()
            }
          );

          throw new Error('PVQ_MAX_ATTEMPTS_EXCEEDED: You have exceeded the maximum number of verification attempts. Please try again in 24 hours.');
        }
      }

      // Update or create PVQ verification record
      attemptCount += 1;
      await pvqRef.set({
        userId,
        courseId,
        sessionId,
        attemptCount,
        failureCount,
        lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
        lastAttemptCorrect: isCorrect,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Log the attempt
      await logAuditEvent(
        userId,
        'PVQ_ATTEMPT',
        'identity_verification',
        courseId,
        isCorrect ? 'success' : 'error',
        {
          sessionId,
          attemptCount,
          failureCount,
          isCorrect
        }
      );

      return {
        success: true,
        attemptCount,
        failureCount,
        isCorrect,
        remainingAttempts: Math.max(0, 2 - failureCount),
        serverTimestamp: admin.firestore.Timestamp.now().toMillis()
      };
    } catch (error) {
      console.error('Error tracking PVQ attempt:', error);

      // Log failure
      try {
        const { userId, courseId, sessionId } = data;
        if (userId && courseId) {
          await logAuditEvent(
            userId,
            'PVQ_ATTEMPT_FAILED',
            'identity_verification',
            courseId,
            'error',
            { error: error.message, sessionId }
          );
        }
      } catch (auditError) {
        console.error('Failed to log audit event:', auditError);
      }

      if (error.message.startsWith('PVQ_LOCKED_OUT:') || error.message.startsWith('PVQ_MAX_ATTEMPTS_EXCEEDED:')) {
        const err = new Error(error.message);
        err.code = 'PERMISSION_DENIED';
        throw err;
      }

      throw new Error(`PVQ attempt tracking failed: ${error.message}`);
    }
  }
);

const trackExamAttempt = onCall(
  { enforceAppCheck: false },
  async (request) => {
    try {
      const { auth, data } = request;
      if (!auth) {
        throw new Error('Authentication required');
      }

      const { userId, courseId, sessionId, score, totalQuestions } = data;

      if (!userId || !courseId || !sessionId || typeof score !== 'number' || typeof totalQuestions !== 'number') {
        throw new Error('Missing required parameters: userId, courseId, sessionId, score, totalQuestions');
      }

      if (auth.uid !== userId) {
        throw new Error('User ID mismatch - cannot track exam attempts for another user');
      }

      const PASSING_SCORE_PERCENT = 75;
      const passingScore = Math.ceil((PASSING_SCORE_PERCENT / 100) * totalQuestions);
      const isPassed = score >= passingScore;
      const scorePercent = Math.round((score / totalQuestions) * 100);

      const userRef = getDb().collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      // Check if user is currently locked out from exam
      const userData = userDoc.data();
      const now = new Date();
      if (userData.examLockoutUntil && userData.examLockoutUntil.toDate() > now) {
        const remainingHours = Math.ceil((userData.examLockoutUntil.toDate() - now) / (60 * 60 * 1000));
        throw new Error(`EXAM_LOCKED_OUT: You are locked out from taking the exam for ${remainingHours} more hours`);
      }

      // Get or create exam attempt record
      const examAttemptsRef = getDb().collection('exam_attempts').doc(`${userId}_${courseId}`);
      const examAttemptsDoc = await examAttemptsRef.get();

      let attemptNumber = 1;
      let failureCount = 0;
      let previousAttempts = [];

      if (examAttemptsDoc.exists()) {
        const examData = examAttemptsDoc.data();
        previousAttempts = examData.attempts || [];
        attemptNumber = previousAttempts.length + 1;
        failureCount = examData.failureCount || 0;
      }

      // If not passed, increment failure count
      if (!isPassed) {
        failureCount += 1;

        // Check for 3rd failure - flag for academic reset
        if (failureCount >= 3) {
          const resetUntil = new Date(now.getTime() + 72 * 60 * 60 * 1000);
          await userRef.update({
            academicResetRequired: true,
            academicResetReason: 'Final exam - 3 strikes exceeded',
            resetAvailableAt: resetUntil,
            examAttemptsAfterReset: 0
          });

          await logAuditEvent(
            userId,
            'EXAM_ACADEMIC_RESET_FLAGGED',
            'assessment',
            courseId,
            'error',
            {
              sessionId,
              attemptNumber,
              failureCount,
              score,
              scorePercent,
              passingScore
            }
          );

          throw new Error('EXAM_ACADEMIC_RESET: You have exceeded the maximum number of exam attempts. Your account has been flagged for academic reset. Please contact support.');
        }

        // Set 24-hour lockout for attempt 1 and 2
        const lockoutUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        await userRef.update({
          examLockoutUntil: lockoutUntil,
          examLockedOutAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await logAuditEvent(
          userId,
          'EXAM_ATTEMPT_FAILED',
          'assessment',
          courseId,
          'error',
          {
            sessionId,
            attemptNumber,
            failureCount,
            score,
            scorePercent,
            passingScore,
            lockoutUntil: lockoutUntil.toISOString()
          }
        );
      } else {
        // Exam passed - clear any lockout and update user
        await userRef.update({
          finalExamPassed: true,
          finalExamPassedAt: admin.firestore.FieldValue.serverTimestamp(),
          finalExamScore: scorePercent,
          examLockoutUntil: admin.firestore.FieldValue.delete(),
          academicResetRequired: admin.firestore.FieldValue.delete()
        });

        await logAuditEvent(
          userId,
          'EXAM_PASSED',
          'assessment',
          courseId,
          'success',
          {
            sessionId,
            attemptNumber,
            score,
            scorePercent
          }
        );

        // Check if student qualifies for completion certificate
        // (1,440+ minutes + 75%+ exam score)
        const totalInstructionMinutes = userData.totalInstructionMinutes || userData.cumulativeMinutes || 0;
        const MIN_INSTRUCTION_MINUTES = 1440;
        
        if (totalInstructionMinutes >= MIN_INSTRUCTION_MINUTES && scorePercent >= 75) {
          try {
            // Auto-generate completion certificate
            const { generateCompletionCertificate } = require('./enrollmentCertificateFunctions');
            const courseDoc = await getDb().collection('courses').doc(courseId).get();
            const courseName = courseDoc.exists() ? courseDoc.data().title : 'Course';
            
            // Call the internal function
            await getDb().collection('certificates').add({
              userId,
              courseId,
              type: 'completion',
              certificateNumber: `COMP-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
              courseName,
              studentName: userData.displayName || userData.name || 'Student',
              awardedAt: admin.firestore.FieldValue.serverTimestamp(),
              completionDate: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }),
              totalInstructionMinutes,
              finalExamScore: scorePercent,
              finalExamPassed: true,
              certificateStatus: 'active',
              downloadCount: 0
            });

            await userRef.update({
              completionCertificateGenerated: true,
              completionCertificateAwardedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            await logAuditEvent(
              userId,
              'COMPLETION_CERTIFICATE_GENERATED',
              'assessment',
              courseId,
              'success',
              {
                totalInstructionMinutes,
                finalExamScore: scorePercent
              }
            );
          } catch (certError) {
            console.warn('Failed to auto-generate completion certificate:', certError.message);
            // Don't throw - certificate generation failure shouldn't block exam submission
          }
        }
      }

      // Record this attempt
      const attemptRecord = {
        attemptNumber,
        score,
        scorePercent,
        totalQuestions,
        passingScore,
        isPassed,
        attemptedAt: admin.firestore.FieldValue.serverTimestamp(),
        sessionId
      };

      previousAttempts.push(attemptRecord);

      await examAttemptsRef.set({
        userId,
        courseId,
        attempts: previousAttempts,
        attemptCount: previousAttempts.length,
        failureCount,
        lastAttemptScore: scorePercent,
        lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
        isPassed,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return {
        success: true,
        attemptNumber,
        score,
        scorePercent,
        passingScore,
        isPassed,
        failureCount,
        remainingAttempts: Math.max(0, 3 - failureCount),
        serverTimestamp: admin.firestore.Timestamp.now().toMillis()
      };
    } catch (error) {
      console.error('Error tracking exam attempt:', error);

      // Log failure
      try {
        const { userId, courseId, sessionId } = data;
        if (userId && courseId) {
          await logAuditEvent(
            userId,
            'EXAM_ATTEMPT_TRACKING_FAILED',
            'assessment',
            courseId,
            'error',
            { error: error.message, sessionId }
          );
        }
      } catch (auditError) {
        console.error('Failed to log audit event:', auditError);
      }

      if (error.message.startsWith('EXAM_LOCKED_OUT:') || error.message.startsWith('EXAM_ACADEMIC_RESET:')) {
        const err = new Error(error.message);
        err.code = 'PERMISSION_DENIED';
        throw err;
      }

      throw new Error(`Exam attempt tracking failed: ${error.message}`);
    }
  }
);

const enforceInactivityTimeout = onCall(async (request) => {
  try {
    const auth = request.auth;
    if (!auth) {
      throw new Error('UNAUTHENTICATED: User must be authenticated');
    }

    const { userId, courseId, sessionId, idleDurationSeconds } = request.data;

    if (!userId || !courseId || !sessionId || idleDurationSeconds === undefined) {
      throw new Error('INVALID_ARGUMENTS: Missing required fields');
    }

    if (auth.uid !== userId) {
      throw new Error('PERMISSION_DENIED: Cannot timeout other users');
    }

    const db = getDb();

    const sessionRef = db.collection('users').doc(userId).collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      throw new Error('SESSION_NOT_FOUND: Session does not exist');
    }

    const sessionData = sessionDoc.data();
    if (sessionData.status === 'idle_timeout') {
      return {
        success: false,
        message: 'Session already marked as idle timeout'
      };
    }

    const now = new Date().toISOString();
    const idleDurationMs = idleDurationSeconds * 1000;

    await sessionRef.update({
      status: 'idle_timeout',
      idleTimeoutAt: now,
      idleDurationSeconds,
      lastHeartbeat: sessionData.lastHeartbeat,
      lastHeartbeatTimestamp: sessionData.lastHeartbeatTimestamp
    });

    const estDate = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
    const year = estDate.getFullYear();
    const month = String(estDate.getMonth() + 1).padStart(2, '0');
    const day = String(estDate.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    const dailyLogKey = `${userId}_${dateKey}`;
    const dailyLogRef = db.collection('daily_activity_logs').doc(dailyLogKey);
    const dailyLogDoc = await dailyLogRef.get();

    if (dailyLogDoc.exists()) {
      const dailyData = dailyLogDoc.data();
      const currentMinutes = dailyData.minutes_completed || 0;
      const idleMinutes = Math.floor(idleDurationSeconds / 60);

      await dailyLogRef.update({
        idle_logout_at: now,
        idle_duration_seconds: idleDurationSeconds,
        idle_duration_minutes: idleMinutes,
        excluded_from_daily_limit: true,
        adjusted_minutes_completed: Math.max(0, currentMinutes - idleMinutes)
      });
    }

    await logAuditEvent(
      userId,
      'SESSION_IDLE_TIMEOUT_ENFORCED',
      'compliance',
      courseId,
      'info',
      {
        sessionId,
        idleDurationSeconds,
        idleMinutes: Math.floor(idleDurationSeconds / 60),
        timedOutAt: now
      }
    );

    return {
      success: true,
      message: 'Inactivity timeout enforced',
      sessionId,
      idleDurationSeconds,
      timedOutAt: now
    };
  } catch (error) {
    console.error('Error enforcing inactivity timeout:', error);

    if (error.message.startsWith('UNAUTHENTICATED:') || error.message.startsWith('PERMISSION_DENIED:')) {
      const err = new Error(error.message);
      err.code = error.message.startsWith('UNAUTHENTICATED:') ? 'unauthenticated' : 'permission-denied';
      throw err;
    }

    throw new Error(`Failed to enforce inactivity timeout: ${error.message}`);
  }
});

const generateComplianceReport = onCall({ enforceAppCheck: false }, async (request) => {
  try {
    const { auth, data } = request;
    if (!auth) {
      throw new Error('Authentication required');
    }

    const { courseId, format = 'json', studentId } = data;

    if (!courseId) {
      throw new Error('Missing required parameter: courseId');
    }

    let reportData;

    if (studentId) {
      reportData = await getComplianceDataForStudent(studentId, courseId);
    } else {
      reportData = await getComplianceDataForCourse(courseId);
    }

    let formattedReport = reportData;

    if (format === 'csv') {
      formattedReport = convertToCSV(
        studentId
          ? reportData.quizData
          : reportData.complianceData.flatMap(d => d.quizData)
      );
    } else if (format === 'pdf') {
      const doc = await convertToPDF(reportData, courseId);
      formattedReport = doc;
    }

    const metadata = { format };
    if (studentId) {
      metadata.studentId = studentId;
      metadata.exportType = 'student';
    } else {
      metadata.exportType = 'course';
    }

    await logAuditEvent(auth.uid, 'GENERATE_COMPLIANCE_REPORT', 'compliance', courseId, 'success', metadata);

    return {
      success: true,
      report: formattedReport,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating compliance report:', error);
    throw new Error(`Failed to generate compliance report: ${error.message}`);
  }
});

const auditLogRetentionPolicy = onSchedule('every day 02:00', async (context) => {
  try {
    const deletedCount = await deleteExpiredAuditLogs();
    console.log(`Audit log retention policy executed. Deleted ${deletedCount} expired logs.`);
    return { success: true, deletedCount };
  } catch (error) {
    console.error('Error executing audit log retention policy:', error);
    throw error;
  }
});

module.exports = {
  sessionHeartbeat,
  trackPVQAttempt,
  trackExamAttempt,
  enforceInactivityTimeout,
  auditComplianceAccess,
  generateComplianceReport,
  auditLogRetentionPolicy,
  getStudentIdByName,
  getComplianceDataForStudent,
  getComplianceDataForCourse,
  getStudentSessionHistory,
  getStudentQuizAttempts,
  getStudentPVQRecords,
  getStudentCertificate,
  convertToCSV,
  convertToPDF
};
