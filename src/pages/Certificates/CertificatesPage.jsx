import { useState, useEffect, useCallback } from 'react';

import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';
import { getCertificatesByUserId } from '../../api/student/certificateServices';

import styles from './CertificatesPage.module.css';

const CertificatesPage = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCertificates = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const certs = await getCertificatesByUserId(user.uid);
      setCertificates(certs);
    } catch (err) {
      console.error('Error loading certificates:', err);
      setError('Failed to load certificates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    loadCertificates();
  }, [user?.uid, loadCertificates]);

  const getCertificateTypeLabel = (type) => {
    switch (type) {
      case 'enrollment':
        return '📋 Enrollment Certificate';
      case 'completion':
        return '🏆 Completion Certificate';
      default:
        return '🎓 Certificate';
    }
  };

  const getCertificateTypeDescription = (type) => {
    switch (type) {
      case 'enrollment':
        return 'Awarded after completing 2 hours of instruction and Units 1-2';
      case 'completion':
        return 'Awarded upon successful completion of the entire course';
      default:
        return 'Certificate';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    try {
      const date = timestamp.toDate?.() || new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const handleDownload = (certificate) => {
    alert(`Download functionality for certificate ${certificate.certificateNumber} coming soon!`);
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading your certificates..." />;
  }

  return (
    <div className={styles.certificatesPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Certificates</h1>
          <p className={styles.subtitle}>View and download your earned certificates</p>
        </div>

        {error && (
          <ErrorMessage message={error} />
        )}

        {certificates.length === 0 ? (
          <Card className={styles.emptyCard}>
            <div className={styles.emptyState}>
              <p className={styles.emptyIcon}>🎓</p>
              <p className={styles.emptyTitle}>No certificates yet</p>
              <p className={styles.emptyMessage}>
                Complete your course requirements to earn certificates:
              </p>
              <ul className={styles.requirementsList}>
                <li>📋 <strong>Enrollment Certificate:</strong> Complete 2 hours + Units 1-2</li>
                <li>🏆 <strong>Completion Certificate:</strong> Complete full course + pass final exam</li>
              </ul>
            </div>
          </Card>
        ) : (
          <div className={styles.certificatesGrid}>
            {certificates.map((certificate) => (
              <Card key={certificate.id} className={styles.certificateCard}>
                <div className={styles.certificateHeader}>
                  <h3 className={styles.certificateTitle}>
                    {getCertificateTypeLabel(certificate.type)}
                  </h3>
                  <span className={`${styles.certBadge} ${styles[`badge-${certificate.type}`]}`}>
                    {certificate.type === 'enrollment' ? 'Enrollment' : 'Completion'}
                  </span>
                </div>

                <div className={styles.certificateDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Certificate #:</span>
                    <span className={styles.detailValue}>{certificate.certificateNumber}</span>
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Course:</span>
                    <span className={styles.detailValue}>{certificate.courseName}</span>
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Student:</span>
                    <span className={styles.detailValue}>{certificate.studentName}</span>
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Awarded:</span>
                    <span className={styles.detailValue}>{formatDate(certificate.awardedAt)}</span>
                  </div>

                  {certificate.completionDate && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Completion Date:</span>
                      <span className={styles.detailValue}>{certificate.completionDate}</span>
                    </div>
                  )}

                  {certificate.type === 'enrollment' && certificate.cumulativeMinutes && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Instruction Time:</span>
                      <span className={styles.detailValue}>{certificate.cumulativeMinutes} minutes</span>
                    </div>
                  )}
                </div>

                <p className={styles.certificateDescription}>
                  {getCertificateTypeDescription(certificate.type)}
                </p>

                <div className={styles.certificateActions}>
                  <Button
                    variant="primary"
                    onClick={() => handleDownload(certificate)}
                    className={styles.downloadButton}
                  >
                    📥 Download Certificate
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificatesPage;
