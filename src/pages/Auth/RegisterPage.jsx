// RegisterPage Component
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';
import { PUBLIC_ROUTES, PROTECTED_ROUTES } from '../../constants/routes';
import { getErrorMessage } from '../../constants/errorMessages';
import { validators, VALIDATION_RULES } from '../../constants/validationRules';
import styles from './AuthPages.module.css';

const RegisterPage = () => {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validators.isRequired(formData.displayName)) {
      setError('Full name is required');
      return;
    }

    if (!validators.isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validators.isStrongPassword(formData.password)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, numbers, and a special character');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(formData.email, formData.password, {
        displayName: formData.displayName
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
      <h1 className={styles.title}>Create Account</h1>
      <p className={styles.subtitle}>Start your driving journey today</p>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Full Name"
          type="text"
          name="displayName"
          value={formData.displayName}
          onChange={handleChange}
          required
          fullWidth
        />
        <Input
          label="Email"
          type="text"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="example+tag@domain.com"
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
        <Button type="submit" variant="primary" fullWidth loading={loading}>
          Sign Up
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
