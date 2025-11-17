import React from 'react';
import { useCourse } from '../../context/CourseContext';
import Card from '../../components/common/Card/Card';
import ProgressBar from '../../components/common/ProgressBar/ProgressBar';
import styles from './MyCoursesPage.module.css';

const MyCoursesPage = () => {
  const { getEnrolledCourses } = useCourse();
  const courses = getEnrolledCourses();

  return (
    <div className={styles.myCoursesPage}>
      <h1 className={styles.title}>My Courses</h1>
      <div className={styles.grid}>
        {courses.length > 0 ? (
          courses.map((course) => (
            <Card key={course.id} hoverable>
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <ProgressBar progress={course.progress || 0} />
            </Card>
          ))
        ) : (
          <p>No enrolled courses yet.</p>
        )}
      </div>
    </div>
  );
};

export default MyCoursesPage;