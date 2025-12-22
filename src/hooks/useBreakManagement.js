import { useState, useCallback, useEffect, useRef } from 'react';

const BREAK_REQUIRED_AFTER = 2 * 3600; // 2 hours for DMV compliance (Ohio OAC 4501-7)
const MIN_BREAK_DURATION = 10 * 60; // 10 minutes minimum per Ohio OAC 4501-7


export const useBreakManagement = (options = {}) => {
  const {
    sessionTime = 0,
    sessionId = null,
    onBreakRequired = null,
    onBreakEnded = null
  } = options;

  const BREAK_STATE_KEY = sessionId ? `fastrack_break_state_${sessionId}` : null;

  const [isOnBreak, setIsOnBreak] = useState(false);
  const [isBreakMandatory, setIsBreakMandatory] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [breakHistory, setBreakHistory] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  const breakRequiredTrackedRef = useRef(false);

   
  const currentBreakDuration = breakStartTime
    // eslint-disable-next-line react-hooks/purity
    ? Math.floor((Date.now() - breakStartTime) / 1000)
    : 0;

  const isBreakDue = sessionTime >= BREAK_REQUIRED_AFTER;
  const isBreakMinimumMet = currentBreakDuration >= MIN_BREAK_DURATION;
  const timeUntilBreakRequired = Math.max(0, BREAK_REQUIRED_AFTER - sessionTime);

  // Restore break state from localStorage when sessionId changes
  useEffect(() => {
    if (BREAK_STATE_KEY) {
      try {
        const saved = localStorage.getItem(BREAK_STATE_KEY);
        if (saved) {
          const state = JSON.parse(saved);
          if (state.isOnBreak && state.breakStartTime) {
            setIsOnBreak(true);
            setBreakStartTime(state.breakStartTime);
            setIsBreakMandatory(state.isBreakMandatory);
          }
        }
      } catch (error) {
        console.error('Failed to restore break state:', error);
      }
    }
    setHydrated(true);
  }, [BREAK_STATE_KEY]);

  // Persist break state to localStorage whenever it changes
  useEffect(() => {
    if (hydrated && BREAK_STATE_KEY) {
      try {
        if (isOnBreak && breakStartTime) {
          localStorage.setItem(BREAK_STATE_KEY, JSON.stringify({
            isOnBreak,
            breakStartTime,
            isBreakMandatory
          }));
        } else {
          localStorage.removeItem(BREAK_STATE_KEY);
        }
      } catch (error) {
        console.error('Failed to persist break state:', error);
      }
    }
  }, [isOnBreak, breakStartTime, isBreakMandatory, hydrated, BREAK_STATE_KEY]);

  const startBreak = useCallback(() => {
    if (!isOnBreak) {
      setIsOnBreak(true);
      setBreakStartTime(Date.now());
      setIsBreakMandatory(false);
      breakRequiredTrackedRef.current = false;
    }
  }, [isOnBreak]);

  const endBreak = useCallback(() => {
    if (isOnBreak && breakStartTime) {
      const breakDuration = Math.floor((Date.now() - breakStartTime) / 1000);

      setBreakHistory(prev => [
        ...prev,
        {
          timestamp: new Date(breakStartTime).toISOString(),
          duration: breakDuration,
          isMandatory: isBreakMandatory
        }
      ]);

      setIsOnBreak(false);
      setBreakStartTime(null);
      setIsBreakMandatory(false);

      if (BREAK_STATE_KEY) {
        try {
          localStorage.removeItem(BREAK_STATE_KEY);
        } catch (error) {
          console.error('Failed to clear break state from localStorage:', error);
        }
      }

      if (onBreakEnded) {
        onBreakEnded(breakDuration);
      }
    }
  }, [isOnBreak, breakStartTime, isBreakMandatory, onBreakEnded, BREAK_STATE_KEY]);

  useEffect(() => {
    if (isBreakDue && !isOnBreak && !breakRequiredTrackedRef.current) {
      breakRequiredTrackedRef.current = true;
      setIsBreakMandatory(true);
      if (onBreakRequired) {
        onBreakRequired(sessionTime);
      }
    }

    if (!isBreakDue) {
      breakRequiredTrackedRef.current = false;
    }
  }, [isBreakDue, isOnBreak, sessionTime, onBreakRequired]);

  return {
    isOnBreak,
    isBreakMandatory,
    breakStartTime,
    breakHistory,
    isBreakDue,
    isBreakMinimumMet,
    currentBreakDuration,
    timeUntilBreakRequired,
    startBreak,
    endBreak
  };
};

export default useBreakManagement;
