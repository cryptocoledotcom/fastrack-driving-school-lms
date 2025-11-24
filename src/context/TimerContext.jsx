// Timer Context
// Manages time tracking for learning sessions and breaks
// Includes state compliance tracking

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import APP_CONFIG from '../constants/appConfig';
import {
  createComplianceSession,
  updateComplianceSession,
  closeComplianceSession,
  getDailyTime,
  checkDailyHourLockout,
  logBreak,
  logBreakEnd
} from '../api/complianceServices';
import {
  getRandomPVQQuestion,
  logIdentityVerification
} from '../api/pvqServices';

const TimerContext = createContext();

const MAX_DAILY_HOURS = 4 * 3600;
const BREAK_REQUIRED_AFTER = 2 * 3600;
const MIN_BREAK_DURATION = 10 * 60;
const PVQ_TRIGGER_INTERVAL = 30 * 60;
const PVQ_RANDOM_OFFSET_MIN = 5 * 60;
const PVQ_RANDOM_OFFSET_MAX = 10 * 60;

// Custom hook to use timer context
export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

export const TimerProvider = ({ children, courseId, lessonId, ipAddress }) => {
  const { user } = useAuth();
  
  // State management
  const [sessionTime, setSessionTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [breakTime, setBreakTime] = useState(0);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [isBreakMandatory, setIsBreakMandatory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [lessonsAccessed, setLessonsAccessed] = useState([]);
  const [videoProgress, setVideoProgress] = useState(null);
  const [breakHistory, setBreakHistory] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [lastBreakStartTime, setLastBreakStartTime] = useState(null);
  const [timeSinceLastBreak, setTimeSinceLastBreak] = useState(0);
  const [showPVQModal, setShowPVQModal] = useState(false);
  const [currentPVQQuestion, setCurrentPVQQuestion] = useState(null);
  const [nextPVQTriggerTime, setNextPVQTriggerTime] = useState(null);
  const [pvqSubmitting, setPVQSubmitting] = useState(false);
  const [pvqError, setPVQError] = useState(null);
  
  const intervalRef = useRef(null);
  const breakIntervalRef = useRef(null);
  const saveIntervalRef = useRef(null);
  const pvqCheckIntervalRef = useRef(null);
  const sessionStartTimeRef = useRef(null);
  const lastSaveTimeRef = useRef(Date.now());

  // Check for daily lockout and load time data on mount
  useEffect(() => {
    const initializeSession = async () => {
      if (user && courseId) {
        try {
          const isLocked = await checkDailyHourLockout(user.uid, courseId);
          setIsLockedOut(isLocked);

          const dailyTime = await getDailyTime(user.uid, courseId);
          setTotalTime(dailyTime);
        } catch (err) {
          console.error('Error initializing session:', err);
        }
      }
    };

    initializeSession();
  }, [user, courseId]);

  // Save time data and update compliance log
  const saveTimerData = async () => {
    if (user && currentSessionId && courseId && currentSession) {
      try {
        const sessionData = {
          duration: sessionTime,
          videoProgress,
          lessonsAccessed: lessonId ? [...new Set([...lessonsAccessed, lessonId])] : lessonsAccessed,
          breaks: breakHistory,
          currentSession: {
            ...currentSession,
            endTime: new Date().toISOString(),
            duration: sessionTime,
            videoProgress,
            lessonsAccessed: lessonId ? [...new Set([...lessonsAccessed, lessonId])] : lessonsAccessed,
            ipAddress
          },
          sessionHistory
        };

        await updateComplianceSession(currentSessionId, sessionData);
        lastSaveTimeRef.current = Date.now();
      } catch (err) {
        console.error('Error saving timer data to compliance log:', err);
      }
    }
  };

  // Start timer and create compliance session
  const startTimer = async () => {
    if (!isActive && !isOnBreak && !isLockedOut && user && courseId) {
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
        
        setCurrentSessionId(sessionId);
        setCurrentSession(session);
        sessionStartTimeRef.current = now;
        setIsActive(true);
        setIsPaused(false);
        setLastActivityTime(Date.now());
        setTimeSinceLastBreak(0);
        
        initializePVQTrigger();
      } catch (err) {
        console.error('Error starting timer:', err);
      }
    }
  };

  // Pause timer and save
  const pauseTimer = async () => {
    if (isActive && !isPaused) {
      await saveTimerData();
      setIsPaused(true);
      setLastActivityTime(Date.now());
    }
  };

  // Resume timer
  const resumeTimer = async () => {
    if (isActive && isPaused) {
      await saveTimerData();
      setIsPaused(false);
      setLastActivityTime(Date.now());
    }
  };

  // Stop timer and close compliance session
  const stopTimer = async () => {
    if (isActive && currentSessionId && user && courseId) {
      try {
        const sessionData = {
          duration: sessionTime,
          videoProgress,
          lessonsAccessed: lessonId ? [...new Set([...lessonsAccessed, lessonId])] : lessonsAccessed,
          breaks: breakHistory
        };

        await closeComplianceSession(currentSessionId, sessionData);
      } catch (err) {
        console.error('Error stopping timer:', err);
      }
    }

    setIsActive(false);
    setIsPaused(false);
    setCurrentSessionId(null);
    setSessionTime(0);
    setLessonsAccessed([]);
    setVideoProgress(null);
    setBreakHistory([]);
  };

  // Reset session timer
  const resetSessionTimer = () => {
    setSessionTime(0);
    setIsActive(false);
    setIsPaused(false);
  };

  // Start break and log to compliance
  const startBreak = async (duration = APP_CONFIG.BREAK_INTERVALS.SHORT_BREAK) => {
    if (currentSessionId) {
      try {
        await logBreak(currentSessionId, {
          duration,
          type: 'mandatory',
          startTime: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error logging break:', err);
      }
    }

    setIsOnBreak(true);
    setBreakTime(duration);
    setIsActive(false);
    setIsPaused(false);
    setIsBreakMandatory(false);
    setLastBreakStartTime(Date.now());
  };

  // End break - enforces minimum 10-minute break duration
  const endBreak = async () => {
    if (lastBreakStartTime) {
      const breakDurationSeconds = Math.floor((Date.now() - lastBreakStartTime) / 1000);
      
      if (breakDurationSeconds < MIN_BREAK_DURATION) {
        const minutesRemaining = Math.ceil((MIN_BREAK_DURATION - breakDurationSeconds) / 60);
        const error = new Error(`Break must be at least 10 minutes. ${minutesRemaining} minute(s) remaining.`);
        error.code = 'BREAK_TOO_SHORT';
        error.minutesRemaining = minutesRemaining;
        throw error;
      }

      try {
        if (currentSessionId) {
          await logBreakEnd(currentSessionId, breakDurationSeconds);
        }
      } catch (err) {
        console.error('Error logging break end:', err);
      }

      setBreakHistory(prev => [...prev, {
        startTime: new Date(lastBreakStartTime).toISOString(),
        actualDuration: breakDurationSeconds,
        type: 'mandatory',
        endTime: new Date().toISOString()
      }]);
    }
    
    setIsOnBreak(false);
    setBreakTime(0);
    setLastBreakStartTime(null);
  };

  // Get actual break duration in seconds (for validation before ending)
  const getActualBreakDuration = () => {
    if (!lastBreakStartTime) return 0;
    return Math.floor((Date.now() - lastBreakStartTime) / 1000);
  };

  // Check if current break has met minimum duration
  const hasBreakMetMinimumDuration = () => {
    if (!lastBreakStartTime) return false;
    return getActualBreakDuration() >= MIN_BREAK_DURATION;
  };

  // Initialize PVQ trigger time
  const initializePVQTrigger = () => {
    const randomOffset = Math.floor(
      Math.random() * (PVQ_RANDOM_OFFSET_MAX - PVQ_RANDOM_OFFSET_MIN) + PVQ_RANDOM_OFFSET_MIN
    );
    setNextPVQTriggerTime(PVQ_TRIGGER_INTERVAL + randomOffset);
  };

  // Trigger PVQ modal
  const triggerPVQ = async () => {
    try {
      setPVQError(null);
      setPVQSubmitting(false);
      const question = await getRandomPVQQuestion();
      if (question) {
        setCurrentPVQQuestion(question);
        setShowPVQModal(true);
        setIsActive(false);
        setIsPaused(true);
      }
    } catch (err) {
      console.error('Error triggering PVQ:', err);
      setPVQError('Failed to load verification question');
    }
  };

  // Handle PVQ submission
  const handlePVQSubmit = async (pvqResponse) => {
    if (!currentPVQQuestion || !currentSessionId || !user) return;

    setPVQSubmitting(true);
    setPVQError(null);

    try {
      const timeToAnswer = pvqResponse.timeToAnswer;

      await logIdentityVerification(user.uid, courseId, currentSessionId, {
        questionId: currentPVQQuestion.id,
        question: currentPVQQuestion.question,
        answer: pvqResponse.answer,
        isCorrect: true,
        timeToAnswer,
        ipAddress,
        deviceInfo: navigator.userAgent
      });

      setShowPVQModal(false);
      setCurrentPVQQuestion(null);
      setPVQSubmitting(false);

      initializePVQTrigger();
      setTimeSinceLastBreak(0);
      resumeTimer();
    } catch (err) {
      console.error('Error submitting PVQ:', err);
      setPVQError(err.message || 'Error saving verification');
      setPVQSubmitting(false);
    }
  };

  // Close PVQ modal
  const closePVQModal = () => {
    setShowPVQModal(false);
    setCurrentPVQQuestion(null);
    setPVQError(null);
    setPVQSubmitting(false);
    initializePVQTrigger();
    resumeTimer();
  };

  // Update video progress
  const updateVideoProgress = (currentTime, duration, percentWatched) => {
    setVideoProgress({
      currentTime,
      duration,
      percentWatched
    });
  };

  // Track lesson access
  const trackLessonAccess = (newLessonId) => {
    if (newLessonId && !lessonsAccessed.includes(newLessonId)) {
      setLessonsAccessed(prev => [...prev, newLessonId]);
    }
  };

  // Timer interval effect with mandatory break check
  useEffect(() => {
    if (isActive && !isPaused && !isOnBreak) {
      intervalRef.current = setInterval(() => {
        setSessionTime(prev => {
          const newSessionTime = prev + 1;
          setTotalTime(prevTotal => prevTotal + 1);

          // Check for mandatory break after 2 hours
          if (newSessionTime >= BREAK_REQUIRED_AFTER && !isBreakMandatory) {
            setIsBreakMandatory(true);
          }

          return newSessionTime;
        });

        // Check for 4-hour daily limit
        setTotalTime(prevTotal => {
          const newTotalTime = prevTotal + 1;
          if (newTotalTime >= MAX_DAILY_HOURS) {
            setIsLockedOut(true);
            setIsActive(false);
            setIsPaused(false);
          }
          return newTotalTime;
        });

        setLastActivityTime(Date.now());
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
  }, [isActive, isPaused, isOnBreak, isBreakMandatory]);

  // Break timer interval effect
  useEffect(() => {
    if (isOnBreak && breakTime > 0) {
      breakIntervalRef.current = setInterval(() => {
        setBreakTime(prev => {
          if (prev <= 1) {
            endBreak();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (breakIntervalRef.current) {
        clearInterval(breakIntervalRef.current);
      }
    }

    return () => {
      if (breakIntervalRef.current) {
        clearInterval(breakIntervalRef.current);
      }
    };
  }, [isOnBreak, breakTime]);

  // Auto-save timer data every 30 seconds
  useEffect(() => {
    if (isActive && !isPaused) {
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
  }, [isActive, isPaused, sessionTime, videoProgress, lessonsAccessed, breakHistory]);

  // PVQ trigger check effect
  useEffect(() => {
    if (isActive && !isPaused && !isOnBreak && !showPVQModal && nextPVQTriggerTime) {
      pvqCheckIntervalRef.current = setInterval(() => {
        setTimeSinceLastBreak(prev => {
          if (prev >= nextPVQTriggerTime) {
            triggerPVQ();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (pvqCheckIntervalRef.current) {
        clearInterval(pvqCheckIntervalRef.current);
      }
    }

    return () => {
      if (pvqCheckIntervalRef.current) {
        clearInterval(pvqCheckIntervalRef.current);
      }
    };
  }, [isActive, isPaused, isOnBreak, showPVQModal, nextPVQTriggerTime]);

  // Check for idle timeout
  useEffect(() => {
    const checkIdleTimeout = setInterval(() => {
      if (isActive && !isPaused) {
        const idleTime = Date.now() - lastActivityTime;
        if (idleTime > APP_CONFIG.IDLE_TIMEOUT) {
          pauseTimer();
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkIdleTimeout);
  }, [isActive, isPaused, lastActivityTime]);

  // Check if break is recommended
  const isBreakRecommended = () => {
    return sessionTime >= APP_CONFIG.RECOMMENDED_BREAK_AFTER && !isOnBreak;
  };

  // Check if max daily hours reached
  const isMaxDailyHoursReached = () => {
    return totalTime >= APP_CONFIG.MAX_DAILY_HOURS * 3600;
  };

  // Format time as HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get session time formatted
  const getFormattedSessionTime = () => formatTime(sessionTime);

  // Get total time formatted
  const getFormattedTotalTime = () => formatTime(totalTime);

  // Get break time formatted
  const getFormattedBreakTime = () => formatTime(breakTime);

  // Get remaining daily time
  const getRemainingDailyTime = () => {
    const maxSeconds = APP_CONFIG.MAX_DAILY_HOURS * 3600;
    return Math.max(0, maxSeconds - totalTime);
  };

  const value = {
    // State
    sessionTime,
    totalTime,
    isActive,
    isPaused,
    breakTime,
    isOnBreak,
    isLockedOut,
    isBreakMandatory,
    currentSessionId,
    videoProgress,
    lessonsAccessed,
    breakHistory,
    showPVQModal,
    currentPVQQuestion,
    pvqSubmitting,
    pvqError,
    
    // Methods
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetSessionTimer,
    startBreak,
    endBreak,
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
    closePVQModal
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};

export default TimerContext;