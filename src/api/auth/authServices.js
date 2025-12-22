// Authentication Services
// Firebase authentication operations

import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';

import { auth } from '../../config/firebase';
import { executeService } from '../base/ServiceWrapper';
import { validateEmail, validatePassword } from '../../utils/api/validators.js';
import { AuthError } from '../errors/ApiError';

// Login with email and password
export const login = async (email, password) => {
  return executeService(async () => {
    validateEmail(email);
    validatePassword(password);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }, 'login');
};

// Register new user
export const register = async (email, password) => {
  return executeService(async () => {
    validateEmail(email);
    validatePassword(password);
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  }, 'register');
};

// Logout current user
export const logout = async () => {
  return executeService(async () => {
    await signOut(auth);
  }, 'logout');
};

// Send password reset email
export const resetPassword = async (email) => {
  return executeService(async () => {
    validateEmail(email);
    
    await sendPasswordResetEmail(auth, email);
  }, 'resetPassword');
};

// Change user password (requires recent authentication)
export const changePassword = async (currentPassword, newPassword) => {
  return executeService(async () => {
    validatePassword(currentPassword);
    validatePassword(newPassword);
    
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new AuthError('No user logged in');
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    await updatePassword(user, newPassword);
  }, 'changePassword');
};

// Change user email (requires recent authentication)
export const changeEmail = async (currentPassword, newEmail) => {
  return executeService(async () => {
    validatePassword(currentPassword);
    validateEmail(newEmail);
    
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new AuthError('No user logged in');
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    await updateEmail(user, newEmail);
  }, 'changeEmail');
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!auth.currentUser;
};

export default {
  login,
  register,
  logout,
  resetPassword,
  changePassword,
  changeEmail,
  getCurrentUser,
  isAuthenticated
};