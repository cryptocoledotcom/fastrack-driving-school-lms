// Timer Context
// Manages time tracking for learning sessions and breaks

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import APP_CONFIG from '../constants/appConfig';

const TimerContext = createContext();

// Custom hook to use timer context
export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

export const TimerProvider = ({ children }) => {
  const { user } = useAuth();
  
  // State management
  const [sessionTime, setSessionTime] = useState(0); // Current session time in seconds
  const [totalTime, setTotalTime] = useState(0); // Total time today in seconds
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [breakTime, setBreakTime] = useState(0);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  
  const intervalRef = useRef(null);
  const breakIntervalRef = useRef(null);

  // Load saved time data from localStorage
  useEffect(() => {
    if (user) {
      const savedData = localStorage.getItem(`timer_${user.uid}`);
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          const today = new Date().toDateString();
          
          // Only load data if it's from today
          if (data.date === today) {
            setTotalTime(data.totalTime || 0);
            setSessionTime(data.sessionTime || 0);
          } else {
            // Reset for new day
            setTotalTime(0);
            setSessionTime(0);
          }
        } catch (err) {
          console.error('Error loading timer data:', err);
        }
      }
    }
  }, [user]);

  // Save time data to localStorage
  const saveTimerData = () => {
    if (user) {
      const data = {
        date: new Date().toDateString(),
        totalTime,
        sessionTime,
        lastSaved: Date.now()
      };
      localStorage.setItem(`timer_${user.uid}`, JSON.stringify(data));
    }
  };

  // Start timer
  const startTimer = () => {
    if (!isActive && !isOnBreak) {
      setIsActive(true);
      setIsPaused(false);
      setLastActivityTime(Date.now());
    }
  };

  // Pause timer
  const pauseTimer = () => {
    setIsPaused(true);
  };

  // Resume timer
  const resumeTimer = () => {
    if (isActive) {
      setIsPaused(false);
      setLastActivityTime(Date.now());
    }
  };

  // Stop timer
  const stopTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    saveTimerData();
  };

  // Reset session timer
  const resetSessionTimer = () => {
    setSessionTime(0);
    setIsActive(false);
    setIsPaused(false);
  };

  // Start break
  const startBreak = (duration = APP_CONFIG.BREAK_INTERVALS.SHORT_BREAK) => {
    setIsOnBreak(true);
    setBreakTime(duration);
    setIsActive(false);
    setIsPaused(false);
  };

  // End break
  const endBreak = () => {
    setIsOnBreak(false);
    setBreakTime(0);
  };

  // Timer interval effect
  useEffect(() => {
    if (isActive && !isPaused && !isOnBreak) {
      intervalRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
        setTotalTime(prev => prev + 1);
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
  }, [isActive, isPaused, isOnBreak]);

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

  // Auto-save timer data periodically
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (isActive) {
        saveTimerData();
      }
    }, APP_CONFIG.AUTO_SAVE_INTERVAL);

    return () => clearInterval(saveInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, totalTime, sessionTime]);

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
    
    // Methods
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetSessionTimer,
    startBreak,
    endBreak,
    isBreakRecommended,
    isMaxDailyHoursReached,
    getFormattedSessionTime,
    getFormattedTotalTime,
    getFormattedBreakTime,
    getRemainingDailyTime,
    formatTime
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};

export default TimerContext;