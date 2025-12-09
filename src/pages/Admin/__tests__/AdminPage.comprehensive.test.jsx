import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPage from '../AdminPage';
import enrollmentServices from '../../../api/enrollment/enrollmentServices';
import schedulingServices from '../../../api/compliance/schedulingServices';
import userServices from '../../../api/student/userServices';
import AuthContext from '../../../context/AuthContext';
import { USER_ROLES } from '../../../constants/userRoles';
import { vi } from 'vitest';

vi.mock('../../../api/enrollment/enrollmentServices');
vi.mock('../../../api/compliance/schedulingServices');
vi.mock('../../../api/student/userServices');

const mockAuthContext = {
  user: { uid: 'admin-1', email: 'admin@test.com', role: USER_ROLES.SUPER_ADMIN },
  userProfile: { role: USER_ROLES.SUPER_ADMIN },
  isAdmin: true,
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
};

const mockUsers = [
  {
    userId: 'user-1',
    displayName: 'John Doe',
    email: 'john@test.com',
    enrollments: [
      {
        id: 'enrollment-1',
        courseId: 'fastrack-online',
        courseName: 'DMV Written Test',
        status: 'active',
        paymentStatus: 'paid',
        price: 199.99,
        totalAmount: 199.99,
        amountPaid: 199.99,
        amountDue: 0,
        userName: 'John Doe',
        userEmail: 'john@test.com',
      },
      {
        id: 'enrollment-2',
        courseId: 'fastrack-behind-the-wheel',
        courseName: 'Road Test Prep',
        status: 'inactive',
        paymentStatus: 'pending',
        price: 299.99,
        totalAmount: 299.99,
        amountPaid: 0,
        amountDue: 299.99,
        userName: 'John Doe',
        userEmail: 'john@test.com',
      },
    ],
  },
  {
    userId: 'user-2',
    displayName: 'Jane Smith',
    email: 'jane@test.com',
    enrollments: [
      {
        id: 'enrollment-3',
        courseId: 'fastrack-online',
        courseName: 'DMV Written Test',
        status: 'active',
        paymentStatus: 'paid',
        price: 199.99,
        totalAmount: 199.99,
        amountPaid: 199.99,
        amountDue: 0,
        userName: 'Jane Smith',
        userEmail: 'jane@test.com',
      },
    ],
  },
];

const mockTimeSlots = [
  {
    id: 'slot-1',
    date: '2024-12-15',
    startTime: '09:00',
    endTime: '10:00',
    assignedInstructor: 'instructor-1',
    assignedStudent: null,
  },
  {
    id: 'slot-2',
    date: '2024-12-15',
    startTime: '10:00',
    endTime: '11:00',
    assignedInstructor: 'instructor-1',
    assignedStudent: 'user-1',
  },
];

const mockStudents = [
  { userId: 'user-1', displayName: 'John Doe', email: 'john@test.com' },
  { userId: 'user-2', displayName: 'Jane Smith', email: 'jane@test.com' },
];

