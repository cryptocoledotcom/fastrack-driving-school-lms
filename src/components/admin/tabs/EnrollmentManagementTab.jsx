import React, { useState } from 'react';
import Card from '../../common/Card/Card';
import Button from '../../common/Button/Button';
import Input from '../../common/Input/Input';
import styles from '../../../pages/Admin/AdminPage.module.css';

const EnrollmentManagementTab = ({
  users,
  onResetEnrollment,
  onResetAllUserEnrollments,
  resettingEnrollments,
  getCourseName,
  getStatusBadgeClass,
  getPaymentStatusBadgeClass
}) => {
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

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

  const allEnrollments = [];
  filteredUsers.forEach(user => {
    (user.enrollments || []).forEach(enrollment => {
      allEnrollments.push({
        ...enrollment,
        userId: user.userId,
        userName: user.displayName,
        userEmail: user.email
      });
    });
  });

  return (
    <div className={styles.enrollmentTab}>
      <Card padding="large">
        <div className={styles.searchSection}>
          <div className={styles.searchBox}>
            <label className={styles.selectLabel}>Search by Name or Email</label>
            <Input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
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
                onChange={(e) => setSelectedUserId(e.target.value)}
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
          {allEnrollments.length === 0 ? (
            <p className={styles.noUsers}>
              {searchText || filterStatus || filterCourse ? 'No enrollments found matching your criteria.' : 'Enter search terms or select filters to view enrollments.'}
            </p>
          ) : (
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
                        onClick={() => onResetEnrollment(enrollment.userId, enrollment.courseId)}
                        loading={resettingEnrollments[`${enrollment.userId}-${enrollment.courseId}`]}
                      >
                        Reset
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default EnrollmentManagementTab;
