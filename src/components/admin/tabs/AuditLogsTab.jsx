import React, { useState, useEffect, useCallback } from 'react';
import { auditLogServices } from '../../../api/admin';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../common/ErrorMessage/ErrorMessage';
import styles from './AuditLogsTab.module.css';

const AuditLogsTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);

  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    resource: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const filterObj = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      const result = await auditLogServices.getAuditLogs(
        filterObj,
        sortBy,
        sortOrder,
        limit,
        offset
      );
      setLogs(result.logs || []);
      setTotalCount(result.totalCount || 0);
    } catch (err) {
      console.error('Error loading audit logs:', err);
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder, limit, offset]);

  const loadAuditStats = useCallback(async () => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const startDate = thirtyDaysAgo.toISOString();
      const endDate = now.toISOString();
      const result = await auditLogServices.getAuditLogStats(startDate, endDate);
      setStats(result);
    } catch (err) {
      console.error('Error loading audit stats:', err);
    }
  }, []);

  useEffect(() => {
    loadAuditLogs();
    loadAuditStats();
  }, [loadAuditLogs, loadAuditStats]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setOffset(0);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setOffset(0);
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setOffset(0);
  };

  const handlePreviousPage = () => {
    setOffset(Math.max(0, offset - limit));
  };

  const handleNextPage = () => {
    if (offset + limit < totalCount) {
      setOffset(offset + limit);
    }
  };

  const formatTimestamp = (iso8601) => {
    if (!iso8601) return 'N/A';
    return new Date(iso8601).toLocaleString();
  };

  const formatStatus = (status) => {
    const statusClass = status === 'error' ? styles.statusError
      : status === 'denied' ? styles.statusDenied
      : status === 'failure' ? styles.statusFailure
      : status === 'success' ? styles.statusSuccess
      : styles.statusInfo;
    return (
      <span className={`${styles.statusBadge} ${statusClass}`}>
        {status}
      </span>
    );
  };

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(totalCount / limit);

  if (loading && logs.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className={styles.tabContent}>
      {error && <ErrorMessage message={error} />}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Total Events (30 days)</h3>
            <p className={styles.statValue}>{stats.totalEvents || 0}</p>
          </div>
          <div className={styles.statCard}>
            <h3>By Status</h3>
            <ul className={styles.statList}>
              {Object.entries(stats.byStatus || {}).map(([status, count]) => (
                <li key={status}>{status}: {count}</li>
              ))}
            </ul>
          </div>
          <div className={styles.statCard}>
            <h3>By Action Type</h3>
            <ul className={styles.statList}>
              {Object.entries(stats.byAction || {})
                .slice(0, 5)
                .map(([action, count]) => (
                  <li key={action}>{action}: {count}</li>
                ))}
            </ul>
          </div>
        </div>
      )}
      <div className={styles.filterPanel}>
        <h2>Filters</h2>
        <div className={styles.filterGrid}>
          <div className={styles.filterGroup}>
            <label>User ID</label>
            <input type="text" name="userId" value={filters.userId} onChange={handleFilterChange} placeholder="Filter by user ID" />
          </div>
          <div className={styles.filterGroup}>
            <label>Action</label>
            <input type="text" name="action" value={filters.action} onChange={handleFilterChange} placeholder="Filter by action" />
          </div>
          <div className={styles.filterGroup}>
            <label>Resource</label>
            <input type="text" name="resource" value={filters.resource} onChange={handleFilterChange} placeholder="Filter by resource" />
          </div>
          <div className={styles.filterGroup}>
            <label>Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="error">Error</option>
              <option value="denied">Denied</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Start Date</label>
            <input type="datetime-local" name="startDate" value={filters.startDate} onChange={handleDateChange} />
          </div>
          <div className={styles.filterGroup}>
            <label>End Date</label>
            <input type="datetime-local" name="endDate" value={filters.endDate} onChange={handleDateChange} />
          </div>
        </div>
      </div>
      <div className={styles.logsSection}>
        <h2>Audit Trail ({totalCount} total events)</h2>
        {logs.length === 0 ? (
          <p className={styles.noData}>No audit logs found</p>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th onClick={() => handleSortChange('timestamp')}>
                      Timestamp {sortBy === 'timestamp' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>User ID</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Status</th>
                    <th>IP Address</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td>{formatTimestamp(log.timestamp)}</td>
                      <td className={styles.userId}>{log.userId}</td>
                      <td className={styles.action}>{log.action}</td>
                      <td>{log.resource}</td>
                      <td>{formatStatus(log.status)}</td>
                      <td className={styles.ipAddress}>{log.ipAddress || 'N/A'}</td>
                      <td>
                        <details className={styles.details}>
                          <summary>View</summary>
                          <pre>{JSON.stringify(log.metadata || {}, null, 2)}</pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.pagination}>
              <button onClick={handlePreviousPage} disabled={offset === 0}>Previous</button>
              <span>Page {currentPage} of {totalPages} ({totalCount} total)</span>
              <button onClick={handleNextPage} disabled={offset + limit >= totalCount}>Next</button>
              <select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value)); setOffset(0); }}>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
                <option value={500}>500 per page</option>
              </select>
            </div>
          </>
        )}
      </div>
      <div className={styles.info}>
        <h3>ℹ️ Audit Log Information</h3>
        <ul>
          <li><strong>Retention:</strong> 3 years (1,095 days)</li>
          <li><strong>Immutability:</strong> Records cannot be deleted or modified</li>
          <li><strong>Access:</strong> Admins and instructors only</li>
          <li><strong>Frequency:</strong> Real-time logging of all compliance events</li>
          <li><strong>Events Tracked:</strong> User actions, quiz attempts, exam submissions, certificate generation, session timeouts, and more</li>
        </ul>
      </div>
    </div>
  );
};

export default AuditLogsTab;
