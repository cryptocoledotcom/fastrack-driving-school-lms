import { useState, useCallback, useReducer } from 'react';
import { enrollmentServices } from '../api/enrollment';

const INITIAL_STATE = {
  users: [],
  loading: true,
  error: '',
  success: '',
  resettingEnrollments: {}
};

const adminPanelReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SUCCESS':
      return { ...state, success: action.payload };
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'SET_RESETTING_ENROLLMENT':
      return {
        ...state,
        resettingEnrollments: {
          ...state.resettingEnrollments,
          [action.payload.key]: action.payload.value
        }
      };
    case 'CLEAR_MESSAGES':
      return { ...state, error: '', success: '' };
    case 'RESET_RESETTING_ENROLLMENTS':
      return { ...state, resettingEnrollments: {} };
    default:
      return state;
  }
};

export const useAdminPanel = () => {
  const [state, dispatch] = useReducer(adminPanelReducer, INITIAL_STATE);
  const [activeTab, setActiveTab] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: '' });
      const usersData = await enrollmentServices.getAllUsersWithEnrollments();
      dispatch({ type: 'SET_USERS', payload: usersData || [] });
    } catch (err) {
      console.error('Error loading users:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load users. Please try again.' });
      dispatch({ type: 'SET_USERS', payload: [] });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const handleResetEnrollment = useCallback(async (userId, courseId) => {
    try {
      const key = `${userId}-${courseId}`;
      dispatch({ type: 'SET_RESETTING_ENROLLMENT', payload: { key, value: true } });
      dispatch({ type: 'CLEAR_MESSAGES' });

      await enrollmentServices.resetEnrollmentToPending(userId, courseId);

      dispatch({
        type: 'SET_SUCCESS',
        payload: `Reset enrollment for ${courseId} successfully!`
      });
      await loadUsers();
      setTimeout(() => {
        dispatch({ type: 'SET_SUCCESS', payload: '' });
      }, 3000);
    } catch (err) {
      console.error('Error resetting enrollment:', err);
      dispatch({
        type: 'SET_ERROR',
        payload: `Failed to reset enrollment: ${err.message}`
      });
    } finally {
      const key = `${userId}-${courseId}`;
      dispatch({ type: 'SET_RESETTING_ENROLLMENT', payload: { key, value: false } });
    }
  }, [loadUsers]);

  const handleResetAllUserEnrollments = useCallback(async (userId, userName) => {
    if (
      window.confirm(
        `Are you sure you want to reset ALL enrollments for ${userName}? This action cannot be undone.`
      )
    ) {
      try {
        dispatch({ type: 'SET_RESETTING_ENROLLMENT', payload: { key: userId, value: true } });
        dispatch({ type: 'CLEAR_MESSAGES' });

        await enrollmentServices.resetUserEnrollmentsToPending(userId);

        dispatch({
          type: 'SET_SUCCESS',
          payload: `Reset all enrollments for ${userName} successfully!`
        });
        await loadUsers();
        setTimeout(() => {
          dispatch({ type: 'SET_SUCCESS', payload: '' });
        }, 3000);
      } catch (err) {
        console.error('Error resetting user enrollments:', err);
        dispatch({
          type: 'SET_ERROR',
          payload: `Failed to reset enrollments: ${err.message}`
        });
      } finally {
        dispatch({ type: 'SET_RESETTING_ENROLLMENT', payload: { key: userId, value: false } });
      }
    }
  }, [loadUsers]);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: '' });
  }, []);

  const clearSuccess = useCallback(() => {
    dispatch({ type: 'SET_SUCCESS', payload: '' });
  }, []);

  return {
    users: state.users,
    loading: state.loading,
    error: state.error,
    success: state.success,
    resettingEnrollments: state.resettingEnrollments,
    activeTab,
    setActiveTab,
    loadUsers,
    handleResetEnrollment,
    handleResetAllUserEnrollments,
    clearError,
    clearSuccess
  };
};
