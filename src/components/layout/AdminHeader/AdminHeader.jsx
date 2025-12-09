import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../common/Button/Button';
import { PUBLIC_ROUTES } from '../../../constants/routes';
import styles from './AdminHeader.module.css';

const AdminHeader = () => {
  const { user, userProfile, logout, getUserFullName } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      setDropdownOpen(false);
      await logout();
      navigate(PUBLIC_ROUTES.HOME);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.branding}>
          <h1 className={styles.title}>Fastrack Admin</h1>
          <p className={styles.subtitle}>Learning Management System</p>
        </div>

        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <div className={styles.userDetails}>
              <p className={styles.userName}>{getUserFullName()}</p>
              <p className={styles.userRole}>
                {userProfile?.role && (
                  <>
                    <span className={styles.roleIcon}>👤</span>
                    <span className={styles.roleBadge}>{userProfile.role}</span>
                  </>
                )}
              </p>
            </div>

            <div className={styles.userMenu}>
              <button
                className={styles.menuButton}
                onClick={toggleDropdown}
                aria-label="User menu"
                aria-expanded={dropdownOpen}
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className={styles.dropdown}>
                  <button
                    className={styles.dropdownItem}
                    onClick={handleLogout}
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {dropdownOpen && (
            <div className={styles.dropdownBackdrop} onClick={closeDropdown} />
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
