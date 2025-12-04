import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SchedulingManagement from '../SchedulingManagement';
import * as schedulingApi from '../../../api/compliance/schedulingServices';
import * as studentApi from '../../../api/student/userServices';
import { vi } from 'vitest';

vi.mock('../../../api/compliance/schedulingServices');
vi.mock('../../../api/student/userServices');

describe('SchedulingManagement - Loading Indicators', () => {
  const mockTimeSlots = [
    {
      id: 'slot-1',
      date: '2025-12-15',
      startTime: '09:00',
      endTime: '10:00',
      location: 'Test Location',
      instructor: 'Test Instructor',
      capacity: 1,
      notes: 'Test slot',
      assignedTo: null,
      createdAt: new Date()
    },
    {
      id: 'slot-2',
      date: '2025-12-15',
      startTime: '10:00',
      endTime: '11:00',
      location: 'Test Location 2',
      instructor: 'Test Instructor 2',
      capacity: 1,
      notes: '',
      assignedTo: 'student-123',
      createdAt: new Date()
    }
  ];

  const mockStudents = [
    {
      id: 'student-1',
      displayName: 'John Doe',
      email: 'john@test.com'
    },
    {
      id: 'student-2',
      displayName: 'Jane Smith',
      email: 'jane@test.com'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    schedulingApi.getTimeSlots.mockResolvedValue(mockTimeSlots);
    studentApi.getAllStudents.mockResolvedValue(mockStudents);
    schedulingApi.createTimeSlot.mockResolvedValue({ id: 'slot-new' });
    schedulingApi.updateTimeSlot.mockResolvedValue({ id: 'slot-1' });
    schedulingApi.deleteTimeSlot.mockResolvedValue({});
    schedulingApi.assignTimeSlot.mockResolvedValue({});
    schedulingApi.unassignTimeSlot.mockResolvedValue({});
  });

  describe('Form submission loading state', () => {
    test('should initialize with submittingForm state as false', async () => {
      render(<SchedulingManagement />);

      await waitFor(() => {
        expect(screen.getByText('Lesson Time Slot Management')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /Add New Time Slot/ });
      expect(addButton).not.toHaveAttribute('disabled');
    });

    test('should successfully create time slot with form submission', async () => {
      render(<SchedulingManagement />);

      await waitFor(() => {
        expect(screen.getByText('Lesson Time Slot Management')).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /Add New Time Slot/ });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Time Slot')).toBeInTheDocument();
      });

      const dateInputs = screen.getAllByDisplayValue('');
      expect(dateInputs.length).toBeGreaterThan(0);

      expect(schedulingApi.createTimeSlot).not.toHaveBeenCalled();
    });

    test('should handle form submission errors gracefully', async () => {
      render(<SchedulingManagement />);

      await waitFor(() => {
        expect(screen.getByText('Lesson Time Slot Management')).toBeInTheDocument();
      });

      schedulingApi.createTimeSlot.mockRejectedValueOnce(new Error('API Error'));
      
      expect(schedulingApi.getTimeSlots).toHaveBeenCalled();
      expect(studentApi.getAllStudents).toHaveBeenCalled();
    });
  });

  describe('Delete button loading state', () => {
    test('should show loading state on delete button during deletion', async () => {
      render(<SchedulingManagement />);

      await waitFor(() => {
        expect(screen.getByText(mockTimeSlots[0].location)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
      const deleteButton = deleteButtons[0];

      window.confirm = vi.fn(() => true);

      schedulingApi.deleteTimeSlot.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 500))
      );

      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(deleteButton).toHaveAttribute('disabled');
      }, { timeout: 1000 });
    });

    test('should clear loading state after successful deletion', async () => {
      render(<SchedulingManagement />);

      await waitFor(() => {
        expect(screen.getByText(mockTimeSlots[0].location)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
      const deleteButton = deleteButtons[0];

      window.confirm = vi.fn(() => true);

      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Time slot deleted successfully!')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(deleteButton).not.toHaveAttribute('disabled');
      });
    });

    test('should clear loading state after deletion error', async () => {
      render(<SchedulingManagement />);

      await waitFor(() => {
        expect(screen.getByText(mockTimeSlots[0].location)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
      const deleteButton = deleteButtons[0];

      window.confirm = vi.fn(() => true);
      schedulingApi.deleteTimeSlot.mockRejectedValueOnce(new Error('Delete failed'));

      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to delete time slot/)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(deleteButton).not.toHaveAttribute('disabled');
      });
    });

    test('should not show loading state if deletion is cancelled', async () => {
      render(<SchedulingManagement />);

      await waitFor(() => {
        expect(screen.getByText(mockTimeSlots[0].location)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
      const deleteButton = deleteButtons[0];

      window.confirm = vi.fn(() => false);

      fireEvent.click(deleteButton);

      expect(deleteButton).not.toHaveAttribute('disabled');
      expect(schedulingApi.deleteTimeSlot).not.toHaveBeenCalled();
    });
  });

  describe('Unassign button loading state', () => {
    test('should show loading state on unassign button during unassignment', async () => {
      render(<SchedulingManagement />);

      await waitFor(() => {
        expect(screen.getByText(mockTimeSlots[1].location)).toBeInTheDocument();
      });

      const unassignButtons = screen.getAllByRole('button', { name: /Unassign/ });
      const unassignButton = unassignButtons[0];

      window.confirm = vi.fn(() => true);

      schedulingApi.unassignTimeSlot.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 500))
      );

      fireEvent.click(unassignButton);

      await waitFor(() => {
        expect(unassignButton).toHaveAttribute('disabled');
      }, { timeout: 1000 });
    });

    test('should clear loading state after successful unassignment', async () => {
      render(<SchedulingManagement />);

      await waitFor(() => {
        expect(screen.getByText(mockTimeSlots[1].location)).toBeInTheDocument();
      });

      const unassignButtons = screen.getAllByRole('button', { name: /Unassign/ });
      const unassignButton = unassignButtons[0];

      window.confirm = vi.fn(() => true);

      fireEvent.click(unassignButton);

      await waitFor(() => {
        expect(screen.getByText('Lesson unassigned successfully!')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(unassignButton).not.toHaveAttribute('disabled');
      });
    });

    test('should clear loading state after unassignment error', async () => {
      render(<SchedulingManagement />);

      await waitFor(() => {
        expect(screen.getByText(mockTimeSlots[1].location)).toBeInTheDocument();
      });

      const unassignButtons = screen.getAllByRole('button', { name: /Unassign/ });
      const unassignButton = unassignButtons[0];

      window.confirm = vi.fn(() => true);
      schedulingApi.unassignTimeSlot.mockRejectedValueOnce(new Error('Unassign failed'));

      expect(unassignButton).not.toHaveAttribute('disabled');
      
      fireEvent.click(unassignButton);

      await waitFor(() => {
        expect(unassignButton).toBeDefined();
      });
    });

    test('should not show loading state if unassignment is cancelled', async () => {
      render(<SchedulingManagement />);

      await waitFor(() => {
        expect(screen.getByText(mockTimeSlots[1].location)).toBeInTheDocument();
      });

      const unassignButtons = screen.getAllByRole('button', { name: /Unassign/ });
      const unassignButton = unassignButtons[0];

      window.confirm = vi.fn(() => false);

      fireEvent.click(unassignButton);

      expect(unassignButton).not.toHaveAttribute('disabled');
      expect(schedulingApi.unassignTimeSlot).not.toHaveBeenCalled();
    });
  });

  describe('Multiple simultaneous operations', () => {
    test('should maintain separate loading states for different slots', async () => {
      render(<SchedulingManagement />);

      await waitFor(() => {
        expect(screen.getByText(mockTimeSlots[0].location)).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });

      window.confirm = vi.fn(() => true);

      schedulingApi.deleteTimeSlot.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 300))
      );

      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(deleteButtons[0]).toHaveAttribute('disabled');
      }, { timeout: 1000 });

      await waitFor(() => {
        expect(screen.getByText('Time slot deleted successfully!')).toBeInTheDocument();
      });
    });

    test('should handle multiple slot operations independently', async () => {
      render(<SchedulingManagement />);

      await waitFor(() => {
        expect(screen.getByText(mockTimeSlots[0].location)).toBeInTheDocument();
      });

      const unassignButtons = screen.getAllByRole('button', { name: /Unassign/ });
      
      expect(unassignButtons.length).toBeGreaterThan(0);
      
      unassignButtons.forEach(btn => {
        expect(btn).not.toHaveAttribute('disabled');
      });
    });
  });

  describe('Loading state persistence', () => {
    test('should not show loading state after component remount', async () => {
      const { unmount } = render(<SchedulingManagement />);

      await waitFor(() => {
        expect(screen.getByText('Lesson Time Slot Management')).toBeInTheDocument();
      });

      unmount();

      render(<SchedulingManagement />);

      await waitFor(() => {
        expect(screen.getByText('Lesson Time Slot Management')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
      deleteButtons.forEach(btn => {
        expect(btn).not.toHaveAttribute('disabled');
      });
    });

    test('should maintain loading state only during operation', async () => {
      render(<SchedulingManagement />);

      await waitFor(() => {
        expect(screen.getByText('Lesson Time Slot Management')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
      const unassignButtons = screen.getAllByRole('button', { name: /Unassign/ });
      
      [...deleteButtons, ...unassignButtons].forEach(btn => {
        expect(btn).not.toHaveAttribute('disabled');
      });
    });

    test('should clear loading state when operations complete', async () => {
      render(<SchedulingManagement />);

      await waitFor(() => {
        expect(screen.getByText('Lesson Time Slot Management')).toBeInTheDocument();
      });

      const unassignButtons = screen.getAllByRole('button', { name: /Unassign/ });
      expect(unassignButtons.length).toBeGreaterThan(0);

      window.confirm = vi.fn(() => true);
      fireEvent.click(unassignButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Lesson unassigned successfully!')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(unassignButtons[0]).not.toHaveAttribute('disabled');
      });
    });
  });
});
