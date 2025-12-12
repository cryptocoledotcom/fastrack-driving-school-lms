import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import AdminHeader from './AdminHeader/AdminHeader';
import AdminSidebar from './AdminSidebar/AdminSidebar';
import styles from './AdminLayout.module.css';
import { PROTECTED_ROUTES } from '../../constants/routes';
import { USER_ROLES } from '../../constants/userRoles';

const AdminLayout = ({ children }) => {
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

    const canAccessAdmin = userProfile.role === USER_ROLES.DMV_ADMIN ||
      userProfile.role === USER_ROLES.SUPER_ADMIN ||
      userProfile.role === USER_ROLES.INSTRUCTOR;

    if (!canAccessAdmin) {
      navigate(PROTECTED_ROUTES.DASHBOARD, { replace: true });
    }
  }, [loading, user, userProfile, navigate]);

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  const canAccessAdmin = userProfile && (userProfile.role === USER_ROLES.DMV_ADMIN ||
    userProfile.role === USER_ROLES.SUPER_ADMIN ||
    userProfile.role === USER_ROLES.INSTRUCTOR);

  if (!user || !userProfile || !canAccessAdmin) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  return (
    <div className={styles.layout}>
      <AdminHeader />
      <div className={styles.container}>
        <AdminSidebar />
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
