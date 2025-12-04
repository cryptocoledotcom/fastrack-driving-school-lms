import {
  collection,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { executeService } from '../base/ServiceWrapper';
import { ValidationError, QuizError } from '../errors/ApiError';
import { validateUserId, validateCourseId } from '../../utils/api/validators.js';
import { getCreatedTimestamp, getUpdatedTimestamp, getCurrentISOTimestamp } from '../../utils/api/timestampHelper.js';

const QUIZ_ATTEMPTS_COLLECTION = 'quizAttempts';

export const createQuizAttempt = async (userId, courseId, quizData) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    if (typeof quizData !== 'object' || !quizData) {
      throw new ValidationError('Quiz data must be a valid object');
    }
    
    const docRef = await addDoc(collection(db, QUIZ_ATTEMPTS_COLLECTION), {
      userId,
      courseId,
      quizId: quizData.quizId,
      quizTitle: quizData.quizTitle,
      isFinalExam: quizData.isFinalExam || false,
      startedAt: getCurrentISOTimestamp(),
      startedTimestamp: Date.now(),
      sessionId: quizData.sessionId || null,
      ipAddress: quizData.ipAddress || null,
      deviceInfo: quizData.deviceInfo || null,
      ...getCreatedTimestamp()
    });

    return docRef.id;
  }, 'createQuizAttempt');
};

export const updateQuizAttempt = async (attemptId, attemptData) => {
  return executeService(async () => {
    if (!attemptId || typeof attemptId !== 'string') {
      throw new ValidationError('Attempt ID is required');
    }
    if (typeof attemptData !== 'object' || !attemptData) {
      throw new ValidationError('Attempt data must be a valid object');
    }
    
    const attemptRef = doc(db, QUIZ_ATTEMPTS_COLLECTION, attemptId);
    await updateDoc(attemptRef, {
      ...attemptData,
      ...getUpdatedTimestamp()
    });
  }, 'updateQuizAttempt');
};

export const submitQuizAttempt = async (attemptId, submissionData) => {
  return executeService(async () => {
    if (!attemptId || typeof attemptId !== 'string') {
      throw new ValidationError('Attempt ID is required');
    }
    if (typeof submissionData !== 'object' || !submissionData) {
      throw new ValidationError('Submission data must be a valid object');
    }
    
    const attemptRef = doc(db, QUIZ_ATTEMPTS_COLLECTION, attemptId);
    const attemptDoc = await getDoc(attemptRef);

    if (!attemptDoc.exists()) {
      throw new QuizError('Quiz attempt not found');
    }

    const answers = submissionData.answers || {};
    const totalQuestions = submissionData.totalQuestions || 0;
    const correctAnswers = submissionData.correctAnswers || 0;
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const PASSING_SCORE = 70;
    const passed = score >= PASSING_SCORE;

    await updateDoc(attemptRef, {
      answers,
      totalQuestions,
      correctAnswers,
      score,
      passed,
      completedAt: getCurrentISOTimestamp(),
      completedTimestamp: Date.now(),
      timeSpent: submissionData.timeSpent || 0,
      status: 'completed',
      ...getUpdatedTimestamp()
    });

    return {
      attemptId,
      score,
      passed,
      correctAnswers,
      totalQuestions
    };
  }, 'submitQuizAttempt');
};

export const getQuizAttempts = async (userId, courseId, quizId = null) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    
    const attemptsRef = collection(db, QUIZ_ATTEMPTS_COLLECTION);
    let q;

    if (quizId) {
      q = query(
        attemptsRef,
        where('userId', '==', userId),
        where('courseId', '==', courseId),
        where('quizId', '==', quizId),
        orderBy('startedAt', 'desc')
      );
    } else {
      q = query(
        attemptsRef,
        where('userId', '==', userId),
        where('courseId', '==', courseId),
        orderBy('startedAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    const attempts = [];

    snapshot.forEach(doc => {
      attempts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return attempts;
  }, 'getQuizAttempts');
};

export const getAttemptCount = async (userId, courseId, quizId = null, isFinalExam = false) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    
    const attempts = await getQuizAttempts(userId, courseId, quizId);
    
    let filteredAttempts = attempts;
    if (isFinalExam) {
      filteredAttempts = attempts.filter(a => a.isFinalExam === true);
    } else if (quizId) {
      filteredAttempts = attempts.filter(a => a.quizId === quizId);
    }

    return filteredAttempts.length;
  }, 'getAttemptCount');
};

