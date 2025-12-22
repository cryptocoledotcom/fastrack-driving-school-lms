// Header Component
// Main navigation header

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../../context/AuthContext';
import Button from '../../common/Button/Button';
import { PUBLIC_ROUTES, PROTECTED_ROUTES } from '../../../constants/routes';

import styles from './Header.module.css';

const Header = () => {
  const { user, logout, getUserFullName } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate(PUBLIC_ROUTES.HOME);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to={PUBLIC_ROUTES.HOME} className={styles.logo}>
          <img src="assets/images/logo.png" alt="Fastrack Driving School" className={styles.logoImage} />
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.nav}>
          <Link to={PUBLIC_ROUTES.HOME} className={styles.navLink}>
            Home
          </Link>
          <Link to={PUBLIC_ROUTES.COURSES} className={styles.navLink}>
            Courses
          </Link>
          <Link to={PUBLIC_ROUTES.ABOUT} className={styles.navLink}>
            About
          </Link>
          <Link to={PUBLIC_ROUTES.CONTACT} className={styles.navLink}>
            Contact
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className={styles.authSection}>
          {user ? (
            <>
              <Link to={PROTECTED_ROUTES.DASHBOARD}>
                <Button variant="outline" size="small">
                  Dashboard
                </Button>
              </Link>
              <div className={styles.userMenu}>
                <span className={styles.userName}>{getUserFullName()}</span>
                <Button variant="ghost" size="small" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link to={PUBLIC_ROUTES.LOGIN}>
                <Button variant="ghost" size="small">
                  Login
                </Button>
              </Link>
              <Link to={PUBLIC_ROUTES.REGISTER}>
                <Button variant="primary" size="small">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className={styles.mobileMenuButton} onClick={toggleMobileMenu}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <Link to={PUBLIC_ROUTES.HOME} className={styles.mobileNavLink} onClick={toggleMobileMenu}>
            Home
          </Link>
          <Link to={PUBLIC_ROUTES.COURSES} className={styles.mobileNavLink} onClick={toggleMobileMenu}>
            Courses
          </Link>
          <Link to={PUBLIC_ROUTES.ABOUT} className={styles.mobileNavLink} onClick={toggleMobileMenu}>
            About
          </Link>
          <Link to={PUBLIC_ROUTES.CONTACT} className={styles.mobileNavLink} onClick={toggleMobileMenu}>
            Contact
          </Link>
          {user ? (
            <>
              <Link to={PROTECTED_ROUTES.DASHBOARD} className={styles.mobileNavLink} onClick={toggleMobileMenu}>
                Dashboard
              </Link>
              <button className={styles.mobileNavLink} onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to={PUBLIC_ROUTES.LOGIN} className={styles.mobileNavLink} onClick={toggleMobileMenu}>
                Login
              </Link>
              <Link to={PUBLIC_ROUTES.REGISTER} className={styles.mobileNavLink} onClick={toggleMobileMenu}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;