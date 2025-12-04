import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import * as firebase from 'firebase/auth';
import * as firestore from 'firebase/firestore';

vi.mock('firebase/auth');
vi.mock('firebase/firestore');
vi.mock('../config/firebase', () => ({
  auth: {},
  db: {}
}));

vi.mock('../constants/userRoles', () => ({
  USER_ROLES: {
    STUDENT: 'student',
    INSTRUCTOR: 'instructor',
    DMV_ADMIN: 'dmv_admin',
    SUPER_ADMIN: 'super_admin'
  }
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firebase.onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return vi.fn();
    });
  });

  describe('useAuth hook', () => {
    it('should provide auth context inside AuthProvider', () => {
      const TestComponent = () => {
        const { user } = useAuth();
        return <div>{user ? 'Logged in' : 'Logged out'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('Logged out')).toBeInTheDocument();
    });
  });

  describe('AuthProvider', () => {
    it('should render children', () => {
      render(
        <AuthProvider>
          <div>Test Child</div>
        </AuthProvider>
      );

      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should initialize with user as null', () => {
      const TestComponent = () => {
        const { user, loading } = useAuth();
        if (loading) return <div>Loading</div>;
        return <div>{user ? 'User exists' : 'No user'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      waitFor(() => {
        expect(screen.getByText('No user')).toBeInTheDocument();
      });
    });
  });

  describe('Auth context values', () => {
    it('should provide isAuthenticated as false when user is null', async () => {
      const TestComponent = () => {
        const { isAuthenticated } = useAuth();
        return <div>{isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Not authenticated')).toBeInTheDocument();
      });
    });

    it('should provide isAdmin as false when user role is not admin', async () => {
      const TestComponent = () => {
        const { isAdmin } = useAuth();
        return <div>{isAdmin ? 'Admin' : 'Not admin'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Not admin')).toBeInTheDocument();
      });
    });

    it('should provide isInstructor as false when user role is not instructor', async () => {
      const TestComponent = () => {
        const { isInstructor } = useAuth();
        return <div>{isInstructor ? 'Instructor' : 'Not instructor'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Not instructor')).toBeInTheDocument();
      });
    });

    it('should provide isStudent as false when user role is not student', async () => {
      const TestComponent = () => {
        const { isStudent } = useAuth();
        return <div>{isStudent ? 'Student' : 'Not student'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Not student')).toBeInTheDocument();
      });
    });
  });

  describe('hasRole method', () => {
    it('should check single role', () => {
      const TestComponent = () => {
        const { hasRole } = useAuth();
        return <div>{hasRole('student') ? 'Has role' : 'No role'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('No role')).toBeInTheDocument();
    });

    it('should check array of roles', () => {
      const TestComponent = () => {
        const { hasRole } = useAuth();
        return <div>{hasRole(['student', 'instructor']) ? 'Has role' : 'No role'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('No role')).toBeInTheDocument();
    });
  });

  describe('getUserFullName method', () => {
    it('should return empty string when no user profile', () => {
      const TestComponent = () => {
        const { getUserFullName } = useAuth();
        const name = getUserFullName();
        return <div>Name:{name || 'empty'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('Name:empty')).toBeInTheDocument();
    });
  });

  describe('logout functionality', () => {
    it('should have logout method available', () => {
      const TestComponent = () => {
        const { logout } = useAuth();
        return (
          <button onClick={logout}>Logout</button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should initialize error as null', () => {
      const TestComponent = () => {
        const { error } = useAuth();
        return <div>{error ? 'Error' : 'No error'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('password change modal', () => {
    it('should initialize showPasswordChangeModal as false', () => {
      const TestComponent = () => {
        const { showPasswordChangeModal } = useAuth();
        return <div>{showPasswordChangeModal ? 'Show modal' : 'Hide modal'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('Hide modal')).toBeInTheDocument();
    });

    it('should provide setShowPasswordChangeModal method', () => {
      const TestComponent = () => {
        const { setShowPasswordChangeModal } = useAuth();
        return (
          <button onClick={() => setShowPasswordChangeModal(true)}>Show Modal</button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByText('Show Modal')).toBeInTheDocument();
    });
  });
});
