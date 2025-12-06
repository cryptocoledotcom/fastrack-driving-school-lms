// RoleBasedRoute Component
// Route guard for role-based access (admin, student, instructor)

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { PROTECTED_ROUTES } from '../../constants/routes';

const RoleBasedRoute = ({ children, allowedRoles = [] }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!userProfile) {
    return <LoadingSpinner fullScreen text="Loading profile..." />;
  }

  // Check if user has required role
  const hasRequiredRole = allowedRoles.length === 0 || 
    allowedRoles.includes(userProfile.role);

  if (!hasRequiredRole) {
    // Redirect to dashboard if user doesn't have required role
    return <Navigate to={PROTECTED_ROUTES.DASHBOARD} replace />;
  }

  return children;
};

export default RoleBasedRoute;