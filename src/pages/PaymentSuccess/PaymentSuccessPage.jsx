import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import { getEnrollment } from '../../api/enrollmentServices';
import { getCourseById } from '../../api/courseServices';
import styles from './PaymentSuccessPage.module.css';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [courseData, setCourseData] = useState(null);
  const [enrollmentData, setEnrollmentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        const courseId = searchParams.get('courseId');
        
        if (!courseId || !user) {
          setLoading(false);
          return;
        }

        const [course, enrollment] = await Promise.all([
          getCourseById(courseId),
          getEnrollment(user.uid, courseId)
        ]);

        setCourseData(course);
        setEnrollmentData(enrollment);
      } catch (error) {
        console.error('Error loading payment data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPaymentData();
  }, [user, searchParams]);

  if (loading) {
    return <LoadingSpinner fullScreen text="Processing your payment..." />;
  }

  return (
    <div className={styles.successContainer}>
      <div className={styles.successCard}>
        <div className={styles.successIcon}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h1 className={styles.title}>Payment Successful!</h1>
        
        <div className={styles.message}>
          <p>Thank you for your payment. Your enrollment has been confirmed.</p>
          {courseData && (
            <p className={styles.courseName}>
              Course: <strong>{courseData.title}</strong>
            </p>
          )}
        </div>

        {enrollmentData && (
          <div className={styles.paymentDetails}>
            <h3>Payment Summary</h3>
            <div className={styles.detailRow}>
              <span>Amount Paid:</span>
              <strong>${enrollmentData.amountPaid?.toFixed(2) || '0.00'}</strong>
            </div>
            {enrollmentData.amountDue > 0 && (
              <div className={styles.detailRow}>
                <span>Remaining Balance:</span>
                <strong>${enrollmentData.amountDue.toFixed(2)}</strong>
              </div>
            )}
            <div className={styles.detailRow}>
              <span>Enrollment Status:</span>
              <strong className={styles.statusBadge}>
                {enrollmentData.paymentStatus === 'completed' ? 'Fully Paid' : 'Partially Paid'}
              </strong>
            </div>
          </div>
        )}

        <div className={styles.nextSteps}>
          <h3>What's Next?</h3>
          <ul>
            {!enrollmentData || enrollmentData.amountDue === 0 ? (
              <>
                <li>Your course is now unlocked and ready to use</li>
                <li>Go to "My Courses" to view your enrolled courses</li>
                <li>Start learning at your own pace</li>
              </>
            ) : (
              <>
                <li>You have a remaining balance due</li>
                <li>You can pay the remaining balance anytime from "My Courses"</li>
                <li>Your course access is active while your payment is pending</li>
              </>
            )}
          </ul>
        </div>

        <div className={styles.actions}>
          <Button 
            variant="primary"
            onClick={() => navigate('/dashboard/my-courses')}
          >
            Go to My Courses
          </Button>
          <Button 
            variant="secondary"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>

        <p className={styles.receipt}>
          A receipt has been sent to your email address.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