export const getLastAttemptData = async (userId, courseId, quizId = null) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    
    const attempts = await getQuizAttempts(userId, courseId, quizId);
    
    if (attempts.length === 0) {
      return null;
    }

    return attempts[0];
  }, 'getLastAttemptData');
};

export const getQuizScore = async (userId, courseId, quizId = null) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    
    const lastAttempt = await getLastAttemptData(userId, courseId, quizId);

    if (!lastAttempt) {
      return { score: 0, passed: false, attempts: 0 };
    }

    return {
      score: lastAttempt.score || 0,
      passed: lastAttempt.passed || false,
      attempts: 1,
      lastAttemptDate: lastAttempt.completedAt,
      correctAnswers: lastAttempt.correctAnswers || 0,
      totalQuestions: lastAttempt.totalQuestions || 0
    };
  }, 'getQuizScore');
};

export const markQuizPassed = async (attemptId) => {
  return executeService(async () => {
    if (!attemptId || typeof attemptId !== 'string') {
      throw new ValidationError('Attempt ID is required');
    }
    
    const attemptRef = doc(db, QUIZ_ATTEMPTS_COLLECTION, attemptId);
    await updateDoc(attemptRef, {
      passed: true,
      status: 'passed',
      ...getUpdatedTimestamp()
    });
  }, 'markQuizPassed');
};

export const getFinalExamStatus = async (userId, courseId) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    
    const attemptsRef = collection(db, QUIZ_ATTEMPTS_COLLECTION);
    const q = query(
      attemptsRef,
      where('userId', '==', userId),
      where('courseId', '==', courseId),
      where('isFinalExam', '==', true),
      orderBy('startedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const attempts = [];

    snapshot.forEach(doc => {
      attempts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    if (attempts.length === 0) {
      return {
        attemptCount: 0,
        passed: false,
        lastScore: 0,
        canRetake: true
      };
    }

    const passedAttempts = attempts.filter(a => a.passed === true);
    const lastAttempt = attempts[0];

    return {
      attemptCount: attempts.length,
      passed: passedAttempts.length > 0,
      lastScore: lastAttempt.score || 0,
      lastAttemptDate: lastAttempt.completedAt,
      canRetake: attempts.length < 3 && !passedAttempts.length,
      attempts: attempts.map(a => ({
        attemptNumber: attempts.indexOf(a) + 1,
        score: a.score,
        passed: a.passed,
        date: a.completedAt
      }))
    };
  }, 'getFinalExamStatus');
};

export const canRetakeQuiz = async (userId, courseId, quizId, isFinalExam = false) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    
    const MAX_ATTEMPTS = 3;
    const attemptCount = await getAttemptCount(userId, courseId, quizId, isFinalExam);

    if (attemptCount >= MAX_ATTEMPTS) {
      return false;
    }

    const lastAttempt = await getLastAttemptData(userId, courseId, quizId);
    if (lastAttempt && lastAttempt.passed === true) {
      return false;
    }

    return true;
  }, 'canRetakeQuiz');
};

export const getQuizAttemptHistory = async (userId, courseId, limit = 100) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    if (typeof limit !== 'number' || limit <= 0) {
      throw new ValidationError('Limit must be a positive number');
    }
    
    const attemptsRef = collection(db, QUIZ_ATTEMPTS_COLLECTION);
    const q = query(
      attemptsRef,
      where('userId', '==', userId),
      where('courseId', '==', courseId),
      orderBy('startedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const attempts = [];

    snapshot.forEach(doc => {
      attempts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return attempts.slice(0, limit);
  }, 'getQuizAttemptHistory');
};

const quizServices = {
  createQuizAttempt,
  updateQuizAttempt,
  submitQuizAttempt,
  getQuizAttempts,
  getAttemptCount,
  getLastAttemptData,
  getQuizScore,
  markQuizPassed,
  getFinalExamStatus,
  canRetakeQuiz,
  getQuizAttemptHistory
};

export default quizServices;
