import { useState, useCallback, useEffect, useRef } from 'react';

const BREAK_REQUIRED_AFTER = 2 * 3600;
const MIN_BREAK_DURATION = 10 * 60;

export const useBreakManagement = (options = {}) => {
  const {
    sessionTime = 0,
    onBreakRequired = null,
    onBreakEnded = null
  } = options;

  const [isOnBreak, setIsOnBreak] = useState(false);
  const [isBreakMandatory, setIsBreakMandatory] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [breakHistory, setBreakHistory] = useState([]);

  const breakRequiredTrackedRef = useRef(false);

  const currentBreakDuration = breakStartTime
    ? Math.floor((Date.now() - breakStartTime) / 1000)
    : 0;

  const isBreakDue = sessionTime >= BREAK_REQUIRED_AFTER;
  const isBreakMinimumMet = currentBreakDuration >= MIN_BREAK_DURATION;
  const timeUntilBreakRequired = Math.max(0, BREAK_REQUIRED_AFTER - sessionTime);

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

      if (onBreakEnded) {
        onBreakEnded(breakDuration);
      }
    }
  }, [isOnBreak, breakStartTime, isBreakMandatory, onBreakEnded]);

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
