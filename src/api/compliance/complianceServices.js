import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { executeService } from '../base/ServiceWrapper';
import { validateUserId, validateCourseId } from '../../utils/api/validators.js';
import { ValidationError } from '../errors/ApiError';

const MAX_DAILY_HOURS = 4 * 3600;
const MIN_BREAK_DURATION = 10 * 60;

// Helper function to get sessions subcollection reference
// Path: users/{userId}/sessions
const getSessionsRef = (userId) => {
  return collection(db, 'users', userId, 'sessions');
};

// Create a new compliance session (PHASE 1 - Issue #2: Heartbeat support)
export const createComplianceSession = async (userId, courseId, data) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    if (!data || typeof data !== 'object') {
      throw new ValidationError('data must be a non-empty object');
    }

    const sessionsRef = getSessionsRef(userId);
    const sessionRef = doc(sessionsRef);
    const nowMs = new Date().getTime();
    const sessionData = {
      userId,
      courseId,
      sessionId: sessionRef.id,
      startTime: serverTimestamp(),
      startTimestamp: nowMs,
      lastHeartbeatTimestamp: nowMs,
      ipAddress: data.ipAddress || null,
      deviceInfo: data.deviceInfo || null,
      userAgent: data.userAgent || null,
      status: 'active',
      lastHeartbeat: serverTimestamp(),
      completionEvents: [],
      breaks: [],
      createdAt: serverTimestamp()
    };

    await setDoc(sessionRef, sessionData);
    return sessionRef.id;
  }, 'createComplianceSession');
};

// Update compliance session (PHASE 1 - Issue #2: Heartbeat)
export const updateComplianceSession = async (userId, sessionId, updates) => {
  return executeService(async () => {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new ValidationError('sessionId must be a non-empty string');
    }
    if (!updates || typeof updates !== 'object') {
      throw new ValidationError('updates must be a non-empty object');
    }

    const sessionsRef = getSessionsRef(userId);
    const sessionRef = doc(sessionsRef, sessionId);
    
    await updateDoc(sessionRef, {
      ...updates,
      lastUpdated: serverTimestamp()
    });
  }, 'updateComplianceSession');
};

// Close a compliance session
export const closeComplianceSession = async (userId, sessionId, sessionData) => {
  return executeService(async () => {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new ValidationError('sessionId must be a non-empty string');
    }
    if (!sessionData || typeof sessionData !== 'object') {
      throw new ValidationError('sessionData must be a non-empty object');
    }

    const sessionsRef = getSessionsRef(userId);
    const sessionRef = doc(sessionsRef, sessionId);
    
    await updateDoc(sessionRef, {
      endTime: serverTimestamp(),
      endTimestamp: new Date().getTime(),
      duration: sessionData.duration || 0,
      videoProgress: sessionData.videoProgress || null,
      lessonsAccessed: sessionData.lessonsAccessed || [],
      breaks: sessionData.breaks || [],
      status: sessionData.closureType === 'page_unload' ? 'unloaded' : 'completed',
      closureType: sessionData.closureType || 'normal_exit',
      closedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }, 'closeComplianceSession');
};

// Get daily time spent on course
export const getDailyTime = async (userId, courseId) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionsRef = getSessionsRef(userId);
    const q = query(
      sessionsRef,
      where('courseId', '==', courseId)
    );

    const querySnapshot = await getDocs(q);
    let totalTime = 0;

    querySnapshot.forEach((doc) => {
      const session = doc.data();
      if (session.status === 'completed' && session.startTime) {
        const startTime = new Date(session.startTime);
        if (startTime >= today) {
          totalTime += session.duration || 0;
        }
      }
    });

    return totalTime;
  }, 'getDailyTime');
};

// Check if user has hit daily hour lockout
export const checkDailyHourLockout = async (userId, courseId) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);

    const dailyTime = await getDailyTime(userId, courseId);
    return dailyTime >= MAX_DAILY_HOURS;
  }, 'checkDailyHourLockout');
};

// Get session history for a user in a course
export const getSessionHistory = async (userId, courseId, limit = 50) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);

    const sessionsRef = getSessionsRef(userId);
    const q = query(
      sessionsRef,
      where('courseId', '==', courseId)
    );

    const querySnapshot = await getDocs(q);
    const sessions = [];

    querySnapshot.forEach((doc) => {
      sessions.push({
        sessionId: doc.id,
        ...doc.data()
      });
    });

    return sessions.slice(0, limit);
  }, 'getSessionHistory');
};

// Log start of break (SECURITY: Server timestamps only, no client duration)
export const logBreak = async (userId, sessionId, breakData) => {
  return executeService(async () => {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new ValidationError('sessionId must be a non-empty string');
    }
    if (!breakData || typeof breakData !== 'object') {
      throw new ValidationError('breakData must be a non-empty object');
    }

    // SECURITY: Validate break reason
    const validReasons = ['mandatory', 'user_initiated'];
    const breakReason = breakData.reason || 'user_initiated';
    if (!validReasons.includes(breakReason)) {
      throw new ValidationError(`Invalid break reason: ${breakReason}`);
    }

    const sessionsRef = getSessionsRef(userId);
    const sessionRef = doc(sessionsRef, sessionId);
    const now = new Date().toISOString();
    
    await updateDoc(sessionRef, {
      breaks: arrayUnion({
        startTime: now,
        // SECURITY: Do NOT store client-supplied duration. Duration calculated server-side at break end.
        reason: breakReason,
        status: 'active',  // Will be 'completed' after logBreakEnd() validates
        initiatedAt: now
      })
    });
  }, 'logBreak');
};

