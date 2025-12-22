import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card/Card';
import Input from '../../components/common/Input/Input';
import Select from '../../components/common/Select/Select';
import Button from '../../components/common/Button/Button';
import { ToggleSwitch } from '../../components/common/ToggleSwitch/ToggleSwitch';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';
import SuccessMessage from '../../components/common/SuccessMessage/SuccessMessage';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import { 
  updateProfile, 
  getUserSettings, 
  updateUserSettings 
} from '../../api/student/userServices';
import { 
  getSecurityProfile, 
  setSecurityQuestions 
} from '../../api/security/securityServices';

import styles from './SettingsPage.module.css';

const SettingsPage = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
  const location = useLocation();
  
  const [profileData, setProfileData] = useState({
    displayName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    emailNotifications: true
  });
  
  const [securityQuestions, setSecurityQuestionsState] = useState([
    { questionId: '', answer: '' },
    { questionId: '', answer: '' },
    { questionId: '', answer: '' }
  ]);
  const [availableQuestions] = useState([
    { id: 'q1', text: 'What was your first pet\'s name?' },
    { id: 'q2', text: 'What was the name of your elementary school?' },
    { id: 'q3', text: 'What city were you born in?' },
    { id: 'q4', text: 'What is your mother\'s maiden name?' },
    { id: 'q5', text: 'What was the make of your first car?' },
    { id: 'q6', text: 'What is your favorite book?' },
    { id: 'q7', text: 'What is the name of your favorite teacher?' },
    { id: 'q8', text: 'What was the first concert you attended?' },
    { id: 'q9', text: 'What is your favorite movie?' },
    {
      id: 'q10',
      text: 'What is the name of the street you grew up on?',
    },
  ]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'profile');

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userProfile]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
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
      
      const userSettings = await getUserSettings(user.uid);
      setSettings(userSettings);
      
      if (userSettings.darkMode) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
      } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
      }
      
      const securityData = await getSecurityProfile(user.uid);
      if (securityData && securityData.question1) {
        setSecurityQuestionsState([
          { questionId: securityData.question1, answer: '' },
          { questionId: securityData.question2 || '', answer: '' },
          { questionId: securityData.question3 || '', answer: '' }
        ]);
      }
      
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
      
      if (settingName === 'darkMode') {
        if (value) {
          document.body.classList.add('dark-mode');
          document.body.classList.remove('light-mode');
        } else {
          document.body.classList.remove('dark-mode');
          document.body.classList.add('light-mode');
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
      
      const isValid = securityQuestions.every(q => q.questionId && q.answer);
      if (!isValid) {
        setError('Please fill in all security questions and answers');
        setSaving(false);
        return;
      }
      
      const questionIds = securityQuestions.map(q => q.questionId);
      const hasDuplicates = questionIds.length !== new Set(questionIds).size;
      if (hasDuplicates) {
        setError('Please select different questions for each slot');
        setSaving(false);
        return;
      }
      
      const questionsData = {
        question1: securityQuestions[0].questionId,
        answer1: securityQuestions[0].answer.trim(),
        question2: securityQuestions[1].questionId,
        answer2: securityQuestions[1].answer.trim(),
        question3: securityQuestions[2].questionId,
        answer3: securityQuestions[2].answer.trim()
      };
      
      await setSecurityQuestions(user.uid, questionsData);
      setSuccess('Security questions updated successfully!');
      
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

      {activeTab === 'preferences' && (
        <Card padding="large">
          <h2 className={styles.sectionTitle}>Preferences</h2>
          <div className={styles.preferences}>
            <div className={styles.preferenceItem}>
              <div className={styles.preferenceInfo}>
                <h3>Dark Mode</h3>
                <p>Enable dark theme for better viewing in low light</p>
              </div>
              <ToggleSwitch
                checked={settings.darkMode}
                onChange={() => handleSettingChange('darkMode', !settings.darkMode)}
              />
            </div>
            <div className={styles.preferenceItem}>
              <div className={styles.preferenceInfo}>
                <h3>Notifications</h3>
                <p>Receive in-app notifications</p>
              </div>
              <ToggleSwitch
                checked={settings.notifications}
                onChange={() => handleSettingChange('notifications', !settings.notifications)}
              />
            </div>
            <div className={styles.preferenceItem}>
              <div className={styles.preferenceInfo}>
                <h3>Email Notifications</h3>
                <p>Receive email updates about your courses</p>
              </div>
              <ToggleSwitch
                checked={settings.emailNotifications}
                onChange={() => handleSettingChange('emailNotifications', !settings.emailNotifications)}
              />
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card padding="large">
          <h2 className={styles.sectionTitle}>Security Questions</h2>
          <p className={styles.description}>
            Set up security questions to verify your identity during lessons. Required by Ohio compliance regulations.
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
