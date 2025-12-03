const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();
const logger = functions.logger;

const VIDEO_QUESTIONS_COLLECTION = 'video_post_questions';
const VIDEO_QUESTION_RESPONSES_COLLECTION = 'video_question_responses';
const AUDIT_LOGS_COLLECTION = 'audit_logs';

exports.checkVideoQuestionAnswer = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { userId, lessonId, courseId, questionId, selectedAnswer } = data;

    if (!userId || !lessonId || !courseId || !questionId || !selectedAnswer) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required parameters'
      );
    }

    if (context.auth.uid !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cannot check answers for other users'
      );
    }

    try {
      const questionDoc = await db
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

      await db
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
          ipAddress: context.rawRequest?.ip || null,
          userAgent: context.rawRequest?.headers?.['user-agent'] || null
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
        'Failed to check answer'
      );
    }
  }
);

exports.getVideoQuestion = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
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
      const querySnapshot = await db
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
  async (data, context) => {
    if (!context.auth) {
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

    if (context.auth.uid !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cannot record responses for other users'
      );
    }

    try {
      const responseRef = await db
        .collection(VIDEO_QUESTION_RESPONSES_COLLECTION)
        .add({
          userId,
          lessonId,
          courseId,
          questionId,
          selectedAnswer,
          isCorrect,
          respondedAt: admin.firestore.FieldValue.serverTimestamp(),
          ipAddress: context.rawRequest?.ip || null,
          userAgent: context.rawRequest?.headers?.['user-agent'] || null
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
