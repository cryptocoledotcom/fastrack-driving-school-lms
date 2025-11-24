import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COMPLIANCE_LOGS_COLLECTION = 'complianceLogs';
const MAX_DAILY_HOURS = 4 * 3600;
const BREAK_REQUIRED_AFTER = 2 * 3600;
const MIN_BREAK_DURATION = 10 * 60;

export const createComplianceSession = async (userId, courseId, data) => {
  try {
    const sessionRef = doc(collection(db, COMPLIANCE_LOGS_COLLECTION));
    const sessionData = {
      userId,
      courseId,
      sessionId: sessionRef.id,
      startTime: new Date().toISOString(),
      startTimestamp: Date.now(),
      ipAddress: data.ipAddress,
      deviceInfo: data.deviceInfo || null,
      createdAt: new Date().toISOString()
    };

    await setDoc(sessionRef, sessionData);
    return sessionRef.id;
  } catch (error) {
    console.error('Error creating compliance session:', error);
    throw error;
  }
};

export const updateComplianceSession = async (sessionId, updates) => {
  try {
    const sessionRef = doc(db, COMPLIANCE_LOGS_COLLECTION, sessionId);
    await updateDoc(sessionRef, {
      ...updates,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating compliance session:', error);
    throw error;
  }
};

export const closeComplianceSession = async (sessionId, sessionData) => {
  try {
    const sessionRef = doc(db, COMPLIANCE_LOGS_COLLECTION, sessionId);
    await updateDoc(sessionRef, {
      endTime: new Date().toISOString(),
      endTimestamp: Date.now(),
      duration: sessionData.duration,
      videoProgress: sessionData.videoProgress || null,
      lessonsAccessed: sessionData.lessonsAccessed || [],
      breaks: sessionData.breaks || [],
      status: 'completed',
      closedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error closing compliance session:', error);
    throw error;
  }
};

export const getDailyTime = async (userId, courseId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const logsRef = collection(db, COMPLIANCE_LOGS_COLLECTION);
    const q = query(
      logsRef,
      where('userId', '==', userId),
      where('courseId', '==', courseId)
    );

    const snapshot = await getDocs(q);
    let totalSeconds = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'completed' && data.startTime >= todayISO && data.duration) {
        totalSeconds += data.duration;
      }
    });

    return totalSeconds;
  } catch (error) {
    console.error('Error getting daily time:', error);
    return 0;
  }
};

export const checkDailyHourLockout = async (userId, courseId) => {
  try {
    const dailyTime = await getDailyTime(userId, courseId);
    return dailyTime >= MAX_DAILY_HOURS;
  } catch (error) {
    console.error('Error checking daily hour lockout:', error);
    return false;
  }
};

