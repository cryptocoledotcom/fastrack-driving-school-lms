import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';
import SuccessMessage from '../../components/common/SuccessMessage/SuccessMessage';
import ErrorBoundary from '../../components/common/ErrorBoundary/ErrorBoundary';
import { useAdminTabs } from '../../hooks/useAdminTabs';
import { useAdminPanel } from '../../hooks/useAdminPanel';
import styles from './AdminPage.module.css';

const AdminPage = () => {
  const { isAdmin, userProfile } = useAuth();
  const availableTabs = useAdminTabs(userProfile?.role);
  const {
    users,
    loading,
    error,
    success,
    resettingEnrollments,
    activeTab,
    setActiveTab,
    loadUsers,
    handleResetEnrollment,
    handleResetAllUserEnrollments,
    clearError,
    clearSuccess
  } = useAdminPanel();

  useEffect(() => {
    if (!activeTab && availableTabs.length > 0) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab, setActiveTab]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);



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
        
        {error && <ErrorMessage message={error} onDismiss={clearError} />}
        {success && <SuccessMessage message={success} onDismiss={clearSuccess} />}

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
