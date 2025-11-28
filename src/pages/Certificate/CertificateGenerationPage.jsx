import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import SuccessMessage from '../../components/common/SuccessMessage/SuccessMessage';
import enrollmentServices from '../../api/enrollment/enrollmentServices';
import { COURSE_IDS, ENROLLMENT_STATUS } from '../../constants/courses';
import styles from './CertificateGenerationPage.module.css';

const CertificateGenerationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [enrollment, setEnrollment] = useState(null);
  const [certificateInfo, setCertificateInfo] = useState(null);

  useEffect(() => {
    loadEnrollmentData();
  }, []);

  const loadEnrollmentData = async () => {
    try {
      setLoading(true);
      const onlineEnrollment = await enrollmentServices.getEnrollment(user.uid, COURSE_IDS.ONLINE);
      
      if (!onlineEnrollment) {
        setError('No enrollment found for online course');
        return;
      }

      setEnrollment(onlineEnrollment);

      setCertificateInfo({
        studentName: user.displayName || 'Student',
        completionDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        certificateNumber: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        courseName: 'Fastrack Online Driving Course'
      });
    } catch (err) {
      console.error('Error loading enrollment:', err);
      setError('Failed to load enrollment data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    if (!enrollment || !certificateInfo) return;

    try {
      setGenerating(true);
      setError('');

      await enrollmentServices.updateCertificateStatus(user.uid, COURSE_IDS.ONLINE, true);

      setSuccess('Certificate generated successfully!');
      
      setTimeout(() => {
        navigate('/my-courses');
      }, 2000);
    } catch (err) {
      console.error('Error generating certificate:', err);
      setError('Failed to generate certificate. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadCertificate = () => {
    if (!certificateInfo) return;

    const canvas = document.getElementById('certificateCanvas');
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${certificateInfo.studentName}-certificate.png`;
      link.click();
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading certificate..." />;
  }

  return (
    <div className={styles.certificatePage}>
      <div className={styles.container}>
        <h1 className={styles.title}>Course Completion Certificate</h1>

        {error && (
          <div className={styles.errorContainer}>
            <p>{error}</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        )}

        {success && <SuccessMessage message={success} />}

        {!error && certificateInfo && (
          <>
            <Card className={styles.certificateCard}>
              <div className={styles.certificatePreview} id="certificateCanvas">
                <svg width="800" height="600" viewBox="0 0 800 600" className={styles.certificateSvg}>
                  <defs>
                    <pattern id="pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#E8F4F8" strokeWidth="1" opacity="0.3" />
                    </pattern>
                  </defs>

                  <rect width="800" height="600" fill="white" stroke="#2E5266" strokeWidth="4" rx="10" />
                  <rect width="800" height="600" fill="url(#pattern)" />

                  <text x="400" y="80" className={styles.certificateTitle} textAnchor="middle">
                    Certificate of Completion
                  </text>

                  <text x="400" y="140" className={styles.certificateSubtitle} textAnchor="middle">
                    This certifies that
                  </text>

                  <text x="400" y="200" className={styles.studentName} textAnchor="middle">
                    {certificateInfo.studentName}
                  </text>

                  <line x1="150" y1="220" x2="650" y2="220" stroke="#2E5266" strokeWidth="2" />

                  <text x="400" y="280" className={styles.certificateBody} textAnchor="middle">
                    has successfully completed
                  </text>

                  <text x="400" y="330" className={styles.courseName} textAnchor="middle">
                    {certificateInfo.courseName}
                  </text>

                  <text x="400" y="400" className={styles.certificateBody} textAnchor="middle">
                    Completion Date: {certificateInfo.completionDate}
                  </text>

                  <text x="400" y="450" className={styles.certificateSmall} textAnchor="middle">
                    Certificate Number: {certificateInfo.certificateNumber}
                  </text>

                  <text x="150" y="540" className={styles.certificateSmall}>
                    Fastrack Driving School
                  </text>

                  <text x="650" y="540" className={styles.certificateSmall} textAnchor="end">
                    Official Certificate
                  </text>
                </svg>
              </div>

              <div className={styles.certificateInfo}>
                <h3>Certificate Details</h3>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Student Name:</span>
                  <span className={styles.detailValue}>{certificateInfo.studentName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Course:</span>
                  <span className={styles.detailValue}>{certificateInfo.courseName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Completion Date:</span>
                  <span className={styles.detailValue}>{certificateInfo.completionDate}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Certificate Number:</span>
                  <span className={styles.detailValue}>{certificateInfo.certificateNumber}</span>
                </div>
              </div>
            </Card>

            <div className={styles.actions}>
              <Button
                variant="primary"
                size="large"
                onClick={handleGenerateCertificate}
                loading={generating}
                disabled={generating || enrollment?.certificateGenerated}
                fullWidth
              >
                {enrollment?.certificateGenerated ? 'Certificate Already Generated' : 'Generate & Save Certificate'}
              </Button>

              {enrollment?.certificateGenerated && (
                <Button
                  variant="secondary"
                  size="large"
                  onClick={handleDownloadCertificate}
                  fullWidth
                >
                  Download Certificate
                </Button>
              )}

              <Button
                variant="outline"
                size="large"
                onClick={() => navigate('/my-courses')}
                fullWidth
              >
                Continue to My Courses
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CertificateGenerationPage;