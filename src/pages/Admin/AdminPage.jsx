import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';
import SuccessMessage from '../../components/common/SuccessMessage/SuccessMessage';
import ErrorBoundary from '../../components/common/ErrorBoundary/ErrorBoundary';
import { enrollmentServices } from '../../api/enrollment';
import { useAdminTabs } from '../../hooks/useAdminTabs';
import styles from './AdminPage.module.css';

const AdminPage = () => {
  const { isAdmin, userProfile } = useAuth();
  const availableTabs = useAdminTabs(userProfile?.role);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(availableTabs[0]?.id || 'enrollment-management');
  const [resettingEnrollments, setResettingEnrollments] = useState({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const usersData = await enrollmentServices.getAllUsersWithEnrollments();
      setUsers(usersData || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please try again.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetEnrollment = async (userId, courseId) => {
    try {
      const key = `${userId}-${courseId}`;
      setResettingEnrollments(prev => ({ ...prev, [key]: true }));
      setError('');
      setSuccess('');

      await enrollmentServices.resetEnrollmentToPending(userId, courseId);
      
      setSuccess(`Reset enrollment for ${courseId} successfully!`);
      await loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error resetting enrollment:', err);
      setError(`Failed to reset enrollment: ${err.message}`);
    } finally {
      const key = `${userId}-${courseId}`;
      setResettingEnrollments(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleResetAllUserEnrollments = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to reset ALL enrollments for ${userName}? This action cannot be undone.`)) {
      try {
        setResettingEnrollments(prev => ({ ...prev, [userId]: true }));
        setError('');
        setSuccess('');

        await enrollmentServices.resetUserEnrollmentsToPending(userId);
        
        setSuccess(`Reset all enrollments for ${userName} successfully!`);
        await loadUsers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('Error resetting user enrollments:', err);
        setError(`Failed to reset enrollments: ${err.message}`);
      } finally {
        setResettingEnrollments(prev => ({ ...prev, [userId]: false }));
      }
    }
  };



  const getCourseName = (courseId) => {
    const names = {
      'fastrack-online': 'Fastrack Online Course',
      'fastrack-behind-the-wheel': 'Fastrack Behind-the-Wheel Course',
      'fastrack-complete': 'Fastrack Complete Package'
    };
    return names[courseId] || courseId;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return styles.statusActive;
      case 'pending_payment':
        return styles.statusPending;
      case 'completed':
        return styles.statusCompleted;
      default:
        return styles.statusDefault;
    }
  };

  const getPaymentStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return styles.paymentCompleted;
      case 'partial':
        return styles.paymentPartial;
      case 'pending':
        return styles.paymentPending;
      default:
        return styles.paymentDefault;
    }
  };

  if (!isAdmin) {
    return (
      <div className={styles.adminPage}>
        <Card>
          <h1 className={styles.title}>Access Denied</h1>
          <p>You do not have permission to access this page.</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading admin panel..." />;
  }

  const TabErrorFallback = ({ tabName }) => (
    <div className={styles.tabErrorContainer}>
      <h3>Error in {tabName}</h3>
      <p>There was a problem loading this section. Please try refreshing the page.</p>
      <Button onClick={() => window.location.reload()}>Refresh Page</Button>
    </div>
  );

  return (
    <ErrorBoundary fallback={<TabErrorFallback tabName="Admin Panel" />}>
    <div className={styles.adminPage}>
      <div className={styles.container}>
        <h1 className={styles.title}>Admin Panel</h1>
        
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        <div className={styles.tabs}>
          {availableTabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {availableTabs.map(tab => {
          const currentTab = activeTab === tab.id;
          if (!currentTab) return null;

          const renderTabContent = () => {
            switch (tab.id) {
              case 'enrollment-management':
                return (
                  <tab.component
                    users={users}
                    onResetEnrollment={handleResetEnrollment}
                    onResetAllUserEnrollments={handleResetAllUserEnrollments}
                    resettingEnrollments={resettingEnrollments}
                    getCourseName={getCourseName}
                    getStatusBadgeClass={getStatusBadgeClass}
                    getPaymentStatusBadgeClass={getPaymentStatusBadgeClass}
                  />
                );
              case 'analytics':
                return <tab.component users={users} getCourseName={getCourseName} />;
              default:
                return <tab.component />;
            }
          };

          return (
            <ErrorBoundary key={tab.id} fallback={<TabErrorFallback tabName={tab.label} />}>
              {tab.wrapInCard ? (
                <div className={styles.schedulingTab}>
                  <Card {...tab.cardProps}>
                    {renderTabContent()}
                  </Card>
                </div>
              ) : (
                renderTabContent()
              )}
            </ErrorBoundary>
          );
        })}
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default AdminPage;
