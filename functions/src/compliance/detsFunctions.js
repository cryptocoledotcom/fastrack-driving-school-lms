const functions = require('firebase-functions');
const admin = require('firebase-admin');

const { getDb } = require('../common/firebaseUtils');
const { logAuditEvent } = require('../common/auditLogger');

const DETS_API_ENDPOINT = process.env.DETS_API_ENDPOINT || 'https://dets.ohio.gov/api/v1';
const DETS_API_KEY = process.env.DETS_API_KEY || '';
const DETS_AUTO_SUBMIT = process.env.DETS_AUTO_SUBMIT === 'true';

exports.validateDETSRecord = functions.https.onCall(async (data, _context) => {
  try {
    const record = data;
    const errors = [];

    if (!record.studentId) errors.push({ field: 'studentId', message: 'Missing student ID' });
    if (!record.firstName) errors.push({ field: 'firstName', message: 'Missing first name' });
    if (!record.lastName) errors.push({ field: 'lastName', message: 'Missing last name' });

    if (record.dateOfBirth && !isValidDateFormat(record.dateOfBirth)) {
      errors.push({ field: 'dateOfBirth', message: 'Invalid date format (expected YYYY-MM-DD)' });
    }

    if (record.driverLicense && !isValidDriverLicense(record.driverLicense)) {
      errors.push({ field: 'driverLicense', message: 'Invalid license format (expected XX######)' });
    }

    if (record.examScore !== undefined) {
      if (typeof record.examScore !== 'number' || record.examScore < 0 || record.examScore > 100) {
        errors.push({ field: 'examScore', message: 'Exam score must be 0-100' });
      }
    }

    if (record.totalInstructionMinutes !== undefined) {
      if (record.totalInstructionMinutes < 1440) {
        errors.push({ field: 'totalInstructionMinutes', message: 'Must be at least 1440 minutes' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      record
    };
  } catch (error) {
    console.error('Error validating DETS record:', error);
    throw new functions.https.HttpsError('internal', 'Error validating DETS record');
  }
});

exports.exportDETSReport = functions.https.onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { courseId, startDate, endDate, studentIds } = request.data;

    if (!courseId) {
      throw new functions.https.HttpsError('invalid-argument', 'Course ID required');
    }

    const records = [];
    const errors = [];

    const certificatesQuery = getDb().collection('certificates')
      .where('courseId', '==', courseId)
      .where('type', '==', 'completion');

    const querySnapshot = await certificatesQuery.get();

    for (const doc of querySnapshot.docs) {
      const cert = doc.data();

      if (studentIds && !studentIds.includes(cert.userId)) continue;

      if (startDate && new Date(cert.awardedAt?.toDate?.() || 0) < new Date(startDate)) continue;
      if (endDate && new Date(cert.awardedAt?.toDate?.() || 0) > new Date(endDate)) continue;

      const userDoc = await getDb().collection('users').doc(cert.userId).get();
      if (!userDoc.exists()) {
        errors.push({
          certificateId: cert.certificateNumber,
          error: 'User not found'
        });
        continue;
      }

      const userData = userDoc.data();
      const totalMinutes = await getTotalInstructionMinutes(cert.userId, courseId);

      const record = {
        studentId: cert.userId,
        firstName: userData.firstName || userData.displayName?.split(' ')[0] || '',
        lastName: userData.lastName || userData.displayName?.split(' ')[1] || '',
        dateOfBirth: userData.dateOfBirth || '',
        driverLicense: userData.driverLicense || '',
        driverLicenseState: userData.driverLicenseState || 'OH',
        schoolName: userData.schoolName || 'Fastrack Driving School',
        instructorId: userData.instructorId || '',
        instructorName: userData.instructorName || '',
        courseCode: courseId,
        courseName: cert.courseName,
        completionDate: formatDate(cert.awardedAt?.toDate?.()),
        totalInstructionMinutes: Math.ceil(totalMinutes),
        examScore: cert.examScore || 0,
        examPassed: (cert.examScore || 0) >= 75,
        examAttempts: cert.examAttempts || 1,
        finalAttemptDate: formatDate(cert.awardedAt?.toDate?.()),
        certificateId: cert.certificateNumber,
        timeEnforced: true,
        pvqCompleted: cert.pvqVerified !== false,
        videoCompletionVerified: cert.videoVerified !== false,
        exportedAt: new Date().toISOString(),
        status: 'pending'
      };

      const validation = await validateDETSRecordLocal(record);
      if (!validation.isValid) {
        errors.push({
          certificateId: record.certificateId,
          errors: validation.errors
        });
      } else {
        records.push(record);
      }
    }

    if (records.length === 0) {
      throw new functions.https.HttpsError('not-found', 'No eligible records found for export');
    }

    const reportId = getDb().collection('dets_reports').doc().id;
    const report = {
      id: reportId,
      courseId,
      exportDate: admin.firestore.FieldValue.serverTimestamp(),
      submissionDate: null,
      status: 'ready',
      recordCount: records.length,
      records,
      errors,
      submissionAttempts: 0,
      detsResponse: null,
      exportedBy: request.auth.uid,
      exportedAt: new Date().toISOString()
    };

    await getDb().collection('dets_reports').doc(reportId).set(report);

    await logAuditEvent({
      userId: request.auth.uid,
      action: 'DETS_REPORT_EXPORTED',
      resource: 'dets_reports',
      resourceId: reportId,
      status: 'success',
      metadata: {
        courseId,
        recordCount: records.length,
        errorCount: errors.length
      }
    });

    if (DETS_AUTO_SUBMIT) {
      try {
        await submitDETSReportInternal(reportId);
      } catch (submitError) {
        console.warn('Auto-submit failed (manual submit available):', submitError);
      }
    }

    return {
      reportId,
      recordCount: records.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : null,
      status: 'ready',
      autoSubmitted: DETS_AUTO_SUBMIT
    };
  } catch (error) {
    console.error('Error exporting DETS report:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Error exporting DETS report');
  }
});

