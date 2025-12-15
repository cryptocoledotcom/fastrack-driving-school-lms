// Security Services
// Handles security profile operations in users/{userId}/securityProfile subcollection

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { executeService } from '../base/ServiceWrapper';
import { ValidationError } from '../errors/ApiError';
import { validateUserId } from '../../utils/api/validators.js';
import { getFirestoreTimestamps } from '../../utils/api/timestampHelper.js';
import { hashAnswer, compareAnswerHash } from '../../utils/security/answerHasher';

export const getSecurityProfile = async (userId) => {
  return executeService(async () => {
    validateUserId(userId);
    
    const securityRef = doc(db, 'users', userId, 'securityProfile', 'questions');
    const securityDoc = await getDoc(securityRef);

    if (!securityDoc.exists()) {
      return null;
    }

    return {
      ...securityDoc.data()
    };
  }, 'getSecurityProfile');
};

export const setSecurityQuestions = async (userId, securityData) => {
  return executeService(async () => {
    validateUserId(userId);
    if (typeof securityData !== 'object' || !securityData) {
      throw new ValidationError('Security data must be a valid object');
    }
    
    const hash1 = await hashAnswer(securityData.answer1);
    const hash2 = await hashAnswer(securityData.answer2);
    const hash3 = await hashAnswer(securityData.answer3);

    const securityRef = doc(db, 'users', userId, 'securityProfile', 'questions');
    
    const data = {
      question1: securityData.question1,
      answerHash1: hash1,
      question2: securityData.question2,
      answerHash2: hash2,
      question3: securityData.question3,
      answerHash3: hash3,
      ...getFirestoreTimestamps()
    };

    await setDoc(securityRef, data);

    return {
      success: true,
      message: 'Security questions set successfully'
    };
  }, 'setSecurityQuestions');
};

export const updateSecurityQuestions = async (userId, updates) => {
  return executeService(async () => {
    validateUserId(userId);
    if (typeof updates !== 'object' || !updates) {
      throw new ValidationError('Updates must be a valid object');
    }
    
    const securityRef = doc(db, 'users', userId, 'securityProfile', 'questions');
    
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };

    await updateDoc(securityRef, updateData);

    return {
      success: true,
      message: 'Security questions updated successfully'
    };
  }, 'updateSecurityQuestions');
};

export const verifySecurityAnswer = async (userId, questionNumber, providedAnswer) => {
  return executeService(async () => {
    validateUserId(userId);
    if (typeof questionNumber !== 'number' || questionNumber < 1 || questionNumber > 3) {
      throw new ValidationError('Question number must be between 1 and 3');
    }
    if (typeof providedAnswer !== 'string' || !providedAnswer.trim()) {
      throw new ValidationError('Provided answer must be a non-empty string');
    }
    
    const securityProfile = await getSecurityProfile(userId);
    
    if (!securityProfile) {
      return {
        verified: false,
        message: 'No security questions set'
      };
    }

    const hashKey = `answerHash${questionNumber}`;
    const storedHash = securityProfile[hashKey];

    if (!storedHash) {
      return {
        verified: false,
        message: 'Security question not found'
      };
    }

    const isMatch = await compareAnswerHash(providedAnswer, storedHash);

    return {
      verified: isMatch,
      message: isMatch ? 'Answer verified' : 'Incorrect answer'
    };
  }, 'verifySecurityAnswer');
};

export const hasSecurityQuestions = async (userId) => {
  return executeService(async () => {
    validateUserId(userId);
    const securityProfile = await getSecurityProfile(userId);
    return securityProfile !== null && 
           securityProfile.question1 && 
           securityProfile.answerHash1;
  }, 'hasSecurityQuestions');
};

export const getSecurityQuestionsForRecovery = async (userId) => {
  return executeService(async () => {
    validateUserId(userId);
    const securityProfile = await getSecurityProfile(userId);
    
    if (!securityProfile) {
      return null;
    }

    return {
      question1: securityProfile.question1,
      question2: securityProfile.question2,
      question3: securityProfile.question3
    };
  }, 'getSecurityQuestionsForRecovery');
};

export const verifySecurityAnswers = async (userId, answers) => {
  return executeService(async () => {
    validateUserId(userId);
    if (typeof answers !== 'object' || !answers) {
      throw new ValidationError('Answers must be a valid object');
    }
    
    const securityProfile = await getSecurityProfile(userId);
    
    if (!securityProfile) {
      return {
        verified: false,
        message: 'No security questions set'
      };
    }

    let correctAnswers = 0;
    const requiredCorrect = 2;

    for (let i = 1; i <= 3; i++) {
      const answerKey = `answer${i}`;
      const hashKey = `answerHash${i}`;
      const providedAnswer = answers[answerKey];
      const storedHash = securityProfile[hashKey];

      if (providedAnswer && storedHash) {
        const isMatch = await compareAnswerHash(providedAnswer, storedHash);
        if (isMatch) {
          correctAnswers++;
        }
      }
    }

    const verified = correctAnswers >= requiredCorrect;

    return {
      verified,
      correctAnswers,
      requiredCorrect,
      message: verified 
        ? 'Security verification successful' 
        : `Need at least ${requiredCorrect} correct answers`
    };
  }, 'verifySecurityAnswers');
};

export const getRandomPersonalSecurityQuestion = async (userId) => {
  return executeService(async () => {
    validateUserId(userId);
    
    const securityProfile = await getSecurityProfile(userId);
    
    if (!securityProfile) {
      throw new ValidationError('No security questions set for this user');
    }

    const questions = [];
    for (let i = 1; i <= 3; i++) {
      const questionKey = `question${i}`;
      const hashKey = `answerHash${i}`;
      
      if (securityProfile[questionKey] && securityProfile[hashKey]) {
        questions.push({
          questionNumber: i,
          question: securityProfile[questionKey]
        });
      }
    }

    if (questions.length === 0) {
      throw new ValidationError('No valid security questions found');
    }

    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  }, 'getRandomPersonalSecurityQuestion');
};

const securityServices = {
  getSecurityProfile,
  setSecurityQuestions,
  updateSecurityQuestions,
  verifySecurityAnswer,
  hasSecurityQuestions,
  getSecurityQuestionsForRecovery,
  verifySecurityAnswers,
  getRandomPersonalSecurityQuestion
};

export default securityServices;
