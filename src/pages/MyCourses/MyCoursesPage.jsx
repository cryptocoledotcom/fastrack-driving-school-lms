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
import { COURSE_IDS, ACCESS_STATUS, ENROLLMENT_STATUS } from '../../constants/courses';

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
      const allEnrollments = await getUserEnrollments(user.uid);
      // Only include ACTIVE enrollments (paid/unlocked)
      const enrollments = allEnrollments.filter(e => e.status === ENROLLMENT_STATUS.ACTIVE);

      // Fetch course details and progress for each enrollment
      const coursesWithDetails = await Promise.all(
        enrollments.map(async (enrollment) => {
          try {
            // Get course details from courses collection
            const courseDetails = await getCourseById(enrollment.courseId || enrollment.id);
            
            // Get progress from users/{userId}/userProgress/progress
            const progress = await getProgress(user.uid, enrollment.courseId || enrollment.id);

            return {
              course: {
                ...courseDetails,
                progress: progress.overallProgress || 0,
                completedLessons: progress.completedLessons || 0,
                totalLessons: progress.totalLessons || 0,
              },
              enrollment: enrollment, // Pass the original enrollment object
              lastAccessedAt: progress.lastAccessedAt,
            };
          } catch (err) {
            console.error(`Error loading course ${enrollment.id}:`, err);
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

  const handleCourseClick = (enrollment) => {
    if (enrollment.accessStatus !== ACCESS_STATUS.UNLOCKED) {
      navigate('/dashboard', { state: { message: 'Please complete payment before accessing this course.' } });
      return;
    }
    
    if (enrollment.courseId === COURSE_IDS.ONLINE) {
      navigate(`/course-player/${COURSE_IDS.ONLINE}`);
    }
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
            <Card key={course.enrollment.id} hoverable>
              <div className={styles.courseCard}>
                <h3 className={styles.courseTitle}>{course.course.title}</h3>
                <p className={styles.courseDescription}>{course.course.description}</p>
                
                {/* Payment Status Badge */}
                {course.enrollment.accessStatus !== ACCESS_STATUS.UNLOCKED && (
                  <div className={styles.lockedBanner}>
                    🔒 Purchase Required - Please visit Dashboard to complete payment
                  </div>
                )}
                
                <div className={styles.progressSection}>
                  <div className={styles.progressHeader}>
                    <span>Progress</span>
                    <span className={styles.progressPercent}>{course.course.progress}%</span>
                  </div>
                  <ProgressBar progress={course.course.progress || 0} />
                  <p className={styles.lessonsCompleted}>
                    {course.course.completedLessons} of {course.course.totalLessons} lessons completed
                  </p>
                </div>

                <div className={styles.courseFooter}>
                  {course.enrollment.accessStatus === ACCESS_STATUS.UNLOCKED && course.enrollment.id === COURSE_IDS.ONLINE ? (
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => handleCourseClick(course.enrollment)}
                    >
                      Continue Learning
                    </Button>
                  ) : course.enrollment.id === COURSE_IDS.ONLINE ? (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => navigate('/dashboard')}
                    >
                      Complete Payment on Dashboard
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="small"
                      disabled
                    >
                      Coming Soon
                    </Button>
                  )}
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