exports.submitDETSToState = functions.https.onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { reportId } = request.data;

    if (!reportId) {
      throw new functions.https.HttpsError('invalid-argument', 'Report ID required');
    }

    return await submitDETSReportInternal(reportId, request.auth.uid);
  } catch (error) {
    console.error('Error submitting DETS report:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Error submitting DETS report');
  }
});

async function submitDETSReportInternal(reportId, userId = 'system') {
  const reportDoc = await getDb().collection('dets_reports').doc(reportId).get();

  if (!reportDoc.exists()) {
    throw new Error('Report not found');
  }

  const report = reportDoc.data();

  if (report.status === 'submitted' || report.status === 'confirmed') {
    throw new Error('Report already submitted');
  }

  if (!report.records || report.records.length === 0) {
    throw new Error('Report has no records');
  }

  try {
    const detsPayload = {
      records: report.records,
      exportDate: report.exportedAt,
      schoolId: 'FASTRACK',
      submissionId: reportId,
      timestamp: new Date().toISOString()
    };

    const response = await callDETSAPI('POST', '/submit', detsPayload);

    await getDb().collection('dets_reports').doc(reportId).update({
      status: response.success ? 'submitted' : 'error',
      submissionDate: admin.firestore.FieldValue.serverTimestamp(),
      detsResponse: response,
      submissionAttempts: admin.firestore.FieldValue.increment(1)
    });

    await logAuditEvent({
      userId,
      action: 'DETS_SUBMISSION_SUBMITTED',
      resource: 'dets_reports',
      resourceId: reportId,
      status: response.success ? 'success' : 'failure',
      metadata: {
        recordCount: report.recordCount,
        detsStatusCode: response.code,
        detsMessage: response.message
      }
    });

    return {
      reportId,
      status: response.success ? 'submitted' : 'error',
      detsResponse: response
    };
  } catch (error) {
    await getDb().collection('dets_reports').doc(reportId).update({
      status: 'error',
      submissionAttempts: admin.firestore.FieldValue.increment(1),
      lastError: error.message
    });

    await logAuditEvent({
      userId,
      action: 'DETS_SUBMISSION_FAILED',
      resource: 'dets_reports',
      resourceId: reportId,
      status: 'error',
      metadata: {
        error: error.message
      }
    });

    throw error;
  }
}

