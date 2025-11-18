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
            <h3>Fastrack Online</h3>
            <p>24hr. Online Course.</p>
            <p>Work at your own pace.</p>
          </Card>
          <Card hoverable>
            <h3>Fastrack Behind the Wheel</h3>
            <p>8hrs. of One on One Driving Lessons</p>
          </Card>
          <Card hoverable>
            <h3>Fastrack Complete</h3>
            <p>A combination of both online and behind the wheel lessons.</p>
            <p>For a significant discount of course fees, you can choose to take both courses together.</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CoursesPage;