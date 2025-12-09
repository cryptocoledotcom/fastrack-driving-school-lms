import React, { useEffect } from 'react';
import AnalyticsTab from '../../components/admin/tabs/AnalyticsTab';
import { useAdminPanel } from '../../hooks/useAdminPanel';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';

const AnalyticsPage = () => {
  const { users, loading, loadUsers } = useAdminPanel();

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading analytics..." />;
  }

  const getCourseName = (courseId) => {
    const names = {
      'fastrack-online': 'Fastrack Online Course',
      'fastrack-behind-the-wheel': 'Fastrack Behind-the-Wheel Course',
      'fastrack-complete': 'Fastrack Complete Package'
    };
    return names[courseId] || courseId;
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Analytics</h1>
      <AnalyticsTab users={users} getCourseName={getCourseName} />
    </div>
  );
};

export default AnalyticsPage;
