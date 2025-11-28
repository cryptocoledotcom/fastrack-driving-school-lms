import React, { useState, useEffect } from 'react';
import Card from '../common/Card/Card';
import Button from '../common/Button/Button';
import Input from '../common/Input/Input';
import LoadingSpinner from '../common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage/ErrorMessage';
import SuccessMessage from '../common/SuccessMessage/SuccessMessage';
import {
  createTimeSlot,
  getTimeSlots,
  updateTimeSlot,
  deleteTimeSlot
} from '../../api/compliance/schedulingServices';
import { getUser } from '../../api/student/userServices';
import styles from './SchedulingManagement.module.css';

const SchedulingManagement = () => {
  const [slots, setSlots] = useState([]);
  const [slotsWithUserNames, setSlotsWithUserNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    instructor: '',
    capacity: 1,
    notes: ''
  });

  useEffect(() => {
    loadTimeSlots();
  }, []);

  const loadTimeSlots = async () => {
    try {
      setLoading(true);
      setError('');
      const timeslots = await getTimeSlots();
      setSlots(timeslots);

      const slotsWithNames = await Promise.all(
        timeslots.map(async (slot) => {
          const bookedWithNames = await Promise.all(
            (slot.bookedBy || []).map(async (booking) => {
              try {
                const user = await getUser(booking.userId);
                return {
                  ...booking,
                  userName: user?.fullName || user?.displayName || booking.userEmail
                };
              } catch (err) {
                console.error(`Error fetching user ${booking.userId}:`, err);
                return {
                  ...booking,
                  userName: booking.userEmail
                };
              }
            })
          );
          return {
            ...slot,
            bookedBy: bookedWithNames
          };
        })
      );

      setSlotsWithUserNames(slotsWithNames);
    } catch (err) {
      console.error('Error loading time slots:', err);
      setError('Failed to load time slots');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) : value
    }));
  };

  const handleAddSlot = () => {
    setEditingSlot(null);
    setFormData({
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      instructor: '',
      capacity: 1,
      notes: ''
    });
    setShowForm(true);
  };

  const handleEditSlot = (slot) => {
    setEditingSlot(slot);
    setFormData({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      location: slot.location || '',
      instructor: slot.instructor || '',
      capacity: slot.capacity || 1,
      notes: slot.notes || ''
    });
    setShowForm(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingSlot) {
        await updateTimeSlot(editingSlot.id, formData);
        setSuccess('Time slot updated successfully!');
      } else {
        await createTimeSlot(formData);
        setSuccess('Time slot created successfully!');
      }

      setShowForm(false);
      await loadTimeSlots();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving time slot:', err);
      setError(err.message || 'Failed to save time slot');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this time slot?')) return;

    try {
      setError('');
      await deleteTimeSlot(slotId);
      setSuccess('Time slot deleted successfully!');
      await loadTimeSlots();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting time slot:', err);
      setError('Failed to delete time slot');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSlot(null);
  };

  if (loading) {
    return <LoadingSpinner text="Loading scheduling settings..." />;
  }

  return (
    <div className={styles.schedulingManagement}>
      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

      <div className={styles.header}>
        <h2>Lesson Time Slot Management</h2>
        <Button
          variant="primary"
          onClick={handleAddSlot}
          disabled={showForm}
        >
          + Add New Time Slot
        </Button>
      </div>

      {showForm && (
        <Card className={styles.formCard}>
          <h3>{editingSlot ? 'Edit Time Slot' : 'Create New Time Slot'}</h3>
          
          <form onSubmit={handleSubmitForm} className={styles.form}>
            <div className={styles.formRow}>
              <Input
                label="Date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Start Time"
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                required
              />
              <Input
                label="End Time"
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className={styles.formRow}>
              <Input
                label="Location"
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g., Downtown Lot, Test Route"
              />
              <Input
                label="Instructor"
                type="text"
                name="instructor"
                value={formData.instructor}
                onChange={handleInputChange}
                placeholder="Instructor name"
              />
              <Input
                label="Capacity"
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                min={1}
                max={5}
              />
            </div>

            <Input
              label="Notes"
              type="text"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Additional information"
              fullWidth
            />

            <div className={styles.formActions}>
              <Button type="submit" variant="primary">
                {editingSlot ? 'Update Slot' : 'Create Slot'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className={styles.slotsList}>
        {slots.length === 0 ? (
          <Card className={styles.emptyState}>
            <p>No time slots created yet.</p>
            <p>Click "Add New Time Slot" to create available lesson times.</p>
          </Card>
        ) : (
          slotsWithUserNames.map(slot => (
            <Card key={slot.id} className={styles.slotCard}>
              <div className={styles.slotHeader}>
                <div className={styles.slotDateTime}>
                  <span className={styles.date}>
                    {new Date(slot.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <span className={styles.time}>
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
                <span className={`${styles.status} ${slot.isAvailable ? styles.available : styles.full}`}>
                  {slot.isAvailable ? 'Available' : 'Full'}
                </span>
              </div>

              <div className={styles.slotDetails}>
                {slot.location && (
                  <div className={styles.detail}>
                    <span className={styles.label}>Location:</span>
                    <span>{slot.location}</span>
                  </div>
                )}
                {slot.instructor && (
                  <div className={styles.detail}>
                    <span className={styles.label}>Instructor:</span>
                    <span>{slot.instructor}</span>
                  </div>
                )}
                <div className={styles.detail}>
                  <span className={styles.label}>Capacity:</span>
                  <span>{slot.capacity} student{slot.capacity !== 1 ? 's' : ''}</span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.label}>Booked:</span>
                  <span>{slot.bookedBy?.length || 0} / {slot.capacity}</span>
                </div>
                {slot.bookedBy && slot.bookedBy.length > 0 && (
                  <div className={styles.detail}>
                    <span className={styles.label}>Students:</span>
                    <div className={styles.bookedStudents}>
                      {slot.bookedBy.map((booking, idx) => (
                        <span key={idx} className={styles.studentName}>
                          {booking.userName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {slot.notes && (
                  <div className={styles.detail}>
                    <span className={styles.label}>Notes:</span>
                    <span>{slot.notes}</span>
                  </div>
                )}
              </div>

              <div className={styles.slotActions}>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => handleEditSlot(slot)}
                  disabled={showForm}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => handleDeleteSlot(slot.id)}
                  disabled={showForm}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SchedulingManagement;