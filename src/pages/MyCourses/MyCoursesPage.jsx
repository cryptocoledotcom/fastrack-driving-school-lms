import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import ProgressBar from '../../components/common/ProgressBar/ProgressBar';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';
import { getUserEnrollments } from '../../api/enrollmentServices';
import { getCourseById } from '../../api/courseServices';
import { getProgress } from '../../api/progressServices';
import PaymentModal from '../../components/payment/PaymentModal';
import LessonBooking from '../../components/scheduling/LessonBooking';
import styles from './MyCoursesPage.module.css';
import { COURSE_IDS, COURSE_TYPES, PAYMENT_STATUS } from '../../constants/courses';

const MyCoursesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCourseForPayment, setSelectedCourseForPayment] = useState(null);
  const [selectedCourseForBooking, setSelectedCourseForBooking] = useState(null);
  const [certificateStatus, setCertificateStatus] = useState({});

  useEffect(() => {
    if (user) {
      loadEnrolledCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadEnrolledCourses = async () => {
    try {
      setLoading(true);
      setError('');

      const allEnrollments = await getUserEnrollments(user.uid);

      const coursesWithDetails = await Promise.all(
        allEnrollments.map(async (enrollment) => {
          try {
            const courseDetails = await getCourseById(enrollment.courseId || enrollment.id);
            const progress = await getProgress(user.uid, enrollment.courseId || enrollment.id);

            return {
              course: {
                ...courseDetails,
                progress: progress.overallProgress || 0,
                completedLessons: progress.completedLessons || 0,
                totalLessons: progress.totalLessons || 0,
              },
              enrollment: enrollment,
              lastAccessedAt: progress.lastAccessedAt,
            };
          } catch (err) {
            console.error(`Error loading course ${enrollment.id}:`, err);
            return null;
          }
        })
      );

      const validCourses = coursesWithDetails.filter(course => course !== null);
      setEnrolledCourses(validCourses);

      checkCertificateStatus(validCourses);
    } catch (err) {
      console.error('Error loading enrolled courses:', err);
      setError('Failed to load your courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkCertificateStatus = async (courses) => {
    const certStatus = {};
    for (const item of courses) {
      if (item?.enrollment?.courseId === COURSE_IDS.ONLINE) {
        certStatus[COURSE_IDS.ONLINE] = item.enrollment.certificateGenerated || false;
      }
    }
    setCertificateStatus(certStatus);
  };

  const getCourseType = (course) => {
    return course?.category || 'unknown';
  };

  const isBundleCourse = (course) => {
    return course?.category === COURSE_TYPES.BUNDLE && course?.includeCourses;
  };

  const handleViewCourse = (courseId) => {
    navigate(`/course-player/${courseId}`);
  };

  const handleScheduleLesson = () => {
    setShowBookingModal(true);
  };

  const handlePayRemainingBalance = (course, enrollment) => {
    setSelectedCourseForPayment({ course, enrollment });
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedCourseForPayment(null);
    setTimeout(() => {
      navigate('/payment-success', { 
        state: { courseId: selectedCourseForPayment?.course.id } 
      });
    }, 500);
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    setSelectedCourseForBooking(null);
    setTimeout(() => {
      loadEnrolledCourses();
    }, 1000);
  };

  const getButtonLabel = (course, enrollment) => {
    const courseType = getCourseType(course);
    const isBundled = isBundleCourse(course);

    if (courseType === COURSE_TYPES.ONLINE) {
      return 'View Course';
    }

    if (courseType === COURSE_TYPES.IN_PERSON) {
      if (enrollment.paymentStatus === PAYMENT_STATUS.COMPLETED) {
        return 'Schedule Driving Lesson';
      }
      return `Pay Remaining $${enrollment.amountDue?.toFixed(2) || '0.00'}`;
    }

    if (isBundled) {
      const onlineCertGenerated = certificateStatus[COURSE_IDS.ONLINE];

      if (!onlineCertGenerated) {
        return 'Complete the Online Course';
      }

      if (enrollment.paymentStatus !== PAYMENT_STATUS.COMPLETED) {
        return `Pay Remaining $${enrollment.amountDue?.toFixed(2) || '0.00'}`;
      }

      return 'Schedule Driving Lesson';
    }

    return 'View Course';
  };

  const getButtonDisabled = (course, enrollment) => {
    const isBundled = isBundleCourse(course);

    if (isBundled && enrollment?.courseId === COURSE_IDS.BEHIND_WHEEL) {
      const onlineCertGenerated = certificateStatus[COURSE_IDS.ONLINE];
      return !onlineCertGenerated;
    }

    return false;
  };

  const handleButtonClick = (course, enrollment) => {
    const courseType = getCourseType(course);
    const isBundled = isBundleCourse(course);

    if (courseType === COURSE_TYPES.ONLINE) {
      handleViewCourse(course.id);
      return;
    }

    if (courseType === COURSE_TYPES.IN_PERSON) {
      if (enrollment.paymentStatus === PAYMENT_STATUS.COMPLETED) {
        setSelectedCourseForBooking(course);
        handleScheduleLesson();
      } else {
        handlePayRemainingBalance(course, enrollment);
      }
      return;
    }

    if (isBundled) {
      if (enrollment?.courseId === COURSE_IDS.ONLINE) {
        handleViewCourse(course.id);
      } else if (enrollment?.courseId === COURSE_IDS.BEHIND_WHEEL) {
        const onlineCertGenerated = certificateStatus[COURSE_IDS.ONLINE];
        if (!onlineCertGenerated) {
          return;
        }
        if (enrollment.paymentStatus !== PAYMENT_STATUS.COMPLETED) {
          handlePayRemainingBalance(course, enrollment);
        } else {
          setSelectedCourseForBooking(course);
          handleScheduleLesson();
        }
      }
      return;
    }

    handleViewCourse(course.id);
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading your courses..." />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Courses</h1>
        <p>Continue your learning journey</p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

      {enrolledCourses.length === 0 ? (
        <Card className={styles.emptyCard}>
          <div className={styles.emptyContent}>
            <h2>No Courses Yet</h2>
            <p>You haven't enrolled in any courses yet.</p>
            <Button 
              variant="primary"
              onClick={() => navigate('/courses')}
            >
              Browse Courses
            </Button>
          </div>
        </Card>
      ) : (
        <div className={styles.coursesGrid}>
          {enrolledCourses.map((item) => (
            <CourseCard
              key={item.course.id}
              course={item.course}
              enrollment={item.enrollment}
              onViewCourse={() => handleViewCourse(item.course.id)}
              onPayRemaining={() => handlePayRemainingBalance(item.course, item.enrollment)}
              onScheduleLesson={() => {
                setSelectedCourseForBooking(item.course);
                setShowBookingModal(true);
              }}
              onButtonClick={() => handleButtonClick(item.course, item.enrollment)}
              getButtonLabel={() => getButtonLabel(item.course, item.enrollment)}
              getButtonDisabled={() => getButtonDisabled(item.course, item.enrollment)}
              onlineCertGenerated={certificateStatus[COURSE_IDS.ONLINE] || false}
            />
          ))}
        </div>
      )}

      {showPaymentModal && selectedCourseForPayment && (
        <PaymentModal
          courseId={selectedCourseForPayment.course.id}
          course={selectedCourseForPayment.course}
          enrollment={selectedCourseForPayment.enrollment}
          onSuccess={handlePaymentSuccess}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedCourseForPayment(null);
          }}
        />
      )}

      {showBookingModal && selectedCourseForBooking && (
        <LessonBooking
          courseId={selectedCourseForBooking.id}
          courseName={selectedCourseForBooking.title}
          onSuccess={handleBookingSuccess}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedCourseForBooking(null);
          }}
        />
      )}
    </div>
  );
};

