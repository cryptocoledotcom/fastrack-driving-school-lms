// RegisterPage Component
// DTO 0051 Identity Verification & DTO 0201 Falsification Warning Compliance
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input/Input';
import Checkbox from '../../components/common/Checkbox/Checkbox';
import Button from '../../components/common/Button/Button';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';
import { PUBLIC_ROUTES, PROTECTED_ROUTES } from '../../constants/routes';
import { getErrorMessage } from '../../constants/errorMessages';
import { validators } from '../../constants/validationRules';
import { getCSRFToken, validateCSRFToken } from '../../utils/security/csrfToken';

import styles from './AuthPages.module.css';

const RegisterPage = () => {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    tipicNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    state: 'Ohio',
    zipCode: '',
    parentFirstName: '',
    parentLastName: '',
    parentPhone: '',
    parentEmail: '',
    termsAccepted: false,
    accuracyAccepted: false
  });
  const [csrfToken, setCSRFToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showParentFields, setShowParentFields] = useState(false);

  useEffect(() => {
    const token = getCSRFToken();
    setCSRFToken(token);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData({ ...formData, [name]: newValue });

    if (name === 'dateOfBirth') {
      const age = validators.calculateAge(value);
      setShowParentFields(age !== null && age < 18);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateCSRFToken(csrfToken, getCSRFToken())) {
      setError('Security validation failed. Please refresh and try again.');
      return;
    }

    if (!validators.isRequired(formData.firstName) || !validators.isRequired(formData.lastName)) {
      setError('First and last name are required');
      return;
    }

    if (!validators.isRequired(formData.dateOfBirth)) {
      setError('Date of birth is required');
      return;
    }

    if (!validators.isRequired(formData.email)) {
      setError('Email address is required');
      return;
    }

    if (!validators.isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validators.isRequired(formData.address) || !validators.isRequired(formData.city) || !validators.isRequired(formData.zipCode)) {
      setError('Complete address is required');
      return;
    }

    if (showParentFields) {
      if (!validators.isRequired(formData.parentFirstName) || !validators.isRequired(formData.parentLastName)) {
        setError('Parent/Guardian first and last name are required');
        return;
      }
      if (!validators.isRequired(formData.parentPhone)) {
        setError('Parent/Guardian phone number is required');
        return;
      }
      if (!validators.isRequired(formData.parentEmail) || !validators.isValidEmail(formData.parentEmail)) {
        setError('Valid parent/Guardian email is required');
        return;
      }
    }

    if (!validators.isStrongPassword(formData.password)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, numbers, and a special character');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.termsAccepted) {
      setError('You must accept the Terms of Service and Privacy Policy');
      return;
    }

    if (!formData.accuracyAccepted) {
      setError('You must certify that your information is accurate');
      return;
    }

    setLoading(true);
    try {
      const displayName = `${formData.firstName} ${formData.lastName}`.trim();

      await register(formData.email, formData.password, {
        displayName,
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        tipicNumber: formData.tipicNumber || null,
        parentGuardian: showParentFields ? {
          firstName: formData.parentFirstName,
          lastName: formData.parentLastName,
          phone: formData.parentPhone,
          email: formData.parentEmail
        } : null
      });
      navigate(PROTECTED_ROUTES.DASHBOARD);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate(PROTECTED_ROUTES.DASHBOARD);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <h1 className={styles.title}>Create Your Student Account</h1>
      <p className={styles.subtitle}>Please enter your information exactly as it appears on your Temporary Permit (TIPIC).</p>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

      <form onSubmit={handleSubmit} className={styles.form}>
        <input type="hidden" name="csrf_token" value={csrfToken} />

        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Student Information</h3>
          <Input
            label="Legal First Name"
            type="text"
            name="firstName"
            placeholder="Enter your first name"
            value={formData.firstName}
            onChange={handleChange}
            required
            fullWidth
          />
          <Input
            label="Middle Name"
            type="text"
            name="middleName"
            placeholder="Required if on permit"
            value={formData.middleName}
            onChange={handleChange}
            fullWidth
          />
          <Input
            label="Legal Last Name"
            type="text"
            name="lastName"
            placeholder="Enter your last name"
            value={formData.lastName}
            onChange={handleChange}
            required
            fullWidth
          />
          <Input
            label="Date of Birth"
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
            fullWidth
          />
          <Input
            label="TIPIC / Permit Number"
            type="text"
            name="tipicNumber"
            placeholder="e.g., R12345678"
            value={formData.tipicNumber}
            onChange={handleChange}
            fullWidth
          />
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Contact Information</h3>
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            fullWidth
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            fullWidth
          />
          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            fullWidth
          />
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Address</h3>
          <Input
            label="Street Address"
            type="text"
            name="address"
            placeholder="123 Main St"
            value={formData.address}
            onChange={handleChange}
            required
            fullWidth
          />
          <Input
            label="City"
            type="text"
            name="city"
            placeholder="Columbus"
            value={formData.city}
            onChange={handleChange}
            required
            fullWidth
          />
          <Input
            label="State"
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            disabled
            fullWidth
          />
          <Input
            label="Zip Code"
            type="text"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            required
            fullWidth
          />
        </div>

        {showParentFields && (
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Parent/Guardian Information (Required for students under 18)</h3>
            <Input
              label="Parent/Guardian First Name"
              type="text"
              name="parentFirstName"
              value={formData.parentFirstName}
              onChange={handleChange}
              required
              fullWidth
            />
            <Input
              label="Parent/Guardian Last Name"
              type="text"
              name="parentLastName"
              value={formData.parentLastName}
              onChange={handleChange}
              required
              fullWidth
            />
            <Input
              label="Parent/Guardian Phone Number"
              type="tel"
              name="parentPhone"
              value={formData.parentPhone}
              onChange={handleChange}
              required
              fullWidth
            />
            <Input
              label="Parent/Guardian Email Address"
              type="email"
              name="parentEmail"
              value={formData.parentEmail}
              onChange={handleChange}
              required
              fullWidth
            />
          </div>
        )}

        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Certification</h3>
          <Checkbox
            label="I agree to the Terms of Service and have read the Privacy Policy."
            name="termsAccepted"
            checked={formData.termsAccepted}
            onChange={handleChange}
          />
          <Checkbox
            label="I certify that the information provided is true and accurate. I understand that providing false information is a violation of Ohio regulations and may result in the cancellation of my course and certificate."
            name="accuracyAccepted"
            checked={formData.accuracyAccepted}
            onChange={handleChange}
          />
        </div>

        <Button type="submit" variant="primary" fullWidth loading={loading}>
          Create Account & Start Course
        </Button>
      </form>

      <p className={styles.switchText}>
        Already have an account?{' '}
        <Link to={PUBLIC_ROUTES.LOGIN} className={styles.switchLink}>
          Sign In
        </Link>
      </p>

      <div className={styles.divider}>OR</div>

      <Button
        onClick={handleGoogleLogin}
        style={{ backgroundColor: 'var(--color-primary-700)' }}
        fullWidth
        loading={googleLoading}
      >
        Sign Up with Google
      </Button>
    </div>
  );
};

export default RegisterPage;
