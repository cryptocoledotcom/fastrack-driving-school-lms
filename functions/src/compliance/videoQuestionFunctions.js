const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { getDb } = require('../common/firebaseUtils');
const logger = functions.logger;

const VIDEO_QUESTIONS_COLLECTION = 'video_post_questions';
const VIDEO_QUESTION_RESPONSES_COLLECTION = 'video_question_responses';
const AUDIT_LOGS_COLLECTION = 'audit_logs';

exports.checkVideoQuestionAnswer = functions.https.onCall(
  async (request) => {
    // Gen 2 signature: request contains .data and .auth
    const data = request.data || {};
    const auth = request.auth;

    // DEBUG: Log authentication details
    logger.info('checkVideoQuestionAnswer called', {
      authenticated: !!auth,
      uid: auth?.uid,
      token: auth?.token,
      dataKeys: Object.keys(data)
    });

    // Fallback: Check for token in data if auth is missing
    let effectiveAuth = auth;

    if (!effectiveAuth) {
      if (!data.authToken) {
        const receivedKeys = Object.keys(data || {}).join(', ');
        logger.error('Unauthenticated request: No auth and no data.authToken', {
          headers: request.rawRequest?.headers,
          dataKeys: Object.keys(data || {})
        });
        throw new functions.https.HttpsError(
          'unauthenticated',
          `User must be authenticated (No authToken provided). Received keys in data: [${receivedKeys}]`
        );
      }

      try {
        const decodedToken = await admin.auth().verifyIdToken(data.authToken);
        effectiveAuth = {
          uid: decodedToken.uid,
          token: decodedToken
        };
        logger.info('Successfully manually verified token from payload', { uid: decodedToken.uid });
      } catch (verifyError) {
        logger.error('Failed to manually verify token', verifyError);
        throw new functions.https.HttpsError(
          'unauthenticated',
          `Token verification failed: ${verifyError.message}`
        );
      }
    }

    // Double check
    if (!effectiveAuth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated (Auth context missing after checks)'
      );
    }

    // Use effectiveAuth for context-dependent logic if needed, or just proceed
    // The rest of the code likely uses `userId` from data, which we have.
    // Ensure we don't rely on 'context' variable below this block.

    const { userId, lessonId, courseId, questionId, selectedAnswer } = data;

    if (!userId || !lessonId || !courseId || !questionId || !selectedAnswer) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required parameters'
      );
    }

    // Use effectiveAuth which we populated earlier
    if (effectiveAuth.uid !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cannot check answers for other users'
      );
    }

    try {
      const questionDoc = await getDb()
        .collection(VIDEO_QUESTIONS_COLLECTION)
        .doc(questionId)
        .get();

      if (!questionDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Question not found'
        );
      }

      const questionData = questionDoc.data();
      const isCorrect = questionData.correctAnswer === selectedAnswer;

      await getDb()
        .collection(AUDIT_LOGS_COLLECTION)
        .add({
          userId,
          courseId,
          lessonId,
          eventType: 'VIDEO_QUESTION_ANSWERED',
          questionId,
          selectedAnswer,
          isCorrect,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          ipAddress: request.rawRequest?.ip || null,
          userAgent: request.rawRequest?.headers?.['user-agent'] || null
        });

      return {
        isCorrect,
        correctAnswer: isCorrect ? null : questionData.correctAnswer,
        question: questionData.question,
        explanation: questionData.explanation || null
      };
    } catch (error) {
      logger.error('Error checking video question answer:', error);

      if (error.code === 'invalid-argument' || error.code === 'not-found' || error.code === 'permission-denied') {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        `Failed to check answer: ${error.message}`
      );
    }
  }
);

exports.getVideoQuestion = functions.https.onCall(
  async (request) => {
    const { data, auth } = request;
    if (!auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { lessonId } = data;

    if (!lessonId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing lessonId parameter'
      );
    }

    try {
      const querySnapshot = await getDb()
        .collection(VIDEO_QUESTIONS_COLLECTION)
        .where('lessonId', '==', lessonId)
        .where('active', '==', true)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return { question: null };
      }

      const doc = querySnapshot.docs[0];
      const questionData = doc.data();

      return {
        id: doc.id,
        question: questionData.question,
        answers: questionData.answers || [],
        explanation: questionData.explanation || null
      };
    } catch (error) {
      logger.error('Error getting video question:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to get question'
      );
    }
  }
);

exports.recordVideoQuestionResponse = functions.https.onCall(
  async (request) => {
    const { data, auth } = request;
    if (!auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { userId, lessonId, courseId, questionId, selectedAnswer, isCorrect } = data;

    if (!userId || !lessonId || !courseId || !questionId || !selectedAnswer || isCorrect === undefined) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required parameters'
      );
    }

    if (auth.uid !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cannot record responses for other users'
      );
    }

    try {
      const responseRef = await getDb()
        .collection(VIDEO_QUESTION_RESPONSES_COLLECTION)
        .add({
          userId,
          lessonId,
          courseId,
          questionId,
          selectedAnswer,
          isCorrect,
          respondedAt: admin.firestore.FieldValue.serverTimestamp(),
          ipAddress: request.rawRequest?.ip || null,
          userAgent: request.rawRequest?.headers?.['user-agent'] || null
        });

      return {
        id: responseRef.id,
        recorded: true
      };
    } catch (error) {
      logger.error('Error recording video question response:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to record response'
      );
    }
  }
);
