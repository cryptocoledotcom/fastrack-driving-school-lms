// CoursesPage Component
// Displays available courses with enrollment functionality

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import PaymentModal from '../../components/payment/PaymentModal';
import { getCourseById } from '../../api/courseServices'; // eslint-disable-line no-unused-vars
import { 
  createEnrollment, 
  createCompletePackageEnrollment,
  getEnrollment 
} from '../../api/enrollmentServices';
import { COURSE_IDS, COURSE_PRICING } from '../../constants/courses';
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
      
      // Load course data
      const coursesData = [
        {
          id: COURSE_IDS.ONLINE,
          title: 'Fastrack Online',
          description: '24-hour online driving course. Get your Ohio Driver\'s Permit Online! Work at your own pace with our fully certified BMV program.',
          price: COURSE_PRICING[COURSE_IDS.ONLINE].total,
          features: [
            '24 hours of online instruction',
            'BMV certified curriculum',
            'Self-paced learning',
            'Instant access after payment',
            'Certificate upon completion'
          ],
          type: 'online'
        },
        {
          id: COURSE_IDS.BEHIND_WHEEL,
          title: 'Fastrack Behind the Wheel',
          description: '8 hours of one-on-one driving instruction with a certified instructor.',
          price: COURSE_PRICING[COURSE_IDS.BEHIND_WHEEL].total,
          features: [
            '8 hours of in-person instruction',
            'One-on-one with certified instructor',
            'Flexible scheduling',
            'Real-world driving experience',
            'Certificate upon completion'
          ],
          type: 'in-person'
        },
        {
          id: COURSE_IDS.COMPLETE,
          title: 'Fastrack Complete',
          description: 'Complete package combining both online and behind-the-wheel courses at a discounted rate.',
          price: COURSE_PRICING[COURSE_IDS.COMPLETE].total,
          originalPrice: COURSE_PRICING[COURSE_IDS.COMPLETE].originalPrice,
          discount: COURSE_PRICING[COURSE_IDS.COMPLETE].discount,
          features: [
            'All Online Course features',
            'All Behind-the-Wheel features',
            `Save $${COURSE_PRICING[COURSE_IDS.COMPLETE].discount}!`,
            'Split payment option',
            'Complete driver education'
          ],
          type: 'bundle',
          popular: true
        }
      ];

      setCourses(coursesData);

      // Load user enrollments if logged in
      if (user) {
        const enrollmentData = {};
        for (const course of coursesData) {
          const enrollment = await getEnrollment(user.uid, course.id);
          if (enrollment) {
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

    try {
      const pricing = COURSE_PRICING[courseId];
      
      // Check if already enrolled
      if (enrollments[courseId]) {
        navigate('/dashboard');
        return;
      }

      // If course requires upfront payment, show payment modal
      if (pricing.upfront > 0) {
        setSelectedCourse(courseId);
        setShowPaymentModal(true);
      } else {
        // Create enrollment without payment (Behind-the-Wheel only)
        if (courseId === COURSE_IDS.COMPLETE) {
          await createCompletePackageEnrollment(user.uid, userProfile?.email);
        } else {
          await createEnrollment(user.uid, courseId, userProfile?.email);
        }
        
        // Reload enrollments
        await loadCourses();
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      alert('Failed to enroll in course. Please try again.');
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      // Create enrollment after successful payment
      if (paymentData.courseId === COURSE_IDS.COMPLETE) {
        await createCompletePackageEnrollment(user.uid, userProfile?.email);
      } else {
        await createEnrollment(user.uid, paymentData.courseId, userProfile?.email);
      }

      // Update enrollment with payment
      const { updateEnrollmentAfterPayment } = await import('../../api/enrollmentServices');
      await updateEnrollmentAfterPayment(
        user.uid,
        paymentData.courseId,
        paymentData.amount,
        'upfront'
      );

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

    if (course.price === 0 || COURSE_PRICING[course.id].upfront === 0) {
      return 'Enroll Now';
    }

    return `Enroll - $${(course.price / 100).toFixed(2)}`;
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
                      ${(course.originalPrice / 100).toFixed(2)}
                    </span>
                  )}
                  <span className={styles.price}>
                    ${(course.price / 100).toFixed(2)}
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