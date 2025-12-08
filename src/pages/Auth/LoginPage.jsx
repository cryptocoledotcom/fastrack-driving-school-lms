// LoginPage Component
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';
import { PUBLIC_ROUTES, PROTECTED_ROUTES } from '../../constants/routes';
import { getErrorMessage } from '../../constants/errorMessages';
import { getCSRFToken, validateCSRFToken } from '../../utils/security/csrfToken';
import styles from './AuthPages.module.css';

const LoginPage = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [csrfToken, setCSRFToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const token = getCSRFToken();
    setCSRFToken(token);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateCSRFToken(csrfToken, getCSRFToken())) {
      setError('Security validation failed. Please refresh and try again.');
      return;
    }

    setLoading(true);

    try {
      await login(formData.email, formData.password);
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
      <h1 className={styles.title}>Welcome Back</h1>
      <p className={styles.subtitle}>Sign in to continue your learning journey</p>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

      <form onSubmit={handleSubmit} className={styles.form}>
        <input type="hidden" name="csrf_token" value={csrfToken} />
        <Input
          label="Email"
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
        <Link to={PUBLIC_ROUTES.FORGOT_PASSWORD} className={styles.forgotLink}>
          Forgot Password?
        </Link>
        <Button type="submit" variant="primary" fullWidth loading={loading}>
          Sign In
        </Button>
      </form>

      <p className={styles.switchText}>
        Don't have an account?{' '}
        <Link to={PUBLIC_ROUTES.REGISTER} className={styles.switchLink}>
          Sign Up
        </Link>
      </p>

      <div className={styles.divider}>OR</div>

      <Button
        onClick={handleGoogleLogin}
        style={{ backgroundColor: 'var(--color-primary-700)' }}
        fullWidth
        loading={googleLoading}
      >
        Sign In with Google
      </Button>
    </div>
  );
};

export default LoginPage;