// Log end of break - Server-side duration calculation (SECURITY: Not trusting client)
export const logBreakEnd = async (userId, sessionId) => {
  return executeService(async () => {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new ValidationError('sessionId must be a non-empty string');
    }

    const sessionsRef = getSessionsRef(userId);
    const sessionRef = doc(sessionsRef, sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      throw new ValidationError('Session not found');
    }

    const breaks = sessionDoc.data().breaks || [];
    if (breaks.length === 0) {
      throw new ValidationError('No active break found');
    }

    const lastBreak = breaks[breaks.length - 1];
    
    // SECURITY: Server calculates duration from server timestamps (not client claim)
    let breakStartMs;
    if (lastBreak.startTime?.toMillis?.()) {
      // Firestore Timestamp object
      breakStartMs = lastBreak.startTime.toMillis();
    } else if (typeof lastBreak.startTime === 'string') {
      // ISO string
      breakStartMs = new Date(lastBreak.startTime).getTime();
    } else if (lastBreak.startTime instanceof Date) {
      // JavaScript Date
      breakStartMs = lastBreak.startTime.getTime();
    } else {
      // Numeric timestamp
      breakStartMs = lastBreak.startTime;
    }
    
    if (!breakStartMs) {
      throw new ValidationError('Break start time is invalid');
    }

    const breakEndMs = Date.now();  // Server's current time (not client time!)
    const breakDurationSeconds = Math.floor((breakEndMs - breakStartMs) / 1000);

    // SECURITY: Server enforces minimum break duration
    if (breakDurationSeconds < MIN_BREAK_DURATION) {
      const minutesRemaining = Math.ceil((MIN_BREAK_DURATION - breakDurationSeconds) / 60);
      const error = new ValidationError(
        `Break must be at least ${MIN_BREAK_DURATION / 60} minutes. ` +
        `Current: ${Math.floor(breakDurationSeconds / 60)} minutes. ` +
        `${minutesRemaining} minute(s) remaining.`
      );
      error.code = 'BREAK_TOO_SHORT';
      error.minutesRemaining = minutesRemaining;
      error.currentDurationSeconds = breakDurationSeconds;
      throw error;
    }

    // SECURITY: Update with server-calculated values
    const now = new Date().toISOString();
    lastBreak.endTime = now;
    lastBreak.actualDuration = breakDurationSeconds;  // Server calculated, not client supplied
    lastBreak.validatedByServer = true;               // Audit flag
    lastBreak.validationTimestamp = now;

    await updateDoc(sessionRef, {
      breaks
    });

    // Return actual duration for audit purposes
    return {
      actualDurationSeconds: breakDurationSeconds,
      validated: true
    };
  }, 'logBreakEnd');
};

// Removed: logLessonCompletion (now handled via batch transaction in progressServices)
// This function is no longer used - lesson completion is atomic with progress updates

// Removed: logModuleCompletion (now handled via batch transaction in progressServices)
// This function is no longer used - module completion is atomic with progress updates

// Log identity verification (PVQ)
export const logIdentityVerification = async (userId, courseId, pvqData) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    if (!pvqData || typeof pvqData !== 'object') {
      throw new ValidationError('pvqData must be a non-empty object');
    }

    const verificationRef = doc(collection(db, 'users', userId, 'identityVerifications'));
    
    await setDoc(verificationRef, {
      userId,
      courseId,
      pvqId: pvqData.pvqId,
      questionsAnswered: pvqData.questionsAnswered || 0,
      correctAnswers: pvqData.correctAnswers || 0,
      passed: pvqData.passed || false,
      verifiedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    return verificationRef.id;
  }, 'logIdentityVerification');
};

// Log quiz attempt
export const logQuizAttempt = async (userId, sessionId, quizAttemptData) => {
  return executeService(async () => {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new ValidationError('sessionId must be a non-empty string');
    }
    if (!quizAttemptData || typeof quizAttemptData !== 'object') {
      throw new ValidationError('quizAttemptData must be a non-empty object');
    }

    const sessionsRef = getSessionsRef(userId);
    const sessionRef = doc(sessionsRef, sessionId);
    
    await updateDoc(sessionRef, {
      completionEvents: arrayUnion({
        type: 'quiz_attempt',
        quizId: quizAttemptData.quizId,
        quizTitle: quizAttemptData.quizTitle,
        score: quizAttemptData.score || 0,
        passingScore: quizAttemptData.passingScore || 0,
        passed: quizAttemptData.passed || false,
        attemptNumber: quizAttemptData.attemptNumber || 1,
        completedAt: serverTimestamp(),
        timestamp: serverTimestamp()
      })
    });
  }, 'logQuizAttempt');
};

