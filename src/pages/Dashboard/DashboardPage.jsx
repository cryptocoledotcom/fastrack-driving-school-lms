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
import { COURSE_IDS } from '../../constants/courses';
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  const { user, getUserFullName } = useAuth();
  const [stats, setStats] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState({});
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
      const userEnrollments = await getUserEnrollments(user.uid);
      setEnrollments(userEnrollments);

      // Fetch course details for each enrollment
      const courseData = {};
      for (const enrollment of userEnrollments) {
        try {
          // For predefined courses, use static data
          if (enrollment.courseId === COURSE_IDS.ONLINE) {
            courseData[enrollment.courseId] = {
              id: COURSE_IDS.ONLINE,
              title: 'Fastrack Online',
              description: '24-hour online driving course'
            };
          } else if (enrollment.courseId === COURSE_IDS.BEHIND_WHEEL) {
            courseData[enrollment.courseId] = {
              id: COURSE_IDS.BEHIND_WHEEL,
              title: 'Fastrack Behind the Wheel',
              description: '8-hour in-person instruction'
            };
          } else if (enrollment.courseId === COURSE_IDS.COMPLETE) {
            courseData[enrollment.courseId] = {
              id: COURSE_IDS.COMPLETE,
              title: 'Fastrack Complete',
              description: 'Complete package (Online + Behind-the-Wheel)'
            };
          } else {
            // Try to fetch from Firestore
            const course = await getCourseById(enrollment.courseId);
            courseData[enrollment.courseId] = course;
          }
        } catch (error) {
          console.error(`Error fetching course ${enrollment.courseId}:`, error);
        }
      }
      setCourses(courseData);
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
              .filter(enrollment => !enrollment.isComponentOfBundle) // Hide component courses
              .map((enrollment) => (
                <EnrollmentCard
                  key={enrollment.id}
                  enrollment={enrollment}
                  course={courses[enrollment.courseId]}
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