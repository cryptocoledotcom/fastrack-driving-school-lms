import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import APP_CONFIG from '../constants/appConfig';
import useSessionTimer from '../hooks/useSessionTimer';
import useBreakManagement from '../hooks/useBreakManagement';
import usePVQTrigger from '../hooks/usePVQTrigger';
import useSessionData from '../hooks/useSessionData';
import useActivityTracking from '../hooks/useActivityTracking';
import useInactivityTimeout from '../hooks/useInactivityTimeout';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  createComplianceSession,
  updateComplianceSession,
  closeComplianceSession,
  getDailyTime,
  logBreak,
  logBreakEnd,
  getBreakTimeRemaining,
  enforceInactivityTimeout
} from '../api/compliance/complianceServices';
import {
  logIdentityVerification as logIdentityVerificationPVQ
} from '../api/student/pvqServices';
import {
  getRandomPersonalSecurityQuestion,
  verifySecurityAnswer
} from '../api/security/securityServices';

const TimerContext = createContext();

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

export const TimerProvider = ({ children, courseId, lessonId, ipAddress }) => {
  const { user } = useAuth();
  
  const [videoProgress, setVideoProgress] = useState(null);
  const [breakTime, setBreakTime] = useState(600); // 10 minutes default for modal initialization
  const [pvqError, setPVQError] = useState(null);

  const intervalRef = useRef(null);
  const breakIntervalRef = useRef(null);
  const saveIntervalRef = useRef(null);
  const lastSaveTimeRef = useRef(Date.now());
  const heartbeatIntervalRef = useRef(null);
  const beforeUnloadHandlerRef = useRef(null);
  const sessionCreationPromiseRef = useRef(null);

  const sessionData = useSessionData({
    onSessionCreated: null,
    onLessonAccessed: null,
    onSessionClosed: null
  });

  const sessionTimer = useSessionTimer({
    sessionId: sessionData.currentSessionId,
    onDailyLimitReached: null,
    onBreakRequired: null,
    onLockoutCheck: null
  });

  const breakManager = useBreakManagement({
    sessionTime: sessionTimer.sessionTime,
    sessionId: sessionData.currentSessionId,
    onBreakRequired: null,
    onBreakEnded: null
  });

  const pvqTrigger = usePVQTrigger({
    sessionTime: sessionTimer.sessionTime,
    getRandomQuestion: user ? () => getRandomPersonalSecurityQuestion(user.uid) : null,
    onPVQTriggered: null,
    onPVQSubmitted: null
  });

  const activityTracking = useActivityTracking(sessionTimer.isActive);

  const [inactivityTimedOut, setInactivityTimedOut] = useState(false);

  const inactivityTimeout = useInactivityTimeout({
    enabled: sessionTimer.isActive && !inactivityTimedOut,
    lastActivityTime: activityTracking.lastActivity,
    onWarning: () => {
      console.log('Inactivity warning triggered');
    },
    onTimeout: async () => {
      console.log('Inactivity timeout - enforcing logout');
      setInactivityTimedOut(true);

      if (user && courseId && sessionData.currentSessionId) {
        try {
          const idleDurationSeconds = Math.floor(
            (Date.now() - activityTracking.lastActivity) / 1000
          );

          await enforceInactivityTimeout(
            user.uid,
            courseId,
            sessionData.currentSessionId,
            idleDurationSeconds
          );

          localStorage.removeItem('lastActivityTime');
          await signOut(auth);
        } catch (error) {
          console.error('Error enforcing inactivity timeout:', error);
          localStorage.removeItem('lastActivityTime');
          await signOut(auth).catch(e => console.error('Error signing out:', e));
        }
      }
    },
    onReset: () => {
      setInactivityTimedOut(false);
      localStorage.setItem('lastActivityTime', Date.now().toString());
      activityTracking.resetActivity();
    }
  });

  useEffect(() => {
    const initializeSession = async () => {
      if (user && courseId) {
        try {
          const dailyTime = await getDailyTime(user.uid, courseId);
          sessionTimer.loadDailyTime(dailyTime);
        } catch (err) {
          console.error('Error initializing session:', err);
        }
      }
    };

    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, courseId]);

  const saveTimerData = async () => {
    if (user && sessionData.currentSessionId && courseId && sessionData.currentSession) {
      try {
        const timerData = {
          duration: sessionTimer.sessionTime,
          videoProgress,
          lessonsAccessed: lessonId ? [...new Set([...sessionData.lessonsAccessed, lessonId])] : sessionData.lessonsAccessed,
          breaks: breakManager.breakHistory,
          currentSession: {
            ...sessionData.currentSession,
            endTime: new Date().toISOString(),
            duration: sessionTimer.sessionTime,
            videoProgress,
            lessonsAccessed: lessonId ? [...new Set([...sessionData.lessonsAccessed, lessonId])] : sessionData.lessonsAccessed,
            ipAddress
          }
        };

        await updateComplianceSession(user.uid, sessionData.currentSessionId, timerData);
        lastSaveTimeRef.current = Date.now();
      } catch (err) {
        console.error('Error saving timer data to compliance log:', err);
      }
    }
  };

  const startHeartbeat = async (sessionId) => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(async () => {
      if (user && sessionId) {
        try {
          await updateComplianceSession(user.uid, sessionId, {
            lastHeartbeat: new Date().toISOString(),
            lastHeartbeatTimestamp: Date.now(),
            status: 'active'
          });
        } catch (error) {
          console.error('Heartbeat failed:', error);
        }
      }
    }, 5 * 60 * 1000);
  };

  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  const setupPageUnloadHandler = (sessionId) => {
    beforeUnloadHandlerRef.current = async (event) => {
      if (user && sessionId) {
        try {
          navigator.sendBeacon(
            '/api/sessions/close',
            JSON.stringify({
              userId: user.uid,
              sessionId,
              closureType: 'page_unload',
              duration: sessionTimer.sessionTime
            })
          );
        } catch (error) {
          console.error('Failed to send unload beacon:', error);
        }
      }
    };

    window.addEventListener('beforeunload', beforeUnloadHandlerRef.current);
  };

  const removePageUnloadHandler = () => {
    if (beforeUnloadHandlerRef.current) {
      window.removeEventListener('beforeunload', beforeUnloadHandlerRef.current);
      beforeUnloadHandlerRef.current = null;
    }
  };

  const startTimerComplianceWrapped = async () => {
    if (sessionCreationPromiseRef.current) {
      await sessionCreationPromiseRef.current;
      return;
    }

    if (!sessionTimer.isActive && !breakManager.isOnBreak && !sessionTimer.isLockedOut && !sessionData.currentSessionId && user && courseId) {
      sessionCreationPromiseRef.current = (async () => {
        try {
          const now = new Date().toISOString();
          const session = {
            startTime: now,
            courseId,
            lessonId: lessonId || null,
            ipAddress,
            lessonsAccessed: lessonId ? [lessonId] : [],
            videoProgress: null
          };
        
        const sessionId = await createComplianceSession(user.uid, courseId, {
          ipAddress,
          deviceInfo: navigator.userAgent,
          startTime: now
        });
        
        localStorage.removeItem('lastActivityTime');
        activityTracking.resetActivity();
        
        sessionTimer.startTimer();
        sessionData.createSession(sessionId, session);
        
        startHeartbeat(sessionId);
        setupPageUnloadHandler(sessionId);
        } catch (err) {
          console.error('Error starting timer:', err);
        } finally {
          sessionCreationPromiseRef.current = null;
        }
      })();

      await sessionCreationPromiseRef.current;
    }
  };

  const pauseTimerComplianceWrapped = async () => {
    if (sessionTimer.isActive && !sessionTimer.isPaused) {
      await saveTimerData();
      sessionTimer.pauseTimer();
    }
  };

  const resumeTimerComplianceWrapped = async () => {
    if (sessionTimer.isActive && sessionTimer.isPaused) {
      await saveTimerData();
      sessionTimer.resumeTimer();
    }
  };

  const stopTimerComplianceWrapped = async () => {
    if (sessionTimer.isActive && sessionData.currentSessionId && user && courseId) {
      stopHeartbeat();
      removePageUnloadHandler();
      
      try {
        const timerData = {
          duration: sessionTimer.sessionTime,
          videoProgress,
          lessonsAccessed: lessonId ? [...new Set([...sessionData.lessonsAccessed, lessonId])] : sessionData.lessonsAccessed,
          breaks: breakManager.breakHistory
        };

        await closeComplianceSession(user.uid, sessionData.currentSessionId, timerData);
      } catch (err) {
        console.error('Error stopping timer:', err);
      }
    }

    sessionTimer.stopTimer();
    sessionData.closeSession();
    setVideoProgress(null);
    setBreakTime(0);

  };

  const resetSessionTimer = () => {
    sessionTimer.resetSessionTime();
  };

  const startBreakComplianceWrapped = async () => {
    setBreakTime(600);

    if (sessionData.currentSessionId && user) {
      try {
        await logBreak(user.uid, sessionData.currentSessionId, {
          reason: 'mandatory'
        });

        const breakInfo = await getBreakTimeRemaining(user.uid, sessionData.currentSessionId);
        setBreakTime(breakInfo.remainingSeconds);
      } catch (err) {
        console.error('Error handling break:', err);
        setBreakTime(600);
      }
    }

    breakManager.startBreak();
    sessionTimer.pauseTimer();
  };

  const endBreakComplianceWrapped = async () => {
    try {
      // SECURITY: Don't calculate duration client-side. Server will validate from timestamps.
      if (sessionData.currentSessionId && user) {
        // Server will validate: time between break start and now >= 600 seconds
        await logBreakEnd(user.uid, sessionData.currentSessionId);
      }

      breakManager.endBreak();
      setBreakTime(0);
      sessionTimer.resumeTimer();
    } catch (err) {
      console.error('Error ending break:', err);
      throw err;
    }
  };

  const updateVideoProgress = (currentTime, duration, percentWatched) => {
    setVideoProgress({
      currentTime,
      duration,
      percentWatched
    });
  };

  const trackLessonAccess = (newLessonId) => {
    sessionData.recordLessonAccess(newLessonId);
  };

  const handlePVQSubmit = async (pvqResponse) => {
    if (!pvqTrigger.currentPVQQuestion || !sessionData.currentSessionId || !user) return;

    try {
      const timeToAnswer = pvqResponse.timeToAnswer;
      const questionNumber = pvqTrigger.currentPVQQuestion.questionNumber;
      
      const verificationResult = await verifySecurityAnswer(user.uid, questionNumber, pvqResponse.answer);
      
      if (!verificationResult.verified) {
        setPVQError('Incorrect answer. Please try again.');
        return;
      }

      const functions = getFunctions(getApp());
      const trackPVQAttemptFn = httpsCallable(functions, 'trackPVQAttempt');

      const trackResult = await trackPVQAttemptFn({
        userId: user.uid,
        courseId,
        sessionId: sessionData.currentSessionId,
        isCorrect: true
      });

      await logIdentityVerificationPVQ(user.uid, courseId, sessionData.currentSessionId, {
        questionId: pvqTrigger.currentPVQQuestion.questionKey,
        question: pvqTrigger.currentPVQQuestion.question,
        answer: pvqResponse.answer,
        isCorrect: true,
        timeToAnswer,
        ipAddress,
        deviceInfo: navigator.userAgent,
        attemptNumber: trackResult.data.attemptCount,
        remainingAttempts: trackResult.data.remainingAttempts
      });

      await pvqTrigger.submitPVQAnswer(pvqResponse.answer);
      breakManager.resetBreakRequired?.();
      resumeTimerComplianceWrapped();
    } catch (err) {
      console.error('Error submitting PVQ:', err);
      if (err.message?.includes('PVQ_LOCKED_OUT') || err.message?.includes('PVQ_MAX_ATTEMPTS_EXCEEDED')) {
        setPVQError(err.message);
      } else {
        setPVQError(err.message || 'Error saving verification');
      }
    }
  };

  const closePVQModalWrapped = () => {
    pvqTrigger.closePVQModal();
    resumeTimerComplianceWrapped();
  };

  const isBreakRecommended = () => {
    return sessionTimer.sessionTime >= (APP_CONFIG.RECOMMENDED_BREAK_AFTER || 5400) && !breakManager.isOnBreak;
  };

  const isMaxDailyHoursReached = () => {
    return sessionTimer.totalTime >= (APP_CONFIG.MAX_DAILY_HOURS * 3600 || 14400);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getFormattedSessionTime = () => formatTime(sessionTimer.sessionTime);
  const getFormattedTotalTime = () => formatTime(sessionTimer.totalTime);
  const getFormattedBreakTime = () => formatTime(breakTime);

  const getRemainingDailyTime = () => {
    const maxSeconds = (APP_CONFIG.MAX_DAILY_HOURS || 4) * 3600;
    return Math.max(0, maxSeconds - sessionTimer.totalTime);
  };

  const getActualBreakDuration = () => breakManager.currentBreakDuration;
  const hasBreakMetMinimumDuration = () => breakManager.isBreakMinimumMet;

  useEffect(() => {
    if (sessionTimer.isActive && !sessionTimer.isPaused && !breakManager.isOnBreak) {
      intervalRef.current = setInterval(() => {
        // Activity tracking handled by server-side heartbeat
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessionTimer.isActive, sessionTimer.isPaused, breakManager.isOnBreak]);



  useEffect(() => {
    if (sessionTimer.isActive && !sessionTimer.isPaused) {
      saveIntervalRef.current = setInterval(() => {
        saveTimerData();
      }, 30000);
    } else {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    }

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionTimer.isActive, sessionTimer.isPaused, sessionTimer.sessionTime, videoProgress, sessionData.lessonsAccessed, breakManager.breakHistory]);





  const value = {
    sessionTime: sessionTimer.sessionTime,
    totalTime: sessionTimer.totalTime,
    isActive: sessionTimer.isActive,
    isPaused: sessionTimer.isPaused,
    breakTime,
    isOnBreak: breakManager.isOnBreak,
    isLockedOut: sessionTimer.isLockedOut,
    isBreakMandatory: breakManager.isBreakMandatory,
    currentSessionId: sessionData.currentSessionId,
    videoProgress,
    lessonsAccessed: sessionData.lessonsAccessed,
    sessionHistory: sessionData.sessionHistory,
    breakHistory: breakManager.breakHistory,
    showPVQModal: pvqTrigger.showPVQModal,
    currentPVQQuestion: pvqTrigger.currentPVQQuestion,
    pvqSubmitting: pvqTrigger.pvqSubmitting,
    pvqError,
    showInactivityWarning: inactivityTimeout.showWarning,
    inactivitySecondsRemaining: inactivityTimeout.secondsRemaining,
    handleInactivityContinue: inactivityTimeout.handleContinueLesson,
    inactivityTimedOut,
    
    startTimer: startTimerComplianceWrapped,
    pauseTimer: pauseTimerComplianceWrapped,
    resumeTimer: resumeTimerComplianceWrapped,
    stopTimer: stopTimerComplianceWrapped,
    resetSessionTimer,
    startBreak: startBreakComplianceWrapped,
    endBreak: endBreakComplianceWrapped,
    triggerPVQ: pvqTrigger.triggerPVQ,
    updateVideoProgress,
    trackLessonAccess,
    isBreakRecommended,
    isMaxDailyHoursReached,
    getFormattedSessionTime,
    getFormattedTotalTime,
    getFormattedBreakTime,
    getRemainingDailyTime,
    formatTime,
    getActualBreakDuration,
    hasBreakMetMinimumDuration,
    handlePVQSubmit,
    closePVQModal: closePVQModalWrapped
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};

export default TimerContext;
