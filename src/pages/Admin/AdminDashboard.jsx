import { useDashboardStats } from '../../hooks/admin/useDashboardStats';
import CertificatesWidget from '../../components/admin/dashboard/CertificatesWidget';
import RevenueWidget from '../../components/admin/dashboard/RevenueWidget';
import ActivityWidget from '../../components/admin/dashboard/ActivityWidget';

import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const { pendingCertificates, monthlyRevenue, recentActivity, loading, error } = useDashboardStats();

  return (
    <div className="container mx-auto p-6">
      <div className={styles.dashboardHeader}>
        <h1>Admin Dashboard</h1>
        <p>Overview of system activity and performance</p>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <p>⚠️ {error}</p>
        </div>
      )}

      <div className={styles.dashboardGrid}>
        <CertificatesWidget count={pendingCertificates} loading={loading} />
        <RevenueWidget amount={monthlyRevenue} loading={loading} />
        <ActivityWidget activities={recentActivity} loading={loading} />
      </div>
    </div>
  );
};

export default AdminDashboard;
