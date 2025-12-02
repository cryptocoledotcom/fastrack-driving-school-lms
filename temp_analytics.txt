import React from 'react';
import Card from '../../common/Card/Card';
import { COURSE_IDS } from '../../../constants/courses';
import styles from '../../../pages/Admin/AdminPage.module.css';

const AnalyticsTab = ({ users, getCourseName }) => {
  const allUsers = users;

  return (
    <div className={styles.analyticsTab}>
      <Card padding="large">
        <h2 className={styles.sectionTitle}>Enrollment Analytics</h2>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Users</div>
            <div className={styles.statValue}>{allUsers.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Enrollments</div>
            <div className={styles.statValue}>
              {allUsers.reduce((sum, user) => sum + (user.enrollments || []).length, 0)}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Active Enrollments</div>
            <div className={styles.statValue}>
              {allUsers.reduce((sum, user) =>
                sum + (user.enrollments || []).filter(e => e.status === 'active').length, 0
              )}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Pending Payment</div>
            <div className={styles.statValue}>
              {allUsers.reduce((sum, user) =>
                sum + (user.enrollments || []).filter(e => e.status === 'pending_payment').length, 0
              )}
            </div>
          </div>
        </div>

        <div className={styles.courseBreakdown}>
          <h3>Enrollment Breakdown by Course</h3>
          <div className={styles.courseStats}>
            {[COURSE_IDS.ONLINE, COURSE_IDS.BEHIND_WHEEL, COURSE_IDS.COMPLETE].map(courseId => {
              const count = allUsers.reduce((sum, user) =>
                sum + (user.enrollments || []).filter(e => e.courseId === courseId).length, 0
              );
              return (
                <div key={courseId} className={styles.courseStat}>
                  <div className={styles.courseName}>{getCourseName(courseId)}</div>
                  <div className={styles.courseCount}>{count} enrollments</div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
