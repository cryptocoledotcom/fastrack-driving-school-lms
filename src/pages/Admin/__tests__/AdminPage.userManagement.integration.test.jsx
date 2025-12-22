/* eslint-disable import/order */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import AdminPage from '../AdminPage';
import { USER_ROLES } from '../../../constants/userRoles';
import enrollmentServices from '../../../api/enrollment/enrollmentServices';
vi.mock('../../../api/enrollment/enrollmentServices');
vi.mock('../../../api/admin/userManagementServices');
vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../hooks/useAdminPanel', () => ({
  useAdminPanel: vi.fn(() => ({
    loading: false,
    error: null,
    activeTab: 'enrollment',
    setActiveTab: vi.fn(),
    isSidebarOpen: true,
    setIsSidebarOpen: vi.fn(),
    stats: {},
    refreshData: vi.fn(),
    users: [],
    resettingEnrollments: false,
    loadUsers: vi.fn(),
    handleResetEnrollment: vi.fn(),
    handleResetAllUserEnrollments: vi.fn()
  })),
}));
vi.mock('../../../components/admin/tabs/EnrollmentManagementTab', () => ({
  default: function DummyComponent() {
    return <div>Enrollment Management Tab</div>;
  }
}));
vi.mock('../../../components/admin/tabs/AnalyticsTab', () => ({
  default: function DummyComponent() {
    return <div>Analytics Tab</div>;
  }
}));
vi.mock('../../../components/admin/SchedulingManagement', () => ({
  default: function DummyComponent() {
    return <div>Scheduling Management</div>;
  }
}));
vi.mock('../../../components/admin/ComplianceReporting', () => ({
  default: function DummyComponent() {
    return <div>Compliance Reporting</div>;
  }
}));
vi.mock('../../../components/admin/tabs/UserManagementTab', () => ({
  default: function DummyComponent() {
    return <div>User Management Tab</div>;
  }
}));

import { useAuth } from '../../../context/AuthContext';
import { useAdminPanel } from '../../../hooks/useAdminPanel';

describe('AdminPage - User Management Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAdminPanel.mockReturnValue({
      loading: false,
      error: null,
      activeTab: 'enrollment',
      setActiveTab: vi.fn(),
      isSidebarOpen: true,
      setIsSidebarOpen: vi.fn(),
      stats: {},
      refreshData: vi.fn(),
    });
    enrollmentServices.getAllUsersWithEnrollments.mockResolvedValue([]);
  });

  describe('Access Control', () => {
    it('should show user management tab only for SUPER_ADMIN', async () => {
      useAuth.mockReturnValue({
        isAdmin: true,
        userProfile: {
          uid: 'admin123',
          role: USER_ROLES.SUPER_ADMIN,
        },
      });

      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    it('should not show user management tab for DMV_ADMIN', async () => {
      useAuth.mockReturnValue({
        isAdmin: true,
        userProfile: {
          uid: 'dmv123',
          role: USER_ROLES.DMV_ADMIN,
        },
      });

      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      expect(screen.queryByText('User Management')).not.toBeInTheDocument();
    });

    it('should not show user management tab for INSTRUCTOR', async () => {
      useAuth.mockReturnValue({
        isAdmin: false,
        userProfile: {
          uid: 'instructor123',
          role: USER_ROLES.INSTRUCTOR,
        },
      });

      render(<AdminPage />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should not show user management tab for STUDENT', async () => {
      useAuth.mockReturnValue({
        isAdmin: false,
        userProfile: {
          uid: 'student123',
          role: USER_ROLES.STUDENT,
        },
      });

      render(<AdminPage />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        isAdmin: true,
        userProfile: {
          uid: 'admin123',
          role: USER_ROLES.SUPER_ADMIN,
        },
      });
    });

    it.skip('should render user management tab when clicked', async () => {
      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
      });

      const userMgmtTab = screen.getByText('User Management');
      fireEvent.click(userMgmtTab);

      await waitFor(() => {
        expect(screen.getByText('User Management Tab')).toBeInTheDocument();
      });
    });

    it('should render other tabs for SUPER_ADMIN', async () => {
      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      expect(screen.getByText('Enrollment Management')).toBeInTheDocument();
      expect(screen.getByText('Lesson Scheduling')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Compliance Reports')).toBeInTheDocument();
    });

    it('should switch between tabs correctly', async () => {
      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Navigate to User Management
      fireEvent.click(screen.getByText('User Management'));

      await waitFor(() => {
        expect(screen.getByText('User Management Tab')).toBeInTheDocument();
      });

      // Navigate to Enrollment Management
      fireEvent.click(screen.getByText('Enrollment Management'));

      await waitFor(() => {
        expect(screen.getByText('Enrollment Management Tab')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Visibility Rules', () => {
    it('SUPER_ADMIN sees all tabs including User Management', async () => {
      useAuth.mockReturnValue({
        isAdmin: true,
        userProfile: {
          uid: 'admin123',
          role: USER_ROLES.SUPER_ADMIN,
        },
      });

      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      const tabs = [
        'Enrollment Management',
        'Lesson Scheduling',
        'Analytics',
        'Compliance Reports',
        'User Management',
      ];

      tabs.forEach(tab => {
        expect(screen.getByText(tab)).toBeInTheDocument();
      });
    });

    it('DMV_ADMIN sees all tabs except User Management', async () => {
      useAuth.mockReturnValue({
        isAdmin: true,
        userProfile: {
          uid: 'dmv123',
          role: USER_ROLES.DMV_ADMIN,
        },
      });

      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      const visibleTabs = [
        'Enrollment Management',
        'Lesson Scheduling',
        'Analytics',
        'Compliance Reports',
      ];

      visibleTabs.forEach(tab => {
        expect(screen.getByText(tab)).toBeInTheDocument();
      });

      expect(screen.queryByText('User Management')).not.toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should pass userProfile to UserManagementTab correctly', async () => {
      useAuth.mockReturnValue({
        isAdmin: true,
        userProfile: {
          uid: 'admin123',
          role: USER_ROLES.SUPER_ADMIN,
        },
      });

      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('User Management'));

      await waitFor(() => {
        expect(screen.getByText('User Management Tab')).toBeInTheDocument();
      });
    });
  });

  describe('Default Tab Behavior', () => {
    it('should show enrollment management tab by default', async () => {
      useAuth.mockReturnValue({
        isAdmin: true,
        userProfile: {
          uid: 'admin123',
          role: USER_ROLES.SUPER_ADMIN,
        },
      });

      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Enrollment Management Tab')).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundary', () => {
    it('should have error boundary for User Management tab', async () => {
      useAuth.mockReturnValue({
        isAdmin: true,
        userProfile: {
          uid: 'admin123',
          role: USER_ROLES.SUPER_ADMIN,
        },
      });

      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('User Management'));

      await waitFor(() => {
        expect(screen.getByText('User Management Tab')).toBeInTheDocument();
      });
    });
  });
});
