// DashboardPage Component
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import EnrollmentCard from '../../components/payment/EnrollmentCard';
import UpcomingLessons from '../../components/scheduling/UpcomingLessons';
import { PROTECTED_ROUTES } from '../../constants/routes';
import { COURSE_IDS, ENROLLMENT_STATUS } from '../../constants/courses';
import { getCourseById } from '../../api/courses/courseServices';
import { getProgress } from '../../api/student/progressServices'; 
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  const { user, getUserFullName } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    const coursesRef = collection(db, 'users', user.uid, 'courses');
    
    const unsubscribe = onSnapshot(
      coursesRef,
      async (snapshot) => {
        try {
          const allEnrollments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          const enrollments = allEnrollments.filter(e => e.status === ENROLLMENT_STATUS.ACTIVE);

          const enrollmentsWithDetails = await Promise.all(
            enrollments.map(async (enrollment) => {
              const courseId = enrollment.courseId || enrollment.id;
              if (!courseId) {
                console.error('Skipping enrollment with missing courseId:', enrollment);
                return null;
              }

              try {
                const courseDetails = await getCourseById(courseId);
                const progress = await getProgress(user.uid, courseId);
                if (!enrollment.courseId) {
                  enrollment.courseId = courseId;
                }
                return {
                  enrollment: enrollment,
                  course: {
                    ...courseDetails,
                    progress: progress.overallProgress || 0,
                    completedLessons: progress.completedLessons || 0,
                    totalLessons: progress.totalLessons || 0,
                  }
                };
              } catch (error) {
                console.error(`Error loading details for course ${courseId}:`, error);
                return {
                  enrollment: enrollment,
                  course: { id: courseId, title: 'Course not found', isMissing: true }
                };
              }
            })
          );

          const validEnrollments = enrollmentsWithDetails.filter(e => e !== null);
          setEnrollments(validEnrollments);
          setLoading(false);
        } catch (error) {
          console.error('Error processing enrollment snapshot:', error);
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error setting up enrollment listener:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleContinueCourse = (courseId) => {
    navigate(`/course-player/${courseId}`);
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Welcome back, {getUserFullName()}!</h1>
        <p className={styles.subtitle}>Continue your learning journey</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
      </div>

      {/* My Courses */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>My Courses</h2>
          {enrollments.length === 0 && (
            <Link to="/courses">
              <Button variant="primary" size="small">Browse Courses</Button>
            </Link>
          )}
        </div>
        
        {enrollments.length > 0 ? (
          <div className={styles.enrollmentsGrid}>
            {enrollments
              .filter(enrollment => !enrollment.enrollment.isComponentOfBundle) // Hide component courses
              .map((enrollment) => (
                <EnrollmentCard
                  key={enrollment.enrollment.id}
                  enrollment={enrollment.enrollment}
                  course={enrollment.course}
                  onContinueCourse={handleContinueCourse}
                  isActionable={enrollment.enrollment.courseId !== COURSE_IDS.BEHIND_WHEEL}
                />
              ))}
          </div>
        ) : (
          <Card>
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📚</div>
              <h3>No courses yet</h3>
              <p>You haven't enrolled in any courses yet. Browse our courses to get started!</p>
              <Link to="/courses">
                <Button variant="primary">Browse Courses</Button>
              </Link>
            </div>
          </Card>
        )}
      </section>

      {/* Upcoming Lessons */}
      {enrollments.length > 0 && (
        <UpcomingLessons />
      )}

      {/* Quick Actions */}
      {enrollments.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            <Card hoverable clickable>
              <Link to={PROTECTED_ROUTES.MY_COURSES} className={styles.actionCard}>
                <div className={styles.actionIcon}>📖</div>
                <h3>View All Courses</h3>
                <p>See all your enrolled courses</p>
              </Link>
            </Card>
            <Card hoverable clickable>
              <Link to={PROTECTED_ROUTES.PROGRESS} className={styles.actionCard}>
                <div className={styles.actionIcon}>📊</div>
                <h3>Track Progress</h3>
                <p>Monitor your learning progress</p>
              </Link>
            </Card>
            <Card hoverable clickable>
              <Link to={PROTECTED_ROUTES.CERTIFICATES} className={styles.actionCard}>
                <div className={styles.actionIcon}>🏆</div>
                <h3>Certificates</h3>
                <p>View your earned certificates</p>
              </Link>
            </Card>
            <Card hoverable clickable>
              <Link to={PROTECTED_ROUTES.PROFILE} className={styles.actionCard}>
                <div className={styles.actionIcon}>👤</div>
                <h3>Profile Settings</h3>
                <p>Update your profile information</p>
              </Link>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
};

export default DashboardPage;