// Get total session time for user in course
export const getTotalSessionTime = async (userId, courseId) => {
  return executeService(async () => {
    //Note: getTotalSessionTime gets ALL sessions, not just today
    validateUserId(userId);
    validateCourseId(courseId);

    const sessionsRef = getSessionsRef(userId);
    const q = query(
      sessionsRef,
      where('courseId', '==', courseId),
      where('status', '==', 'completed')
    );

    const querySnapshot = await getDocs(q);
    let totalTime = 0;

    querySnapshot.forEach((doc) => {
      const session = doc.data();
      if (session.status === 'completed') {
        totalTime += session.duration || 0;
      }
    });

    return totalTime;
  }, 'getTotalSessionTime');
};

// Get total session time in minutes
export const getTotalSessionTimeInMinutes = async (userId, courseId) => {
  return executeService(async () => {
    const totalSeconds = await getTotalSessionTime(userId, courseId);
    return Math.round(totalSeconds / 60);
  }, 'getTotalSessionTimeInMinutes');
};

// PHASE 1 - Issue #2: Detect and close orphaned sessions
export const handleOrphanedSessions = async (userId, courseId) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);

    const now = new Date().getTime();
    const thirtyMinutesAgo = now - (30 * 60 * 1000);

    const sessionsRef = getSessionsRef(userId);
    const q = query(
      sessionsRef,
      where('courseId', '==', courseId),
      where('status', '==', 'active')
    );

    const orphanedSnapshots = await getDocs(q);
    const closedSessions = [];

    for (const sessionDoc of orphanedSnapshots.docs) {
      const session = sessionDoc.data();
      const lastHeartbeatTime = session.lastHeartbeat?.toMillis?.() || session.startTimestamp;
      
      if (lastHeartbeatTime < thirtyMinutesAgo) {
        try {
          const startTime = session.startTimestamp || 0;
          const duration = Math.floor((now - startTime) / 1000);

          await updateDoc(sessionDoc.ref, {
            status: 'timeout',
            endTime: serverTimestamp(),
            endTimestamp: now,
            duration: duration,
            closureType: 'orphaned_auto_close',
            auditFlag: 'SESSION_ABANDONED_30MIN',
            updatedAt: serverTimestamp()
          });

          closedSessions.push({
            sessionId: sessionDoc.id,
            duration: duration
          });
        } catch (error) {
          console.error(`Failed to close orphaned session ${sessionDoc.id}:`, error);
        }
      }
    }

    return { closedCount: closedSessions.length };
  }, 'handleOrphanedSessions');
};

export const enforceInactivityTimeout = async (userId, courseId, sessionId, idleDurationSeconds) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);

    if (!sessionId) {
      throw new ValidationError('sessionId is required');
    }

    if (typeof idleDurationSeconds !== 'number' || idleDurationSeconds < 0) {
      throw new ValidationError('idleDurationSeconds must be a non-negative number');
    }

    const { httpsCallable, getFunctions } = await import('firebase/functions');
    const functions = getFunctions();
    const enforceInactivityTimeoutFn = httpsCallable(functions, 'enforceInactivityTimeout');

    const result = await enforceInactivityTimeoutFn({
      userId,
      courseId,
      sessionId,
      idleDurationSeconds
    });

    return result.data;
  }, 'enforceInactivityTimeout');
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
  logIdentityVerification,
  logQuizAttempt,
  getTotalSessionTime,
  getTotalSessionTimeInMinutes,
  handleOrphanedSessions,
  enforceInactivityTimeout
};

export default complianceServices;

// Get server-calculated remaining break time
export const getBreakTimeRemaining = async (userId, sessionId) => {
  return executeService(async () => {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new ValidationError('sessionId must be a non-empty string');
    }

    const sessionsRef = getSessionsRef(userId);
    const sessionRef = doc(sessionsRef, sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      throw new ValidationError('Session not found');
    }

    const breaks = sessionDoc.data().breaks || [];
    if (breaks.length === 0) {
      throw new ValidationError('No active break found');
    }

    const lastBreak = breaks[breaks.length - 1];
    
    // Parse break start time (supports multiple formats)
    let breakStartMs;
    if (lastBreak.startTime?.toMillis?.()) {
      breakStartMs = lastBreak.startTime.toMillis();
    } else if (typeof lastBreak.startTime === 'string') {
      breakStartMs = new Date(lastBreak.startTime).getTime();
    } else if (lastBreak.startTime instanceof Date) {
      breakStartMs = lastBreak.startTime.getTime();
    } else {
      breakStartMs = lastBreak.startTime;
    }

    if (!breakStartMs) {
      throw new ValidationError('Break start time is invalid');
    }

    const now = Date.now();
    const elapsedSeconds = Math.floor((now - breakStartMs) / 1000);
    const remainingSeconds = Math.max(0, MIN_BREAK_DURATION - elapsedSeconds);

    return {
      remainingSeconds,
      elapsedSeconds,
      breakStartTime: breakStartMs,
      currentTime: now,
      isBreakComplete: remainingSeconds === 0
    };
  }, 'getBreakTimeRemaining');
};
