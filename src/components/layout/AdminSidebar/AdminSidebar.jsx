import { Link, useLocation } from 'react-router-dom';

import useAdminNavigation from '../../../hooks/useAdminNavigation';

import styles from './AdminSidebar.module.css';

const AdminSidebar = () => {
  const location = useLocation();
  const availableItems = useAdminNavigation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>Admin</h2>
      </div>
      <nav className={styles.nav}>
        {availableItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
