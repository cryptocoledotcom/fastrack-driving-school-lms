import {
  collection,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

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
  try {
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
  } catch (error) {
    console.error('Error getting PVQ questions:', error);
    return defaultPVQQuestions;
  }
};

export const getRandomPVQQuestion = async () => {
  try {
    const questions = await getPVQQuestions();
    if (questions.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  } catch (error) {
    console.error('Error getting random PVQ question:', error);
    return null;
  }
};

export const logIdentityVerification = async (userId, courseId, sessionId, pvqData) => {
  try {
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
  } catch (error) {
    console.error('Error logging identity verification:', error);
    throw error;
  }
};

export const getVerificationHistory = async (userId, courseId, limit = 50) => {
  try {
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
  } catch (error) {
    console.error('Error getting verification history:', error);
    return [];
  }
};

export const getUserAnsweredPVQ = async (userId, courseId, questionId) => {
  try {
    const verificationRef = collection(db, VERIFICATION_COLLECTION);
    const q = query(
      verificationRef,
      where('userId', '==', userId),
      where('courseId', '==', courseId),
      where('questionId', '==', questionId)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking if PVQ was answered:', error);
    return false;
  }
};

export const validatePVQAnswer = async (userId, courseId, questionId, userAnswer) => {
  try {
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
  } catch (error) {
    console.error('Error validating PVQ answer:', error);
    return { valid: false, message: 'Error validating answer' };
  }
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
