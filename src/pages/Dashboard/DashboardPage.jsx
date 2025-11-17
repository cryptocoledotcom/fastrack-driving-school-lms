// DashboardPage Component
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCourse } from '../../context/CourseContext';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import ProgressBar from '../../components/common/ProgressBar/ProgressBar';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import { PROTECTED_ROUTES } from '../../constants/routes';
import { getUserStats } from '../../api/userServices';
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
  const { user, getUserFullName } = useAuth();
  const { getEnrolledCourses } = useCourse();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (user) {
        try {
          const userStats = await getUserStats(user.uid);
          setStats(userStats);
        } catch (error) {
          console.error('Error fetching stats:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchStats();
  }, [user]);

  const enrolledCourses = getEnrolledCourses();

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
          <Link to={PROTECTED_ROUTES.MY_COURSES}>
            <Button variant="outline" size="small">View All</Button>
          </Link>
        </div>
        {enrolledCourses.length > 0 ? (
          <div className={styles.coursesGrid}>
            {enrolledCourses.slice(0, 3).map((course) => (
              <Card key={course.id} hoverable clickable>
                <h3 className={styles.courseTitle}>{course.title}</h3>
                <p className={styles.courseDescription}>{course.description}</p>
                <ProgressBar progress={course.progress || 0} />
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className={styles.emptyState}>You haven't enrolled in any courses yet.</p>
            <Link to="/courses">
              <Button variant="primary">Browse Courses</Button>
            </Link>
          </Card>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;