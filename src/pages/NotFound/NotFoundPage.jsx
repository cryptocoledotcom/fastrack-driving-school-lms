import { Link } from 'react-router-dom';

import Button from '../../components/common/Button/Button';
import { PUBLIC_ROUTES } from '../../constants/routes';

import styles from './NotFoundPage.module.css';

const NotFoundPage = () => {
  return (
    <div className={styles.notFoundPage}>
      <div className={styles.content}>
        <h1 className={styles.title}>404</h1>
        <h2 className={styles.subtitle}>Page Not Found</h2>
        <p className={styles.text}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to={PUBLIC_ROUTES.HOME}>
          <Button variant="primary" size="large">
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;