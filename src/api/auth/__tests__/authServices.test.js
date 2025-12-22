import { vi } from 'vitest';

import * as authServices from '../authServices.js';

let firebase;
let auth;
let validateEmail;
let validatePassword;
let ValidationError;

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  updatePassword: vi.fn(),
  updateEmail: vi.fn(),
  EmailAuthProvider: {
    credential: vi.fn()
  },
  reauthenticateWithCredential: vi.fn()
}));

vi.mock('../../../config/firebase.js', () => ({
  auth: {
    currentUser: null
  }
}));

vi.mock('../../../utils/api/validators.js', () => ({
  validateEmail: vi.fn(),
  validatePassword: vi.fn()
}));

vi.mock('../../errors/ApiError.js', () => ({
  AuthError: class AuthError extends Error {
    constructor(message) {
      super(message);
      this.code = 'AUTH_ERROR';
    }
  },
  ValidationError: class ValidationError extends Error {
    constructor(message) {
      super(message);
      this.code = 'VALIDATION_ERROR';
    }
  },
  ApiError: class ApiError extends Error {
    constructor(code, message, originalError) {
      super(message);
      this.code = code;
      this.originalError = originalError;
    }
  },
  mapFirebaseError: vi.fn((error) => error)
}));

vi.mock('../base/ServiceWrapper.js', () => ({
  executeService: vi.fn(async (operation) => {
    return await operation();
  })
}));

beforeEach(async () => {
  vi.clearAllMocks();
  firebase = vi.mocked(await import('firebase/auth'));
  const firebaseConfig = await import('../../../config/firebase.js');
  auth = firebaseConfig.auth;
  const validators = await import('../../../utils/api/validators.js');
  validateEmail = validators.validateEmail;
  validatePassword = validators.validatePassword;
  const errorModule = await import('../../errors/ApiError.js');
  ValidationError = errorModule.ValidationError;
});

