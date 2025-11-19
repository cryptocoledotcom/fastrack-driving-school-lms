import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import ProgressBar from '../../components/common/ProgressBar/ProgressBar';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';
import { getUserEnrollments } from '../../api/enrollmentServices';
import { getCourseById } from '../../api/courseServices';
import { getProgress } from '../../api/progressServices';
import styles from './MyCoursesPage.module.css';

const MyCoursesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadEnrolledCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadEnrolledCourses = async () => {
    try {
      setLoading(true);
      setError('');

      // Get user's enrollments from users/{userId}/courses
      const enrollments = await getUserEnrollments(user.uid);

      // Fetch course details and progress for each enrollment
      const coursesWithDetails = await Promise.all(
        enrollments.map(async (enrollment) => {
          try {
            // Get course details from courses collection
            const courseDetails = await getCourseById(enrollment.courseId);
            
            // Get progress from users/{userId}/userProgress/progress
            const progress = await getProgress(user.uid, enrollment.courseId);

            return {
              ...courseDetails,
              enrollment,
              progress: progress.overallProgress || 0,
              completedLessons: progress.completedLessons || 0,
              totalLessons: progress.totalLessons || 0,
              lastAccessedAt: progress.lastAccessedAt
            };
          } catch (err) {
            console.error(`Error loading course ${enrollment.courseId}:`, err);
            return null;
          }
        })
      );

      // Filter out any failed course loads
      const validCourses = coursesWithDetails.filter(course => course !== null);
      setEnrolledCourses(validCourses);

    } catch (err) {
      console.error('Error loading enrolled courses:', err);
      setError('Failed to load your courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (courseId) => {
    navigate(`/course-player/${courseId}`);
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading your courses..." />;
  }

  return (
    <div className={styles.myCoursesPage}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Courses</h1>
        <p className={styles.subtitle}>
          Continue your learning journey
        </p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

      <div className={styles.grid}>
        {enrolledCourses.length > 0 ? (
          enrolledCourses.map((course) => (
            <Card key={course.id} hoverable onClick={() => handleCourseClick(course.id)}>
              <div className={styles.courseCard}>
                <h3 className={styles.courseTitle}>{course.title}</h3>
                <p className={styles.courseDescription}>{course.description}</p>
                
                <div className={styles.progressSection}>
                  <div className={styles.progressHeader}>
                    <span>Progress</span>
                    <span className={styles.progressPercent}>{course.progress}%</span>
                  </div>
                  <ProgressBar progress={course.progress || 0} />
                  <p className={styles.lessonsCompleted}>
                    {course.completedLessons} of {course.totalLessons} lessons completed
                  </p>
                </div>

                <div className={styles.courseFooter}>
                  <Button variant="primary" size="small">
                    Continue Learning
                  </Button>
                  {course.lastAccessedAt && (
                    <span className={styles.lastAccessed}>
                      Last accessed: {new Date(course.lastAccessedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className={styles.emptyState}>
            <p>No enrolled courses yet.</p>
            <Button variant="primary" onClick={() => navigate('/courses')}>
              Browse Courses
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCoursesPage;