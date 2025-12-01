import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SchedulingManagement from '../SchedulingManagement';
import * as schedulingServices from '../../../api/compliance/schedulingServices';
import * as userServices from '../../../api/student/userServices';

jest.mock('../../../api/compliance/schedulingServices');
jest.mock('../../../api/student/userServices');

describe('SchedulingManagement - Admin Assignment', () => {
  const mockSlot1 = {
    id: 'slot-1',
    date: '2024-12-15',
    startTime: '10:00',
    endTime: '11:00',
    location: 'Downtown Lot',
    instructor: 'John Doe',
    assignedTo: null,
    capacity: 1
  };

  const mockStudent1 = {
    id: 'student-1',
    email: 'alice@example.com',
    displayName: 'Alice'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    schedulingServices.getTimeSlots.mockResolvedValue([mockSlot1]);
    userServices.getAllStudents.mockResolvedValue([mockStudent1]);
  });

  it('should render the component', async () => {
    render(<SchedulingManagement />);

    await waitFor(() => {
      expect(
        screen.getByText(/lesson time slot management/i)
      ).toBeInTheDocument();
    });
  });

  it('should load and display time slots', async () => {
    render(<SchedulingManagement />);

    await waitFor(() => {
      expect(schedulingServices.getTimeSlots).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.queryByText(/downtown lot/i)).toBeInTheDocument();
    });
  });

  it('should load and display students', async () => {
    render(<SchedulingManagement />);

    await waitFor(() => {
      expect(userServices.getAllStudents).toHaveBeenCalled();
    });
  });

  it('should display available status for unassigned slots', async () => {
    render(<SchedulingManagement />);

    await waitFor(() => {
      const statuses = screen.queryAllByText(/available/i);
      expect(statuses.length).toBeGreaterThan(0);
    });
  });

  it('should show Assign Student button for unassigned slots', async () => {
    render(<SchedulingManagement />);

    await waitFor(() => {
      const buttons = screen.queryAllByText(/assign student/i);
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('should have Assign Student button clickable', async () => {
    render(<SchedulingManagement />);

    await waitFor(() => {
      const buttons = screen.queryAllByText(/assign student/i);
      expect(buttons.length).toBeGreaterThan(0);
      expect(buttons[0]).toBeEnabled();
    });
  });
});
