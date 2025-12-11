import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { USER_ROLES, getRoleDisplayName } from '../../../constants/userRoles';
import Card from '../../common/Card/Card';
import Button from '../../common/Button/Button';
import Input from '../../common/Input/Input';
import Select from '../../common/Select/Select';
import ErrorMessage from '../../common/ErrorMessage/ErrorMessage';
import SuccessMessage from '../../common/SuccessMessage/SuccessMessage';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import userManagementServices from '../../../api/admin/userManagementServices';
import { getCSRFToken, validateCSRFToken } from '../../../utils/security/csrfToken';
import styles from './UserManagementTab.module.css';

const UserManagementTab = () => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState({});
  const [showActivityLogs, setShowActivityLogs] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserDisplayName, setNewUserDisplayName] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const [csrfToken, setCSRFToken] = useState('');

  useEffect(() => {
    loadUsers();
    loadUserStats();
    const token = getCSRFToken();
    setCSRFToken(token);
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const allUsers = await userManagementServices.getAllUsers();
      setUsers(allUsers || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const stats = await userManagementServices.getUserStats();
      setUserStats(stats);
    } catch (err) {
      console.error('Error loading user stats:', err);
    }
  };

  const loadActivityLogs = async () => {
    try {
      setLoadingLogs(true);
      const logs = await userManagementServices.getActivityLogs();
      setActivityLogs(logs);
    } catch (err) {
      console.error('Error loading activity logs:', err);
      setError('Failed to load activity logs.');
    } finally {
      setLoadingLogs(false);
    }
  };

  const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    const required = [
      chars.substring(0, 26),
      chars.substring(26, 52),
      chars.substring(52, 62),
      chars.substring(62)
    ];
    password += required[0].charAt(Math.floor(Math.random() * required[0].length));
    password += required[1].charAt(Math.floor(Math.random() * required[1].length));
    password += required[2].charAt(Math.floor(Math.random() * required[2].length));
    password += required[3].charAt(Math.floor(Math.random() * required[3].length));
    for (let i = 4; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleCreateUser = async () => {
    if (!validateCSRFToken(csrfToken, getCSRFToken())) {
      setError('Security validation failed. Please refresh and try again.');
      return;
    }

    if (!newUserEmail) {
      setError('Email is required');
      return;
    }

    if (!generatedPassword) {
      setError('Please generate a temporary password');
      return;
    }

    try {
      setCreatingUser(true);
      setError('');
      setSuccess('');

      await userManagementServices.createUser(
        newUserEmail,
        generatedPassword,
        newUserDisplayName,
        userProfile.uid
      );

      setSuccess(`User ${newUserEmail} created successfully with temporary password. They must change it on first login.`);
      setNewUserEmail('');
      setNewUserDisplayName('');
      setGeneratedPassword('');
      setShowCreateUserModal(false);
      await loadUsers();
      await loadUserStats();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error creating user:', err);
      setError(`Failed to create user: ${err.message}`);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!validateCSRFToken(csrfToken, getCSRFToken())) {
      setError('Security validation failed. Please refresh and try again.');
      return;
    }

    if (userId === userProfile.uid && newRole !== USER_ROLES.SUPER_ADMIN) {
      setError('Cannot change your own role.');
      return;
    }

    try {
      setError('');
      setSuccess('');

      await userManagementServices.updateUserRole(userId, newRole, userProfile.uid);

      setSuccess(`User role changed to ${getRoleDisplayName(newRole)}`);
      await loadUsers();
      await loadUserStats();
      setExpandedUser(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error changing user role:', err);
      setError(`Failed to change role: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!validateCSRFToken(csrfToken, getCSRFToken())) {
      setError('Security validation failed. Please refresh and try again.');
      return;
    }

    if (userId === userProfile.uid) {
      setError('Cannot delete your own account.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${userName}? This action can be undone.`)) {
      try {
        setDeletingUser(prev => ({ ...prev, [userId]: true }));
        setError('');
        setSuccess('');

        await userManagementServices.deleteUser(userId, userProfile.uid);

        setSuccess(`${userName} has been deleted`);
        await loadUsers();
        await loadUserStats();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('Error deleting user:', err);
        setError(`Failed to delete user: ${err.message}`);
      } finally {
        setDeletingUser(prev => ({ ...prev, [userId]: false }));
      }
    }
  };

  const handleRestoreUser = async (userId, userName) => {
    try {
      setDeletingUser(prev => ({ ...prev, [userId]: true }));
      setError('');
      setSuccess('');

      await userManagementServices.restoreUser(userId, userProfile.uid);

      setSuccess(`${userName} has been restored`);
      await loadUsers();
      await loadUserStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error restoring user:', err);
      setError(`Failed to restore user: ${err.message}`);
    } finally {
      setDeletingUser(prev => ({ ...prev, [userId]: false }));
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = !roleFilter || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading users..." />;
  }

  const roleOptions = [
    { value: USER_ROLES.STUDENT, label: getRoleDisplayName(USER_ROLES.STUDENT) },
    { value: USER_ROLES.INSTRUCTOR, label: getRoleDisplayName(USER_ROLES.INSTRUCTOR) },
    { value: USER_ROLES.DMV_ADMIN, label: getRoleDisplayName(USER_ROLES.DMV_ADMIN) },
    { value: USER_ROLES.SUPER_ADMIN, label: getRoleDisplayName(USER_ROLES.SUPER_ADMIN) }
  ];

  return (
    <div className={styles.userManagementTab}>
      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

      {userStats && (
        <div className={styles.statsGrid}>
          <Card padding="medium" className={styles.statCard}>
            <h3>Total Users</h3>
            <p className={styles.statNumber}>{userStats.totalUsers}</p>
          </Card>
          <Card padding="medium" className={styles.statCard}>
            <h3>Active Users</h3>
            <p className={styles.statNumber}>{userStats.active}</p>
          </Card>
          <Card padding="medium" className={styles.statCard}>
            <h3>Students</h3>
            <p className={styles.statNumber}>{userStats.byRole[USER_ROLES.STUDENT]}</p>
          </Card>
          <Card padding="medium" className={styles.statCard}>
            <h3>DMV Admins</h3>
            <p className={styles.statNumber}>{userStats.byRole[USER_ROLES.DMV_ADMIN]}</p>
          </Card>
        </div>
      )}

      <Card padding="large">
        <div className={styles.header}>
          <h2>User Management</h2>
          <div className={styles.headerButtons}>
            <Button
              variant="success"
              onClick={() => {
                setShowCreateUserModal(true);
                setGeneratedPassword(generateTemporaryPassword());
              }}
            >
              Create User
            </Button>
            <Button
              variant={showActivityLogs ? 'secondary' : 'primary'}
              onClick={() => {
                setShowActivityLogs(!showActivityLogs);
                if (!showActivityLogs) {
                  loadActivityLogs();
                }
              }}
            >
              {showActivityLogs ? 'Hide Activity Logs' : 'View Activity Logs'}
            </Button>
          </div>
        </div>

        {showActivityLogs ? (
          <div className={styles.activityLogsSection}>
            <h3>Activity Logs</h3>
            {loadingLogs ? (
              <LoadingSpinner text="Loading activity logs..." />
            ) : activityLogs.length === 0 ? (
              <p>No activity logs found.</p>
            ) : (
              <div className={styles.logsList}>
                {activityLogs.map(log => (
                  <div key={log.id} className={styles.logEntry}>
                    <div className={styles.logType}>
                      <span className={styles.badge}>{log.type}</span>
                    </div>
                    <div className={styles.logDetails}>
                      <p className={styles.description}>{log.description}</p>
                      <p className={styles.timestamp}>
                        {new Date(log.timestamp?.toDate?.() || log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className={styles.filterSection}>
              <Input
                label="Search by name or email"
                placeholder="Enter name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <Select
                label="Filter by role"
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Roles' },
                  ...roleOptions
                ]}
              />
            </div>

            <div className={styles.usersTable}>
              {filteredUsers.length === 0 ? (
                <p className={styles.emptyMessage}>No users found.</p>
              ) : (
                <div className={styles.tableContainer}>
                  <div className={styles.tableHeader}>
                    <div className={styles.colName}>Name</div>
                    <div className={styles.colEmail}>Email</div>
                    <div className={styles.colRole}>Role</div>
                    <div className={styles.colStatus}>Status</div>
                    <div className={styles.colActions}>Actions</div>
                  </div>
                  {filteredUsers.map(user => (
                    <div key={user.uid} className={styles.tableRow}>
                      <div className={styles.colName}>{user.displayName || 'No Name'}</div>
                      <div className={styles.colEmail}>{user.email}</div>
                      <div className={styles.colRole}>{getRoleDisplayName(user.role)}</div>
                      <div className={styles.colStatus}>
                        <span className={user.deleted ? styles.statusDeleted : styles.statusActive}>
                          {user.deleted ? 'Deleted' : 'Active'}
                        </span>
                      </div>
                      <div className={styles.colActions}>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => setExpandedUser(expandedUser === user.uid ? null : user.uid)}
                        >
                          {expandedUser === user.uid ? 'Collapse' : 'Manage'}
                        </Button>
                      </div>

                      {expandedUser === user.uid && (
                        <div className={styles.expandedContent}>
                          <div className={styles.roleChangeSection}>
                            <Select
                              label="Change Role"
                              value={user.role}
                              onChange={e => handleRoleChange(user.uid, e.target.value)}
                              options={roleOptions}
                            />
                          </div>
                          <div className={styles.actionButtons}>
                            {user.deleted ? (
                              <Button
                                variant="primary"
                                size="small"
                                onClick={() => handleRestoreUser(user.uid, user.displayName || user.email)}
                                loading={deletingUser[user.uid]}
                              >
                                Restore User
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="danger"
                                  size="small"
                                  onClick={() => handleDeleteUser(user.uid, user.displayName || user.email)}
                                  loading={deletingUser[user.uid]}
                                >
                                  Delete User
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="small"
                                  onClick={() => setExpandedUser(null)}
                                >
                                  Close
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {showCreateUserModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3>Create New User</h3>
                <button
                  className={styles.closeButton}
                  onClick={() => setShowCreateUserModal(false)}
                >
                  ×
                </button>
              </div>

              <div className={styles.modalBody}>
                <Input
                  label="Email"
                  type="email"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />

                <Input
                  label="Display Name (Optional)"
                  type="text"
                  value={newUserDisplayName}
                  onChange={e => setNewUserDisplayName(e.target.value)}
                  placeholder="John Doe"
                />

                <div className={styles.passwordSection}>
                  <label>Temporary Password</label>
                  <div className={styles.passwordDisplay}>
                    <input
                      type="text"
                      readOnly
                      value={generatedPassword}
                      className={styles.passwordInput}
                    />
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedPassword);
                        setSuccess('Password copied to clipboard');
                        setTimeout(() => setSuccess(''), 2000);
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className={styles.passwordHint}>
                    User must change this password on first login
                  </p>
                </div>

                <div className={styles.roleInfo}>
                  <p>
                    <strong>Role:</strong> DMV Admin
                  </p>
                  <p className={styles.roleDesc}>
                    This user will have restricted admin permissions for DMV compliance
                  </p>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button
                  variant="secondary"
                  onClick={() => setShowCreateUserModal(false)}
                  disabled={creatingUser}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateUser}
                  loading={creatingUser}
                  disabled={!newUserEmail || !generatedPassword}
                >
                  Create User
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserManagementTab;
