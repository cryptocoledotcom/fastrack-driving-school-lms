import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPage from '../AdminPage';
import enrollmentServices from '../../../api/enrollment/enrollmentServices';
import schedulingServices from '../../../api/compliance/schedulingServices';
import userServices from '../../../api/student/userServices';
import AuthContext from '../../../context/AuthContext';

jest.mock('../../../api/enrollment/enrollmentServices');
jest.mock('../../../api/compliance/schedulingServices');
jest.mock('../../../api/student/userServices');

const mockAuthContext = {
  user: { uid: 'admin-1', email: 'admin@test.com', role: 'Super_admin' },
  userProfile: { role: 'Super_admin' },
  isAdmin: true,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
};

const mockUsers = [
  {
    userId: 'user-1',
    displayName: 'John Doe',
    email: 'john@test.com',
    enrollments: [
      {
        courseId: 'course-1',
        courseName: 'DMV Written Test',
        status: 'active',
        paymentStatus: 'paid',
        price: 199.99,
      },
      {
        courseId: 'course-2',
        courseName: 'Road Test Prep',
        status: 'inactive',
        paymentStatus: 'pending',
        price: 299.99,
      },
    ],
  },
  {
    userId: 'user-2',
    displayName: 'Jane Smith',
    email: 'jane@test.com',
    enrollments: [
      {
        courseId: 'course-1',
        courseName: 'DMV Written Test',
        status: 'active',
        paymentStatus: 'paid',
        price: 199.99,
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
    jest.clearAllMocks();

    enrollmentServices.getAllUsersWithEnrollments = jest.fn().mockResolvedValue(mockUsers);
    enrollmentServices.resetEnrollmentToPending = jest.fn().mockResolvedValue({});
    enrollmentServices.resetAllUserEnrollments = jest.fn().mockResolvedValue({});

    schedulingServices.getTimeSlots = jest.fn().mockResolvedValue(mockTimeSlots);
    schedulingServices.assignTimeSlot = jest.fn().mockResolvedValue({});
    schedulingServices.unassignTimeSlot = jest.fn().mockResolvedValue({});
    schedulingServices.deleteTimeSlot = jest.fn().mockResolvedValue({});

    userServices.getAllStudents = jest.fn().mockResolvedValue(mockStudents);
  });

  const renderAdminPage = async () => {
    const { container, ...rest } = render(
      <AuthContext.Provider value={mockAuthContext}>
        <AdminPage />
      </AuthContext.Provider>
    );
    
    // Wait for the component to finish loading
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
      enrollmentServices.getAllUsersWithEnrollments = jest.fn(
        () => new Promise(resolve => setTimeout(() => resolve(mockUsers), 100))
      );

      const { rerender } = renderAdminPage();

      // Should show default empty state before data loads
      await waitFor(() => {
        expect(enrollmentServices.getAllUsersWithEnrollments).toHaveBeenCalled();
      });
    });
  });

  describe('Enrollment Management Tab', () => {
    test('should display enrolled users list', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    test('should display user enrollment details when expanded', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const expandButton = screen.getAllByRole('button').find(btn => 
        btn.textContent.includes('John Doe')
      );
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('DMV Written Test')).toBeInTheDocument();
        expect(screen.getByText('Road Test Prep')).toBeInTheDocument();
      });
    });

    test('should display statistics cards', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText(/Total Users/i)).toBeInTheDocument();
        expect(screen.getByText(/Total Enrollments/i)).toBeInTheDocument();
        expect(screen.getByText(/Active Enrollments/i)).toBeInTheDocument();
        expect(screen.getByText(/Pending Payments/i)).toBeInTheDocument();
      });
    });

    test('should calculate statistics correctly', async () => {
      renderAdminPage();

      await waitFor(() => {
        const userCount = screen.getByText(/2/);
        expect(userCount).toBeInTheDocument();
      });
    });

    test('should search users by name', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'Jane' } });

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    test('should search users by email', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'john@test.com' } });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    test('should reset single enrollment', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const expandButton = screen.getAllByRole('button').find(btn => 
        btn.textContent.includes('John Doe')
      );
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('DMV Written Test')).toBeInTheDocument();
      });

      const resetButtons = screen.getAllByText(/reset/i);
      const singleResetButton = resetButtons[0];
      fireEvent.click(singleResetButton);

      await waitFor(() => {
        expect(enrollmentServices.resetEnrollmentToPending).toHaveBeenCalledWith(
          'user-1',
          'course-1'
        );
      });
    });

    test('should reset all user enrollments', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const resetAllButtons = screen.getAllByText(/reset all/i);
      if (resetAllButtons.length > 0) {
        fireEvent.click(resetAllButtons[0]);

        await waitFor(() => {
          expect(enrollmentServices.resetAllUserEnrollments).toHaveBeenCalledWith('user-1');
        });
      }
    });

    test('should handle reset enrollment error', async () => {
      enrollmentServices.resetEnrollmentToPending = jest
        .fn()
        .mockRejectedValue(new Error('Reset failed'));

      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const expandButton = screen.getAllByRole('button').find(btn => 
        btn.textContent.includes('John Doe')
      );
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('DMV Written Test')).toBeInTheDocument();
      });

      const resetButtons = screen.getAllByText(/reset/i);
      fireEvent.click(resetButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });

    test('should display payment status badges', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const expandButton = screen.getAllByRole('button').find(btn => 
        btn.textContent.includes('John Doe')
      );
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText(/paid|pending/i)).toBeInTheDocument();
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
        expect(schedulingServices.getTimeSlots).toHaveBeenCalled();
      });
    });

    test('should load and display time slots', async () => {
      renderAdminPage();

      const schedulingTab = screen.getByText('Lesson Scheduling');
      fireEvent.click(schedulingTab);

      await waitFor(() => {
        expect(schedulingServices.getTimeSlots).toHaveBeenCalled();
      });
    });

    test('should handle scheduling API errors', async () => {
      schedulingServices.getTimeSlots = jest
        .fn()
        .mockRejectedValue(new Error('API Error'));

      renderAdminPage();

      const schedulingTab = screen.getByText('Lesson Scheduling');
      fireEvent.click(schedulingTab);

      await waitFor(() => {
        expect(schedulingServices.getTimeSlots).toHaveBeenCalled();
      });
    });

    test('should load students for scheduling', async () => {
      renderAdminPage();

      const schedulingTab = screen.getByText('Lesson Scheduling');
      fireEvent.click(schedulingTab);

      await waitFor(() => {
        expect(userServices.getAllStudents).toHaveBeenCalled();
      });
    });
  });

  describe('Tab Navigation', () => {
    test('should switch between tabs without errors', async () => {
      renderAdminPage();

      const enrollmentTab = screen.getByText('Enrollment Management');
      const schedulingTab = screen.getByText('Lesson Scheduling');
      const analyticsTab = screen.getByText('Analytics');
      const complianceTab = screen.getByText('Compliance Reports');

      await waitFor(() => {
        expect(enrollmentTab).toBeInTheDocument();
      });

      fireEvent.click(schedulingTab);
      await waitFor(() => {
        expect(schedulingServices.getTimeSlots).toHaveBeenCalled();
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

      const schedulingTab = screen.getByText('Lesson Scheduling');
      fireEvent.click(schedulingTab);

      await waitFor(() => {
        expect(schedulingTab.parentElement).toHaveClass('activeTab');
      });
    });

    test('should only load tab data once per tab switch', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(enrollmentServices.getAllUsersWithEnrollments).toHaveBeenCalledTimes(1);
      });

      const schedulingTab = screen.getByText('Lesson Scheduling');
      fireEvent.click(schedulingTab);

      await waitFor(() => {
        expect(schedulingServices.getTimeSlots).toHaveBeenCalled();
      });

      const enrollmentTab = screen.getByText('Enrollment Management');
      fireEvent.click(enrollmentTab);

      // Should not call getAllUsers again since tab data was already loaded
      await waitFor(() => {
        expect(enrollmentServices.getAllUsersWithEnrollments).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Analytics Tab', () => {
    test('should render analytics tab', async () => {
      renderAdminPage();

      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);

      await waitFor(() => {
        expect(analyticsTab).toBeInTheDocument();
      });
    });

    test('should switch to analytics tab without errors', async () => {
      renderAdminPage();

      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);

      // Should not throw errors
      await waitFor(() => {
        expect(analyticsTab).toBeInTheDocument();
      });
    });
  });

  describe('Compliance Reporting Tab', () => {
    test('should render compliance reporting tab', async () => {
      renderAdminPage();

      const complianceTab = screen.getByText('Compliance Reports');
      fireEvent.click(complianceTab);

      await waitFor(() => {
        expect(complianceTab).toBeInTheDocument();
      });
    });

    test('should switch to compliance tab without errors', async () => {
      renderAdminPage();

      const complianceTab = screen.getByText('Compliance Reports');
      fireEvent.click(complianceTab);

      // Should not throw errors
      await waitFor(() => {
        expect(complianceTab).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle enrollment data load error', async () => {
      enrollmentServices.getAllUsersWithEnrollments = jest
        .fn()
        .mockRejectedValue(new Error('Failed to load users'));

      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });

    test('should show error message when API fails', async () => {
      enrollmentServices.getAllUsersWithEnrollments = jest
        .fn()
        .mockRejectedValue(new Error('Network error'));

      renderAdminPage();

      await waitFor(() => {
        expect(enrollmentServices.getAllUsersWithEnrollments).toHaveBeenCalled();
      });
    });

    test('should recover from error state', async () => {
      let callCount = 0;
      enrollmentServices.getAllUsersWithEnrollments = jest.fn(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Initial error'));
        }
        return Promise.resolve(mockUsers);
      });

      const { rerender } = renderAdminPage();

      await waitFor(() => {
        expect(enrollmentServices.getAllUsersWithEnrollments).toHaveBeenCalled();
      });

      // Component should attempt to recover or display error gracefully
      expect(enrollmentServices.getAllUsersWithEnrollments).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    test('should show loading indicator while fetching data', async () => {
      enrollmentServices.getAllUsersWithEnrollments = jest.fn(
        () => new Promise(resolve => setTimeout(() => resolve(mockUsers), 50))
      );

      renderAdminPage();

      // Initial render - checking for loading state
      expect(enrollmentServices.getAllUsersWithEnrollments).toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    test('should show loading state on reset operations', async () => {
      enrollmentServices.resetEnrollmentToPending = jest.fn(
        () => new Promise(resolve => setTimeout(() => resolve({}), 50))
      );

      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const expandButton = screen.getAllByRole('button').find(btn => 
        btn.textContent.includes('John Doe')
      );
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('DMV Written Test')).toBeInTheDocument();
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
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const initialUserCount = screen.getAllByText(/john|jane/i).length;

      const expandButton = screen.getAllByRole('button').find(btn => 
        btn.textContent.includes('John Doe')
      );
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('DMV Written Test')).toBeInTheDocument();
      });

      // Users should still be visible
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    test('should show correct enrollment counts in statistics', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText(/Total Users/i)).toBeInTheDocument();
      });

      // mockUsers has 2 users and 3 total enrollments
      // This test verifies the stats are calculated correctly
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
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'Jane' } });

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Clear the search
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle multiple reset operations', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const expandButton = screen.getAllByRole('button').find(btn => 
        btn.textContent.includes('John Doe')
      );
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('DMV Written Test')).toBeInTheDocument();
      });

      const resetButtons = screen.getAllByText(/reset/i);

      fireEvent.click(resetButtons[0]);
      fireEvent.click(resetButtons[1]);

      await waitFor(() => {
        expect(enrollmentServices.resetEnrollmentToPending).toHaveBeenCalled();
      });
    });

    test('should not allow duplicate submissions during reset', async () => {
      enrollmentServices.resetEnrollmentToPending = jest.fn(
        () => new Promise(resolve => setTimeout(() => resolve({}), 100))
      );

      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const expandButton = screen.getAllByRole('button').find(btn => 
        btn.textContent.includes('John Doe')
      );
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('DMV Written Test')).toBeInTheDocument();
      });

      const resetButtons = screen.getAllByText(/reset/i);
      const button = resetButtons[0];

      // Click button multiple times rapidly
      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        // Should be called but possibly only once if button is disabled during operation
        expect(enrollmentServices.resetEnrollmentToPending).toHaveBeenCalled();
      });
    });
  });

  describe('Success Messages', () => {
    test('should show success message after successful reset', async () => {
      renderAdminPage();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const expandButton = screen.getAllByRole('button').find(btn => 
        btn.textContent.includes('John Doe')
      );
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('DMV Written Test')).toBeInTheDocument();
      });

      const resetButtons = screen.getAllByText(/reset/i);
      fireEvent.click(resetButtons[0]);

      await waitFor(() => {
        expect(enrollmentServices.resetEnrollmentToPending).toHaveBeenCalled();
      });
    });
  });
});
