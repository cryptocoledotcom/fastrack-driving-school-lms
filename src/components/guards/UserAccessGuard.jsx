import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { PROTECTED_ROUTES } from '../../constants/routes';
import { USER_ROLES } from '../../constants/userRoles';

const UserAccessGuard = ({ children, _accessType = 'profile' }) => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const requestedUserId = params.userId || params.certificateId;

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

    const isAdmin = userProfile.role === USER_ROLES.DMV_ADMIN || userProfile.role === USER_ROLES.SUPER_ADMIN;
    const isOwnResource = user.uid === requestedUserId;

    if (!isOwnResource && !isAdmin) {
      navigate(PROTECTED_ROUTES.DASHBOARD, { replace: true });
    }
  }, [loading, user, userProfile, requestedUserId, navigate]);

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  const isAdmin = userProfile && (userProfile.role === USER_ROLES.DMV_ADMIN || userProfile.role === USER_ROLES.SUPER_ADMIN);
  const isOwnResource = user && user.uid === requestedUserId;

  if (!user || !userProfile || (!isOwnResource && !isAdmin)) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  return children;
};

export default UserAccessGuard;
