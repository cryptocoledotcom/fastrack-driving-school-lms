import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import UpcomingLessons from '../UpcomingLessons';

import { getUserBookings, cancelBooking } from '@/api/compliance/schedulingServices';

// Mock dependencies
const mockUser = { uid: 'u1', email: 'test@test.com' };

vi.mock('@/context/AuthContext', () => ({
    useAuth: () => ({ user: mockUser }),
}));

// Use manual mock via alias
vi.mock('@/api/compliance/schedulingServices');

vi.mock('../common/Card/Card', () => ({
    default: ({ children, className }) => <div data-testid="card" className={className}>{children}</div>,
}));

vi.mock('../common/Button/Button', () => ({
    default: ({ children, onClick }) => <button onClick={onClick}>{children}</button>
}));

describe('UpcomingLessons', () => {
    const mockBookings = [
        {
            id: 'l1',
            slotId: 's1',
            date: '2025-12-25',
            startTime: '10:00',
            endTime: '12:00',
            location: 'Test Loc',
            instructor: 'Instructor A',
            status: 'scheduled'
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        getUserBookings.mockResolvedValue(mockBookings);
    });

    it('should render loading state initially', async () => {
        let resolvePromise;
        const promise = new Promise(r => { resolvePromise = r; });
        getUserBookings.mockReturnValue(promise);

        render(<UpcomingLessons />);
        expect(screen.getByText(/Loading/i)).toBeInTheDocument();

        resolvePromise([]);
        await waitFor(() => expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument());
    });

    it('should render upcoming lessons', async () => {
        render(<UpcomingLessons />);
        await waitFor(() => {
            expect(screen.getByText('Upcoming Lessons')).toBeInTheDocument();
        });
        expect(screen.getByText('Behind-the-Wheel Lesson')).toBeInTheDocument();
    });

    it('should handle cancellation', async () => {
        vi.spyOn(window, 'confirm').mockImplementation(() => true);
        cancelBooking.mockResolvedValue({});

        render(<UpcomingLessons onBookingsChange={vi.fn()} />);

        await waitFor(() => screen.getByText('Cancel Lesson'));
        fireEvent.click(screen.getByText('Cancel Lesson'));

        await waitFor(() => {
            expect(cancelBooking).toHaveBeenCalledWith('u1', 'l1', 's1');
        });
    });
});
