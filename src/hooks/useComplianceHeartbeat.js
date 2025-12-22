import { useEffect, useRef, useCallback } from 'react';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { getApp } from 'firebase/app';

const HEARTBEAT_INTERVAL_MS = 60 * 1000;

export const useComplianceHeartbeat = (options = {}) => {
  const {
    userId = null,
    courseId = null,
    sessionId = null,
    enabled = true,
    onLimitReached = null,
    onIdleTimeout = null,
    onHeartbeatSuccess = null,
    onHeartbeatError = null
  } = options;

  const intervalRef = useRef(null);
  const lastHeartbeatRef = useRef(0);

  const sendHeartbeat = useCallback(async () => {
    if (!userId || !courseId || !sessionId) {
      console.warn('useComplianceHeartbeat: Missing required parameters');
      return;
    }

    try {
      const functions = getFunctions(getApp());
      const heartbeatFn = httpsCallable(functions, 'sessionHeartbeat');
      
      const response = await heartbeatFn({
        userId,
        courseId,
        sessionId
      });

      lastHeartbeatRef.current = Date.now();

      if (onHeartbeatSuccess) {
        onHeartbeatSuccess(response.data);
      }

      return response.data;
    } catch (error) {
      console.error('Heartbeat error:', error);

      if (error.code === 'functions/resource-exhausted' || 
          error.message?.includes('DAILY_LIMIT_REACHED')) {
        if (onLimitReached) {
          onLimitReached({
            message: 'You have reached the 4-hour daily training limit',
            minutesCompleted: 240
          });
        }
      } else if (error.code === 'functions/unauthenticated' ||
                 error.message?.includes('SESSION_IDLE_TIMEOUT')) {
        if (onIdleTimeout) {
          onIdleTimeout({
            message: 'Your session has ended due to 15 minutes of inactivity'
          });
        }
      }

      if (onHeartbeatError) {
        onHeartbeatError(error);
      }

      return null;
    }
  }, [userId, courseId, sessionId, onHeartbeatSuccess, onHeartbeatError, onLimitReached, onIdleTimeout]);

  useEffect(() => {
    if (!enabled || !userId || !courseId || !sessionId) {
      return;
    }

    intervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, userId, courseId, sessionId, sendHeartbeat]);

  return {
    sendHeartbeat,
    // eslint-disable-next-line react-hooks/refs
    lastHeartbeatTime: lastHeartbeatRef.current
  };
};

export default useComplianceHeartbeat;
