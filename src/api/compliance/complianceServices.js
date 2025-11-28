import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { executeService } from '../base/ServiceWrapper';
import { validateUserId, validateCourseId } from '../validators/validators';
import { ValidationError } from '../errors/ApiError';

const COMPLIANCE_LOGS_COLLECTION = 'complianceLogs';
const MAX_DAILY_HOURS = 4 * 3600;
const MIN_BREAK_DURATION = 10 * 60;

export const createComplianceSession = async (userId, courseId, data) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    if (!data || typeof data !== 'object') {
      throw new ValidationError('data must be a non-empty object');
    }

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
  }, 'createComplianceSession');
};

export const updateComplianceSession = async (sessionId, updates) => {
  return executeService(async () => {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new ValidationError('sessionId must be a non-empty string');
    }
    if (!updates || typeof updates !== 'object') {
      throw new ValidationError('updates must be a non-empty object');
    }

    const sessionRef = doc(db, COMPLIANCE_LOGS_COLLECTION, sessionId);
    await updateDoc(sessionRef, {
      ...updates,
      lastUpdated: new Date().toISOString()
    });
  }, 'updateComplianceSession');
};

export const closeComplianceSession = async (sessionId, sessionData) => {
  return executeService(async () => {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new ValidationError('sessionId must be a non-empty string');
    }
    if (!sessionData || typeof sessionData !== 'object') {
      throw new ValidationError('sessionData must be a non-empty object');
    }

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
  }, 'closeComplianceSession');
};

export const getDailyTime = async (userId, courseId) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);

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
  }, 'getDailyTime');
};

export const checkDailyHourLockout = async (userId, courseId) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);

    const dailyTime = await getDailyTime(userId, courseId);
    return dailyTime >= MAX_DAILY_HOURS;
  }, 'checkDailyHourLockout');
};

export const getSessionHistory = async (userId, courseId, limit = 50) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    if (typeof limit !== 'number' || limit <= 0) {
      throw new ValidationError('limit must be a positive number');
    }

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
  }, 'getSessionHistory');
};

export const logBreak = async (sessionId, breakData) => {
  return executeService(async () => {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new ValidationError('sessionId must be a non-empty string');
    }
    if (!breakData || typeof breakData !== 'object') {
      throw new ValidationError('breakData must be a non-empty object');
    }

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
  }, 'logBreak');
};

export const logBreakEnd = async (sessionId, actualDurationSeconds) => {
  return executeService(async () => {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new ValidationError('sessionId must be a non-empty string');
    }
    if (typeof actualDurationSeconds !== 'number' || actualDurationSeconds < 0) {
      throw new ValidationError('actualDurationSeconds must be a non-negative number');
    }

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
  }, 'logBreakEnd');
};

export const logLessonCompletion = async (sessionId, lessonCompletionData) => {
  return executeService(async () => {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new ValidationError('sessionId must be a non-empty string');
    }
    if (!lessonCompletionData || typeof lessonCompletionData !== 'object') {
      throw new ValidationError('lessonCompletionData must be a non-empty object');
    }

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
  }, 'logLessonCompletion');
};

export const logModuleCompletion = async (sessionId, moduleCompletionData) => {
  return executeService(async () => {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new ValidationError('sessionId must be a non-empty string');
    }
    if (!moduleCompletionData || typeof moduleCompletionData !== 'object') {
      throw new ValidationError('moduleCompletionData must be a non-empty object');
    }

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
  }, 'logModuleCompletion');
};

export const logIdentityVerification = async (userId, courseId, pvqData) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    if (!pvqData || typeof pvqData !== 'object') {
      throw new ValidationError('pvqData must be a non-empty object');
    }

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
  }, 'logIdentityVerification');
};

export const logQuizAttempt = async (sessionId, quizAttemptData) => {
  return executeService(async () => {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new ValidationError('sessionId must be a non-empty string');
    }
    if (!quizAttemptData || typeof quizAttemptData !== 'object') {
      throw new ValidationError('quizAttemptData must be a non-empty object');
    }

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
  }, 'logQuizAttempt');
};

export const getTotalSessionTime = async (userId, courseId) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);

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
  }, 'getTotalSessionTime');
};

export const getTotalSessionTimeInMinutes = async (userId, courseId) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);

    const totalSeconds = await getTotalSessionTime(userId, courseId);
    return Math.floor(totalSeconds / 60);
  }, 'getTotalSessionTimeInMinutes');
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
