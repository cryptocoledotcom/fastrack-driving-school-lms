const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { onCall } = require('firebase-functions/v2/https');
const PDFDocument = require('pdfkit');

const db = getFirestore();

const generateCertificate = onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new Error('Authentication required');
    }

    const { userId, courseId } = data;
    const requestingUserId = context.auth.uid;

    if (!userId || !courseId) {
      throw new Error('Missing required parameters: userId, courseId');
    }

    const enrollmentRef = db.collection('enrollments').doc(`${userId}_${courseId}`);
    const enrollmentDoc = await enrollmentRef.get();

    if (!enrollmentDoc.exists) {
      throw new Error('Enrollment not found');
    }

    const enrollmentData = enrollmentDoc.data();

    if (enrollmentData.paymentStatus !== 'completed') {
      throw new Error('Payment not completed. Cannot generate certificate.');
    }

    const courseRef = db.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      throw new Error('Course not found');
    }

    const courseData = courseDoc.data();
    const userName = enrollmentData.userName || 'Student';
    const completionDate = new Date().toLocaleDateString();

    const certificateRef = await db.collection('certificates').add({
      userId,
      courseId,
      courseName: courseData.title,
      userName,
      completionDate,
      generatedAt: new Date(),
      certificateNumber: `CERT-${Date.now()}`
    });

    return {
      success: true,
      certificateId: certificateRef.id,
      message: 'Certificate generated successfully'
    };
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw new Error(`Failed to generate certificate: ${error.message}`);
  }
});

module.exports = { generateCertificate };
