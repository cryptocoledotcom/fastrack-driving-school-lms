const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { onCall, onRequest } = require('firebase-functions/v2/https');
const { logAuditEvent } = require('../common/auditLogger');

const db = getFirestore();

// Constants for compliance enforcement
const MAX_DAILY_MINUTES = 240; // 4 hours
const TIMEZONE = 'America/New_York';

async function getStudentIdByName(studentName) {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('displayName', '==', studentName).get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].id;
}

async function getComplianceDataForStudent(userId, courseId) {
  const sessionHistoryRef = db.collection('sessions').where('userId', '==', userId).where('courseId', '==', courseId);
  const sessionSnapshot = await sessionHistoryRef.get();

  const quizAttemptsRef = db.collection('quizAttempts').where('userId', '==', userId).where('courseId', '==', courseId);
  const quizSnapshot = await quizAttemptsRef.get();

  const pvqRecordsRef = db.collection('pvqRecords').where('userId', '==', userId).where('courseId', '==', courseId);
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
  const enrollmentsRef = db.collection('enrollments').where('courseId', '==', courseId);
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
  const sessionsRef = db.collection('sessions').where('userId', '==', userId).where('courseId', '==', courseId);
  const snapshot = await sessionsRef.get();

  return snapshot.docs.map(doc => doc.data());
}

async function getStudentQuizAttempts(userId, courseId) {
  const quizRef = db.collection('quizAttempts').where('userId', '==', userId).where('courseId', '==', courseId);
  const snapshot = await quizRef.get();

  return snapshot.docs.map(doc => doc.data());
}

async function getStudentPVQRecords(userId, courseId) {
  const pvqRef = db.collection('pvqRecords').where('userId', '==', userId).where('courseId', '==', courseId);
  const snapshot = await pvqRef.get();

  return snapshot.docs.map(doc => doc.data());
}

async function getStudentCertificate(userId, courseId) {
  const certRef = db.collection('certificates').where('userId', '==', userId).where('courseId', '==', courseId);
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
  async (data, context) => {
    try {
      if (!context.auth) {
        throw new Error('Authentication required');
      }

      const { userId, courseId, sessionId } = data;

      if (!userId || !courseId || !sessionId) {
        throw new Error('Missing required parameters: userId, courseId, sessionId');
      }

      const authenticatedUserId = context.auth.uid;
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
      const dailyLogRef = db.collection('daily_activity_logs').doc(dailyLogDocId);
      
      // Get current session document (subcollection)
      const sessionRef = db.collection('users').doc(userId).collection('sessions').doc(sessionId);
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
      const batch = db.batch();

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
        await db.collection('users').doc(userId).update({
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

const auditComplianceAccess = onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const { userId, action } = data;

    if (!userId || !action) {
      throw new Error('Missing required parameters: userId, action');
    }

    await logAuditEvent(context.auth.uid, action, 'compliance', userId, 'success', {
      accessedBy: context.auth.uid
    });

    return { success: true, message: 'Compliance access logged' };
  } catch (error) {
    console.error('Error auditing compliance access:', error);
    throw new Error(`Failed to audit compliance access: ${error.message}`);
  }
});

const generateComplianceReport = onCall({ enforceAppCheck: false }, async (data, context) => {
  try {
    if (!context.auth) {
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

    await logAuditEvent(context.auth.uid, 'GENERATE_COMPLIANCE_REPORT', 'compliance', courseId, 'success', {
      format,
      studentId
    });

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

module.exports = {
  sessionHeartbeat,
  auditComplianceAccess,
  generateComplianceReport,
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
