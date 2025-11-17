import React from 'react';
import Card from '../../components/common/Card/Card';
import styles from './CoursesPage.module.css';

const CoursesPage = () => {
  return (
    <div className={styles.coursesPage}>
      <div className={styles.container}>
        <h1 className={styles.title}>Our Courses</h1>
        <p className={styles.subtitle}>Choose from our comprehensive driving courses</p>
        <div className={styles.grid}>
          <Card hoverable>
            <h3>Beginner's Course</h3>
            <p>Perfect for first-time drivers</p>
          </Card>
          <Card hoverable>
            <h3>Advanced Driving</h3>
            <p>Enhance your driving skills</p>
          </Card>
          <Card hoverable>
            <h3>Defensive Driving</h3>
            <p>Learn safe driving techniques</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;