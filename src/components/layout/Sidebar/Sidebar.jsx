// Sidebar Component
// Dashboard sidebar navigation

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { PROTECTED_ROUTES, ADMIN_ROUTES } from '../../../constants/routes';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const location = useLocation();
  const { isAdmin } = useAuth();

  const navItems = [
    {
      path: PROTECTED_ROUTES.DASHBOARD,
      label: 'Dashboard',
      icon: '📊'
    },
    {
      path: PROTECTED_ROUTES.MY_COURSES,
      label: 'My Courses',
      icon: '📚'
    },
    {
      path: PROTECTED_ROUTES.PROGRESS,
      label: 'Progress',
      icon: '📈'
    },
    {
      path: PROTECTED_ROUTES.CERTIFICATES,
      label: 'Certificates',
      icon: '🎓'
    },
    {
      path: PROTECTED_ROUTES.PROFILE,
      label: 'Profile',
      icon: '👤'
    },
    {
      path: PROTECTED_ROUTES.SETTINGS,
      label: 'Settings',
      icon: '⚙️'
    },
    ...(isAdmin ? [{
      path: ADMIN_ROUTES.ADMIN_DASHBOARD,
      label: 'Admin Panel',
      icon: '🔧'
    }] : [])
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className={styles.sidebar}>
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

export default Sidebar;