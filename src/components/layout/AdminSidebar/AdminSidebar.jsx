import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ADMIN_ROUTES } from '../../../constants/routes';
import styles from './AdminSidebar.module.css';

const AdminSidebar = () => {
  const location = useLocation();

  const navItems = [
    {
      path: ADMIN_ROUTES.ADMIN_DASHBOARD,
      label: 'Dashboard',
      icon: '📊'
    },
    {
      path: ADMIN_ROUTES.MANAGE_USERS,
      label: 'Users',
      icon: '👥'
    },
    {
      path: ADMIN_ROUTES.MANAGE_COURSES,
      label: 'Courses',
      icon: '📚'
    },
    {
      path: ADMIN_ROUTES.MANAGE_LESSONS,
      label: 'Lessons',
      icon: '📝'
    },
    {
      path: ADMIN_ROUTES.ANALYTICS,
      label: 'Analytics',
      icon: '📈'
    },
    {
      path: ADMIN_ROUTES.AUDIT_LOGS,
      label: 'Audit Logs',
      icon: '📋'
    },
    {
      path: ADMIN_ROUTES.SETTINGS,
      label: 'Settings',
      icon: '⚙️'
    }
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>Admin</h2>
      </div>
      <nav className={styles.nav}>
        {navItems.map((item) => (
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
