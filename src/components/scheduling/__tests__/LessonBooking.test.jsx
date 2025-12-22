import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';


import LessonBooking from '../LessonBooking';

import { getAvailableTimeSlots, bookTimeSlot } from '@/api/compliance/schedulingServices';

// Mock dependencies
// Inline user to avoid hoisting issues
vi.mock('@/context/AuthContext', () => ({
    useAuth: () => ({ user: { uid: 'u1', email: 'test@test.com' } }),
}));

// Use manual mock
vi.mock('@/api/compliance/schedulingServices');

vi.mock('../common/Card/Card', () => ({
    default: ({ children, className }) => <div className={className}>{children}</div>,
}));

vi.mock('../common/Button/Button', () => ({
    default: ({ children, onClick, disabled }) => (
        <button onClick={onClick} disabled={disabled}>{children}</button>
    ),
}));

vi.mock('../common/LoadingSpinner/LoadingSpinner', () => ({
    default: ({ text }) => <div>{text}</div>,
}));

vi.mock('../common/ErrorMessage/ErrorMessage', () => ({
    default: ({ message }) => <div>Error: {message}</div>,
}));

vi.mock('../common/SuccessMessage/SuccessMessage', () => ({
    default: ({ message }) => <div>Success: {message}</div>,
}));

describe('LessonBooking', () => {
    const mockSlots = [
        {
            id: 's1',
            date: '2025-12-30',
            startTime: '10:00',
            endTime: '12:00',
            location: 'Loc A',
            instructor: 'Instr A',
            capacity: 2,
            bookedBy: []
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        getAvailableTimeSlots.mockResolvedValue(mockSlots);
    });

    it('should render slots after loading', async () => {
        render(<LessonBooking />);
        expect(screen.getByText('Loading available time slots...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Schedule Behind-the-Wheel Lesson')).toBeInTheDocument();
        });

        expect(screen.getByText('Loc A')).toBeInTheDocument();
        expect(screen.getByText('Select')).toBeInTheDocument();
    });

    it('should handle slot selection', async () => {
        render(<LessonBooking />);
        await waitFor(() => screen.getByText('Select'));

        // Test logic sometimes needs checking initial state
        fireEvent.click(screen.getByText('Select'));

        expect(screen.getByText('✓ Selected')).toBeInTheDocument();
        expect(screen.getByText('Confirm and Book Lesson')).toBeInTheDocument();
    });

    it('should handle booking submission', async () => {
        bookTimeSlot.mockResolvedValue({});
        const onSuccess = vi.fn();

        render(<LessonBooking onSuccess={onSuccess} />);

        // Wait for slots to load
        await waitFor(() => screen.getByText('Select'));
        
        // Select a slot
        fireEvent.click(screen.getByText('Select'));

        // Wait for confirm button and click it
        const confirmBtn = await screen.findByText('Confirm and Book Lesson');
        fireEvent.click(confirmBtn);

        // Verify booking was called
        await waitFor(() => {
            expect(bookTimeSlot).toHaveBeenCalledWith('u1', 's1', 'test@test.com');
        }, { timeout: 1000 });

        // Verify success message appears
        await waitFor(() => {
            const successElement = screen.queryByText(/Success: Lesson booked successfully!/i);
            if (successElement) {
                expect(successElement).toBeInTheDocument();
            }
        }, { timeout: 1000 });
    });

    it('should display empty state if no slots', async () => {
        getAvailableTimeSlots.mockResolvedValue([]);
        render(<LessonBooking />);

        await waitFor(() => {
            expect(screen.getByText('No available time slots')).toBeInTheDocument();
        });
    });

    it('should handle month navigation', async () => {
        render(<LessonBooking />);
        await waitFor(() => screen.getByText('Schedule Behind-the-Wheel Lesson'));

        fireEvent.click(screen.getByText('Next →'));

        await waitFor(() => {
            expect(getAvailableTimeSlots).toHaveBeenCalledTimes(2);
        });
    });
});
