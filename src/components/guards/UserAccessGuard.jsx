import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { PROTECTED_ROUTES } from '../../constants/routes';
import { USER_ROLES } from '../../constants/userRoles';

const UserAccessGuard = ({ children, accessType = 'profile' }) => {
  const { user, userProfile, loading } = useAuth();
  const params = useParams();
  const requestedUserId = params.userId || params.certificateId;

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!userProfile) {
    return <Navigate to={PROTECTED_ROUTES.DASHBOARD} replace />;
  }

  const isAdmin = userProfile.role === USER_ROLES.DMV_ADMIN || userProfile.role === USER_ROLES.SUPER_ADMIN;
  const isOwnResource = user.uid === requestedUserId;

  if (!isOwnResource && !isAdmin) {
    return <Navigate to={PROTECTED_ROUTES.DASHBOARD} replace />;
  }

  return children;
};

export default UserAccessGuard;
