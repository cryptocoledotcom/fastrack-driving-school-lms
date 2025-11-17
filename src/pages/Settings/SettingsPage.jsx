import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card/Card';
import Input from '../../components/common/Input/Input';
import Select from '../../components/common/Select/Select';
import Button from '../../components/common/Button/Button';
import Checkbox from '../../components/common/Checkbox/Checkbox';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';
import SuccessMessage from '../../components/common/SuccessMessage/SuccessMessage';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import { updateProfile, getUserSettings, updateUserSettings } from '../../api/userServices';
import { getSecurityQuestions, setSecurityQuestions, getAvailableSecurityQuestions } from '../../api/securityServices';
import styles from './SettingsPage.module.css';

const SettingsPage = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
  
  // Profile state
  const [profileData, setProfileData] = useState({
    displayName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  
  // Settings state
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    emailNotifications: true
  });
  
  // Security questions state
  const [securityQuestions, setSecurityQuestionsState] = useState([
    { questionId: '', answer: '' },
    { questionId: '', answer: '' },
    { questionId: '', answer: '' }
  ]);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userProfile]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load profile data
      if (userProfile) {
        setProfileData({
          displayName: userProfile.displayName || '',
          phone: userProfile.phone || '',
          address: userProfile.address || '',
          city: userProfile.city || '',
          state: userProfile.state || '',
          zipCode: userProfile.zipCode || ''
        });
      }
      
      // Load settings
      const userSettings = await getUserSettings(user.uid);
      setSettings(userSettings);
      
      // Apply dark mode
      if (userSettings.darkMode) {
        document.body.classList.add('dark-mode');
      }
      
      // Load security questions
      const securityData = await getSecurityQuestions(user.uid);
      if (securityData && securityData.questions) {
        setSecurityQuestionsState(securityData.questions.map(q => ({
          questionId: q.id,
          answer: '' // Don't show existing answers for security
        })));
      }
      
      // Load available questions
      setAvailableQuestions(getAvailableSecurityQuestions());
      
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      await updateProfile(user.uid, profileData);
      await updateUserProfile(profileData);
      
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = async (settingName, value) => {
    try {
      const newSettings = { ...settings, [settingName]: value };
      setSettings(newSettings);
      
      await updateUserSettings(user.uid, newSettings);
      
      // Apply dark mode immediately
      if (settingName === 'darkMode') {
        if (value) {
          document.body.classList.add('dark-mode');
        } else {
          document.body.classList.remove('dark-mode');
        }
      }
      
      setSuccess('Settings updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update settings');
      console.error(err);
    }
  };

  const handleSecurityQuestionChange = (index, field, value) => {
    const newQuestions = [...securityQuestions];
    newQuestions[index][field] = value;
    setSecurityQuestionsState(newQuestions);
  };

  const handleSaveSecurityQuestions = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Validate all questions are filled
      const isValid = securityQuestions.every(q => q.questionId && q.answer);
      if (!isValid) {
        setError('Please fill in all security questions and answers');
        setSaving(false);
        return;
      }
      
      // Check for duplicate questions
      const questionIds = securityQuestions.map(q => q.questionId);
      const hasDuplicates = questionIds.length !== new Set(questionIds).size;
      if (hasDuplicates) {
        setError('Please select different questions for each slot');
        setSaving(false);
        return;
      }
      
      const questionsData = {
        questions: securityQuestions.map(q => ({
          id: q.questionId,
          answer: q.answer.trim()
        }))
      };
      
      await setSecurityQuestions(user.uid, questionsData);
      setSuccess('Security questions updated successfully!');
      
      // Clear answers from display
      setSecurityQuestionsState(securityQuestions.map(q => ({
        ...q,
        answer: ''
      })));
      
    } catch (err) {
      setError('Failed to update security questions');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading settings..." />;
  }

  return (
    <div className={styles.settingsPage}>
      <h1 className={styles.title}>Settings</h1>
      
      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'profile' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'preferences' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'security' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card padding="large">
          <h2 className={styles.sectionTitle}>Profile Information</h2>
          <div className={styles.form}>
            <Input
              label="Full Name"
              name="displayName"
              value={profileData.displayName}
              onChange={handleProfileChange}
              fullWidth
            />
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              value={profileData.phone}
              onChange={handleProfileChange}
              fullWidth
            />
            <Input
              label="Address"
              name="address"
              value={profileData.address}
              onChange={handleProfileChange}
              fullWidth
            />
            <div className={styles.row}>
              <Input
                label="City"
                name="city"
                value={profileData.city}
                onChange={handleProfileChange}
                fullWidth
              />
              <Input
                label="State"
                name="state"
                value={profileData.state}
                onChange={handleProfileChange}
                fullWidth
              />
              <Input
                label="Zip Code"
                name="zipCode"
                value={profileData.zipCode}
                onChange={handleProfileChange}
                fullWidth
              />
            </div>
            <Button
              variant="primary"
              onClick={handleSaveProfile}
              loading={saving}
            >
              Save Profile
            </Button>
          </div>
        </Card>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <Card padding="large">
          <h2 className={styles.sectionTitle}>Preferences</h2>
          <div className={styles.preferences}>
            <div className={styles.preferenceItem}>
              <div className={styles.preferenceInfo}>
                <h3>Dark Mode</h3>
                <p>Enable dark theme for better viewing in low light</p>
              </div>
              <Checkbox
                checked={settings.darkMode}
                onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
              />
            </div>
            <div className={styles.preferenceItem}>
              <div className={styles.preferenceInfo}>
                <h3>Notifications</h3>
                <p>Receive in-app notifications</p>
              </div>
              <Checkbox
                checked={settings.notifications}
                onChange={(e) => handleSettingChange('notifications', e.target.checked)}
              />
            </div>
            <div className={styles.preferenceItem}>
              <div className={styles.preferenceInfo}>
                <h3>Email Notifications</h3>
                <p>Receive email updates about your courses</p>
              </div>
              <Checkbox
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card padding="large">
          <h2 className={styles.sectionTitle}>Security Questions</h2>
          <p className={styles.description}>
            Set up security questions to help recover your account if you forget your password.
          </p>
          <div className={styles.form}>
            {securityQuestions.map((question, index) => (
              <div key={index} className={styles.securityQuestion}>
                <Select
                  label={`Question ${index + 1}`}
                  value={question.questionId}
                  onChange={(e) => handleSecurityQuestionChange(index, 'questionId', e.target.value)}
                  options={availableQuestions.map(q => ({
                    value: q.id,
                    label: q.text
                  }))}
                  placeholder="Select a question"
                  fullWidth
                />
                <Input
                  label="Answer"
                  type="text"
                  value={question.answer}
                  onChange={(e) => handleSecurityQuestionChange(index, 'answer', e.target.value)}
                  placeholder="Enter your answer"
                  fullWidth
                />
              </div>
            ))}
            <Button
              variant="primary"
              onClick={handleSaveSecurityQuestions}
              loading={saving}
            >
              Save Security Questions
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SettingsPage;