const CourseCard = ({
  course,
  enrollment,
  onButtonClick,
  getButtonLabel,
  getButtonDisabled,
  onlineCertGenerated
}) => {
  const getStatusBadge = () => {
    if (!enrollment) return null;

    if (enrollment.paymentStatus === PAYMENT_STATUS.COMPLETED) {
      return <span className={styles.badge + ' ' + styles.badgePaid}>Fully Paid</span>;
    }

    if (enrollment.paymentStatus === PAYMENT_STATUS.PARTIAL) {
      return <span className={styles.badge + ' ' + styles.badgePartial}>Partially Paid</span>;
    }

    if (enrollment.paymentStatus === PAYMENT_STATUS.PENDING) {
      return <span className={styles.badge + ' ' + styles.badgePending}>Payment Required</span>;
    }

    return null;
  };

  return (
    <Card className={styles.courseCard}>
      {course.thumbnail && (
        <img src={course.thumbnail} alt={course.title} className={styles.thumbnail} />
      )}

      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <h3>{course.title}</h3>
          {getStatusBadge()}
        </div>

        {course.description && (
          <p className={styles.description}>{course.description}</p>
        )}

        {course.progress !== undefined && (
          <div className={styles.progressSection}>
            <div className={styles.progressLabel}>
              <span>Progress</span>
              <span className={styles.percentage}>{Math.round(course.progress)}%</span>
            </div>
            <ProgressBar value={course.progress} max={100} />
            <p className={styles.lessonInfo}>
              {course.completedLessons} of {course.totalLessons} lessons completed
            </p>
          </div>
        )}

        {enrollment && enrollment.amountDue > 0 && (
          <div className={styles.paymentInfo}>
            <p>Remaining Balance: <strong>${enrollment.amountDue.toFixed(2)}</strong></p>
          </div>
        )}

        <Button
          variant="primary"
          disabled={getButtonDisabled()}
          onClick={onButtonClick}
          className={styles.actionButton}
          title={getButtonDisabled() ? 'Complete the online course first' : ''}
        >
          {getButtonLabel()}
        </Button>
      </div>
    </Card>
  );
};

export default MyCoursesPage;
