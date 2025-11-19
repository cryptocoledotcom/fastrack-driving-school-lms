// EnrollmentCard Component
// Displays enrollment status and payment information

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button/Button';
import ProgressBar from '../common/ProgressBar/ProgressBar';
import PaymentModal from './PaymentModal';
import { PAYMENT_STATUS, ACCESS_STATUS, COURSE_IDS } from '../../constants/courses';
import { updateEnrollmentAfterPayment } from '../../api/enrollmentServices';
import { useAuth } from '../../context/AuthContext';
import styles from './EnrollmentCard.module.css';

const EnrollmentCard = ({ enrollment, course, onPaymentSuccess }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const needsPayment = enrollment.amountDue > 0 && 
                       enrollment.paymentStatus !== PAYMENT_STATUS.COMPLETED;

  const canAccessCourse = enrollment.accessStatus === ACCESS_STATUS.UNLOCKED;

  const getPaymentType = () => {
    if (enrollment.courseId === COURSE_IDS.COMPLETE) {
      return enrollment.amountPaid === 0 ? 'upfront' : 'remaining';
    }
    return 'upfront';
  };

  const getPaymentButtonText = () => {
    if (enrollment.courseId === COURSE_IDS.COMPLETE) {
      if (enrollment.amountPaid === 0) {
        return `Pay Initial $${(enrollment.amountDue / 100).toFixed(2)}`;
      }
      return `Pay Remaining $${(enrollment.amountDue / 100).toFixed(2)}`;
    }
    return `Pay $${(enrollment.amountDue / 100).toFixed(2)}`;
  };

  const getStatusBadge = () => {
    if (enrollment.paymentStatus === PAYMENT_STATUS.COMPLETED) {
      return <span className={`${styles.badge} ${styles.badgeSuccess}`}>Paid</span>;
    }
    if (enrollment.paymentStatus === PAYMENT_STATUS.PARTIAL) {
      return <span className={`${styles.badge} ${styles.badgeWarning}`}>Partial Payment</span>;
    }
    return <span className={`${styles.badge} ${styles.badgePending}`}>Payment Required</span>;
  };

  const getAccessBadge = () => {
    if (enrollment.accessStatus === ACCESS_STATUS.UNLOCKED) {
      return <span className={`${styles.badge} ${styles.badgeSuccess}`}>Access Granted</span>;
    }
    if (enrollment.accessStatus === ACCESS_STATUS.PENDING_CERTIFICATE) {
      return <span className={`${styles.badge} ${styles.badgeWarning}`}>Pending Certificate</span>;
    }
    return <span className={`${styles.badge} ${styles.badgeError}`}>Locked</span>;
  };

  const handlePaymentSuccess = async (paymentData) => {
    setProcessing(true);
    try {
      // Update enrollment after payment
      await updateEnrollmentAfterPayment(
        user.uid,
        enrollment.courseId,
        paymentData.amount,
        paymentData.paymentType
      );

      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment processed but there was an error updating your enrollment. Please contact support.');
    } finally {
      setProcessing(false);
    }
  };

  const handleAccessCourse = () => {
    if (enrollment.courseId === COURSE_IDS.ONLINE) {
      navigate(`/course-player/${COURSE_IDS.ONLINE}`);
    }
  };

  return (
    <>
      <div className={styles.enrollmentCard}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.courseTitle}>{course?.title || 'Course'}</h3>
            <p className={styles.courseDescription}>{course?.description}</p>
          </div>
          <div className={styles.badges}>
            {getStatusBadge()}
            {getAccessBadge()}
          </div>
        </div>

        <div className={styles.cardBody}>
          {/* Payment Information */}
          <div className={styles.paymentInfo}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Total Amount:</span>
              <span className={styles.value}>${(enrollment.totalAmount / 100).toFixed(2)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Amount Paid:</span>
              <span className={styles.value}>${(enrollment.amountPaid / 100).toFixed(2)}</span>
            </div>
            {enrollment.amountDue > 0 && (
              <div className={`${styles.infoRow} ${styles.highlight}`}>
                <span className={styles.label}>Amount Due:</span>
                <span className={styles.value}>${(enrollment.amountDue / 100).toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {canAccessCourse && (
            <div className={styles.progressSection}>
              <div className={styles.progressHeader}>
                <span className={styles.label}>Progress</span>
                <span className={styles.value}>{course.progress || 0}%</span>
              </div>
              <ProgressBar progress={course.progress || 0} />
            </div>
          )}

          {/* Certificate Status for Behind-the-Wheel */}
          {enrollment.courseId === COURSE_IDS.BEHIND_WHEEL && (
            <div className={styles.certificateStatus}>
              <span className={styles.label}>Certificate:</span>
              <span className={enrollment.certificateGenerated ? styles.valueSuccess : styles.valueWarning}>
                {enrollment.certificateGenerated ? 'Generated ✓' : 'Not Generated'}
              </span>
            </div>
          )}
        </div>

        <div className={styles.cardFooter}>
          {needsPayment && (
            <Button
              variant="primary"
              onClick={() => setShowPaymentModal(true)}
              disabled={processing}
            >
              {getPaymentButtonText()}
            </Button>
          )}
          
          {canAccessCourse && enrollment.courseId === COURSE_IDS.ONLINE && (
            <Button
              variant={needsPayment ? 'outline' : 'primary'}
              onClick={handleAccessCourse}
            >
              Continue Course
            </Button>
          )}

          {canAccessCourse && enrollment.courseId !== COURSE_IDS.ONLINE && (
            <Button
              variant="outline"
              disabled
            >
              Coming Soon
            </Button>
          )}

          {!canAccessCourse && !needsPayment && (
            <div className={styles.lockedMessage}>
              {enrollment.accessStatus === ACCESS_STATUS.PENDING_CERTIFICATE
                ? 'Waiting for certificate generation'
                : 'Course access locked'}
            </div>
          )}
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={enrollment.amountDue}
        courseId={enrollment.courseId}
        courseName={course?.title}
        paymentType={getPaymentType()}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default EnrollmentCard;