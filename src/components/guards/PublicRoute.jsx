// PublicRoute Component
// Route guard for unauthenticated users (redirects logged-in users)

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { PROTECTED_ROUTES } from '../../constants/routes';

const PublicRoute = ({ children, redirectTo = PROTECTED_ROUTES.DASHBOARD }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (user) {
      navigate(redirectTo, { replace: true });
    }
  }, [loading, user, navigate, redirectTo]);

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (user) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  return children;
};

export default PublicRoute;