import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserManagementTab from '../UserManagementTab';
import userManagementServices from '../../../../api/admin/userManagementServices';
import { USER_ROLES } from '../../../../constants/userRoles';

jest.mock('../../../../api/admin/userManagementServices');

const mockUserProfile = {
  uid: 'admin123',
  role: 'super_admin',
  displayName: 'Super Admin',
};

jest.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({
    userProfile: mockUserProfile,
  }),
}));

const mockUsers = [
  {
    uid: 'uid1',
    displayName: 'John Doe',
    email: 'john@test.com',
    role: USER_ROLES.STUDENT,
    deleted: false,
  },
  {
    uid: 'uid2',
    displayName: 'Jane Smith',
    email: 'jane@test.com',
    role: USER_ROLES.DMV_ADMIN,
    deleted: false,
  },
  {
    uid: 'uid3',
    displayName: 'Bob Johnson',
    email: 'bob@test.com',
    role: USER_ROLES.STUDENT,
    deleted: true,
  },
];

const mockStats = {
  totalUsers: 3,
  active: 2,
  deleted: 1,
  byRole: {
    [USER_ROLES.STUDENT]: 2,
    [USER_ROLES.INSTRUCTOR]: 0,
    [USER_ROLES.DMV_ADMIN]: 1,
    [USER_ROLES.SUPER_ADMIN]: 0,
  },
};

const mockActivityLogs = [
  {
    id: 'log1',
    type: 'ROLE_CHANGED',
    description: 'Role changed from student to dmv_admin',
    timestamp: { toDate: () => new Date() },
    targetUserId: 'uid1',
  },
  {
    id: 'log2',
    type: 'USER_DELETED',
    description: 'User account deleted',
    timestamp: { toDate: () => new Date() },
    targetUserId: 'uid3',
  },
];

