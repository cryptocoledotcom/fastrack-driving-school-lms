import React from 'react';
import Card from '../../components/common/Card/Card';
import styles from './SettingsPage.module.css';

const SettingsPage = () => {
  return (
    <div className={styles.settingsPage}>
      <h1 className={styles.title}>Settings</h1>
      <Card padding="large">
        <p>Account settings and preferences</p>
      </Card>
    </div>
  );
};

export default SettingsPage;