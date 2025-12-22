
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card/Card';

import styles from './ProfilePage.module.css';

const ProfilePage = () => {
  const { user, userProfile } = useAuth();

  return (
    <div className={styles.profilePage}>
      <h1 className={styles.title}>My Profile</h1>
      <Card padding="large">
        <p><strong>Name:</strong> {userProfile?.displayName || 'N/A'}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {userProfile?.role || 'student'}</p>
      </Card>
    </div>
  );
};

export default ProfilePage;