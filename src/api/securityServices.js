// Security Services
// Handles security profile operations in users/{userId}/securityProfile subcollection

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Get user's security profile from users/{userId}/securityProfile/questions
 */
export const getSecurityProfile = async (userId) => {
  try {
    const securityRef = doc(db, 'users', userId, 'securityProfile', 'questions');
    const securityDoc = await getDoc(securityRef);

    if (!securityDoc.exists()) {
      return null;
    }

    return {
      ...securityDoc.data()
    };
  } catch (error) {
    console.error('Error fetching security profile:', error);
    throw error;
  }
};

/**
 * Set security questions and answers
 * Note: In production, answers should be hashed on the server side
 */
export const setSecurityQuestions = async (userId, securityData) => {
  try {
    const securityRef = doc(db, 'users', userId, 'securityProfile', 'questions');
    
    const data = {
      question1: securityData.question1 || '',
      answer1: securityData.answer1 || '', // Should be hashed in production
      question2: securityData.question2 || '',
      answer2: securityData.answer2 || '', // Should be hashed in production
      question3: securityData.question3 || '',
      answer3: securityData.answer3 || '', // Should be hashed in production
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(securityRef, data);

    return {
      success: true,
      message: 'Security questions set successfully'
    };
  } catch (error) {
    console.error('Error setting security questions:', error);
    throw error;
  }
};

/**
 * Update security questions
 */
export const updateSecurityQuestions = async (userId, updates) => {
  try {
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
  } catch (error) {
    console.error('Error updating security questions:', error);
    throw error;
  }
};

/**
 * Verify security answer
 * Note: In production, this should hash the provided answer and compare
 */
export const verifySecurityAnswer = async (userId, questionNumber, providedAnswer) => {
  try {
    const securityProfile = await getSecurityProfile(userId);
    
    if (!securityProfile) {
      return {
        verified: false,
        message: 'No security questions set'
      };
    }

    const answerKey = `answer${questionNumber}`;
    const storedAnswer = securityProfile[answerKey];

    // In production, both should be hashed and compared
    const isMatch = storedAnswer && 
                   storedAnswer.toLowerCase().trim() === providedAnswer.toLowerCase().trim();

    return {
      verified: isMatch,
      message: isMatch ? 'Answer verified' : 'Incorrect answer'
    };
  } catch (error) {
    console.error('Error verifying security answer:', error);
    throw error;
  }
};

/**
 * Check if user has security questions set
 */
export const hasSecurityQuestions = async (userId) => {
  try {
    const securityProfile = await getSecurityProfile(userId);
    return securityProfile !== null && 
           securityProfile.question1 && 
           securityProfile.answer1;
  } catch (error) {
    console.error('Error checking security questions:', error);
    return false;
  }
};

/**
 * Get security questions (without answers) for password recovery
 */
export const getSecurityQuestionsForRecovery = async (userId) => {
  try {
    const securityProfile = await getSecurityProfile(userId);
    
    if (!securityProfile) {
      return null;
    }

    // Return only questions, not answers
    return {
      question1: securityProfile.question1,
      question2: securityProfile.question2,
      question3: securityProfile.question3
    };
  } catch (error) {
    console.error('Error fetching security questions for recovery:', error);
    throw error;
  }
};

/**
 * Verify multiple security answers for password recovery
 */
export const verifySecurityAnswers = async (userId, answers) => {
  try {
    const securityProfile = await getSecurityProfile(userId);
    
    if (!securityProfile) {
      return {
        verified: false,
        message: 'No security questions set'
      };
    }

    let correctAnswers = 0;
    const requiredCorrect = 2; // Require at least 2 correct answers

    // Check each provided answer
    for (let i = 1; i <= 3; i++) {
      const answerKey = `answer${i}`;
      const providedAnswer = answers[`answer${i}`];
      const storedAnswer = securityProfile[answerKey];

      if (providedAnswer && storedAnswer) {
        // In production, both should be hashed and compared
        if (storedAnswer.toLowerCase().trim() === providedAnswer.toLowerCase().trim()) {
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
  } catch (error) {
    console.error('Error verifying security answers:', error);
    throw error;
  }
};

const securityServices = {
  getSecurityProfile,
  setSecurityQuestions,
  updateSecurityQuestions,
  verifySecurityAnswer,
  hasSecurityQuestions,
  getSecurityQuestionsForRecovery,
  verifySecurityAnswers
};

export default securityServices;