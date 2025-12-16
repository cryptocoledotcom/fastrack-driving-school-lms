import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import EnrollmentCard from '../EnrollmentCard';

// Using mocks for constants to avoid potential module resolution issues with spaces in path
const PAYMENT_STATUS = {
    COMPLETED: 'completed',
    PARTIAL: 'partial',
    PENDING: 'pending'
};
const PROTECTED_ROUTES = {
    MY_COURSES: '/dashboard/my-courses'
};

vi.mock('../../../constants/courses', () => ({
    PAYMENT_STATUS: {
        COMPLETED: 'completed',
        PARTIAL: 'partial',
        PENDING: 'pending'
    },
    COURSE_IDS: {}
}));

vi.mock('../../../constants/routes', () => ({
    PROTECTED_ROUTES: {
        MY_COURSES: '/dashboard/my-courses'
    }
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

// Mock ProgressBar
vi.mock('../../common/ProgressBar/ProgressBar', () => ({
    default: ({ progress }) => <div data-testid="progress-bar">{progress}%</div>,
}));

vi.mock('../../common/Button/Button', () => ({
    default: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));

describe('EnrollmentCard', () => {
    const defaultProps = {
        course: {
            title: 'Test Course',
            description: 'Description',
            progress: 50,
        },
        enrollment: {
            paymentStatus: PAYMENT_STATUS.COMPLETED,
            totalAmount: 500,
            amountPaid: 500,
            amountDue: 0,
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render course details', () => {
        render(<EnrollmentCard {...defaultProps} />);
        expect(screen.getByText('Test Course')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Fully Paid')).toBeInTheDocument();
    });

    it('should show correct payment status badges', () => {
        const { rerender } = render(<EnrollmentCard {...defaultProps} />);
        expect(screen.getByText('Fully Paid')).toBeInTheDocument();

        const partialProps = { ...defaultProps, enrollment: { ...defaultProps.enrollment, paymentStatus: PAYMENT_STATUS.PARTIAL } };
        rerender(<EnrollmentCard {...partialProps} />);
        expect(screen.getByText('Partially Paid')).toBeInTheDocument();

        const pendingProps = { ...defaultProps, enrollment: { ...defaultProps.enrollment, paymentStatus: 'pending' } };
        rerender(<EnrollmentCard {...pendingProps} />);
        expect(screen.getByText('Payment Required')).toBeInTheDocument();
    });

    it('should display financial info', async () => {
        render(<EnrollmentCard {...defaultProps} />);
        expect(screen.getByText(/Total Amount:/i)).toBeInTheDocument();
        expect(screen.getAllByText(/\$500\.00/i)[0]).toBeInTheDocument();
    });

    it('should display progress', () => {
        render(<EnrollmentCard {...defaultProps} />);
        expect(screen.getByTestId('progress-bar')).toHaveTextContent(/50%/);
    });

    it('should navigate to My Courses on click', () => {
        render(<EnrollmentCard {...defaultProps} />);
        fireEvent.click(screen.getByText('My Courses'));
        expect(mockNavigate).toHaveBeenCalledWith(PROTECTED_ROUTES.MY_COURSES);
    });
});