describe('Auth Services', () => {
  describe('login()', () => {
    it('should login with valid email and password', async () => {
      const mockUser = { uid: '123', email: 'test@example.com' };
      firebase.signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      validateEmail.mockImplementation(() => true);
      validatePassword.mockImplementation(() => true);

      const result = await authServices.login('test@example.com', 'password123');
      expect(result).toEqual(mockUser);
    });

    it('should throw validation error for invalid email', async () => {
      validateEmail.mockImplementation(() => {
        throw new ValidationError('Invalid email format');
      });

      await expect(authServices.login('invalid-email', 'password123')).rejects.toThrow();
    });

    it('should throw validation error for weak password', async () => {
      validateEmail.mockImplementation(() => true);
      validatePassword.mockImplementation(() => {
        throw new ValidationError('Password too weak');
      });

      await expect(authServices.login('test@example.com', '123')).rejects.toThrow();
    });

    it('should handle Firebase auth/user-not-found error', async () => {
      const mockError = { code: 'auth/user-not-found', message: 'User not found' };
      validateEmail.mockImplementation(() => true);
      validatePassword.mockImplementation(() => true);
      firebase.signInWithEmailAndPassword.mockRejectedValue(mockError);

      await expect(authServices.login('test@example.com', 'password123')).rejects.toThrow();
    });

    it('should handle Firebase auth/wrong-password error', async () => {
      const mockError = { code: 'auth/wrong-password', message: 'Wrong password' };
      validateEmail.mockImplementation(() => true);
      validatePassword.mockImplementation(() => true);
      firebase.signInWithEmailAndPassword.mockRejectedValue(mockError);

      await expect(authServices.login('test@example.com', 'wrongpassword')).rejects.toThrow();
    });

    it('should handle Firebase auth/too-many-requests error', async () => {
      const mockError = { code: 'auth/too-many-requests', message: 'Too many requests' };
      validateEmail.mockImplementation(() => true);
      validatePassword.mockImplementation(() => true);
      firebase.signInWithEmailAndPassword.mockRejectedValue(mockError);

      await expect(authServices.login('test@example.com', 'password123')).rejects.toThrow();
    });

    it('should handle network errors during login', async () => {
      const mockError = new Error('Network error');
      validateEmail.mockImplementation(() => true);
      validatePassword.mockImplementation(() => true);
      firebase.signInWithEmailAndPassword.mockRejectedValue(mockError);

      await expect(authServices.login('test@example.com', 'password123')).rejects.toThrow();
    });

    it('should handle case-sensitive email validation', async () => {
      const mockUser = { uid: '123', email: 'Test@Example.com' };
      firebase.signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      validateEmail.mockImplementation(() => true);
      validatePassword.mockImplementation(() => true);

      const result = await authServices.login('Test@Example.com', 'password123');
      expect(result).toEqual(mockUser);
    });
  });

  describe('register()', () => {
    it('should register new user with valid credentials', async () => {
      const mockUser = { uid: '456', email: 'newuser@example.com' };
      firebase.createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      validateEmail.mockImplementation(() => true);
      validatePassword.mockImplementation(() => true);

      const result = await authServices.register('newuser@example.com', 'securepassword123');
      expect(result).toEqual(mockUser);
    });

    it('should throw validation error for invalid email during register', async () => {
      validateEmail.mockImplementation(() => {
        throw new ValidationError('Invalid email format');
      });

      await expect(authServices.register('bad-email', 'password123')).rejects.toThrow();
    });

    it('should throw validation error for weak password during register', async () => {
      validateEmail.mockImplementation(() => true);
      validatePassword.mockImplementation(() => {
        throw new ValidationError('Password too weak');
      });

      await expect(authServices.register('user@example.com', 'weak')).rejects.toThrow();
    });

    it('should handle Firebase auth/email-already-in-use error', async () => {
      const mockError = { code: 'auth/email-already-in-use', message: 'Email already exists' };
      validateEmail.mockImplementation(() => true);
      validatePassword.mockImplementation(() => true);
      firebase.createUserWithEmailAndPassword.mockRejectedValue(mockError);

      await expect(authServices.register('existing@example.com', 'password123')).rejects.toThrow();
    });

    it('should handle Firebase auth/weak-password error', async () => {
      const mockError = { code: 'auth/weak-password', message: 'Password is too weak' };
      validateEmail.mockImplementation(() => true);
      validatePassword.mockImplementation(() => true);
      firebase.createUserWithEmailAndPassword.mockRejectedValue(mockError);

      await expect(authServices.register('user@example.com', 'weak')).rejects.toThrow();
    });

    it('should handle Firebase auth/operation-not-allowed error', async () => {
      const mockError = { code: 'auth/operation-not-allowed', message: 'Operation not allowed' };
      validateEmail.mockImplementation(() => true);
      validatePassword.mockImplementation(() => true);
      firebase.createUserWithEmailAndPassword.mockRejectedValue(mockError);

      await expect(authServices.register('user@example.com', 'password123')).rejects.toThrow();
    });

    it('should handle network errors during registration', async () => {
      const mockError = new Error('Network error');
      validateEmail.mockImplementation(() => true);
      validatePassword.mockImplementation(() => true);
      firebase.createUserWithEmailAndPassword.mockRejectedValue(mockError);

      await expect(authServices.register('user@example.com', 'password123')).rejects.toThrow();
    });
  });

  describe('logout()', () => {
    it('should logout successfully', async () => {
      firebase.signOut.mockResolvedValue(undefined);

      await expect(authServices.logout()).resolves.toBeUndefined();
      expect(firebase.signOut).toHaveBeenCalled();
    });
  });

  describe('resetPassword()', () => {
    it('should send password reset email for valid email', async () => {
      validateEmail.mockImplementation(() => true);
      firebase.sendPasswordResetEmail.mockResolvedValue(undefined);

      await expect(authServices.resetPassword('user@example.com')).resolves.toBeUndefined();
    });

    it('should throw validation error for invalid email in reset', async () => {
      validateEmail.mockImplementation(() => {
        throw new ValidationError('Invalid email format');
      });

      await expect(authServices.resetPassword('bad-email')).rejects.toThrow();
    });

    it('should handle Firebase errors during password reset', async () => {
      const mockError = { code: 'auth/invalid-email', message: 'Invalid email' };
      validateEmail.mockImplementation(() => true);
      firebase.sendPasswordResetEmail.mockRejectedValue(mockError);

      await expect(authServices.resetPassword('user@example.com')).rejects.toThrow();
    });
  });

  describe('changePassword()', () => {
    it('should change password with valid current password', async () => {
      auth.currentUser = { uid: '123', email: 'user@example.com' };
      const mockCredential = { temp: 'credential' };
      validatePassword.mockImplementation(() => true);
      firebase.EmailAuthProvider.credential.mockReturnValue(mockCredential);
      firebase.reauthenticateWithCredential.mockResolvedValue(undefined);
      firebase.updatePassword.mockResolvedValue(undefined);

      await expect(authServices.changePassword('oldpassword', 'newpassword123')).resolves.toBeUndefined();
    });

    it('should throw error if no user is logged in for password change', async () => {
      auth.currentUser = null;
      validatePassword.mockImplementation(() => true);

      await expect(authServices.changePassword('oldpassword', 'newpassword123')).rejects.toThrow();
    });

    it('should throw validation error for invalid current password', async () => {
      auth.currentUser = { uid: '123', email: 'user@example.com' };
      validatePassword.mockImplementation(() => {
        throw new ValidationError('Invalid password');
      });

      await expect(authServices.changePassword('invalid', 'newpassword123')).rejects.toThrow();
    });

    it('should throw validation error for invalid new password', async () => {
      auth.currentUser = { uid: '123', email: 'user@example.com' };
      validatePassword
        .mockImplementationOnce(() => true)
        .mockImplementationOnce(() => {
          throw new ValidationError('Password too weak');
        });

      await expect(authServices.changePassword('oldpassword', 'weak')).rejects.toThrow();
    });

    it('should handle Firebase reauthentication failure', async () => {
      auth.currentUser = { uid: '123', email: 'user@example.com' };
      const mockCredential = { temp: 'credential' };
      const mockError = { code: 'auth/wrong-password', message: 'Wrong password' };
      validatePassword.mockImplementation(() => true);
      firebase.EmailAuthProvider.credential.mockReturnValue(mockCredential);
      firebase.reauthenticateWithCredential.mockRejectedValue(mockError);

      await expect(authServices.changePassword('wrongpassword', 'newpassword123')).rejects.toThrow();
    });
  });

  describe('changeEmail()', () => {
    it('should change email with valid password and new email', async () => {
      auth.currentUser = { uid: '123', email: 'old@example.com' };
      const mockCredential = { temp: 'credential' };
      validatePassword.mockImplementation(() => true);
      validateEmail.mockImplementation(() => true);
      firebase.EmailAuthProvider.credential.mockReturnValue(mockCredential);
      firebase.reauthenticateWithCredential.mockResolvedValue(undefined);
      firebase.updateEmail.mockResolvedValue(undefined);

      await expect(authServices.changeEmail('password123', 'new@example.com')).resolves.toBeUndefined();
    });

    it('should throw error if no user is logged in for email change', async () => {
      auth.currentUser = null;
      validatePassword.mockImplementation(() => true);
      validateEmail.mockImplementation(() => true);

      await expect(authServices.changeEmail('password123', 'new@example.com')).rejects.toThrow();
    });

    it('should throw validation error for invalid password during email change', async () => {
      auth.currentUser = { uid: '123', email: 'old@example.com' };
      validatePassword.mockImplementation(() => {
        throw new ValidationError('Invalid password');
      });

      await expect(authServices.changeEmail('invalid', 'new@example.com')).rejects.toThrow();
    });

    it('should throw validation error for invalid new email', async () => {
      auth.currentUser = { uid: '123', email: 'old@example.com' };
      validatePassword.mockImplementation(() => true);
      validateEmail.mockImplementation(() => {
        throw new ValidationError('Invalid email format');
      });

      await expect(authServices.changeEmail('password123', 'bad-email')).rejects.toThrow();
    });

    it('should handle Firebase reauthentication failure during email change', async () => {
      auth.currentUser = { uid: '123', email: 'old@example.com' };
      const mockCredential = { temp: 'credential' };
      const mockError = { code: 'auth/wrong-password', message: 'Wrong password' };
      validatePassword.mockImplementation(() => true);
      validateEmail.mockImplementation(() => true);
      firebase.EmailAuthProvider.credential.mockReturnValue(mockCredential);
      firebase.reauthenticateWithCredential.mockRejectedValue(mockError);

      await expect(authServices.changeEmail('wrongpassword', 'new@example.com')).rejects.toThrow();
    });
  });

  describe('getCurrentUser()', () => {
    it('should return current user when logged in', () => {
      const mockUser = { uid: '123', email: 'user@example.com' };
      auth.currentUser = mockUser;

      const result = authServices.getCurrentUser();
      expect(result).toEqual(mockUser);
    });

    it('should return null when no user is logged in', () => {
      auth.currentUser = null;

      const result = authServices.getCurrentUser();
      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated()', () => {
    it('should return true when user is logged in', () => {
      auth.currentUser = { uid: '123', email: 'user@example.com' };

      const result = authServices.isAuthenticated();
      expect(result).toBe(true);
    });

    it('should return false when no user is logged in', () => {
      auth.currentUser = null;

      const result = authServices.isAuthenticated();
      expect(result).toBe(false);
    });

    it('should return false for undefined currentUser', () => {
      auth.currentUser = undefined;

      const result = authServices.isAuthenticated();
      expect(result).toBe(false);
    });

    it('should return false for null currentUser', () => {
      auth.currentUser = null;

      const result = authServices.isAuthenticated();
      expect(result).toBe(false);
    });
  });

  describe('Integration Scenarios', () => {
    it('should complete full login and logout flow', async () => {
      const mockUser = { uid: '123', email: 'user@example.com' };
      firebase.signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      firebase.signOut.mockResolvedValue(undefined);
      validateEmail.mockImplementation(() => true);
      validatePassword.mockImplementation(() => true);

      const loginResult = await authServices.login('user@example.com', 'password123');
      expect(loginResult).toEqual(mockUser);

      auth.currentUser = mockUser;
      expect(authServices.isAuthenticated()).toBe(true);

      await authServices.logout();
      auth.currentUser = null;
      expect(authServices.isAuthenticated()).toBe(false);
    });

    it('should handle register and password change flow', async () => {
      const mockUser = { uid: '456', email: 'newuser@example.com' };
      firebase.createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      validateEmail.mockImplementation(() => true);
      validatePassword.mockImplementation(() => true);
      const mockCredential = { temp: 'credential' };
      firebase.EmailAuthProvider.credential.mockReturnValue(mockCredential);
      firebase.reauthenticateWithCredential.mockResolvedValue(undefined);
      firebase.updatePassword.mockResolvedValue(undefined);

      const registerResult = await authServices.register('newuser@example.com', 'initialpassword123');
      expect(registerResult).toEqual(mockUser);

      auth.currentUser = mockUser;
      await authServices.changePassword('initialpassword123', 'newpassword456');
      expect(firebase.updatePassword).toHaveBeenCalled();
    });

    it('should handle password reset workflow', async () => {
      validateEmail.mockImplementation(() => true);
      firebase.sendPasswordResetEmail.mockResolvedValue(undefined);

      await authServices.resetPassword('user@example.com');
      expect(firebase.sendPasswordResetEmail).toHaveBeenCalledWith(
        auth,
        'user@example.com'
      );
    });
  });
});
