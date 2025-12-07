// ProtectedRoute Component
// Route guard for authenticated users

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import { PUBLIC_ROUTES } from '../../constants/routes';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate(PUBLIC_ROUTES.LOGIN, { state: { from: location }, replace: true });
    }
  }, [loading, user, navigate, location]);

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (!user) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  return children;
};

export default ProtectedRoute;