const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { onCall } = require('firebase-functions/v2/https');
const { logAuditEvent } = require('../common/auditLogger');

const db = getFirestore();

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