export const getSessionHistory = async (userId, courseId, limit = 50) => {
  try {
    const logsRef = collection(db, COMPLIANCE_LOGS_COLLECTION);
    const q = query(
      logsRef,
      where('userId', '==', userId),
      where('courseId', '==', courseId)
    );

    const snapshot = await getDocs(q);
    const sessions = [];

    snapshot.forEach(doc => {
      sessions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    sessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    return sessions.slice(0, limit);
  } catch (error) {
    console.error('Error getting session history:', error);
    throw error;
  }
};

export const logBreak = async (sessionId, breakData) => {
  try {
    const sessionRef = doc(db, COMPLIANCE_LOGS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (sessionDoc.exists()) {
      const breaks = sessionDoc.data().breaks || [];
      breaks.push({
        startTime: breakData.startTime || new Date().toISOString(),
        scheduledDuration: breakData.duration,
        type: breakData.type || 'mandatory',
        status: 'initiated'
      });

      await updateDoc(sessionRef, { breaks });
    }
  } catch (error) {
    console.error('Error logging break:', error);
    throw error;
  }
};

export const logBreakEnd = async (sessionId, actualDurationSeconds) => {
  try {
    const sessionRef = doc(db, COMPLIANCE_LOGS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (sessionDoc.exists()) {
      const breaks = sessionDoc.data().breaks || [];
      if (breaks.length > 0) {
        const lastBreak = breaks[breaks.length - 1];
        lastBreak.actualDuration = actualDurationSeconds;
        lastBreak.endTime = new Date().toISOString();
        lastBreak.status = 'completed';
        
        if (actualDurationSeconds < MIN_BREAK_DURATION) {
          lastBreak.complianceFlag = 'BREAK_TOO_SHORT';
        }
      }

      await updateDoc(sessionRef, { breaks });
    }
  } catch (error) {
    console.error('Error logging break end:', error);
    throw error;
  }
};

export const logLessonCompletion = async (sessionId, lessonCompletionData) => {
  try {
    const sessionRef = doc(db, COMPLIANCE_LOGS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (sessionDoc.exists()) {
      const completionEvents = sessionDoc.data().completionEvents || [];
      completionEvents.push({
        type: 'lesson_completion',
        lessonId: lessonCompletionData.lessonId,
        lessonTitle: lessonCompletionData.lessonTitle,
        moduleId: lessonCompletionData.moduleId,
        moduleTitle: lessonCompletionData.moduleTitle,
        timestamp: new Date().toISOString(),
        sessionTime: lessonCompletionData.sessionTime,
        videoProgress: lessonCompletionData.videoProgress || null,
        completedAt: new Date().toISOString()
      });

      await updateDoc(sessionRef, { completionEvents });
    }
  } catch (error) {
    console.error('Error logging lesson completion:', error);
    throw error;
  }
};

export const logModuleCompletion = async (sessionId, moduleCompletionData) => {
  try {
    const sessionRef = doc(db, COMPLIANCE_LOGS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (sessionDoc.exists()) {
      const completionEvents = sessionDoc.data().completionEvents || [];
      completionEvents.push({
        type: 'module_completion',
        moduleId: moduleCompletionData.moduleId,
        moduleTitle: moduleCompletionData.moduleTitle,
        lessonsCompleted: moduleCompletionData.lessonsCompleted || 0,
        timestamp: new Date().toISOString(),
        sessionTime: moduleCompletionData.sessionTime,
        completedAt: new Date().toISOString()
      });

      await updateDoc(sessionRef, { completionEvents });
    }
  } catch (error) {
    console.error('Error logging module completion:', error);
    throw error;
  }
};

export const logIdentityVerification = async (userId, courseId, pvqData) => {
  try {
    const verificationRef = doc(collection(db, 'identityVerifications'));
    await setDoc(verificationRef, {
      userId,
      courseId,
      question: pvqData.question,
      answer: pvqData.answer,
      isCorrect: pvqData.isCorrect,
      timeToAnswer: pvqData.timeToAnswer,
      timestamp: new Date().toISOString(),
      ipAddress: pvqData.ipAddress
    });

    return verificationRef.id;
  } catch (error) {
    console.error('Error logging identity verification:', error);
    throw error;
  }
};

export const logQuizAttempt = async (sessionId, quizAttemptData) => {
  try {
    const sessionRef = doc(db, COMPLIANCE_LOGS_COLLECTION, sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (sessionDoc.exists()) {
      const quizAttempts = sessionDoc.data().quizAttempts || [];
      quizAttempts.push({
        type: 'quiz_attempt',
        quizId: quizAttemptData.quizId,
        quizTitle: quizAttemptData.quizTitle,
        isFinalExam: quizAttemptData.isFinalExam || false,
        attemptNumber: quizAttemptData.attemptNumber || 1,
        score: quizAttemptData.score || 0,
        passed: quizAttemptData.passed || false,
        correctAnswers: quizAttemptData.correctAnswers || 0,
        totalQuestions: quizAttemptData.totalQuestions || 0,
        timeSpent: quizAttemptData.timeSpent || 0,
        startTime: quizAttemptData.startTime || new Date().toISOString(),
        completedAt: quizAttemptData.completedAt || new Date().toISOString(),
        timestamp: new Date().toISOString()
      });

      await updateDoc(sessionRef, { quizAttempts });
    }
  } catch (error) {
    console.error('Error logging quiz attempt:', error);
    throw error;
  }
};

export const getTotalSessionTime = async (userId, courseId) => {
  try {
    const logsRef = collection(db, COMPLIANCE_LOGS_COLLECTION);
    const q = query(
      logsRef,
      where('userId', '==', userId),
      where('courseId', '==', courseId),
      where('status', '==', 'completed')
    );

    const snapshot = await getDocs(q);
    let totalSeconds = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.duration) {
        totalSeconds += data.duration;
      }
    });

    return totalSeconds;
  } catch (error) {
    console.error('Error getting total session time:', error);
    return 0;
  }
};

export const getTotalSessionTimeInMinutes = async (userId, courseId) => {
  try {
    const totalSeconds = await getTotalSessionTime(userId, courseId);
    return Math.floor(totalSeconds / 60);
  } catch (error) {
    console.error('Error getting total session time in minutes:', error);
    return 0;
  }
};

const complianceServices = {
  createComplianceSession,
  updateComplianceSession,
  closeComplianceSession,
  getDailyTime,
  checkDailyHourLockout,
  getSessionHistory,
  logBreak,
  logBreakEnd,
  logLessonCompletion,
  logModuleCompletion,
  logIdentityVerification,
  logQuizAttempt,
  getTotalSessionTime,
  getTotalSessionTimeInMinutes
};

export default complianceServices;
