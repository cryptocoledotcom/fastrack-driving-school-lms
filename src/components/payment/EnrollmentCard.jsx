import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button/Button';
import ProgressBar from '../common/ProgressBar/ProgressBar';
import { PAYMENT_STATUS } from '../../constants/courses';
import { PROTECTED_ROUTES } from '../../constants/routes';
import styles from './EnrollmentCard.module.css';

const EnrollmentCard = ({ enrollment, course }) => {
  const navigate = useNavigate();

  const getStatusBadge = () => {
    if (enrollment.paymentStatus === PAYMENT_STATUS.COMPLETED) {
      return <span className={`${styles.badge} ${styles.badgeSuccess}`}>Fully Paid</span>;
    }
    if (enrollment.paymentStatus === PAYMENT_STATUS.PARTIAL) {
      return <span className={`${styles.badge} ${styles.badgeWarning}`}>Partially Paid</span>;
    }
    return <span className={`${styles.badge} ${styles.badgePending}`}>Payment Required</span>;
  };

  const handleMyCoursesClick = () => {
    navigate(PROTECTED_ROUTES.MY_COURSES);
  };

  return (
    <div className={styles.enrollmentCard}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.courseTitle}>{course?.title || 'Course'}</h3>
          <p className={styles.courseDescription}>{course?.description}</p>
        </div>
        <div className={styles.badges}>
          {getStatusBadge()}
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.paymentInfo}>
          <div className={styles.infoRow}>
            <span className={styles.label}>Total Amount:</span>
            <span className={styles.value}>${enrollment.totalAmount.toFixed(2)}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Amount Paid:</span>
            <span className={styles.value}>${enrollment.amountPaid.toFixed(2)}</span>
          </div>
          {enrollment.amountDue > 0 && (
            <div className={`${styles.infoRow} ${styles.highlight}`}>
              <span className={styles.label}>Amount Due:</span>
              <span className={styles.value}>${enrollment.amountDue.toFixed(2)}</span>
            </div>
          )}
        </div>

        {course.progress !== undefined && (
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span className={styles.label}>Progress</span>
              <span className={styles.value}>{Math.round(course.progress)}%</span>
            </div>
            <ProgressBar progress={course.progress || 0} />
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <Button
          variant="primary"
          onClick={handleMyCoursesClick}
        >
          My Courses
        </Button>
      </div>
    </div>
  );
};

export default EnrollmentCard;