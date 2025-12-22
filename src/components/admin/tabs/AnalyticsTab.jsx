import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import Card from '../../common/Card/Card';
import analyticsServices from '../../../api/admin/analyticsServices';
import { COURSE_IDS } from '../../../constants/courses';

import styles from './AnalyticsTab.module.css';

const defaultGetCourseName = (courseId) => courseId;

const AnalyticsTab = ({ users = [], getCourseName = defaultGetCourseName }) => {
  const courseNames = useMemo(
    () => ({
      [COURSE_IDS.ONLINE]: getCourseName(COURSE_IDS.ONLINE),
      [COURSE_IDS.BEHIND_WHEEL]: getCourseName(COURSE_IDS.BEHIND_WHEEL),
      [COURSE_IDS.COMPLETE]: getCourseName(COURSE_IDS.COMPLETE),
    }),
    [getCourseName]
  );

  const enrollmentMetrics = useMemo(() => analyticsServices.calculateEnrollmentMetrics(users), [users]);
  const paymentMetrics = useMemo(() => analyticsServices.calculatePaymentMetrics(users), [users]);
  const progressMetrics = useMemo(() => analyticsServices.calculateStudentProgressMetrics(users), [users]);
  const userMetrics = useMemo(() => analyticsServices.calculateUserMetrics(users), [users]);
  
  const enrollmentTrendData = useMemo(() => analyticsServices.generateEnrollmentTrendData(users), [users]);
  const courseDistributionData = useMemo(() => analyticsServices.generateCourseDistributionData(users, courseNames), [users, courseNames]);
  const paymentStatusData = useMemo(() => analyticsServices.generatePaymentStatusData(users), [users]);
  const revenueByCourseData = useMemo(() => analyticsServices.generateRevenueByCourseSeries(users, courseNames), [users, courseNames]);

  const chartColors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#43e97b', '#38f9d7'];

  const topPerformers = useMemo(
    () => progressMetrics.studentsWithProgress
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 5),
    [progressMetrics]
  );

  const topOverduePayments = useMemo(
    () => paymentMetrics.overduePayments
      .sort((a, b) => b.amountDue - a.amountDue)
      .slice(0, 5),
    [paymentMetrics]
  );

  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.headerSection}>
        <div className={`${styles.metricCard} ${styles.enrollment}`}>
          <div className={styles.metricLabel}>Total Enrollments</div>
          <div className={styles.metricValue}>{enrollmentMetrics.totalEnrollments}</div>
          <div className={styles.metricSubtext}>
            {enrollmentMetrics.activeEnrollments} active • {enrollmentMetrics.completedEnrollments} completed
          </div>
        </div>

        <div className={`${styles.metricCard} ${styles.revenue}`}>
          <div className={styles.metricLabel}>Total Revenue</div>
          <div className={styles.metricValue}>${paymentMetrics.totalRevenue.toFixed(2)}</div>
          <div className={styles.metricSubtext}>
            Avg: ${paymentMetrics.averagePaymentAmount.toFixed(2)} per enrollment
          </div>
        </div>

        <div className={`${styles.metricCard} ${styles.users}`}>
          <div className={styles.metricLabel}>Active Users</div>
          <div className={styles.metricValue}>{userMetrics.activeUsers}/{userMetrics.totalUsers}</div>
          <div className={styles.metricSubtext}>
            {userMetrics.retentionRate}% retention rate
          </div>
        </div>

        <div className={`${styles.metricCard} ${styles.payment}`}>
          <div className={styles.metricLabel}>Outstanding</div>
          <div className={styles.metricValue}>${paymentMetrics.totalDue.toFixed(2)}</div>
          <div className={styles.metricSubtext}>
            {paymentMetrics.overduePayments.length} overdue payments
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>Enrollment Trends</h3>
          <div className={styles.chartContainer}>
            {enrollmentTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={enrollmentTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value) => [value, '']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#667eea" 
                    strokeWidth={2} 
                    dot={{ fill: '#667eea', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Enrollments"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#f5576c" 
                    strokeWidth={2} 
                    dot={{ fill: '#f5576c', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Revenue ($)"
                    yAxisId="right"
                  />
                  <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.emptyState}>No enrollment data available</p>
            )}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Enrollment by Course</h3>
          <div className={styles.chartContainer}>
            {courseDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={courseDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {courseDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Enrollments']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.emptyState}>No course distribution data</p>
            )}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Payment Status</h3>
          <div className={styles.chartContainer}>
            {paymentStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.emptyState}>No payment status data</p>
            )}
          </div>
        </div>

        <div className={`${styles.chartCard} ${styles.fullWidthChart}`}>
          <h3>Revenue by Course</h3>
          <div className={styles.chartContainer}>
            {revenueByCourseData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByCourseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="course" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    fill="#667eea" 
                    radius={[8, 8, 0, 0]}
                    name="Revenue"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.emptyState}>No revenue data available</p>
            )}
          </div>
        </div>
      </div>

      <div className={styles.statGridSection}>
        <div className={styles.miniStat}>
          <div className={styles.miniStatLabel}>Completion Rate</div>
          <div className={styles.miniStatValue}>{progressMetrics.completionRate}%</div>
        </div>
        <div className={styles.miniStat}>
          <div className={styles.miniStatLabel}>Avg Progress</div>
          <div className={styles.miniStatValue}>{progressMetrics.averageCompletion}%</div>
        </div>
        <div className={styles.miniStat}>
          <div className={styles.miniStatLabel}>Active Students</div>
          <div className={styles.miniStatValue}>{progressMetrics.activeStudents}</div>
        </div>
        <div className={styles.miniStat}>
          <div className={styles.miniStatLabel}>Completed Students</div>
          <div className={styles.miniStatValue}>{progressMetrics.completedStudents}</div>
        </div>
        <div className={styles.miniStat}>
          <div className={styles.miniStatLabel}>New Users (30d)</div>
          <div className={styles.miniStatValue}>{userMetrics.newUsers}</div>
        </div>
        <div className={styles.miniStat}>
          <div className={styles.miniStatLabel}>Total Paid</div>
          <div className={styles.miniStatValue}>${paymentMetrics.totalPaid.toFixed(0)}</div>
        </div>
      </div>

      {topPerformers.length > 0 && (
        <div className={styles.tableSection}>
          <h3>Top Performing Students</h3>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th className={styles.tableHeaderCell}>Student Name</th>
                <th className={styles.tableHeaderCell}>Avg Progress</th>
                <th className={styles.tableHeaderCell}>Active Courses</th>
                <th className={styles.tableHeaderCell}>Completed Courses</th>
              </tr>
            </thead>
            <tbody>
              {topPerformers.map((student) => (
                <tr key={student.userId} className={styles.tableRow}>
                  <td className={styles.tableCell}>{student.name}</td>
                  <td className={styles.tableCell}>{student.progress}%</td>
                  <td className={styles.tableCell}>{student.activeCourses}</td>
                  <td className={styles.tableCell}>
                    <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>
                      {student.completedCourses}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {topOverduePayments.length > 0 && (
        <div className={styles.tableSection}>
          <h3>Top Overdue Payments</h3>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th className={styles.tableHeaderCell}>Student</th>
                <th className={styles.tableHeaderCell}>Course</th>
                <th className={styles.tableHeaderCell}>Amount Due</th>
                <th className={styles.tableHeaderCell}>Status</th>
              </tr>
            </thead>
            <tbody>
              {topOverduePayments.map((payment) => (
                <tr key={`${payment.userId}-${payment.courseId}`} className={styles.tableRow}>
                  <td className={styles.tableCell}>{payment.userName}</td>
                  <td className={styles.tableCell}>{courseNames[payment.courseId] || payment.courseId}</td>
                  <td className={styles.tableCell}>${payment.amountDue.toFixed(2)}</td>
                  <td className={styles.tableCell}>
                    <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                      Pending
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {users.length === 0 && (
        <Card>
          <div className={styles.emptyState}>
            <p>No user data available to display analytics.</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsTab;