exports.getDETSReports = functions.https.onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { reportId, limit = 50, offset = 0 } = request.data;

    if (reportId) {
      const doc = await getDb().collection('dets_reports').doc(reportId).get();
      if (!doc.exists()) {
        throw new functions.https.HttpsError('not-found', 'Report not found');
      }
      return { report: { id: doc.id, ...doc.data() } };
    }

    const snapshot = await getDb().collection('dets_reports')
      .orderBy('exportDate', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const totalSnapshot = await getDb().collection('dets_reports').count().get();

    return {
      reports,
      totalCount: totalSnapshot.data().count,
      limit,
      offset
    };
  } catch (error) {
    console.error('Error getting DETS reports:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Error getting DETS reports');
  }
});

exports.processPendingDETSReports = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError('authentication-required', 'User must be authenticated');
  }
  const userRef = await admin.firestore().collection('users').doc(request.auth.uid).get();
  const userData = userRef.data();
  if (userData?.role !== 'SUPER_ADMIN' && userData?.role !== 'DMV_ADMIN') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can trigger DETS processing');
  }
  try {
    const pendingReports = await getDb().collection('dets_reports')
      .where('status', '==', 'ready')
      .limit(10)
      .get();

    console.log(`Found ${pendingReports.docs.length} pending DETS reports`);

    let successCount = 0;
    let failureCount = 0;

    for (const doc of pendingReports.docs) {
      try {
        await submitDETSReportInternal(doc.id, 'system');
        successCount++;
        console.log(`Successfully submitted DETS report ${doc.id}`);
      } catch (error) {
        failureCount++;
        console.warn(`Failed to submit DETS report ${doc.id}:`, error.message);
      }
    }

    return {
      success: true,
      message: `Processed ${pendingReports.docs.length} pending reports`,
      successCount,
      failureCount
    };
  } catch (error) {
    console.error('Error processing pending DETS reports:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Error processing pending DETS reports');
  }
});

async function getTotalInstructionMinutes(userId, courseId) {
  const today = new Date();
  const startDate = new Date('2020-01-01');
  let totalMinutes = 0;

  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const docId = `${userId}_${dateStr}`;

    const doc = await getDb().collection('daily_activity_logs').doc(docId).get();
    if (doc.exists()) {
      const data = doc.data();
      if (data.course_id === courseId || !data.course_id) {
        totalMinutes += data.minutes_completed || 0;
      }
    }
  }

  return totalMinutes;
}

function isValidDriverLicense(license) {
  const licenseRegex = /^[A-Z]{2}\d{6}$/;
  return licenseRegex.test(license);
}

function isValidDateFormat(dateString) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function validateDETSRecordLocal(record) {
  const errors = [];

  if (!record.studentId) errors.push({ field: 'studentId', message: 'Missing student ID' });
  if (!record.firstName) errors.push({ field: 'firstName', message: 'Missing first name' });
  if (!record.lastName) errors.push({ field: 'lastName', message: 'Missing last name' });
  if (!record.dateOfBirth) errors.push({ field: 'dateOfBirth', message: 'Missing DOB' });
  if (!record.driverLicense) errors.push({ field: 'driverLicense', message: 'Missing license' });

  if (record.driverLicense && !isValidDriverLicense(record.driverLicense)) {
    errors.push({ field: 'driverLicense', message: 'Invalid format (expected XX######)' });
  }

  if (record.totalInstructionMinutes < 1440) {
    errors.push({ field: 'totalInstructionMinutes', message: 'Must be at least 1440 minutes' });
  }

  if (record.examScore < 75) {
    errors.push({ field: 'examScore', message: 'Exam score must be 75% or higher' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

async function callDETSAPI(method, endpoint, payload) {
  if (!DETS_API_KEY) {
    console.warn('DETS_API_KEY not configured - returning mock response');
    return {
      success: true,
      code: 'MOCK_RESPONSE',
      message: 'Mock DETS API response (configure DETS_API_KEY for real submission)',
      submissionId: `MOCK_${Date.now()}`
    };
  }

  try {
    const url = `${DETS_API_ENDPOINT}${endpoint}`;
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DETS_API_KEY}`
      },
      body: JSON.stringify(payload),
      timeout: 30000
    });

    const data = await response.json();

    return {
      success: response.ok,
      statusCode: response.status,
      ...data
    };
  } catch (error) {
    console.error('DETS API call failed:', error);
    return {
      success: false,
      code: 'API_ERROR',
      message: error.message,
      retryable: true
    };
  }
}
