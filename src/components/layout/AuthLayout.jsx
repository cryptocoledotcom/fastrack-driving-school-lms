// AuthLayout Component
// Layout wrapper for auth pages (centered, minimal)

import { Link } from 'react-router-dom';

import { PUBLIC_ROUTES } from '../../constants/routes';

import styles from './AuthLayout.module.css';

const AuthLayout = ({ children }) => {
  return (
    <div className={styles.layout}>
      <div className={styles.header}>
        <Link to={PUBLIC_ROUTES.HOME} className={styles.logo}>
          <span className={styles.logoText}>Fastrack Driving School</span>
        </Link>
      </div>
      <main className={styles.main}>
        <div className={styles.container}>
          {children}
        </div>
      </main>
      <div className={styles.footer}>
        <p>© {new Date().getFullYear()} Fastrack Driving School. All rights reserved.</p>
      </div>
    </div>
  );
};

export default AuthLayout;