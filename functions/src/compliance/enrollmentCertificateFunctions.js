const admin = require('firebase-admin');
const functions = require('firebase-functions');
const db = admin.firestore();
const logger = functions.logger;

const CERTIFICATES_COLLECTION = 'certificates';
const AUDIT_LOGS_COLLECTION = 'audit_logs';
const DAILY_ACTIVITY_COLLECTION = 'daily_activity_logs';

exports.generateEnrollmentCertificate = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { userId, courseId, courseName } = data;

    if (!userId || !courseId || !courseName) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required parameters: userId, courseId, courseName'
      );
    }

    if (context.auth.uid !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cannot generate certificate for other users'
      );
    }

    try {
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists()) {
        throw new functions.https.HttpsError(
          'not-found',
          'User not found'
        );
      }

      const userData = userDoc.data();
      
      const cumulativeMinutes = userData.cumulativeMinutes || 0;
      const unit1Complete = userData.unit1_complete === true || userData.unit1Complete === true;
      const unit2Complete = userData.unit2_complete === true || userData.unit2Complete === true;

      if (cumulativeMinutes < 120) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Insufficient instruction time. Required: 120 minutes, Current: ${cumulativeMinutes} minutes`
        );
      }

      if (!unit1Complete) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Unit 1 must be completed to earn enrollment certificate'
        );
      }

      if (!unit2Complete) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Unit 2 must be completed to earn enrollment certificate'
        );
      }

      const existingCertQuery = await db
        .collection(CERTIFICATES_COLLECTION)
        .where('userId', '==', userId)
        .where('courseId', '==', courseId)
        .where('type', '==', 'enrollment')
        .limit(1)
        .get();

      if (!existingCertQuery.empty) {
        logger.log(`Enrollment certificate already exists for user ${userId}, course ${courseId}`);
        const existingCert = existingCertQuery.docs[0];
        return {
          certificateId: existingCert.id,
          success: true,
          message: 'Enrollment certificate already generated',
          certificate: {
            id: existingCert.id,
            ...existingCert.data()
          }
        };
      }

      const certificateNumber = `ENROLL-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const awardedDate = new Date();

      const certificateData = {
        userId,
        courseId,
        type: 'enrollment',
        certificateNumber,
        courseName,
        studentName: userData.displayName || userData.name || 'Student',
        awardedAt: admin.firestore.FieldValue.serverTimestamp(),
        completionDate: awardedDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        cumulativeMinutes,
        unit1Complete,
        unit2Complete,
        certificateStatus: 'active',
        downloadCount: 0,
        ipAddress: context.rawRequest?.ip || null,
        userAgent: context.rawRequest?.headers?.['user-agent'] || null
      };

      const certificateRef = await db
        .collection(CERTIFICATES_COLLECTION)
        .add(certificateData);

      await db
        .collection(AUDIT_LOGS_COLLECTION)
        .add({
          userId,
          courseId,
          eventType: 'ENROLLMENT_CERTIFICATE_GENERATED',
          certificateId: certificateRef.id,
          certificateNumber,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          ipAddress: context.rawRequest?.ip || null,
          userAgent: context.rawRequest?.headers?.['user-agent'] || null
        });

      await db.collection('users').doc(userId).update({
        enrollmentCertificateGenerated: true,
        enrollmentCertificateAwardedAt: admin.firestore.FieldValue.serverTimestamp(),
        enrollmentCertificateId: certificateRef.id
      });

      return {
        success: true,
        certificateId: certificateRef.id,
        message: 'Enrollment certificate generated successfully',
        certificate: {
          id: certificateRef.id,
          ...certificateData
        }
      };
    } catch (error) {
      logger.error('Error generating enrollment certificate:', error);

      if (error.code === 'invalid-argument' || 
          error.code === 'not-found' || 
          error.code === 'permission-denied' ||
          error.code === 'failed-precondition') {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        'Failed to generate enrollment certificate'
      );
    }
  }
);

exports.checkEnrollmentCertificateEligibility = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { userId } = data;

    if (!userId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing userId parameter'
      );
    }

    if (context.auth.uid !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cannot check eligibility for other users'
      );
    }

    try {
      const userDoc = await db.collection('users').doc(userId).get();

      if (!userDoc.exists()) {
        throw new functions.https.HttpsError(
          'not-found',
          'User not found'
        );
      }

      const userData = userDoc.data();
      const cumulativeMinutes = userData.cumulativeMinutes || 0;
      const unit1Complete = userData.unit1_complete === true || userData.unit1Complete === true;
      const unit2Complete = userData.unit2_complete === true || userData.unit2Complete === true;
      const certificateGenerated = userData.enrollmentCertificateGenerated === true;

      return {
        eligible: cumulativeMinutes >= 120 && unit1Complete && unit2Complete,
        certificateGenerated,
        cumulativeMinutes,
        unit1Complete,
        unit2Complete,
        minutesRemaining: Math.max(0, 120 - cumulativeMinutes),
        missingRequirements: [
          ...(cumulativeMinutes < 120 ? [`Minimum 120 minutes required (${cumulativeMinutes} completed)`] : []),
          ...(!unit1Complete ? ['Unit 1 must be completed'] : []),
          ...(!unit2Complete ? ['Unit 2 must be completed'] : [])
        ]
      };
    } catch (error) {
      logger.error('Error checking enrollment certificate eligibility:', error);

      if (error.code === 'invalid-argument' || error.code === 'not-found' || error.code === 'permission-denied') {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        'Failed to check certificate eligibility'
      );
    }
  }
);
