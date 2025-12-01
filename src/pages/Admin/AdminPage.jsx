import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import Input from '../../components/common/Input/Input';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';
import SuccessMessage from '../../components/common/SuccessMessage/SuccessMessage';
import ErrorBoundary from '../../components/common/ErrorBoundary/ErrorBoundary';
import SchedulingManagement from '../../components/admin/SchedulingManagement';
import ComplianceReporting from '../../components/admin/ComplianceReporting';
import enrollmentServices from '../../api/enrollment/enrollmentServices';
import { COURSE_IDS } from '../../constants/courses';
import styles from './AdminPage.module.css';

const AdminPage = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [activeTab, setActiveTab] = useState('enrollment-management');
  const [expandedUser, setExpandedUser] = useState(null);
  const [resettingEnrollments, setResettingEnrollments] = useState({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const usersData = await enrollmentServices.getAllUsersWithEnrollments();
      setUsers(usersData || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please try again.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetEnrollment = async (userId, courseId) => {
    try {
      const key = `${userId}-${courseId}`;
      setResettingEnrollments(prev => ({ ...prev, [key]: true }));
      setError('');
      setSuccess('');

      await enrollmentServices.resetEnrollmentToPending(userId, courseId);
      
      setSuccess(`Reset enrollment for ${courseId} successfully!`);
      await loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error resetting enrollment:', err);
      setError(`Failed to reset enrollment: ${err.message}`);
    } finally {
      const key = `${userId}-${courseId}`;
      setResettingEnrollments(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleResetAllUserEnrollments = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to reset ALL enrollments for ${userName}? This action cannot be undone.`)) {
      try {
        setResettingEnrollments(prev => ({ ...prev, [userId]: true }));
        setError('');
        setSuccess('');

        await enrollmentServices.resetUserEnrollmentsToPending(userId);
        
        setSuccess(`Reset all enrollments for ${userName} successfully!`);
        await loadUsers();
        setExpandedUser(null);
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('Error resetting user enrollments:', err);
        setError(`Failed to reset enrollments: ${err.message}`);
      } finally {
        setResettingEnrollments(prev => ({ ...prev, [userId]: false }));
      }
    }
  };

  const getFilteredUsers = () => {
    let filtered = users;

    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter(user =>
        (user.displayName || '').toLowerCase().includes(lowerSearch) ||
        (user.email || '').toLowerCase().includes(lowerSearch)
      );
    }

    if (selectedUserId) {
      filtered = filtered.filter(user => user.userId === selectedUserId);
    }

    if (filterStatus || filterCourse) {
      filtered = filtered.map(user => ({
        ...user,
        enrollments: (user.enrollments || []).filter(enrollment => {
          const statusMatch = !filterStatus || enrollment.status === filterStatus;
          const courseMatch = !filterCourse || enrollment.courseId === filterCourse;
          return statusMatch && courseMatch;
        })
      })).filter(user => user.enrollments.length > 0);
    }

    return filtered;
  };

  const filteredUsers = getFilteredUsers();
  const allUsers = users;

  const getCourseName = (courseId) => {
    const names = {
      'fastrack-online': 'Fastrack Online Course',
      'fastrack-behind-the-wheel': 'Fastrack Behind-the-Wheel Course',
      'fastrack-complete': 'Fastrack Complete Package'
    };
    return names[courseId] || courseId;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return styles.statusActive;
      case 'pending_payment':
        return styles.statusPending;
      case 'completed':
        return styles.statusCompleted;
      default:
        return styles.statusDefault;
    }
  };

  const getPaymentStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return styles.paymentCompleted;
      case 'partial':
        return styles.paymentPartial;
      case 'pending':
        return styles.paymentPending;
      default:
        return styles.paymentDefault;
    }
  };

  if (!isAdmin) {
    return (
      <div className={styles.adminPage}>
        <Card>
          <h1 className={styles.title}>Access Denied</h1>
          <p>You do not have permission to access this page.</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading admin panel..." />;
  }

  const TabErrorFallback = ({ tabName }) => (
    <div className={styles.tabErrorContainer}>
      <h3>Error in {tabName}</h3>
      <p>There was a problem loading this section. Please try refreshing the page.</p>
      <Button onClick={() => window.location.reload()}>Refresh Page</Button>
    </div>
  );

  return (
    <ErrorBoundary fallback={<TabErrorFallback tabName="Admin Panel" />}>
    <div className={styles.adminPage}>
      <div className={styles.container}>
        <h1 className={styles.title}>Admin Panel</h1>
        
        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'enrollment-management' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('enrollment-management')}
          >
            Enrollment Management
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'scheduling' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('scheduling')}
          >
            Lesson Scheduling
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'analytics' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>

          <button
            className={`${styles.tab} ${activeTab === 'compliance-reporting' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('compliance-reporting')}
          >
            Compliance Reports
          </button>
        </div>

        {activeTab === 'enrollment-management' && (
          <ErrorBoundary fallback={<TabErrorFallback tabName="Enrollment Management" />}>
            <div className={styles.enrollmentTab}>
              <Card padding="large">
              <div className={styles.searchSection}>
                <div className={styles.searchBox}>
                  <label className={styles.selectLabel}>Search by Name or Email</label>
                  <Input
                    type="text"
                    value={searchText}
                    onChange={(e) => {
                      setSearchText(e.target.value);
                      setExpandedUser(null);
                    }}
                    placeholder="Enter student name or email..."
                    className={styles.searchInput}
                  />
                </div>

                <div className={styles.filterGrid}>
                  <div className={styles.filterGroup}>
                    <label className={styles.selectLabel}>Filter by Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="pending_payment">Pending Payment</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className={styles.filterGroup}>
                    <label className={styles.selectLabel}>Filter by Course</label>
                    <select
                      value={filterCourse}
                      onChange={(e) => setFilterCourse(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="">All Courses</option>
                      <option value="fastrack-online">Fastrack Online</option>
                      <option value="fastrack-behind-the-wheel">Behind-the-Wheel</option>
                      <option value="fastrack-complete">Complete Package</option>
                    </select>
                  </div>

                  <div className={styles.filterGroup}>
                    <label className={styles.selectLabel}>Or Select Student</label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => {
                        setSelectedUserId(e.target.value);
                        setExpandedUser(null);
                      }}
                      className={styles.filterSelect}
                    >
                      <option value="">-- All Students --</option>
                      {users.map(user => (
                        <option key={user.userId} value={user.userId}>
                          {user.displayName || user.email} ({(user.enrollments || []).length})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.enrollmentsTableContainer}>
                {(() => {
                  const allEnrollments = [];
                  filteredUsers.forEach(user => {
                    (user.enrollments || []).forEach(enrollment => {
                      allEnrollments.push({ ...enrollment, userId: user.userId, userName: user.displayName, userEmail: user.email });
                    });
                  });

                  if (allEnrollments.length === 0) {
                    return (
                      <p className={styles.noUsers}>
                        {searchText || filterStatus || filterCourse ? 'No enrollments found matching your criteria.' : 'Enter search terms or select filters to view enrollments.'}
                      </p>
                    );
                  }

                  return (
                    <table className={styles.enrollmentsTable}>
                      <thead>
                        <tr>
                          <th>Student Name</th>
                          <th>Email</th>
                          <th>Course</th>
                          <th>Status</th>
                          <th>Payment</th>
                          <th>Total</th>
                          <th>Paid</th>
                          <th>Due</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allEnrollments.map((enrollment) => (
                          <tr key={`${enrollment.userId}-${enrollment.id}`}>
                            <td className={styles.studentName}>{enrollment.userName || 'No Name'}</td>
                            <td className={styles.studentEmail}>{enrollment.userEmail || 'No Email'}</td>
                            <td>{getCourseName(enrollment.courseId)}</td>
                            <td>
                              <span className={`${styles.statusBadge} ${getStatusBadgeClass(enrollment.status)}`}>
                                {enrollment.status}
                              </span>
                            </td>
                            <td>
                              <span className={`${styles.paymentBadge} ${getPaymentStatusBadgeClass(enrollment.paymentStatus)}`}>
                                {enrollment.paymentStatus}
                              </span>
                            </td>
                            <td>${enrollment.totalAmount.toFixed(2)}</td>
                            <td>${enrollment.amountPaid.toFixed(2)}</td>
                            <td>${enrollment.amountDue.toFixed(2)}</td>
                            <td className={styles.actionCell}>
                              <Button
                                variant="secondary"
                                size="small"
                                onClick={() => handleResetEnrollment(enrollment.userId, enrollment.courseId)}
                                loading={resettingEnrollments[`${enrollment.userId}-${enrollment.courseId}`]}
                              >
                                Reset
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </Card>
            </div>
          </ErrorBoundary>
        )}

        {activeTab === 'scheduling' && (
          <ErrorBoundary fallback={<TabErrorFallback tabName="Lesson Scheduling" />}>
            <div className={styles.schedulingTab}>
              <Card padding="large">
                <SchedulingManagement />
              </Card>
            </div>
          </ErrorBoundary>
        )}

        {activeTab === 'analytics' && (
          <ErrorBoundary fallback={<TabErrorFallback tabName="Analytics" />}>
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
          </ErrorBoundary>
        )}

        {activeTab === 'compliance-reporting' && (
          <ErrorBoundary fallback={<TabErrorFallback tabName="Compliance Reports" />}>
            <ComplianceReporting />
          </ErrorBoundary>
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default AdminPage;
