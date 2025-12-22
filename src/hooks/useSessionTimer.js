import { useState, useEffect, useRef, useCallback } from 'react';

const MAX_DAILY_HOURS = 4 * 3600;
const BREAK_REQUIRED_AFTER = 2 * 3600; // 2 hours for DMV compliance (Ohio OAC 4501-7)

export const useSessionTimer = (options = {}) => {
  const {
    sessionId = null,
    onDailyLimitReached = null,
    onBreakRequired = null,
    onLockoutCheck = null
  } = options;

  const SESSION_TIME_KEY = sessionId ? `fastrack_session_time_${sessionId}` : null;

  const [sessionTime, setSessionTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [breakRequired, setBreakRequired] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const intervalRef = useRef(null);
  const sessionStartTimeRef = useRef(null);
  const breakCheckRef = useRef(false);

  const startTimer = useCallback(() => {
    if (!isActive && !isLockedOut) {
      setIsActive(true);
      setIsPaused(false);
      sessionStartTimeRef.current = Date.now();
    }
  }, [isActive, isLockedOut]);

  const stopTimer = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    setSessionTime(0);
    sessionStartTimeRef.current = null;
    breakCheckRef.current = false;
    if (SESSION_TIME_KEY) {
      try {
        localStorage.removeItem(SESSION_TIME_KEY);
      } catch (error) {
        console.error('Failed to clear session time from localStorage:', error);
      }
    }
  }, [SESSION_TIME_KEY]);

  const pauseTimer = useCallback(() => {
    if (isActive && !isPaused) {
      setIsPaused(true);
    }
  }, [isActive, isPaused]);

  const resumeTimer = useCallback(() => {
    if (isActive && isPaused) {
      setIsPaused(false);
      sessionStartTimeRef.current = Date.now();
    }
  }, [isActive, isPaused]);

  const sessionMinutes = Math.floor(sessionTime / 60);
  const sessionSeconds = sessionTime % 60;
  const totalMinutes = Math.floor(totalTime / 60);
  const totalSeconds = totalTime % 60;

  // Restore session time from localStorage when sessionId changes
  useEffect(() => {
    if (SESSION_TIME_KEY) {
      try {
        const saved = localStorage.getItem(SESSION_TIME_KEY);
        if (saved) {
          const savedTime = parseInt(saved, 10);
          if (!isNaN(savedTime) && savedTime > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSessionTime(savedTime);
          }
        }
      } catch (error) {
        console.error('Failed to restore session time:', error);
      }
    }
    setHydrated(true);
  }, [SESSION_TIME_KEY]);

  // Persist session time to localStorage whenever it changes
  useEffect(() => {
    if (hydrated && sessionTime > 0 && SESSION_TIME_KEY) {
      try {
        localStorage.setItem(SESSION_TIME_KEY, sessionTime.toString());
      } catch (error) {
        console.error('Failed to persist session time:', error);
      }
    }
  }, [sessionTime, hydrated, SESSION_TIME_KEY]);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSessionTime(prev => {
          const newSessionTime = prev + 1;

          if (newSessionTime >= BREAK_REQUIRED_AFTER && !breakCheckRef.current) {
            breakCheckRef.current = true;
            setBreakRequired(true);
            if (onBreakRequired) {
              onBreakRequired(newSessionTime);
            }
          }

          return newSessionTime;
        });

        setTotalTime(prev => {
          const newTotalTime = prev + 1;

          if (newTotalTime >= MAX_DAILY_HOURS) {
            setIsLockedOut(true);
            setIsActive(false);
            setIsPaused(false);
            if (onDailyLimitReached) {
              onDailyLimitReached(newTotalTime);
            }
          }

          return newTotalTime;
        });
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
  }, [isActive, isPaused, onBreakRequired, onDailyLimitReached]);

  const checkDailyLockout = useCallback(async (checkFunction) => {
    if (checkFunction && typeof checkFunction === 'function') {
      try {
        const isLocked = await checkFunction();
        setIsLockedOut(isLocked);
        if (onLockoutCheck) {
          onLockoutCheck(isLocked);
        }
        return isLocked;
      } catch (error) {
        console.error('Error checking daily lockout:', error);
        return false;
      }
    }
  }, [onLockoutCheck]);

  const loadDailyTime = useCallback((dailyTimeInSeconds) => {
    if (typeof dailyTimeInSeconds === 'number' && dailyTimeInSeconds >= 0) {
      setTotalTime(dailyTimeInSeconds);
    }
  }, []);

  const resetBreakRequired = useCallback(() => {
    setBreakRequired(false);
    breakCheckRef.current = false;
  }, []);

  const resetSessionTime = useCallback(() => {
    setSessionTime(0);
    breakCheckRef.current = false;
  }, []);

  return {
    sessionTime,
    totalTime,
    isActive,
    isPaused,
    isLockedOut,
    breakRequired,
    sessionMinutes,
    sessionSeconds,
    totalMinutes,
    totalSeconds,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    checkDailyLockout,
    loadDailyTime,
    resetBreakRequired,
    resetSessionTime
  };
};

export default useSessionTimer;
