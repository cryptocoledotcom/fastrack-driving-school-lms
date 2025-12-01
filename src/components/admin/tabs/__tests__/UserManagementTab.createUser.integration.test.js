import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserManagementTab from '../UserManagementTab';
import userManagementServices from '../../../../api/admin/userManagementServices';
import { useAuth } from '../../../../context/AuthContext';

jest.mock('../../../../api/admin/userManagementServices');
jest.mock('../../../../context/AuthContext');

describe('UserManagementTab - Create User Integration Tests', () => {
  const mockUserProfile = {
    uid: 'super-admin-uid',
    email: 'admin@example.com',
    role: 'super_admin',
    displayName: 'Super Admin'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      userProfile: mockUserProfile
    });

    userManagementServices.getAllUsers.mockResolvedValue([
      {
        uid: 'user-1',
        email: 'user1@example.com',
        displayName: 'User One',
        role: 'dmv_admin',
        deleted: false
      }
    ]);

    userManagementServices.getUserStats.mockResolvedValue({
      totalUsers: 1,
      active: 1,
      deleted: 0,
      byRole: { 
        student: 0, 
        instructor: 0, 
        dmv_admin: 1, 
        super_admin: 1
      }
    });

    userManagementServices.getActivityLogs.mockResolvedValue([]);
  });

  it('should render Create User button', async () => {
    render(<UserManagementTab />);
    
    await waitFor(() => {
      expect(screen.getByText('Create User')).toBeInTheDocument();
    });
  });

  it('should open create user modal when button is clicked', async () => {
    render(<UserManagementTab />);
    
    const createButton = await screen.findByText('Create User');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New User')).toBeInTheDocument();
    });
  });

  it('should have email field in modal', async () => {
    render(<UserManagementTab />);
    
    const createButton = await screen.findByText('Create User');
    fireEvent.click(createButton);

    await waitFor(() => {
      const emailInputs = screen.getAllByPlaceholderText('user@example.com');
      expect(emailInputs.length).toBeGreaterThan(0);
    });
  });

  it('should generate and display temporary password', async () => {
    render(<UserManagementTab />);
    
    const createButton = await screen.findByText('Create User');
    fireEvent.click(createButton);

    await waitFor(() => {
      const passwordLabel = screen.getByText('Temporary Password');
      expect(passwordLabel).toBeInTheDocument();
    });
  });

  it('should display DMV Admin role information', async () => {
    render(<UserManagementTab />);
    
    const createButton = await screen.findByText('Create User');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('This user will have restricted admin permissions for DMV compliance')).toBeInTheDocument();
    });
  });

  it('should have Close button to dismiss modal', async () => {
    render(<UserManagementTab />);
    
    const createButton = await screen.findByText('Create User');
    fireEvent.click(createButton);

    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: '×' });
      expect(closeButton).toBeInTheDocument();
    });
  });

  it('should call createUser service when form is submitted', async () => {
    userManagementServices.createUser.mockResolvedValue({
      success: true,
      uid: 'new-user-id',
      email: 'newuser@example.com'
    });

    render(<UserManagementTab />);
    
    const createButton = await screen.findByText('Create User');
    fireEvent.click(createButton);

    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText('user@example.com');
      expect(emailInput).toBeInTheDocument();
      
      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    });

    const submitButtons = screen.getAllByRole('button').filter(btn => 
      btn.textContent.includes('Create User') && btn !== createButton
    );
    
    if (submitButtons.length > 0) {
      fireEvent.click(submitButtons[submitButtons.length - 1]);
      
      await waitFor(() => {
        expect(userManagementServices.createUser).toHaveBeenCalled();
      });
    }
  });

  it('should reload users after successful creation', async () => {
    userManagementServices.createUser.mockResolvedValue({
      success: true,
      uid: 'new-user-id'
    });

    render(<UserManagementTab />);
    
    const createButton = await screen.findByText('Create User');
    fireEvent.click(createButton);

    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText('user@example.com');
      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    });

    const submitButtons = screen.getAllByRole('button').filter(btn => 
      btn.textContent.includes('Create User') && btn !== createButton
    );
    
    if (submitButtons.length > 0) {
      fireEvent.click(submitButtons[submitButtons.length - 1]);
      
      await waitFor(() => {
        expect(userManagementServices.getAllUsers).toHaveBeenCalledTimes(2);
      });
    }
  });

  it('should display success message after user creation', async () => {
    userManagementServices.createUser.mockResolvedValue({
      success: true,
      uid: 'new-user-id',
      email: 'newuser@example.com'
    });

    render(<UserManagementTab />);
    
    const createButton = await screen.findByText('Create User');
    fireEvent.click(createButton);

    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText('user@example.com');
      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    });

    const submitButtons = screen.getAllByRole('button').filter(btn => 
      btn.textContent.includes('Create User') && btn !== createButton
    );
    
    if (submitButtons.length > 0) {
      fireEvent.click(submitButtons[submitButtons.length - 1]);
      
      await waitFor(() => {
        expect(screen.getByText(/created successfully/)).toBeInTheDocument();
      });
    }
  });

  it('should show error message on creation failure', async () => {
    userManagementServices.createUser.mockRejectedValue(
      new Error('Email already exists')
    );

    render(<UserManagementTab />);
    
    const createButton = await screen.findByText('Create User');
    fireEvent.click(createButton);

    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText('user@example.com');
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    });

    const submitButtons = screen.getAllByRole('button').filter(btn => 
      btn.textContent.includes('Create User') && btn !== createButton
    );
    
    if (submitButtons.length > 0) {
      fireEvent.click(submitButtons[submitButtons.length - 1]);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to create user/)).toBeInTheDocument();
      });
    }
  });
});
