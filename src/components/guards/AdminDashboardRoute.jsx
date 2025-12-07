import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { PROTECTED_ROUTES } from '../../constants/routes';
import { USER_ROLES } from '../../constants/userRoles';

const AdminDashboardRoute = ({ children }) => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    if (!userProfile) {
      navigate(PROTECTED_ROUTES.DASHBOARD, { replace: true });
      return;
    }

    const isAdmin = userProfile.role === USER_ROLES.DMV_ADMIN || 
                    userProfile.role === USER_ROLES.SUPER_ADMIN;

    if (!isAdmin) {
      navigate(PROTECTED_ROUTES.DASHBOARD, { replace: true });
    }
  }, [loading, user, userProfile, navigate]);

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  const isAdmin = userProfile && (userProfile.role === USER_ROLES.DMV_ADMIN || 
                    userProfile.role === USER_ROLES.SUPER_ADMIN);

  if (!user || !userProfile || !isAdmin) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  return children;
};

export default AdminDashboardRoute;
