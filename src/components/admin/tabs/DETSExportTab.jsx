import { useState, useEffect } from 'react';

import { detsServices } from '../../../api/admin/detsServices';
import LoadingSpinner from '../../common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../common/ErrorMessage/ErrorMessage';
import SuccessMessage from '../../common/SuccessMessage/SuccessMessage';
import Card from '../../common/Card/Card';
import Button from '../../common/Button/Button';
import { COURSE_IDS } from '../../../constants/courses';
import { getCSRFToken, validateCSRFToken } from '../../../utils/security/csrfToken';

import styles from './DETSExportTab.module.css';

const DETSExportTab = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [csrfToken, setCSRFToken] = useState('');

  const [selectedCourse, setSelectedCourse] = useState(COURSE_IDS.ONLINE);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  const [exportProgress, setExportProgress] = useState(null);

  useEffect(() => {
    loadReports();
    const token = getCSRFToken();
    setCSRFToken(token);
  }, []);

  const loadReports = async () => {
    try {
      setReportsLoading(true);
      setError('');
      const result = await detsServices.getDETSReports(50, 0);
      setReports(result.reports || []);
    } catch (err) {
      console.error('Error loading DETS reports:', err);
      setError('Failed to load DETS reports');
    } finally {
      setReportsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!validateCSRFToken(csrfToken, getCSRFToken())) {
      setError('Security validation failed. Please refresh and try again.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setExportProgress('Generating DETS report...');

      const result = await detsServices.generateDETSReport(
        selectedCourse,
        startDate || null,
        endDate || null
      );

      setSuccess(`Report generated successfully! ${result.recordCount} records exported.`);
      setExportProgress(null);
      await loadReports();

      setStartDate('');
      setEndDate('');
      setSelectedCourse(COURSE_IDS.ONLINE);
    } catch (err) {
      console.error('Error generating DETS report:', err);
      setError(err.message || 'Failed to generate DETS report');
      setExportProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (reportId) => {
    if (!validateCSRFToken(csrfToken, getCSRFToken())) {
      setError('Security validation failed. Please refresh and try again.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const result = await detsServices.submitDETSReport(reportId);

      if (result.status === 'submitted') {
        setSuccess('Report submitted to DETS successfully!');
      } else {
        setError('Report submission failed. Check DETS response below.');
      }

      await loadReports();
    } catch (err) {
      console.error('Error submitting DETS report:', err);
      setError(err.message || 'Failed to submit DETS report');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (reportId) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await detsServices.retryDETSSubmission(reportId);

      setSuccess('Retry submitted. Check status below.');
      await loadReports();
    } catch (err) {
      console.error('Error retrying DETS submission:', err);
      setError(err.message || 'Failed to retry submission');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async (reportId) => {
    try {
      setError('');
      const result = await detsServices.exportReportAsCSV(reportId);

      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(result.content));
      element.setAttribute('download', result.filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      console.error('Error downloading CSV:', err);
      setError('Failed to download CSV');
    }
  };

  const getCourseName = (courseId) => {
    const names = {
      'fastrack-online': 'Fastrack Online Course',
      'fastrack-behind-the-wheel': 'Behind-the-Wheel Course',
      'fastrack-complete': 'Complete Package'
    };
    return names[courseId] || courseId;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ready':
        return styles.statusReady;
      case 'submitted':
        return styles.statusSubmitted;
      case 'confirmed':
        return styles.statusConfirmed;
      case 'error':
        return styles.statusError;
      default:
        return styles.statusPending;
    }
  };

  return (
    <div className={styles.tabContent}>
      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

      <Card padding="large" className={styles.exportCard}>
        <h2>Generate DETS Report</h2>
        <p>Export student completion data for state reporting</p>

        <div className={styles.formGroup}>
          <label>Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            disabled={loading}
          >
            <option value={COURSE_IDS.ONLINE}>{getCourseName(COURSE_IDS.ONLINE)}</option>
            <option value={COURSE_IDS.BEHIND_WHEEL}>{getCourseName(COURSE_IDS.BEHIND_WHEEL)}</option>
            <option value={COURSE_IDS.COMPLETE}>{getCourseName(COURSE_IDS.COMPLETE)}</option>
          </select>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Start Date (optional)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label>End Date (optional)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {exportProgress && <p className={styles.progress}>{exportProgress}</p>}

        <Button
          onClick={handleExport}
          disabled={loading}
          className={styles.exportButton}
        >
          {loading ? 'Generating...' : 'Generate & Export Report'}
        </Button>

        <div className={styles.info}>
          <p>
            <strong>Note:</strong> This exports all completion certificates for the selected course
            within the date range. Reports can be manually submitted to DETS or will auto-submit if configured.
          </p>
        </div>
      </Card>

      <Card padding="large" className={styles.reportsCard}>
        <h2>Report History</h2>

        {reportsLoading ? (
          <LoadingSpinner text="Loading reports..." />
        ) : reports.length === 0 ? (
          <p className={styles.noReports}>No reports generated yet</p>
        ) : (
          <div className={styles.reportsContainer}>
            {reports.map((report) => (
              <div
                key={report.id}
                className={`${styles.reportCard} ${selectedReport?.id === report.id ? styles.selected : ''}`}
                onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
              >
                <div className={styles.reportHeader}>
                  <div>
                    <h3>{getCourseName(report.courseId)}</h3>
                    <p className={styles.reportDate}>
                      Exported: {new Date(report.exportedAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`${styles.statusBadge} ${getStatusBadgeClass(report.status)}`}>
                    {report.status}
                  </span>
                </div>

                {selectedReport?.id === report.id && (
                  <div className={styles.reportDetails}>
                    <div className={styles.detailsRow}>
                      <span><strong>Records:</strong> {report.recordCount}</span>
                      <span><strong>Errors:</strong> {report.errors?.length || 0}</span>
                      <span><strong>Attempts:</strong> {report.submissionAttempts || 0}</span>
                    </div>

                    {report.submissionDate && (
                      <p className={styles.submittedDate}>
                        Submitted: {new Date(report.submissionDate.toDate?.() || report.submissionDate).toLocaleString()}
                      </p>
                    )}

                    {report.detsResponse && (
                      <div className={styles.detsResponse}>
                        <h4>DETS Response:</h4>
                        <pre>{JSON.stringify(report.detsResponse, null, 2)}</pre>
                      </div>
                    )}

                    {report.errors?.length > 0 && (
                      <div className={styles.errorsList}>
                        <h4>Validation Errors:</h4>
                        <ul>
                          {report.errors.slice(0, 5).map((err, idx) => (
                            <li key={idx}>
                              <strong>{err.certificateId}:</strong> {JSON.stringify(err.errors || err.error)}
                            </li>
                          ))}
                          {report.errors.length > 5 && (
                            <li>... and {report.errors.length - 5} more errors</li>
                          )}
                        </ul>
                      </div>
                    )}

                    <div className={styles.actionButtons}>
                      {report.status === 'ready' && (
                        <Button
                          onClick={() => handleSubmit(report.id)}
                          disabled={loading}
                          className={styles.submitButton}
                        >
                          Submit to DETS
                        </Button>
                      )}

                      {report.status === 'error' && (
                        <Button
                          onClick={() => handleRetry(report.id)}
                          disabled={loading}
                          className={styles.retryButton}
                        >
                          Retry
                        </Button>
                      )}

                      <Button
                        onClick={() => handleDownloadCSV(report.id)}
                        disabled={loading}
                        className={styles.downloadButton}
                      >
                        Download CSV
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card padding="large" className={styles.infoCard}>
        <h3>DETS Integration Information</h3>
        <ul>
          <li><strong>Purpose:</strong> Export student completion data to Ohio state reporting system (DETS)</li>
          <li><strong>Data Exported:</strong> Student name, DOB, driver license, course completion, exam score</li>
          <li><strong>Frequency:</strong> Manual export as needed; auto-submit can be configured</li>
          <li><strong>Validation:</strong> All records validated before export (1440+ minutes, 75%+ exam score)</li>
          <li><strong>Audit Trail:</strong> All exports and submissions logged for compliance</li>
          <li><strong>3-Year Retention:</strong> Reports retained per OAC requirements</li>
        </ul>
      </Card>
    </div>
  );
};

export default DETSExportTab;
