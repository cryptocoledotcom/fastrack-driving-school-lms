import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserBookings, cancelBooking } from '../../api/compliance/schedulingServices';
import Card from '../common/Card/Card';
import Button from '../common/Button/Button';
import styles from './UpcomingLessons.module.css';

const UpcomingLessons = ({ onBookingsChange } = {}) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const upcomingBookings = await getUserBookings(user.uid);
      
      const futureBookings = upcomingBookings.filter(booking => {
        const bookingDate = new Date(`${booking.date}T${booking.startTime}`);
        return bookingDate >= new Date();
      });

      setBookings(futureBookings);
      if (onBookingsChange) {
        onBookingsChange(futureBookings.length > 0);
      }
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError('Failed to load your scheduled lessons');
    } finally {
      setLoading(false);
    }
  }, [onBookingsChange, user]);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user, loadBookings]);

  const handleCancelBooking = async (lessonId, slotId) => {
    if (window.confirm('Are you sure you want to cancel this lesson?')) {
      try {
        await cancelBooking(user.uid, lessonId, slotId);
        setBookings(bookings.filter(b => b.id !== lessonId));
        if (onBookingsChange) {
          onBookingsChange(false);
        }
      } catch (err) {
        console.error('Error canceling booking:', err);
        setError('Failed to cancel the lesson');
      }
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading lessons...</div>;
  }

  if (bookings.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Upcoming Lessons</h2>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.lessonsGrid}>
        {bookings.map(lesson => (
          <Card key={lesson.id} className={styles.lessonCard}>
            <div className={styles.lessonContent}>
              <div className={styles.lessonHeader}>
                <h3>Behind-the-Wheel Lesson</h3>
                <span className={styles.status}>{lesson.status}</span>
              </div>

              <div className={styles.lessonDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>📅 Date:</span>
                  <span className={styles.value}>
                    {new Date(`${lesson.date}T00:00`).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>⏰ Time:</span>
                  <span className={styles.value}>
                    {lesson.startTime} - {lesson.endTime}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>📍 Location:</span>
                  <span className={styles.value}>{lesson.location}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>👨‍🏫 Instructor:</span>
                  <span className={styles.value}>{lesson.instructor}</span>
                </div>
              </div>

              <div className={styles.actions}>
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => handleCancelBooking(lesson.id, lesson.slotId)}
                >
                  Cancel Lesson
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default UpcomingLessons;
