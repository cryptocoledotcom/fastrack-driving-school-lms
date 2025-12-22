import { useState } from 'react';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

import { auth, db } from '../../config/firebase';
import BaseModal from '../common/Modals/BaseModal';
import Button from '../common/Button/Button';
import Input from '../common/Input/Input';
import ErrorMessage from '../common/ErrorMessage/ErrorMessage';
import SuccessMessage from '../common/SuccessMessage/SuccessMessage';

import styles from './ForcePasswordChangeModal.module.css';

const ForcePasswordChangeModal = ({ isOpen, onComplete, temporaryPassword }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState(temporaryPassword || '');

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return 'Password must contain at least one special character (!@#$%^&*)';
    }
    return '';
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No user authenticated');
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        requiresPasswordChange: false,
        lastPasswordChange: new Date().toISOString()
      });

      setSuccess('Password changed successfully!');
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err) {
      console.error('Error changing password:', err);
      if (err.code === 'auth/wrong-password') {
        setError('Current password is incorrect');
      } else {
        setError(err.message || 'Failed to change password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      title="Change Your Password"
      onClose={() => {}}
      showCloseButton={false}
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <div className={styles.modalContent}>
        <p className={styles.description}>
          This is your first time logging in. For security, you must change your password now.
        </p>

        {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
        {success && <SuccessMessage message={success} onDismiss={() => setSuccess('')} />}

        <form onSubmit={handlePasswordChange} className={styles.form}>
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="Enter the temporary password provided"
            required
          />

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
          />
          <p className={styles.passwordHint}>
            Password must be at least 8 characters, contain uppercase, a number, and a special character
          </p>

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={!newPassword || !confirmPassword || !currentPassword}
            fullWidth
          >
            Change Password
          </Button>
        </form>
      </div>
    </BaseModal>
  );
};

export default ForcePasswordChangeModal;
