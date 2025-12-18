import { useState, useEffect, useRef, useCallback } from 'react';

const ACTIVITY_THROTTLE_MS = 30 * 1000;

export const useActivityTracking = (enabled = true) => {
  const [lastActivity, setLastActivity] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lastActivityTime');
      const storedTime = stored ? parseInt(stored, 10) : Date.now();
      const now = Date.now();
      
      if (stored && (now - storedTime) > 20 * 60 * 1000) {
        localStorage.removeItem('lastActivityTime');
        return now;
      }
      return storedTime;
    }
    return Date.now();
  });

  const throttleTimerRef = useRef(null);
  const isThrottledRef = useRef(false);

  const recordActivity = useCallback(() => {
    if (!enabled || isThrottledRef.current) return;

    const now = Date.now();
    setLastActivity(now);

    if (typeof window !== 'undefined') {
      localStorage.setItem('lastActivityTime', now.toString());
    }

    isThrottledRef.current = true;
    throttleTimerRef.current = setTimeout(() => {
      isThrottledRef.current = false;
    }, ACTIVITY_THROTTLE_MS);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = () => recordActivity();
    const handleMouseDown = () => recordActivity();
    const handleKeyDown = () => recordActivity();
    const handleScroll = () => recordActivity();

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('keydown', handleKeyDown, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);

      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, [enabled, recordActivity]);

  const getTimeSinceLastActivity = useCallback(() => {
    return Date.now() - lastActivity;
  }, [lastActivity]);

  const resetActivity = useCallback(() => {
    recordActivity();
  }, [recordActivity]);

  return {
    lastActivity,
    getTimeSinceLastActivity,
    resetActivity
  };
};

export default useActivityTracking;
