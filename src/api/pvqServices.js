import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { executeService } from './base/ServiceWrapper';
import { ValidationError } from './errors/ApiError';
import { validateUserId, validateCourseId, validatePVQData } from './validators/validators';

const PVQ_COLLECTION = 'pvqQuestions';
const VERIFICATION_COLLECTION = 'identityVerifications';

const defaultPVQQuestions = [
  {
    id: 'pvq_001',
    question: 'What is your mother\'s maiden name?',
    category: 'personal',
    active: true
  },
  {
    id: 'pvq_002',
    question: 'In what city were you born?',
    category: 'personal',
    active: true
  },
  {
    id: 'pvq_003',
    question: 'What was the name of your first pet?',
    category: 'personal',
    active: true
  },
  {
    id: 'pvq_004',
    question: 'What is your favorite color?',
    category: 'general',
    active: true
  },
  {
    id: 'pvq_005',
    question: 'In what year did you graduate high school?',
    category: 'personal',
    active: true
  },
  {
    id: 'pvq_006',
    question: 'What is the name of your elementary school?',
    category: 'personal',
    active: true
  },
  {
    id: 'pvq_007',
    question: 'Who is your favorite musician or band?',
    category: 'general',
    active: true
  },
  {
    id: 'pvq_008',
    question: 'What is your favorite book or movie?',
    category: 'general',
    active: true
  },
  {
    id: 'pvq_009',
    question: 'What is the street name of the street you grew up on?',
    category: 'personal',
    active: true
  },
  {
    id: 'pvq_010',
    question: 'In what state did you live as a child?',
    category: 'personal',
    active: true
  }
];

export const getPVQQuestions = async () => {
  return executeService(async () => {
    const questionsRef = collection(db, PVQ_COLLECTION);
    const q = query(questionsRef, where('active', '==', true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return defaultPVQQuestions;
    }

    const questions = [];
    snapshot.forEach(doc => {
      questions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return questions;
  }, 'getPVQQuestions');
};

export const getRandomPVQQuestion = async () => {
  return executeService(async () => {
    const questions = await getPVQQuestions();
    if (questions.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  }, 'getRandomPVQQuestion');
};

export const logIdentityVerification = async (userId, courseId, sessionId, pvqData) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    validatePVQData(pvqData);
    if (!sessionId || typeof sessionId !== 'string') {
      throw new ValidationError('Session ID is required');
    }
    
    const verificationRef = collection(db, VERIFICATION_COLLECTION);
    const docRef = await addDoc(verificationRef, {
      userId,
      courseId,
      sessionId,
      questionId: pvqData.questionId,
      question: pvqData.question,
      answer: pvqData.answer,
      isCorrect: pvqData.isCorrect,
      timeToAnswer: pvqData.timeToAnswer,
      ipAddress: pvqData.ipAddress,
      deviceInfo: pvqData.deviceInfo || null,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    });

    return docRef.id;
  }, 'logIdentityVerification');
};

export const getVerificationHistory = async (userId, courseId, limit = 50) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    if (typeof limit !== 'number' || limit <= 0) {
      throw new ValidationError('Limit must be a positive number');
    }
    
    const verificationRef = collection(db, VERIFICATION_COLLECTION);
    const q = query(
      verificationRef,
      where('userId', '==', userId),
      where('courseId', '==', courseId)
    );

    const snapshot = await getDocs(q);
    const verifications = [];

    snapshot.forEach(doc => {
      verifications.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return verifications.slice(-limit);
  }, 'getVerificationHistory');
};

export const getUserAnsweredPVQ = async (userId, courseId, questionId) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    if (!questionId || typeof questionId !== 'string') {
      throw new ValidationError('Question ID is required');
    }
    
    const verificationRef = collection(db, VERIFICATION_COLLECTION);
    const q = query(
      verificationRef,
      where('userId', '==', userId),
      where('courseId', '==', courseId),
      where('questionId', '==', questionId)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }, 'getUserAnsweredPVQ');
};

export const validatePVQAnswer = async (userId, courseId, questionId, userAnswer) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    if (!questionId || typeof questionId !== 'string') {
      throw new ValidationError('Question ID is required');
    }
    if (!userAnswer || typeof userAnswer !== 'string') {
      throw new ValidationError('User answer is required');
    }
    
    const verificationRef = collection(db, VERIFICATION_COLLECTION);
    const q = query(
      verificationRef,
      where('userId', '==', userId),
      where('courseId', '==', courseId),
      where('questionId', '==', questionId)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { valid: false, message: 'No answer found for this question' };
    }

    const doc = snapshot.docs[0];
    const verificationData = doc.data();

    const normalizedUserAnswer = userAnswer.toLowerCase().trim();
    const normalizedStoredAnswer = verificationData.answer.toLowerCase().trim();

    const isValid = normalizedUserAnswer === normalizedStoredAnswer;
    
    return {
      valid: isValid,
      message: isValid ? 'Answer verified' : 'Incorrect answer. Please try again.'
    };
  }, 'validatePVQAnswer');
};

const pvqServices = {
  getPVQQuestions,
  getRandomPVQQuestion,
  logIdentityVerification,
  getVerificationHistory,
  getUserAnsweredPVQ,
  validatePVQAnswer
};

export default pvqServices;