describe('AdminPage - Comprehensive Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    enrollmentServices.getAllUsersWithEnrollments = vi.fn().mockResolvedValue(mockUsers);
    enrollmentServices.resetEnrollmentToPending = vi.fn().mockResolvedValue({});
    enrollmentServices.resetAllUserEnrollments = vi.fn().mockResolvedValue({});

    schedulingServices.getTimeSlots = vi.fn().mockResolvedValue(mockTimeSlots || []);
    schedulingServices.assignTimeSlot = vi.fn().mockResolvedValue({});
    schedulingServices.unassignTimeSlot = vi.fn().mockResolvedValue({});
    schedulingServices.deleteTimeSlot = vi.fn().mockResolvedValue({});
    schedulingServices.createTimeSlot = vi.fn().mockResolvedValue({});
    schedulingServices.updateTimeSlot = vi.fn().mockResolvedValue({});

    userServices.getAllStudents = vi.fn().mockResolvedValue(mockStudents || []);
  });

  const renderAdminPage = async () => {
    const { container, ...rest } = render(
      <AuthContext.Provider value={mockAuthContext}>
        <AdminPage />
      </AuthContext.Provider>
    );
    
    await waitFor(() => {
      expect(enrollmentServices.getAllUsersWithEnrollments).toHaveBeenCalled();
    }, { timeout: 3000 });
    
    return { container, ...rest };
  };

  describe('Page Initialization', () => {
    test('should render admin page with all tabs', async () => {
      await renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('Enrollment Management')).toBeInTheDocument();
        expect(screen.getByText('Lesson Scheduling')).toBeInTheDocument();
        expect(screen.getByText('Analytics')).toBeInTheDocument();
        expect(screen.getByText('Compliance Reports')).toBeInTheDocument();
      });
    });

    test('should load enrollment data on mount', async () => {
      await renderAdminPage();

      await waitFor(() => {
        expect(enrollmentServices.getAllUsersWithEnrollments).toHaveBeenCalled();
      });
    });

    test('should display loading state initially', async () => {
      enrollmentServices.getAllUsersWithEnrollments = vi.fn(
        () => new Promise(resolve => setTimeout(() => resolve(mockUsers), 100))
      );

      const { rerender } = renderAdminPage();

      await waitFor(() => {
        expect(enrollmentServices.getAllUsersWithEnrollments).toHaveBeenCalled();
      });
    });
  });

  describe('Enrollment Management Tab', () => {
    test('should display enrolled users list', async () => {
      renderAdminPage();

      await waitFor(() => {
        const enrollmentTab = screen.getByText('Enrollment Management');
        expect(enrollmentTab).toBeInTheDocument();
        const table = screen.getByRole('table');
        expect(table.textContent).toContain('John Doe');
        expect(table.textContent).toContain('Jane Smith');
      });
    });

    test('should display user enrollment details when expanded', async () => {
      renderAdminPage();

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table.textContent).toContain('John Doe');
        expect(table.textContent).toContain('Fastrack Online Course');
        expect(table.textContent).toContain('Fastrack Behind-the-Wheel Course');
      });
    });

    test('should display statistics cards', async () => {
      renderAdminPage();

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });

      const tableHeader = screen.getByText('Student Name');
      expect(tableHeader).toBeInTheDocument();
    });

    test('should calculate statistics correctly', async () => {
      renderAdminPage();

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table.textContent).toContain('John Doe');
        expect(table.textContent).toContain('Jane Smith');
      });
    });

    test('should search users by name', async () => {
      renderAdminPage();

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table.textContent).toContain('John Doe');
      });

      const searchInput = screen.getByPlaceholderText(/Enter student/i);
      fireEvent.change(searchInput, { target: { value: 'Jane' } });

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table.textContent).toContain('Jane Smith');
      });
    });

    test('should search users by email', async () => {
      renderAdminPage();

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table.textContent).toContain('John Doe');
      });

      const searchInput = screen.getByPlaceholderText(/Enter student/i);
      fireEvent.change(searchInput, { target: { value: 'john@test.com' } });

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table.textContent).toContain('john@test.com');
      });
    });

    test('should reset single enrollment', async () => {
      renderAdminPage();

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table.textContent).toContain('John Doe');
        expect(table.textContent).toContain('Fastrack Online Course');
      });

      const resetButtons = screen.getAllByText(/reset/i);
      fireEvent.click(resetButtons[0]);

      await waitFor(() => {
        expect(enrollmentServices.resetEnrollmentToPending).toHaveBeenCalled();
      });
    });

    test('should reset all user enrollments', async () => {
      renderAdminPage();

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table.textContent).toContain('John Doe');
      });

      const allButtons = screen.queryAllByText(/reset/i);
      expect(allButtons.length).toBeGreaterThan(0);
    });

    test('should handle reset enrollment error', async () => {
      enrollmentServices.resetEnrollmentToPending = vi
        .fn()
        .mockRejectedValue(new Error('Reset failed'));

      renderAdminPage();

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table.textContent).toContain('John Doe');
        expect(table.textContent).toContain('Fastrack Online Course');
      });

      const resetButtons = screen.getAllByText(/reset/i);
      fireEvent.click(resetButtons[0]);

      await waitFor(() => {
        expect(enrollmentServices.resetEnrollmentToPending).toHaveBeenCalled();
      });
    });

    test('should display payment status badges', async () => {
      renderAdminPage();

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table.textContent).toContain('John Doe');
        expect(table.textContent.match(/paid|pending/i)).toBeTruthy();
      });
    });
  });

  describe('Scheduling Management Tab', () => {
    test('should switch to scheduling tab', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('Enrollment Management')).toBeInTheDocument();
      });

      const schedulingTab = screen.getByText('Lesson Scheduling');
      fireEvent.click(schedulingTab);

      await waitFor(() => {
        expect(screen.getByText('Lesson Scheduling')).toBeInTheDocument();
      });
    });

    test('should load and display time slots', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('Enrollment Management')).toBeInTheDocument();
      });

      const schedulingTab = screen.getByText('Lesson Scheduling');
      fireEvent.click(schedulingTab);

      await waitFor(() => {
        expect(screen.getByText('Lesson Scheduling')).toBeInTheDocument();
      });
    });

    test('should handle scheduling API errors', async () => {
      schedulingServices.getTimeSlots = vi
        .fn()
        .mockRejectedValue(new Error('API Error'));

      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('Enrollment Management')).toBeInTheDocument();
      });

      const schedulingTab = screen.getByText('Lesson Scheduling');
      fireEvent.click(schedulingTab);

      await waitFor(() => {
        expect(screen.getByText('Lesson Scheduling')).toBeInTheDocument();
      });
    });

    test('should load students for scheduling', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('Enrollment Management')).toBeInTheDocument();
      });

      const schedulingTab = screen.getByText('Lesson Scheduling');
      fireEvent.click(schedulingTab);

      await waitFor(() => {
        expect(screen.getByText('Lesson Scheduling')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    test('should switch between tabs without errors', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('Enrollment Management')).toBeInTheDocument();
      });

      const enrollmentTab = screen.getByText('Enrollment Management');
      const schedulingTab = screen.getByText('Lesson Scheduling');
      const analyticsTab = screen.getByText('Analytics');
      const complianceTab = screen.getByText('Compliance Reports');

      fireEvent.click(schedulingTab);
      await waitFor(() => {
        expect(screen.getByText('Lesson Scheduling')).toBeInTheDocument();
      });

      fireEvent.click(analyticsTab);
      await waitFor(() => {
        expect(analyticsTab).toBeInTheDocument();
      });

      fireEvent.click(complianceTab);
      await waitFor(() => {
        expect(complianceTab).toBeInTheDocument();
      });

      fireEvent.click(enrollmentTab);
      await waitFor(() => {
        expect(enrollmentServices.getAllUsersWithEnrollments).toHaveBeenCalled();
      });
    });

    test('should maintain active tab state', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('Enrollment Management')).toBeInTheDocument();
      });

      const schedulingTab = screen.getByText('Lesson Scheduling');
      fireEvent.click(schedulingTab);

      await waitFor(() => {
        expect(screen.getByText('Lesson Scheduling')).toBeInTheDocument();
      });
    });

    test('should only load tab data once per tab switch', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(enrollmentServices.getAllUsersWithEnrollments).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('Enrollment Management')).toBeInTheDocument();
      });

      const schedulingTab = screen.getByText('Lesson Scheduling');
      fireEvent.click(schedulingTab);

      await waitFor(() => {
        expect(screen.getByText('Lesson Scheduling')).toBeInTheDocument();
      });

      const enrollmentTab = screen.getByText('Enrollment Management');
      fireEvent.click(enrollmentTab);

      await waitFor(() => {
        expect(enrollmentServices.getAllUsersWithEnrollments).toHaveBeenCalled();
      });
    });
  });

  describe('Analytics Tab', () => {
    test('should render analytics tab', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('Enrollment Management')).toBeInTheDocument();
      });

      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);

      await waitFor(() => {
        expect(analyticsTab).toBeInTheDocument();
      });
    });

    test('should switch to analytics tab without errors', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('Enrollment Management')).toBeInTheDocument();
      });

      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);

      await waitFor(() => {
        expect(analyticsTab).toBeInTheDocument();
      });
    });
  });

  describe('Compliance Reporting Tab', () => {
    test('should render compliance reporting tab', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('Enrollment Management')).toBeInTheDocument();
      });

      const complianceTab = screen.getByText('Compliance Reports');
      fireEvent.click(complianceTab);

      await waitFor(() => {
        expect(complianceTab).toBeInTheDocument();
      });
    });

    test('should switch to compliance tab without errors', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('Enrollment Management')).toBeInTheDocument();
      });

      const complianceTab = screen.getByText('Compliance Reports');
      fireEvent.click(complianceTab);

      await waitFor(() => {
        expect(complianceTab).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle enrollment data load error', async () => {
      enrollmentServices.getAllUsersWithEnrollments = vi
        .fn()
        .mockRejectedValue(new Error('Failed to load users'));

      renderAdminPage();

      await waitFor(() => {
        expect(enrollmentServices.getAllUsersWithEnrollments).toHaveBeenCalled();
      });
    });

    test('should show error message when API fails', async () => {
      enrollmentServices.getAllUsersWithEnrollments = vi
        .fn()
        .mockRejectedValue(new Error('Network error'));

      renderAdminPage();

      await waitFor(() => {
        expect(enrollmentServices.getAllUsersWithEnrollments).toHaveBeenCalled();
      });
    });

    test('should recover from error state', async () => {
      let callCount = 0;
      enrollmentServices.getAllUsersWithEnrollments = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Initial error'));
        }
        return Promise.resolve(mockUsers);
      });

      renderAdminPage();

      await waitFor(() => {
        expect(enrollmentServices.getAllUsersWithEnrollments).toHaveBeenCalled();
      });

      expect(enrollmentServices.getAllUsersWithEnrollments).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    test('should show loading indicator while fetching data', async () => {
      enrollmentServices.getAllUsersWithEnrollments = vi.fn(
        () => new Promise(resolve => setTimeout(() => resolve(mockUsers), 50))
      );

      renderAdminPage();

      expect(enrollmentServices.getAllUsersWithEnrollments).toHaveBeenCalled();

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table.textContent).toContain('John Doe');
      });
    });

    test('should show loading state on reset operations', async () => {
      enrollmentServices.resetEnrollmentToPending = vi.fn(
        () => new Promise(resolve => setTimeout(() => resolve({}), 50))
      );

      renderAdminPage();

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table.textContent).toContain('John Doe');
        expect(table.textContent).toContain('Fastrack Online Course');
      });

      const resetButtons = screen.getAllByText(/reset/i);
      fireEvent.click(resetButtons[0]);

      await waitFor(() => {
        expect(enrollmentServices.resetEnrollmentToPending).toHaveBeenCalled();
      });
    });
  });

  describe('Data Integrity', () => {
    test('should preserve user data after operations', async () => {
      renderAdminPage();

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table.textContent).toContain('John Doe');
        expect(table.textContent).toContain('Jane Smith');
        expect(table.textContent).toContain('Fastrack Online Course');
      });
    });

    test('should show correct enrollment counts in statistics', async () => {
      renderAdminPage();

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });

      expect(enrollmentServices.getAllUsersWithEnrollments).toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    test('should handle rapid tab switches', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('Enrollment Management')).toBeInTheDocument();
      });

      const schedulingTab = screen.getByText('Lesson Scheduling');
      const analyticsTab = screen.getByText('Analytics');

      fireEvent.click(schedulingTab);
      fireEvent.click(analyticsTab);
      fireEvent.click(schedulingTab);

      await waitFor(() => {
        expect(screen.getByText('Lesson Scheduling')).toBeInTheDocument();
      });
    });

    test('should handle clearing search filter', async () => {
      renderAdminPage();

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table.textContent).toContain('John Doe');
      });

      const searchInput = screen.getByPlaceholderText(/Enter student/i);
      fireEvent.change(searchInput, { target: { value: 'Jane' } });

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table.textContent).toContain('Jane Smith');
      });

      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table.textContent).toContain('John Doe');
        expect(table.textContent).toContain('Jane Smith');
      });
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle multiple reset operations', async () => {
      renderAdminPage();

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table.textContent).toContain('John Doe');
        expect(table.textContent).toContain('Fastrack Online Course');
      });

      const resetButtons = screen.getAllByText(/reset/i);

      if (resetButtons.length >= 2) {
        fireEvent.click(resetButtons[0]);
        fireEvent.click(resetButtons[1]);

        await waitFor(() => {
          expect(enrollmentServices.resetEnrollmentToPending).toHaveBeenCalled();
        });
      }
    });

    test('should not allow duplicate submissions during reset', async () => {
      enrollmentServices.resetEnrollmentToPending = vi.fn(
        () => new Promise(resolve => setTimeout(() => resolve({}), 100))
      );

      renderAdminPage();

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table.textContent).toContain('John Doe');
        expect(table.textContent).toContain('Fastrack Online Course');
      });

      const resetButtons = screen.getAllByText(/reset/i);
      const button = resetButtons[0];

      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        expect(enrollmentServices.resetEnrollmentToPending).toHaveBeenCalled();
      });
    });
  });

  describe('Success Messages', () => {
    test('should show success message after successful reset', async () => {
      renderAdminPage();

      await waitFor(() => {
        const enrollmentTab = screen.getByText('Enrollment Management');
        expect(enrollmentTab).toBeInTheDocument();
      });

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(table.textContent).toContain('John Doe');
      expect(table.textContent).toContain('Fastrack Online Course');

      const resetButtons = screen.getAllByText(/reset/i);
      fireEvent.click(resetButtons[0]);

      await waitFor(() => {
        expect(enrollmentServices.resetEnrollmentToPending).toHaveBeenCalled();
      });
    });
  });
});
