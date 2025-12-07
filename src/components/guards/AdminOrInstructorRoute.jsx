import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { PROTECTED_ROUTES } from '../../constants/routes';
import { USER_ROLES } from '../../constants/userRoles';

const AdminOrInstructorRoute = ({ children }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!userProfile) {
    return <Navigate to={PROTECTED_ROUTES.DASHBOARD} replace />;
  }

  const hasAccess = userProfile.role === USER_ROLES.DMV_ADMIN || 
                    userProfile.role === USER_ROLES.SUPER_ADMIN ||
                    userProfile.role === USER_ROLES.INSTRUCTOR;

  if (!hasAccess) {
    return <Navigate to={PROTECTED_ROUTES.DASHBOARD} replace />;
  }

  return children;
};

export default AdminOrInstructorRoute;
