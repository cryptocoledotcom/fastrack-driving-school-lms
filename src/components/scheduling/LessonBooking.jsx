import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../common/Card/Card';
import Button from '../common/Button/Button';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage/ErrorMessage';
import SuccessMessage from '../common/SuccessMessage/SuccessMessage';
import { getAvailableTimeSlots, bookTimeSlot } from '../../api/schedulingServices';
import styles from './LessonBooking.module.css';

const LessonBooking = ({ onSuccess, onClose }) => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    loadAvailableSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarDate]);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      setError('');

      const startDate = new Date(calendarDate);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(calendarDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setHours(23, 59, 59, 999);

      const availableSlots = await getAvailableTimeSlots(startDate, endDate);
      setSlots(availableSlots);

      if (availableSlots.length === 0) {
        setError('No available time slots for the selected period');
      }
    } catch (err) {
      console.error('Error loading slots:', err);
      setError('Failed to load available time slots');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
  };

  const handleConfirmAndBook = async () => {
    if (!user || !selectedSlot) return;

    try {
      setBooking(true);
      setError('');

      await bookTimeSlot(user.uid, selectedSlot.id, user.email);

      setSuccess('Lesson booked successfully!');

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(selectedSlot);
        }
      }, 2000);
    } catch (err) {
      console.error('Error booking slot:', err);
      setError(err.message || 'Failed to book lesson');
    } finally {
      setBooking(false);
    }
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCalendarDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCalendarDate(newDate);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner text="Loading available time slots..." />;
  }

  return (
    <div className={styles.lessonBooking}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h2>Schedule Behind-the-Wheel Lesson</h2>
          <p className={styles.subtitle}>Select an available time slot to book your lesson</p>
        </div>

        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} />}

        <div className={styles.calendarNav}>
          <Button
            variant="outline"
            size="small"
            onClick={handlePreviousMonth}
          >
            ← Previous
          </Button>
          
          <span className={styles.monthYear}>
            {calendarDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            })}
          </span>
          
          <Button
            variant="outline"
            size="small"
            onClick={handleNextMonth}
          >
            Next →
          </Button>
        </div>

        <div className={styles.slotsContainer}>
          {slots.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No available time slots</p>
              <p className={styles.emptyStateHint}>Try selecting a different time period</p>
            </div>
          ) : (
            <div className={styles.slotsList}>
              {slots.map((slot) => (
                <Card key={slot.id} className={`${styles.slotCard} ${selectedSlot?.id === slot.id ? styles.selected : ''}`}>
                  <div className={styles.slotContent}>
                    <div className={styles.slotTime}>
                      <div className={styles.date}>{formatDate(slot.date)}</div>
                      <div className={styles.time}>
                        {slot.startTime} - {slot.endTime}
                      </div>
                    </div>

                    <div className={styles.slotDetails}>
                      {slot.location && (
                        <div className={styles.detail}>
                          <span className={styles.label}>Location:</span>
                          <span className={styles.value}>{slot.location}</span>
                        </div>
                      )}
                      {slot.instructor && (
                        <div className={styles.detail}>
                          <span className={styles.label}>Instructor:</span>
                          <span className={styles.value}>{slot.instructor}</span>
                        </div>
                      )}
                      <div className={styles.detail}>
                        <span className={styles.label}>Available Spots:</span>
                        <span className={styles.value}>
                          {Math.max(0, (slot.capacity || 1) - slot.bookedBy.length)}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant={selectedSlot?.id === slot.id ? 'primary' : 'outline'}
                      size="small"
                      onClick={() => handleSelectSlot(slot)}
                      disabled={slot.bookedBy.length >= (slot.capacity || 1)}
                      className={styles.bookButton}
                    >
                      {selectedSlot?.id === slot.id ? '✓ Selected' : 'Select'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {!success && (
          <div className={styles.actions}>
            {selectedSlot && (
              <Button
                variant="primary"
                onClick={handleConfirmAndBook}
                disabled={booking}
                fullWidth
              >
                Confirm and Book Lesson
              </Button>
            )}
            <Button
              variant="danger"
              onClick={onClose}
              fullWidth
            >
              Cancel
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LessonBooking;