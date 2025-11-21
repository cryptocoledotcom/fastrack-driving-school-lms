// CoursesPage Component
// Displays available courses with enrollment functionality

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import PaymentModal from '../../components/payment/PaymentModal';
import { getCourses } from '../../api/courseServices';
import { getEnrollment } from '../../api/enrollmentServices';
import { COURSE_IDS, COURSE_PRICING, ENROLLMENT_STATUS } from '../../constants/courses';
import styles from './CoursesPage.module.css';

const CoursesPage = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      
      const coursesData = await getCourses();
      setCourses(coursesData);

      // Load user enrollments if logged in
      if (user) {
        const enrollmentData = {};
        for (const course of coursesData) {
          const enrollment = await getEnrollment(user.uid, course.id);
          // Only count ACTIVE enrollments (paid/unlocked)
          if (enrollment && enrollment.status === ENROLLMENT_STATUS.ACTIVE) {
            enrollmentData[course.id] = enrollment;
          }
        }
        setEnrollments(enrollmentData);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    if (!user) {
      navigate('/login', { state: { from: '/courses' } });
      return;
    }

    // Check if already enrolled
    if (enrollments[courseId]) {
      navigate('/dashboard');
      return;
    }

    // Show payment modal regardless (payment is required for enrollment)
    setSelectedCourse(courseId);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      const { createPaidEnrollment, createPaidCompletePackageSplit } = await import('../../api/enrollmentServices');
      
      // For Complete Package, check if split payment
      if (paymentData.courseId === COURSE_IDS.COMPLETE && paymentData.paymentOption === 'split') {
        // Split payment: $99.99 now, remaining $450 after certificate
        await createPaidCompletePackageSplit(user.uid, paymentData.amount, userProfile?.email);
      } else {
        // Single payment (or other courses)
        await createPaidEnrollment(user.uid, paymentData.courseId, paymentData.amount, userProfile?.email);
      }

      // Reload and navigate to dashboard
      await loadCourses();
      navigate('/dashboard');
    } catch (error) {
      console.error('Error processing enrollment:', error);
      alert('Payment successful but enrollment failed. Please contact support.');
    }
  };

  const getButtonText = (course) => {
    if (!user) {
      return 'Sign In to Enroll';
    }

    if (enrollments[course.id]) {
      return 'View in Dashboard';
    }

    const pricing = COURSE_PRICING[course.id];
    return `Enroll - $${(pricing.upfront).toFixed(2)}`;
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading courses..." />;
  }

  return (
    <div className={styles.coursesPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Our Courses</h1>
          <p className={styles.subtitle}>
            Choose from our comprehensive driving courses designed to help you become a safe and confident driver
          </p>
        </div>

        <div className={styles.grid}>
          {courses.map((course) => (
            <Card key={course.id} hoverable className={styles.courseCard}>
              {course.popular && (
                <div className={styles.popularBadge}>Most Popular</div>
              )}
              
              <div className={styles.cardContent}>
                <h3 className={styles.courseTitle}>{course.title}</h3>
                <p className={styles.courseDescription}>{course.description}</p>

                <div className={styles.priceSection}>
                  {course.originalPrice && (
                    <span className={styles.originalPrice}>
                      ${course.originalPrice.toFixed(2)}
                    </span>
                  )}
                  <span className={styles.price}>
                    ${course.price.toFixed(2)}
                  </span>
                  {course.discount && (
                    <span className={styles.savings}>
                      Save ${course.discount}!
                    </span>
                  )}
                </div>

                <ul className={styles.features}>
                  {course.features.map((feature, index) => (
                    <li key={index}>
                      <span className={styles.checkmark}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {enrollments[course.id] && (
                  <div className={styles.enrolledBadge}>
                    ✓ Enrolled
                  </div>
                )}

                <Button
                  variant={course.popular ? 'primary' : 'outline'}
                  onClick={() => handleEnroll(course.id)}
                  className={styles.enrollButton}
                >
                  {getButtonText(course)}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className={styles.infoSection}>
          <h2>Why Choose Fastrack Driving School?</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>🎓</div>
              <h3>BMV Certified</h3>
              <p>All our courses are fully certified by the Ohio Bureau of Motor Vehicles</p>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>👨‍🏫</div>
              <h3>Expert Instructors</h3>
              <p>Learn from experienced, certified driving instructors</p>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>⏰</div>
              <h3>Flexible Schedule</h3>
              <p>Learn at your own pace with our online courses</p>
            </div>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>💯</div>
              <h3>High Success Rate</h3>
              <p>Our students consistently pass their driving tests</p>
            </div>
          </div>
        </div>
      </div>

      {selectedCourse && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedCourse(null);
          }}
          amount={COURSE_PRICING[selectedCourse].upfront}
          courseId={selectedCourse}
          courseName={courses.find(c => c.id === selectedCourse)?.title}
          paymentType="upfront"
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default CoursesPage;