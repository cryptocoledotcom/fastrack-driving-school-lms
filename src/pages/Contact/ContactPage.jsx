import React from 'react';
import Card from '../../components/common/Card/Card';
import styles from './ContactPage.module.css';

const ContactPage = () => {
  return (
    <div className={styles.contactPage}>
      <div className={styles.container}>
        <h1 className={styles.title}>Contact Us</h1>
        <Card padding="large">
          <div className={styles.info}>
            <p>📧 Email: info@fastrackdrive.com</p>
            <p>📞 Phone: (412) 974-8858</p>
            <p>📍 Address: 45122 Oak Dr., Wellsville, Ohio 43968</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ContactPage;