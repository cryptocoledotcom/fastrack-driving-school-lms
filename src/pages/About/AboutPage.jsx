import React from 'react';
import styles from './AboutPage.module.css';

const AboutPage = () => {
  return (
    <div className={styles.aboutPage}>
      <div className={styles.container}>
        <h1 className={styles.title}>About Fastrack Driving School</h1>
        <p className={styles.text}>
          With over 15 years of experience, Fastrack Driving School has been helping students
          become confident, safe drivers. Our expert instructors and modern teaching methods
          ensure you get the best driving education possible.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;