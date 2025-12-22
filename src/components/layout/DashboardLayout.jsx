// DashboardLayout Component
// Layout wrapper for protected pages (Header + Sidebar)

import Header from './Header/Header';
import Sidebar from './Sidebar/Sidebar';
import styles from './DashboardLayout.module.css';

const DashboardLayout = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Header />
      <div className={styles.container}>
        <Sidebar />
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;