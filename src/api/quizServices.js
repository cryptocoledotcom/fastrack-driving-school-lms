import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const QUIZ_ATTEMPTS_COLLECTION = 'quizAttempts';
const QUIZ_COLLECTION = 'quizzes';

export const createQuizAttempt = async (userId, courseId, quizData) => {
  try {
    const docRef = await addDoc(collection(db, QUIZ_ATTEMPTS_COLLECTION), {
      userId,
      courseId,
      quizId: quizData.quizId,
      quizTitle: quizData.quizTitle,
      isFinalExam: quizData.isFinalExam || false,
      startedAt: new Date().toISOString(),
      startedTimestamp: Date.now(),
      sessionId: quizData.sessionId || null,
      ipAddress: quizData.ipAddress || null,
      deviceInfo: quizData.deviceInfo || null,
      createdAt: new Date().toISOString()
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating quiz attempt:', error);
    throw error;
  }
};

export const updateQuizAttempt = async (attemptId, attemptData) => {
  try {
    const attemptRef = doc(db, QUIZ_ATTEMPTS_COLLECTION, attemptId);
    await updateDoc(attemptRef, {
      ...attemptData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating quiz attempt:', error);
    throw error;
  }
};

export const submitQuizAttempt = async (attemptId, submissionData) => {
  try {
    const attemptRef = doc(db, QUIZ_ATTEMPTS_COLLECTION, attemptId);
    const attemptDoc = await getDoc(attemptRef);

    if (!attemptDoc.exists()) {
      throw new Error('Quiz attempt not found');
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
      completedAt: new Date().toISOString(),
      completedTimestamp: Date.now(),
      timeSpent: submissionData.timeSpent || 0,
      status: 'completed',
      updatedAt: new Date().toISOString()
    });

    return {
      attemptId,
      score,
      passed,
      correctAnswers,
      totalQuestions
    };
  } catch (error) {
    console.error('Error submitting quiz attempt:', error);
    throw error;
  }
};

export const getQuizAttempts = async (userId, courseId, quizId = null) => {
  try {
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
  } catch (error) {
    console.error('Error getting quiz attempts:', error);
    return [];
  }
};

export const getAttemptCount = async (userId, courseId, quizId = null, isFinalExam = false) => {
  try {
    const attempts = await getQuizAttempts(userId, courseId, quizId);
    
    let filteredAttempts = attempts;
    if (isFinalExam) {
      filteredAttempts = attempts.filter(a => a.isFinalExam === true);
    } else if (quizId) {
      filteredAttempts = attempts.filter(a => a.quizId === quizId);
    }

    return filteredAttempts.length;
  } catch (error) {
    console.error('Error getting attempt count:', error);
    return 0;
  }
};

export const getLastAttemptData = async (userId, courseId, quizId = null) => {
  try {
    const attempts = await getQuizAttempts(userId, courseId, quizId);
    
    if (attempts.length === 0) {
      return null;
    }

    return attempts[0];
  } catch (error) {
    console.error('Error getting last attempt data:', error);
    return null;
  }
};

export const getQuizScore = async (userId, courseId, quizId = null) => {
  try {
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
  } catch (error) {
    console.error('Error getting quiz score:', error);
    return { score: 0, passed: false, attempts: 0 };
  }
};

export const markQuizPassed = async (attemptId) => {
  try {
    const attemptRef = doc(db, QUIZ_ATTEMPTS_COLLECTION, attemptId);
    await updateDoc(attemptRef, {
      passed: true,
      status: 'passed',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking quiz as passed:', error);
    throw error;
  }
};

export const getFinalExamStatus = async (userId, courseId) => {
  try {
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
  } catch (error) {
    console.error('Error getting final exam status:', error);
    return {
      attemptCount: 0,
      passed: false,
      lastScore: 0,
      canRetake: true
    };
  }
};

export const canRetakeQuiz = async (userId, courseId, quizId, isFinalExam = false) => {
  try {
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
  } catch (error) {
    console.error('Error checking if quiz can be retaken:', error);
    return false;
  }
};

export const getQuizAttemptHistory = async (userId, courseId, limit = 100) => {
  try {
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
  } catch (error) {
    console.error('Error getting quiz attempt history:', error);
    return [];
  }
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
