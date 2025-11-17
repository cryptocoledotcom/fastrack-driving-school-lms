// ForgotPasswordPage Component
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';
import SuccessMessage from '../../components/common/SuccessMessage/SuccessMessage';
import { PUBLIC_ROUTES } from '../../constants/routes';
import { getErrorMessage } from '../../constants/errorMessages';
import styles from './AuthPages.module.css';

const ForgotPasswordPage = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <h1 className={styles.title}>Reset Password</h1>
      <p className={styles.subtitle}>Enter your email to receive reset instructions</p>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      {success && (
        <SuccessMessage
          message="Password reset email sent! Check your inbox."
          onDismiss={() => setSuccess(false)}
        />
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
        />
        <Button type="submit" variant="primary" fullWidth loading={loading}>
          Send Reset Link
        </Button>
      </form>

      <p className={styles.switchText}>
        Remember your password?{' '}
        <Link to={PUBLIC_ROUTES.LOGIN} className={styles.switchLink}>
          Sign In
        </Link>
      </p>
    </div>
  );
};

export default ForgotPasswordPage;