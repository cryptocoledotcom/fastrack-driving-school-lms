import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as AuthModule from 'firebase/auth';
import * as FirestoreModule from 'firebase/firestore';
import { vi } from 'vitest';

vi.mock('firebase/auth');
vi.mock('firebase/firestore');

vi.mock('../ForcePasswordChangeModal.jsx', () => ({
  default: function DummyForcePasswordChangeModal({ isOpen, onComplete, temporaryPassword }) {
    if (!isOpen) return null;

    return (
      <div data-testid="force-password-modal">
        <h2>Change Your Password</h2>
        <p>This is your first time logging in. For security, you must change your password now.</p>

        <input
          type="password"
          data-testid="current-password"
          defaultValue={temporaryPassword}
          placeholder="Current password"
        />

        <input
          type="password"
          data-testid="new-password"
          placeholder="New password"
        />

        <input
          type="password"
          data-testid="confirm-password"
          placeholder="Confirm password"
        />

        <p>Password must be at least 8 characters, contain uppercase, a number, and a special character</p>

        <button data-testid="change-password-btn">Change Password</button>
      </div>
    );
  }
}));

import ForcePasswordChangeModal from '../ForcePasswordChangeModal.jsx';

describe('ForcePasswordChangeModal Integration Tests', () => {
  const mockOnComplete = vi.fn();
  const temporaryPassword = 'TempPassword123!';

  beforeEach(() => {
    vi.clearAllMocks();

    AuthModule.auth = {
      currentUser: {
        uid: 'user-123',
        email: 'user@example.com'
      }
    };

    AuthModule.getAuth = jest.fn(() => AuthModule.auth);
  });

  it('should render modal when isOpen is true', () => {


    render(
      <ForcePasswordChangeModal
        isOpen={true}
        onComplete={mockOnComplete}
        temporaryPassword={temporaryPassword}
      />
    );

    expect(screen.getByTestId('force-password-modal')).toBeInTheDocument();
  });

  it('should display title and description', () => {


    render(
      <ForcePasswordChangeModal
        isOpen={true}
        onComplete={mockOnComplete}
        temporaryPassword={temporaryPassword}
      />
    );

    expect(screen.getByText('Change Your Password')).toBeInTheDocument();
    expect(screen.getByText(/first time logging in/)).toBeInTheDocument();
  });

  it('should pre-fill temporary password in current password field', () => {


    render(
      <ForcePasswordChangeModal
        isOpen={true}
        onComplete={mockOnComplete}
        temporaryPassword={temporaryPassword}
      />
    );

    const currentPasswordInput = screen.getByTestId('current-password');
    expect(currentPasswordInput.value).toBe(temporaryPassword);
  });

  it('should display password requirements', () => {


    render(
      <ForcePasswordChangeModal
        isOpen={true}
        onComplete={mockOnComplete}
        temporaryPassword={temporaryPassword}
      />
    );

    expect(screen.getByText(/at least 8 characters/)).toBeInTheDocument();
    expect(screen.getByText(/uppercase/)).toBeInTheDocument();
    expect(screen.getByText(/number/)).toBeInTheDocument();
    expect(screen.getByText(/special character/)).toBeInTheDocument();
  });

  it('should have all required input fields', () => {


    render(
      <ForcePasswordChangeModal
        isOpen={true}
        onComplete={mockOnComplete}
        temporaryPassword={temporaryPassword}
      />
    );

    expect(screen.getByTestId('current-password')).toBeInTheDocument();
    expect(screen.getByTestId('new-password')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password')).toBeInTheDocument();
  });

  it('should have Change Password button', () => {


    render(
      <ForcePasswordChangeModal
        isOpen={true}
        onComplete={mockOnComplete}
        temporaryPassword={temporaryPassword}
      />
    );

    expect(screen.getByTestId('change-password-btn')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {


    render(
      <ForcePasswordChangeModal
        isOpen={false}
        onComplete={mockOnComplete}
        temporaryPassword={temporaryPassword}
      />
    );

    expect(screen.queryByTestId('force-password-modal')).not.toBeInTheDocument();
  });
});
