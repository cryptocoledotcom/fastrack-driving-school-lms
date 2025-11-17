import React from 'react';
import { useParams } from 'react-router-dom';
import Card from '../../components/common/Card/Card';
import styles from './LessonPage.module.css';

const LessonPage = () => {
  const { courseId, lessonId } = useParams();

  return (
    <div className={styles.lessonPage}>
      <h1 className={styles.title}>Lesson</h1>
      <Card padding="large">
        <p>Course: {courseId}</p>
        <p>Lesson: {lessonId}</p>
      </Card>
    </div>
  );
};

export default LessonPage;