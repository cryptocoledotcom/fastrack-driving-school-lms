import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';
import SuccessMessage from '../../components/common/SuccessMessage/SuccessMessage';
import ErrorBoundary from '../../components/common/ErrorBoundary/ErrorBoundary';
import EnrollmentManagementTab from '../../components/admin/tabs/EnrollmentManagementTab';
import AnalyticsTab from '../../components/admin/tabs/AnalyticsTab';
import UserManagementTab from '../../components/admin/tabs/UserManagementTab';
import AuditLogsTab from '../../components/admin/tabs/AuditLogsTab';
import SchedulingManagement from '../../components/admin/SchedulingManagement';
import ComplianceReporting from '../../components/admin/ComplianceReporting';
import { enrollmentServices } from '../../api/enrollment';
import { USER_ROLES } from '../../constants/userRoles';
import { COURSE_IDS } from '../../constants/courses';
import styles from './AdminPage.module.css';

const AdminPage = () => {
  const { isAdmin, userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('enrollment-management');
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
          <button
            className={`${styles.tab} ${activeTab === 'enrollment-management' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('enrollment-management')}
          >
            Enrollment Management
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'scheduling' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('scheduling')}
          >
            Lesson Scheduling
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'analytics' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>

          <button
            className={`${styles.tab} ${activeTab === 'compliance-reporting' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('compliance-reporting')}
          >
            Compliance Reports
          </button>

          {(userProfile?.role === USER_ROLES.SUPER_ADMIN || userProfile?.role === USER_ROLES.DMV_ADMIN || userProfile?.role === USER_ROLES.INSTRUCTOR) && (
            <button
              className={`${styles.tab} ${activeTab === 'audit-logs' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('audit-logs')}
            >
              Audit Logs
            </button>
          )}

          {userProfile?.role === USER_ROLES.SUPER_ADMIN && (
            <button
              className={`${styles.tab} ${activeTab === 'user-management' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('user-management')}
            >
              User Management
            </button>
          )}
        </div>

        {activeTab === 'enrollment-management' && (
          <ErrorBoundary fallback={<TabErrorFallback tabName="Enrollment Management" />}>
            <EnrollmentManagementTab
              users={users}
              onResetEnrollment={handleResetEnrollment}
              onResetAllUserEnrollments={handleResetAllUserEnrollments}
              resettingEnrollments={resettingEnrollments}
              getCourseName={getCourseName}
              getStatusBadgeClass={getStatusBadgeClass}
              getPaymentStatusBadgeClass={getPaymentStatusBadgeClass}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'scheduling' && (
          <ErrorBoundary fallback={<TabErrorFallback tabName="Lesson Scheduling" />}>
            <div className={styles.schedulingTab}>
              <Card padding="large">
                <SchedulingManagement />
              </Card>
            </div>
          </ErrorBoundary>
        )}

        {activeTab === 'analytics' && (
          <ErrorBoundary fallback={<TabErrorFallback tabName="Analytics" />}>
            <AnalyticsTab users={users} getCourseName={getCourseName} />
          </ErrorBoundary>
        )}

        {activeTab === 'compliance-reporting' && (
          <ErrorBoundary fallback={<TabErrorFallback tabName="Compliance Reports" />}>
            <ComplianceReporting />
          </ErrorBoundary>
        )}

        {activeTab === 'audit-logs' && (userProfile?.role === USER_ROLES.SUPER_ADMIN || userProfile?.role === USER_ROLES.DMV_ADMIN || userProfile?.role === USER_ROLES.INSTRUCTOR) && (
          <ErrorBoundary fallback={<TabErrorFallback tabName="Audit Logs" />}>
            <AuditLogsTab />
          </ErrorBoundary>
        )}

        {activeTab === 'user-management' && userProfile?.role === USER_ROLES.SUPER_ADMIN && (
          <ErrorBoundary fallback={<TabErrorFallback tabName="User Management" />}>
            <UserManagementTab />
          </ErrorBoundary>
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default AdminPage;
