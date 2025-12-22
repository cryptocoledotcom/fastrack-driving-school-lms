import { useState, useEffect } from 'react';

import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import Select from '../../components/common/Select/Select';
import TextArea from '../../components/common/Input/TextArea';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';
import SuccessMessage from '../../components/common/SuccessMessage/SuccessMessage';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import BaseModal from '../../components/common/Modals/BaseModal';
import courseServices from '../../api/courses/courseServices';

import styles from './AdminCoursesPage.module.css';

const AdminCoursesPage = () => {
  const { userProfile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'beginner',
    price: 0,
    featured: false,
    duration: 60, // minutes
    thumbnailUrl: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await courseServices.getCourses();
      setCourses(data);
    } catch (err) {
      console.error('Error loading courses:', err);
      setError('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (course = null) => {
    if (course) {
      setIsEditing(true);
      setCurrentCourse(course);
      setFormData({
        title: course.title || '',
        description: course.description || '',
        category: course.category || '',
        difficulty: course.difficulty || 'beginner',
        price: course.price || 0,
        featured: course.featured || false,
        duration: course.duration || 60,
        thumbnailUrl: course.thumbnailUrl || ''
      });
    } else {
      setIsEditing(false);
      setCurrentCourse(null);
      setFormData({
        title: '',
        description: '',
        category: '',
        difficulty: 'beginner',
        price: 0,
        featured: false,
        duration: 60,
        thumbnailUrl: ''
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    // Basic Validation
    if (!formData.title || !formData.description || !formData.category) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const courseData = {
        ...formData,
        price: Number(formData.price),
        duration: Number(formData.duration),
        updatedBy: userProfile.uid
      };

      if (isEditing && currentCourse) {
        await courseServices.updateCourse(currentCourse.id, courseData);
        setSuccess('Course updated successfully');
      } else {
        await courseServices.createCourse({
          ...courseData,
          createdBy: userProfile.uid,
          enrolledStudents: 0,
          averageRating: 0,
          totalReviews: 0
        });
        setSuccess('Course created successfully');
      }

      setShowModal(false);
      loadCourses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving course:', err);
      setError(err.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        setLoading(true);
        await courseServices.deleteCourse(courseId);
        setSuccess('Course deleted successfully');
        loadCourses();
      } catch {
        setError('Failed to delete course');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && !courses.length) return <LoadingSpinner fullScreen />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Manage Courses</h1>
        <Button variant="primary" onClick={() => handleOpenModal()}>+ Add Course</Button>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

      <Card padding="none">
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Difficulty</th>
                <th>Price</th>
                <th>Students</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id}>
                  <td>
                    <div className={styles.courseTitle}>{course.title}</div>
                    <div className={styles.courseId}>{course.id}</div>
                  </td>
                  <td>{course.category}</td>
                  <td>{course.difficulty}</td>
                  <td>${course.price}</td>
                  <td>{course.enrolledStudents || 0}</td>
                  <td>
                    <span className={course.featured ? styles.badgeFeatured : styles.badgeNormal}>
                      {course.featured ? 'Featured' : 'Standard'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Button size="small" variant="secondary" onClick={() => handleOpenModal(course)}>Edit</Button>
                      <Button size="small" variant="danger" onClick={() => handleDelete(course.id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td colSpan="7" className={styles.empty}>No courses found. Create one to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <BaseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={isEditing ? 'Edit Course' : 'Create New Course'}
      >
        <div className={styles.formGrid}>
          <Input
            label="Title"
            name="title"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="Course Title"
            required
          />
          <Select
            label="Category"
            name="category"
            value={formData.category}
            onChange={e => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: '', label: 'Select Category' },
              { value: 'Adult Remedial', label: 'Adult Remedial' },
              { value: 'Juvenile Driver', label: 'Juvenile Driver' },
              { value: 'Mature Driver', label: 'Mature Driver' },
              { value: 'Fleet Training', label: 'Fleet Training' }
            ]}
            required
          />
          <div className={styles.fullWidth}>
            <TextArea
              label="Description"
              name="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Course Description"
              rows={4}
              fullWidth
            />
          </div>
          <Select
            label="Difficulty"
            name="difficulty"
            value={formData.difficulty}
            onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
            options={[
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' }
            ]}
          />
          <Input
            label="Price ($)"
            name="price"
            type="number"
            value={formData.price}
            onChange={e => setFormData({ ...formData, price: e.target.value })}
            min="0"
          />
          <Input
            label="Duration (min)"
            name="duration"
            type="number"
            value={formData.duration}
            onChange={e => setFormData({ ...formData, duration: e.target.value })}
            min="1"
          />
          <div className={styles.checkboxWrapper}>
            <label>
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={e => setFormData({ ...formData, featured: e.target.checked })}
              /> Featured Course
            </label>
          </div>
        </div>

        <div className={styles.modalActions}>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>
            {isEditing ? 'Update Course' : 'Create Course'}
          </Button>
        </div>
      </BaseModal>
    </div>
  );
};

export default AdminCoursesPage;
