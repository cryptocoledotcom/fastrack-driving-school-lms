import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { PROTECTED_ROUTES } from '../../constants/routes';
import { USER_ROLES } from '../../constants/userRoles';

const AdminDashboardRoute = ({ children }) => {
  const { user, userProfile, loading } = useAuth();

  console.log('[AdminDashboardRoute] Checking access:', {
    loading,
    userEmail: user?.email,
    userRole: userProfile?.role,
    allowedRoles: [USER_ROLES.DMV_ADMIN, USER_ROLES.SUPER_ADMIN],
    isAdmin: userProfile?.role === USER_ROLES.DMV_ADMIN || userProfile?.role === USER_ROLES.SUPER_ADMIN
  });

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (!user) {
    console.warn('[AdminDashboardRoute] No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (!userProfile) {
    console.warn('[AdminDashboardRoute] No userProfile, redirecting to dashboard');
    return <Navigate to={PROTECTED_ROUTES.DASHBOARD} replace />;
  }

  const isAdmin = userProfile.role === USER_ROLES.DMV_ADMIN || 
                  userProfile.role === USER_ROLES.SUPER_ADMIN;

  if (!isAdmin) {
    console.warn('[AdminDashboardRoute] Access denied - user role:', userProfile.role, 'is not admin');
    return <Navigate to={PROTECTED_ROUTES.DASHBOARD} replace />;
  }

  console.log('[AdminDashboardRoute] Access granted for admin user:', user?.email);
  return children;
};

export default AdminDashboardRoute;
