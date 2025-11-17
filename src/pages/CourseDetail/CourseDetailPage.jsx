import React from 'react';
import { useParams } from 'react-router-dom';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import styles from './CourseDetailPage.module.css';

const CourseDetailPage = () => {
  const { courseId } = useParams();

  return (
    <div className={styles.courseDetailPage}>
      <h1 className={styles.title}>Course Details</h1>
      <Card padding="large">
        <p>Course ID: {courseId}</p>
        <Button variant="primary">Start Learning</Button>
      </Card>
    </div>
  );
};

export default CourseDetailPage;