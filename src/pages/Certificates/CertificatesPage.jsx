import React from 'react';
import Card from '../../components/common/Card/Card';
import styles from './CertificatesPage.module.css';

const CertificatesPage = () => {
  return (
    <div className={styles.certificatesPage}>
      <h1 className={styles.title}>My Certificates</h1>
      <Card padding="large">
        <p>Your earned certificates will appear here</p>
      </Card>
    </div>
  );
};

export default CertificatesPage;