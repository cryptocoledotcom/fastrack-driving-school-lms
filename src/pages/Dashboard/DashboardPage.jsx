// DashboardPage Component
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import EnrollmentCard from '../../components/payment/EnrollmentCard';
import { PROTECTED_ROUTES } from '../../constants/routes';
import { getUserStats } from '../../api/userServices';
import { getUserEnrollments } from '../../api/enrollmentServices';
import { getCourseById } from '../../api/courseServices';
import { getProgress } from '../../api/progressServices'; 
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  const { user, getUserFullName } = useAuth();
  const [stats, setStats] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user stats
      const userStats = await getUserStats(user.uid);
      setStats(userStats);

      // Fetch enrollments
      const enrollments = await getUserEnrollments(user.uid);

      // Fetch course details and progress for each enrollment
      const enrollmentsWithDetails = await Promise.all(
        enrollments.map(async (enrollment) => {
          const courseId = enrollment.courseId || enrollment.id;
          if (!courseId) {
            console.error('Skipping an enrollment because it is missing a courseId or id:', enrollment);
            return null;
          }

          try {
            const courseDetails = await getCourseById(courseId);
            const progress = await getProgress(user.uid, courseId);
            // Create a clear separation between course data and enrollment data
            return {
              enrollment: enrollment, // The original enrollment record
              course: { // The details of the course itself
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
      
      // Filter out any failed course loads if necessary, or handle them in the UI
      const validEnrollments = enrollmentsWithDetails.filter(e => e !== null);
      setEnrollments(validEnrollments);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Reload dashboard data after successful payment
    fetchDashboardData();
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
        <Card>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📚</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats?.enrolledCourses || 0}</div>
              <div className={styles.statLabel}>Enrolled Courses</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats?.completedCourses || 0}</div>
              <div className={styles.statLabel}>Completed</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📈</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats?.inProgressCourses || 0}</div>
              <div className={styles.statLabel}>In Progress</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎓</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats?.completionRate || 0}%</div>
              <div className={styles.statLabel}>Completion Rate</div>
            </div>
          </div>
        </Card>
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
                  onPaymentSuccess={handlePaymentSuccess}
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