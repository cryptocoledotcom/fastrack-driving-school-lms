// PublicRoute Component
// Route guard for unauthenticated users (redirects logged-in users)

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { PROTECTED_ROUTES } from '../../constants/routes';

const PublicRoute = ({ children, redirectTo = PROTECTED_ROUTES.DASHBOARD }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (user) {
    // Redirect authenticated users to dashboard
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default PublicRoute;