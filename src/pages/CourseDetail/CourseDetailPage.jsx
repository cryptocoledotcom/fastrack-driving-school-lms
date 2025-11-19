import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import ProgressBar from '../../components/common/ProgressBar/ProgressBar';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';
import SuccessMessage from '../../components/common/SuccessMessage/SuccessMessage';
import { getCourseById } from '../../api/courseServices';
import { getModules } from '../../api/moduleServices';
import { getProgress } from '../../api/progressServices';
import { createEnrollment } from '../../api/enrollmentServices';
import styles from './CourseDetailPage.module.css';

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, user]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load course details
      const courseData = await getCourseById(courseId);
      setCourse(courseData);

      // Load modules
      const modulesData = await getModules(courseId);
      setModules(modulesData);

      // Load user progress if logged in
      if (user) {
        const progressData = await getProgress(user.uid, courseId);
        setProgress(progressData);
      }

    } catch (err) {
      console.error('Error loading course:', err);
      setError('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setEnrolling(true);
      setError('');
      setSuccess('');

      // Create enrollment in users/{userId}/courses/{courseId}
         await createEnrollment(user.uid, courseId, user.email);
      setSuccess('Successfully enrolled in course!');

      // Reload progress
      const progressData = await getProgress(user.uid, courseId);
      setProgress(progressData);

      // Redirect to course player after 2 seconds
      setTimeout(() => {
        navigate(`/course-player/${courseId}`);
      }, 2000);

    } catch (err) {
      console.error('Error enrolling:', err);
      setError('Failed to enroll in course. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleStartLearning = () => {
    navigate(`/course-player/${courseId}`);
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading course..." />;
  }

  if (!course) {
    return (
      <div className={styles.errorContainer}>
        <ErrorMessage message="Course not found" />
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const isEnrolled = progress?.totalLessons > 0;

  return (
    <div className={styles.courseDetailPage}>
      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

      {/* Course Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.breadcrumb}>
            <Button variant="ghost" size="small" onClick={() => navigate(-1)}>
              ← Back to Courses
            </Button>
          </div>
          <h1 className={styles.title}>{course.title}</h1>
          <p className={styles.description}>{course.description}</p>
          
          <div className={styles.metadata}>
            <Badge variant="primary">{course.level || 'Beginner'}</Badge>
            <span className={styles.metaItem}>📚 {modules.length} Modules</span>
            <span className={styles.metaItem}>📖 {course.totalLessons || 0} Lessons</span>
            <span className={styles.metaItem}>⏱️ {course.duration || 0} hours</span>
          </div>

          {isEnrolled && progress && (
            <div className={styles.progressSection}>
              <h3>Your Progress</h3>
              <ProgressBar progress={progress.overallProgress || 0} />
              <p>{progress.completedLessons || 0} of {progress.totalLessons || 0} lessons completed</p>
            </div>
          )}

          <div className={styles.actions}>
            {isEnrolled ? (
              <Button variant="primary" size="large" onClick={handleStartLearning}>
                Continue Learning
              </Button>
            ) : (
              <Button 
                variant="primary" 
                size="large" 
                onClick={handleEnroll}
                loading={enrolling}
              >
                Enroll Now
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className={styles.content}>
        {course?.learningPoints && course.learningPoints.length > 0 && (
          <Card padding="large">
            <h2 className={styles.sectionTitle}>What You'll Learn</h2>
            <ul className={styles.learningPoints}>
              {course.learningPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </Card>
        )}

        <Card padding="large">
          <h2 className={styles.sectionTitle}>Course Modules</h2>
          <div className={styles.modulesList}>
            {modules.map((module, index) => (
              <div key={module.id} className={styles.moduleItem}>
                <div className={styles.moduleNumber}>{index + 1}</div>
                <div className={styles.moduleInfo}>
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {course?.requirements && course.requirements.length > 0 && (
          <Card padding="large">
            <h2 className={styles.sectionTitle}>Requirements</h2>
            <ul className={styles.requirements}>
              {course.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CourseDetailPage;