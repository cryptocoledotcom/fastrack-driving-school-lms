import { useState, useEffect, useRef, useCallback } from 'react';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
const WARNING_THRESHOLD_MS = 13 * 60 * 1000;
const CHECK_INTERVAL_MS = 1000;

export const useInactivityTimeout = (options = {}) => {
  const {
    enabled = true,
    lastActivityTime = Date.now(),
    onWarning = null,
    onTimeout = null,
    onReset = null
  } = options;

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(120);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  const checkIntervalRef = useRef(null);
  const warningTriggeredRef = useRef(false);

  const checkInactivity = useCallback(() => {
    if (!enabled) return;

    const timeSinceActivity = Date.now() - lastActivityTime;

    if (timeSinceActivity >= INACTIVITY_TIMEOUT_MS && !hasTimedOut) {
      setHasTimedOut(true);
      setShowWarning(false);
      warningTriggeredRef.current = false;

      if (onTimeout) {
        onTimeout();
      }
    } else if (
      timeSinceActivity >= WARNING_THRESHOLD_MS &&
      !warningTriggeredRef.current &&
      !hasTimedOut
    ) {
      warningTriggeredRef.current = true;
      setShowWarning(true);

      if (onWarning) {
        onWarning();
      }
    } else if (timeSinceActivity < WARNING_THRESHOLD_MS && showWarning) {
      setShowWarning(false);
      warningTriggeredRef.current = false;
    }

    if (showWarning) {
      const remaining = Math.ceil(
        (INACTIVITY_TIMEOUT_MS - timeSinceActivity) / 1000
      );
      setSecondsRemaining(Math.max(0, remaining));
    }
  }, [enabled, lastActivityTime, hasTimedOut, showWarning, onWarning, onTimeout]);

  useEffect(() => {
    if (!enabled) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      return;
    }

    checkInactivity();
    checkIntervalRef.current = setInterval(checkInactivity, CHECK_INTERVAL_MS);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [enabled, checkInactivity]);

  const handleContinueLesson = useCallback(() => {
    setShowWarning(false);
    setHasTimedOut(false);
    warningTriggeredRef.current = false;

    if (onReset) {
      onReset();
    }
  }, [onReset]);

  const resetTimeout = useCallback(() => {
    if (hasTimedOut) {
      setHasTimedOut(false);
    }
    setShowWarning(false);
    warningTriggeredRef.current = false;
  }, [hasTimedOut]);

  return {
    showWarning,
    hasTimedOut,
    secondsRemaining,
    handleContinueLesson,
    resetTimeout
  };
};

export default useInactivityTimeout;
