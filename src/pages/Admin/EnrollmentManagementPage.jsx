import React, { useEffect } from 'react';
import EnrollmentManagementTab from '../../components/admin/tabs/EnrollmentManagementTab';
import { useAdminPanel } from '../../hooks/useAdminPanel';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';

const EnrollmentManagementPage = () => {
  const {
    users,
    loading,
    resettingEnrollments,
    loadUsers,
    handleResetEnrollment,
    handleResetAllUserEnrollments
  } = useAdminPanel();

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading enrollment data..." />;
  }

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
        return 'status-active';
      case 'pending_payment':
        return 'status-pending';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-default';
    }
  };

  const getPaymentStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'payment-completed';
      case 'partial':
        return 'payment-partial';
      case 'pending':
        return 'payment-pending';
      default:
        return 'payment-default';
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Enrollment Management</h1>
      <EnrollmentManagementTab
        users={users}
        onResetEnrollment={handleResetEnrollment}
        onResetAllUserEnrollments={handleResetAllUserEnrollments}
        resettingEnrollments={resettingEnrollments}
        getCourseName={getCourseName}
        getStatusBadgeClass={getStatusBadgeClass}
        getPaymentStatusBadgeClass={getPaymentStatusBadgeClass}
      />
    </div>
  );
};

export default EnrollmentManagementPage;
