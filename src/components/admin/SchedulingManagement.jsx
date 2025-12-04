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
  deleteTimeSlot,
  assignTimeSlot,
  unassignTimeSlot
} from '../../api/compliance/schedulingServices';
import { getAllStudents } from '../../api/student/userServices';
import { formatTime24to12, parseLocalDate } from '../../utils/dateTimeFormatter';
import styles from './SchedulingManagement.module.css';

const SchedulingManagement = () => {
  const [slots, setSlots] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSlotForAssignment, setSelectedSlotForAssignment] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assigningSlot, setAssigningSlot] = useState(false);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [deletingSlot, setDeletingSlot] = useState({});
  const [unassigningSlot, setUnassigningSlot] = useState({});
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
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [timeslots, studentsList] = await Promise.all([
        getTimeSlots(),
        getAllStudents()
      ]);
      setSlots(timeslots);
      setStudents(studentsList);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load scheduling data');
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
    setSubmittingForm(true);

    try {
      if (editingSlot) {
        await updateTimeSlot(editingSlot.id, formData);
        setSuccess('Time slot updated successfully!');
      } else {
        await createTimeSlot(formData);
        setSuccess('Time slot created successfully!');
      }

      setShowForm(false);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving time slot:', err);
      setError(err.message || 'Failed to save time slot');
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this time slot?')) return;

    try {
      setError('');
      setDeletingSlot(prev => ({ ...prev, [slotId]: true }));
      await deleteTimeSlot(slotId);
      setSuccess('Time slot deleted successfully!');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting time slot:', err);
      setError('Failed to delete time slot');
    } finally {
      setDeletingSlot(prev => ({ ...prev, [slotId]: false }));
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSlot(null);
  };

  const handleOpenAssignModal = (slot) => {
    setSelectedSlotForAssignment(slot);
    setSelectedStudentId('');
    setShowAssignModal(true);
  };

  const handleAssignSlot = async () => {
    if (!selectedStudentId) {
      setError('Please select a student');
      return;
    }

    try {
      setAssigningSlot(true);
      setError('');
      setSuccess('');

      await assignTimeSlot(selectedSlotForAssignment.id, selectedStudentId);
      setSuccess('Lesson assigned to student successfully!');
      setShowAssignModal(false);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error assigning slot:', err);
      setError(err.message || 'Failed to assign lesson');
    } finally {
      setAssigningSlot(false);
    }
  };

  const handleUnassignSlot = async (slot) => {
    if (!window.confirm('Are you sure you want to unassign this lesson from the student?')) return;

    try {
      setError('');
      setSuccess('');
      setUnassigningSlot(prev => ({ ...prev, [slot.id]: true }));
      await unassignTimeSlot(slot.id, slot.assignedTo);
      setSuccess('Lesson unassigned successfully!');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error unassigning slot:', err);
      setError(err.message || 'Failed to unassign lesson');
    } finally {
      setUnassigningSlot(prev => ({ ...prev, [slot.id]: false }));
    }
  };

  const getAssignedStudentName = (userId) => {
    const student = students.find(s => s.id === userId);
    return student?.displayName || student?.email || userId;
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
              <Button type="submit" variant="primary" loading={submittingForm}>
                {submittingForm ? 'Saving...' : (editingSlot ? 'Update Slot' : 'Create Slot')}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={submittingForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {showAssignModal && selectedSlotForAssignment && (
        <Card className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Assign Lesson to Student</h3>
            <p className={styles.slotInfo}>
              {parseLocalDate(selectedSlotForAssignment.date)?.toLocaleDateString()} at{' '}
              {formatTime24to12(selectedSlotForAssignment.startTime)}
            </p>

            <div className={styles.selectWrapper}>
              <label>Select Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className={styles.studentSelect}
              >
                <option value="">-- Choose a student --</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.displayName || student.email}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.modalActions}>
              <Button
                variant="primary"
                onClick={handleAssignSlot}
                loading={assigningSlot}
              >
                Assign
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAssignModal(false)}
                disabled={assigningSlot}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className={styles.slotsList}>
        {slots.length === 0 ? (
          <Card className={styles.emptyState}>
            <p>No time slots created yet.</p>
            <p>Click "Add New Time Slot" to create available lesson times.</p>
          </Card>
        ) : (
          slots.map(slot => (
            <Card key={slot.id} className={styles.slotCard}>
              <div className={styles.slotHeader}>
                <div className={styles.slotDateTime}>
                  <span className={styles.date}>
                    {parseLocalDate(slot.date)?.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                  <span className={styles.time}>
                    {formatTime24to12(slot.startTime)} - {formatTime24to12(slot.endTime)}
                  </span>
                </div>
                <span className={`${styles.status} ${slot.assignedTo ? styles.assigned : styles.available}`}>
                  {slot.assignedTo ? 'Assigned' : 'Available'}
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
                {slot.assignedTo && (
                  <div className={styles.detail}>
                    <span className={styles.label}>Assigned to:</span>
                    <span>{getAssignedStudentName(slot.assignedTo)}</span>
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
                {!slot.assignedTo ? (
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => handleOpenAssignModal(slot)}
                    disabled={showForm || showAssignModal}
                  >
                    Assign Student
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleUnassignSlot(slot)}
                    disabled={showForm || showAssignModal}
                    loading={unassigningSlot[slot.id]}
                  >
                    Unassign
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => handleEditSlot(slot)}
                  disabled={showForm || showAssignModal}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => handleDeleteSlot(slot.id)}
                  disabled={showForm || showAssignModal}
                  loading={deletingSlot[slot.id]}
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