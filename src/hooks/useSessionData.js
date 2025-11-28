import { useState, useCallback } from 'react';

export const useSessionData = (options = {}) => {
  const {
    onSessionCreated = null,
    onLessonAccessed = null,
    onSessionClosed = null
  } = options;

  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [lessonsAccessed, setLessonsAccessed] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);

  const lessonCount = lessonsAccessed.length;
  const sessionCount = sessionHistory.length;

  const createSession = useCallback((sessionId, metadata = {}) => {
    const now = new Date().toISOString();
    const session = {
      id: sessionId,
      startTime: now,
      lessonsAccessed: [],
      ...metadata
    };

    setCurrentSessionId(sessionId);
    setCurrentSession(session);
    setLessonsAccessed([]);

    if (onSessionCreated) {
      onSessionCreated(session);
    }
  }, [onSessionCreated]);

  const recordLessonAccess = useCallback((lessonId) => {
    if (lessonId && !lessonsAccessed.includes(lessonId)) {
      const updatedLessons = [...lessonsAccessed, lessonId];
      setLessonsAccessed(updatedLessons);

      if (onLessonAccessed) {
        onLessonAccessed({
          lessonId,
          lessonsAccessed: updatedLessons,
          lessonCount: updatedLessons.length
        });
      }
    }
  }, [lessonsAccessed, onLessonAccessed]);

  const closeSession = useCallback(() => {
    if (currentSessionId && currentSession) {
      const now = new Date().toISOString();
      const closedSession = {
        ...currentSession,
        endTime: now,
        lessonsAccessed: lessonsAccessed,
        lessonCount: lessonsAccessed.length
      };

      setSessionHistory(prev => [...prev, closedSession]);

      if (onSessionClosed) {
        onSessionClosed(closedSession);
      }
    }

    setCurrentSessionId(null);
    setCurrentSession(null);
    setLessonsAccessed([]);
  }, [currentSessionId, currentSession, lessonsAccessed, onSessionClosed]);

  return {
    currentSessionId,
    lessonsAccessed,
    sessionHistory,
    currentSession,
    lessonCount,
    sessionCount,
    createSession,
    recordLessonAccess,
    closeSession
  };
};

export default useSessionData;