describe('UserManagementTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    userManagementServices.getAllUsers.mockResolvedValue(mockUsers);
    userManagementServices.getUserStats.mockResolvedValue(mockStats);
    userManagementServices.getActivityLogs.mockResolvedValue(mockActivityLogs);
    userManagementServices.updateUserRole.mockResolvedValue({ success: true });
    userManagementServices.deleteUser.mockResolvedValue({ success: true });
    userManagementServices.restoreUser.mockResolvedValue({ success: true });
  });

  describe('Rendering', () => {
    it('should render component with title', async () => {
      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });
    });

    it('should display user statistics', async () => {
      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Active Users')).toBeInTheDocument();
        expect(screen.getByText('Students')).toBeInTheDocument();
        expect(screen.getByText('DMV Admins')).toBeInTheDocument();
      });
    });

    it('should render users table with all columns', async () => {
      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@test.com')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should show active status for non-deleted users', async () => {
      render(<UserManagementTab />);

      await waitFor(() => {
        const statusElements = screen.getAllByText('Active');
        expect(statusElements.length).toBeGreaterThan(0);
      });
    });

    it('should show deleted status for deleted users', async () => {
      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('Deleted')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter', () => {
    it('should filter users by name', async () => {
      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Enter name or email...');
      fireEvent.change(searchInput, { target: { value: 'Jane' } });

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    it('should filter users by email', async () => {
      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Enter name or email...');
      fireEvent.change(searchInput, { target: { value: 'bob@test.com' } });

      await waitFor(() => {
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });
    });

    it('should filter users by role', async () => {
      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const selects = screen.getAllByRole('combobox');
      const roleSelect = selects.find(s => s.querySelector('option[value="dmv_admin"]'));
      fireEvent.change(roleSelect, { target: { value: 'dmv_admin' } });

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });

    it('should clear search when input is emptied', async () => {
      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Enter name or email...');
      fireEvent.change(searchInput, { target: { value: 'Jane' } });

      await waitFor(() => {
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });

      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });

  describe('User Expansion and Role Change', () => {
    it('should expand user details on click', async () => {
      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const manageButtons = screen.getAllByText('Manage');
      fireEvent.click(manageButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Change Role')).toBeInTheDocument();
      });
    });

    it('should collapse user details on second click', async () => {
      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const manageButtons = screen.getAllByText('Manage');
      fireEvent.click(manageButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Change Role')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Collapse'));

      await waitFor(() => {
        expect(screen.queryByText('Change Role')).not.toBeInTheDocument();
      });
    });

    it('should change user role', async () => {
      userManagementServices.getAllUsers.mockResolvedValueOnce(mockUsers);

      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const manageButtons = screen.getAllByText('Manage');
      fireEvent.click(manageButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Change Role')).toBeInTheDocument();
      });

      const roleSelect = screen.getByDisplayValue('Student');
      fireEvent.change(roleSelect, { target: { value: USER_ROLES.DMV_ADMIN } });

      await waitFor(() => {
        expect(userManagementServices.updateUserRole).toHaveBeenCalledWith(
          'uid1',
          USER_ROLES.DMV_ADMIN,
          'admin123'
        );
      });
    });

    it('should show success message on role change', async () => {
      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const manageButtons = screen.getAllByText('Manage');
      fireEvent.click(manageButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Change Role')).toBeInTheDocument();
      });

      const roleSelect = screen.getByDisplayValue('Student');
      fireEvent.change(roleSelect, { target: { value: USER_ROLES.DMV_ADMIN } });

      await waitFor(() => {
        expect(screen.getByText(/User role changed to DMV Administrator/i)).toBeInTheDocument();
      });
    });

    it('should prevent changing own role', async () => {
      const adminUser = {
        ...mockUsers[0],
        uid: 'admin123',
        role: USER_ROLES.SUPER_ADMIN,
      };

      userManagementServices.getAllUsers.mockResolvedValue([adminUser]);

      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const manageButtons = screen.getAllByText('Manage');
      fireEvent.click(manageButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Change Role')).toBeInTheDocument();
      });

      const roleSelect = screen.getByDisplayValue('Super Administrator');
      fireEvent.change(roleSelect, { target: { value: USER_ROLES.DMV_ADMIN } });

      await waitFor(() => {
        expect(screen.getByText(/Cannot change your own role/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Deletion and Restoration', () => {
    it('should delete user with confirmation', async () => {
      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const manageButtons = screen.getAllByText('Manage');
      fireEvent.click(manageButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete User')).toBeInTheDocument();
      });

      window.confirm = jest.fn(() => true);
      fireEvent.click(screen.getByText('Delete User'));

      await waitFor(() => {
        expect(userManagementServices.deleteUser).toHaveBeenCalledWith('uid1', 'admin123');
      });
    });

    it('should not delete user on confirmation cancel', async () => {
      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const manageButtons = screen.getAllByText('Manage');
      fireEvent.click(manageButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete User')).toBeInTheDocument();
      });

      window.confirm = jest.fn(() => false);
      fireEvent.click(screen.getByText('Delete User'));

      await waitFor(() => {
        expect(userManagementServices.deleteUser).not.toHaveBeenCalled();
      });
    });

    it('should show restore button for deleted users', async () => {
      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });

      const manageButtons = screen.getAllByText('Manage');
      manageButtons.forEach((btn) => {
        if (btn.closest('[class*="tableRow"]')?.textContent?.includes('Bob Johnson')) {
          fireEvent.click(btn);
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Restore User')).toBeInTheDocument();
      });
    });

    it('should restore deleted user', async () => {
      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });

      const manageButtons = screen.getAllByText('Manage');
      manageButtons.forEach((btn) => {
        if (btn.closest('[class*="tableRow"]')?.textContent?.includes('Bob Johnson')) {
          fireEvent.click(btn);
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Restore User')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Restore User'));

      await waitFor(() => {
        expect(userManagementServices.restoreUser).toHaveBeenCalledWith('uid3', 'admin123');
      });
    });

    it('should prevent deleting own account', async () => {
      const adminUser = {
        ...mockUsers[0],
        uid: 'admin123',
        role: USER_ROLES.SUPER_ADMIN,
      };

      userManagementServices.getAllUsers.mockResolvedValue([adminUser]);

      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const manageButtons = screen.getAllByText('Manage');
      fireEvent.click(manageButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Delete User')).toBeInTheDocument();
      });

      window.confirm = jest.fn(() => true);
      fireEvent.click(screen.getByText('Delete User'));

      await waitFor(() => {
        expect(screen.getByText(/Cannot delete your own account/i)).toBeInTheDocument();
      });
    });
  });

  describe('Activity Logs', () => {
    it('should show activity logs when button is clicked', async () => {
      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      const viewLogsButton = screen.getByText('View Activity Logs');
      fireEvent.click(viewLogsButton);

      await waitFor(() => {
        expect(screen.getByText('Activity Logs')).toBeInTheDocument();
        expect(userManagementServices.getActivityLogs).toHaveBeenCalled();
      });
    });

    it('should display activity log entries', async () => {
      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      const viewLogsButton = screen.getByText('View Activity Logs');
      fireEvent.click(viewLogsButton);

      await waitFor(() => {
        expect(screen.getByText(/Role changed from student to dmv_admin/i)).toBeInTheDocument();
        expect(screen.getByText(/User account deleted/i)).toBeInTheDocument();
      });
    });

    it('should display activity log type badges', async () => {
      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      const viewLogsButton = screen.getByText('View Activity Logs');
      fireEvent.click(viewLogsButton);

      await waitFor(() => {
        expect(screen.getByText('ROLE_CHANGED')).toBeInTheDocument();
        expect(screen.getByText('USER_DELETED')).toBeInTheDocument();
      });
    });

    it('should hide logs when button is clicked again', async () => {
      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      const viewLogsButton = screen.getByText('View Activity Logs');
      fireEvent.click(viewLogsButton);

      await waitFor(() => {
        expect(screen.getByText('Activity Logs')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Hide Activity Logs'));

      await waitFor(() => {
        expect(screen.queryByText('Activity Logs')).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty message when no users match search', async () => {
      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Enter name or email...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent@test.com' } });

      await waitFor(() => {
        expect(screen.getByText('No users found.')).toBeInTheDocument();
      });
    });

    it('should show empty message when activity logs are empty', async () => {
      userManagementServices.getActivityLogs.mockResolvedValue([]);

      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      const viewLogsButton = screen.getByText('View Activity Logs');
      fireEvent.click(viewLogsButton);

      await waitFor(() => {
        expect(screen.getByText('No activity logs found.')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on load failure', async () => {
      const error = new Error('Load failed');
      userManagementServices.getAllUsers.mockRejectedValue(error);

      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load users/i)).toBeInTheDocument();
      });
    });

    it('should display error on role change failure', async () => {
      const error = new Error('Role change failed');
      userManagementServices.updateUserRole.mockRejectedValue(error);

      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const manageButtons = screen.getAllByText('Manage');
      fireEvent.click(manageButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Change Role')).toBeInTheDocument();
      });

      const roleSelect = screen.getByDisplayValue('Student');
      fireEvent.change(roleSelect, { target: { value: USER_ROLES.DMV_ADMIN } });

      await waitFor(() => {
        expect(screen.getByText(/Failed to change role/i)).toBeInTheDocument();
      });
    });

    it('should display error on activity logs load failure', async () => {
      const error = new Error('Logs load failed');
      userManagementServices.getActivityLogs.mockRejectedValue(error);

      render(<UserManagementTab />);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      const viewLogsButton = screen.getByText('View Activity Logs');
      fireEvent.click(viewLogsButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load activity logs/i)).toBeInTheDocument();
      });
    });
  });
});
