import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import Button from '../common/Button/Button';
import Input from '../common/Input/Input';
import ErrorMessage from '../common/ErrorMessage/ErrorMessage';
import SuccessMessage from '../common/SuccessMessage/SuccessMessage';
import styles from './ComplianceReporting.module.css';

const ComplianceReporting = () => {
  const [format, setFormat] = useState('csv');
  const [exportType, setExportType] = useState('course');
  const [courseId, setCourseId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleExport = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const functions = getFunctions();
      const generateReport = httpsCallable(functions, 'generateComplianceReport');

      const payload = {
        format,
        exportType,
        ...(exportType === 'course' && courseId && { courseId }),
        ...(exportType === 'student' && (studentId || studentName) && { 
          ...(studentId && { studentId }),
          ...(studentName && { studentName })
        }),
      };

      const response = await generateReport(payload);
      const { downloadUrl, fileName } = response.data;

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess(`${format.toUpperCase()} report generated and downloaded successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error generating report:', err);
      setError(`Failed to generate report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isValid = exportType === 'course' ? courseId : (studentId || studentName);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Compliance Report Export</h2>

      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} />}

      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Export Type</label>
          <select
            value={exportType}
            onChange={(e) => {
              setExportType(e.target.value);
              setCourseId('');
              setStudentId('');
              setStudentName('');
            }}
            className={styles.select}
          >
            <option value="course">Course-Wide Export</option>
            <option value="student">Per-Student Export</option>
          </select>
        </div>

        {exportType === 'course' && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Course ID</label>
            <Input
              type="text"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder="e.g., fastrack-online"
            />
          </div>
        )}

        {exportType === 'student' && (
          <>
            <div className={styles.formGroup}>
              <label className={styles.label}>Student ID</label>
              <Input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter student UID"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Or Search by Name</label>
              <Input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter student name"
              />
            </div>
          </>
        )}

        <div className={styles.formGroup}>
          <label className={styles.label}>Export Format</label>
          <div className={styles.formatOptions}>
            {['csv', 'json', 'pdf'].map((fmt) => (
              <label key={fmt} className={styles.radioLabel}>
                <input
                  type="radio"
                  name="format"
                  value={fmt}
                  checked={format === fmt}
                  onChange={(e) => setFormat(e.target.value)}
                />
                <span>{fmt.toUpperCase()}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.info}>
          <p>
            <strong>Report Contents:</strong> Session history, quiz attempts, PVQ verification records, and certificate status.
          </p>
          <p>
            <strong>Download Link:</strong> Valid for 7 days. Downloaded reports are logged for compliance audits.
          </p>
        </div>

        <Button
          onClick={handleExport}
          disabled={!isValid || loading}
          loading={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Generating Report...' : 'Generate & Download Report'}
        </Button>
      </div>
    </div>
  );
};

export default ComplianceReporting;
