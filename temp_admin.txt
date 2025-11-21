import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import Input from '../../components/common/Input/Input';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';
import SuccessMessage from '../../components/common/SuccessMessage/SuccessMessage';
import { 
  getAllUsersWithEnrollments,
  resetEnrollmentToPending,
  resetUserEnrollmentsToPending
} from '../../api/enrollmentServices';
import { COURSE_IDS } from '../../constants/courses';
import styles from './AdminPage.module.css';

const AdminPage = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
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
      const usersData = await getAllUsersWithEnrollments();
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please try again.');
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

      await resetEnrollmentToPending(userId, courseId);
      
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

        await resetUserEnrollmentsToPending(userId);
        
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

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
    user.displayName.toLowerCase().includes(searchEmail.toLowerCase())
  );

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

  return (
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
            className={`${styles.tab} ${activeTab === 'analytics' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        </div>

        {activeTab === 'enrollment-management' && (
          <div className={styles.enrollmentTab}>
            <Card padding="large">
              <div className={styles.searchSection}>
                <Input
                  label="Search Users by Email or Name"
                  type="text"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Search..."
                  fullWidth
                />
              </div>

              <div className={styles.usersList}>
                {filteredUsers.length === 0 ? (
                  <p className={styles.noUsers}>No users with enrollments found.</p>
                ) : (
                  filteredUsers.map((user) => (
                    <div key={user.userId} className={styles.userCard}>
                      <div
                        className={styles.userHeader}
                        onClick={() => setExpandedUser(
                          expandedUser === user.userId ? null : user.userId
                        )}
                      >
                        <div className={styles.userInfo}>
                          <h3 className={styles.userName}>{user.displayName || 'No Name'}</h3>
                          <p className={styles.userEmail}>{user.email}</p>
                          <p className={styles.enrollmentCount}>
                            {user.enrollments.length} enrollment{user.enrollments.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <span className={`${styles.expandIcon} ${expandedUser === user.userId ? styles.expanded : ''}`}>
                          ▼
                        </span>
                      </div>

                      {expandedUser === user.userId && (
                        <div className={styles.userDetails}>
                          <div className={styles.enrollmentsTable}>
                            {user.enrollments.map((enrollment) => (
                              <div key={enrollment.id} className={styles.enrollmentRow}>
                                <div className={styles.enrollmentInfo}>
                                  <div className={styles.courseName}>
                                    {getCourseName(enrollment.courseId)}
                                  </div>
                                  <div className={styles.enrollmentMeta}>
                                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(enrollment.status)}`}>
                                      {enrollment.status}
                                    </span>
                                    <span className={`${styles.paymentBadge} ${getPaymentStatusBadgeClass(enrollment.paymentStatus)}`}>
                                      {enrollment.paymentStatus}
                                    </span>
                                    <span className={styles.accessStatus}>
                                      Access: {enrollment.accessStatus}
                                    </span>
                                  </div>
                                  <div className={styles.enrollmentDetails}>
                                    <p>Total: ${(enrollment.totalAmount / 100).toFixed(2)}</p>
                                    <p>Paid: ${(enrollment.amountPaid / 100).toFixed(2)}</p>
                                    <p>Due: ${(enrollment.amountDue / 100).toFixed(2)}</p>
                                  </div>
                                </div>
                                <Button
                                  variant="secondary"
                                  size="small"
                                  onClick={() => handleResetEnrollment(user.userId, enrollment.courseId)}
                                  loading={resettingEnrollments[`${user.userId}-${enrollment.courseId}`]}
                                  className={styles.resetButton}
                                >
                                  Reset
                                </Button>
                              </div>
                            ))}
                          </div>

                          <Button
                            variant="danger"
                            onClick={() => handleResetAllUserEnrollments(user.userId, user.displayName)}
                            loading={resettingEnrollments[user.userId]}
                            className={styles.resetAllButton}
                          >
                            Reset All User Enrollments
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className={styles.analyticsTab}>
            <Card padding="large">
              <h2 className={styles.sectionTitle}>Enrollment Analytics</h2>
              
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Total Users</div>
                  <div className={styles.statValue}>{filteredUsers.length}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Total Enrollments</div>
                  <div className={styles.statValue}>
                    {filteredUsers.reduce((sum, user) => sum + user.enrollments.length, 0)}
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Active Enrollments</div>
                  <div className={styles.statValue}>
                    {filteredUsers.reduce((sum, user) => 
                      sum + user.enrollments.filter(e => e.status === 'active').length, 0
                    )}
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Pending Payment</div>
                  <div className={styles.statValue}>
                    {filteredUsers.reduce((sum, user) => 
                      sum + user.enrollments.filter(e => e.status === 'pending_payment').length, 0
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.courseBreakdown}>
                <h3>Enrollment Breakdown by Course</h3>
                <div className={styles.courseStats}>
                  {[COURSE_IDS.ONLINE, COURSE_IDS.BEHIND_WHEEL, COURSE_IDS.COMPLETE].map(courseId => {
                    const count = filteredUsers.reduce((sum, user) => 
                      sum + user.enrollments.filter(e => e.courseId === courseId).length, 0
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
        )}
      </div>
    </div>
  );
};

export default AdminPage;
