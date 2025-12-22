import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import EnrollmentManagementPage from '../EnrollmentManagementPage';
import { useAdminPanel } from '../../../hooks/useAdminPanel';

// Mock dependencies
vi.mock('../../../hooks/useAdminPanel');
vi.mock('../../../components/admin/tabs/EnrollmentManagementTab', () => ({
    default: (props) => (
        <div data-testid="mock-enrollment-tab">
            Enrollment Tab
            <span data-testid="user-count">{props.users?.length}</span>
        </div>
    )
}));
vi.mock('../../../components/common/LoadingSpinner/LoadingSpinner', () => ({
    default: ({ text }) => <div data-testid="loading-spinner">{text}</div>
}));

describe('EnrollmentManagementPage', () => {
    const mockLoadUsers = vi.fn();
    const mockResetEnrollment = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock return
        useAdminPanel.mockReturnValue({
            users: [],
            loading: false,
            resettingEnrollments: {},
            loadUsers: mockLoadUsers,
            handleResetEnrollment: mockResetEnrollment,
            handleResetAllUserEnrollments: vi.fn()
        });
    });

    it('renders loading state', () => {
        useAdminPanel.mockReturnValue({
            users: [],
            loading: true, // Set loading to true
            loadUsers: mockLoadUsers
        });

        render(<EnrollmentManagementPage />);
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        expect(screen.getByText('Loading enrollment data...')).toBeInTheDocument();
    });

    it('renders content when loaded and calls loadUsers', () => {
        render(<EnrollmentManagementPage />);

        expect(screen.getByTestId('mock-enrollment-tab')).toBeInTheDocument();
        expect(mockLoadUsers).toHaveBeenCalled();
    });

    it('passes data to tab component', () => {
        const mockUsers = [{ id: 1 }, { id: 2 }];
        useAdminPanel.mockReturnValue({
            users: mockUsers,
            loading: false,
            loadUsers: mockLoadUsers,
            handleResetEnrollment: mockResetEnrollment
        });

        render(<EnrollmentManagementPage />);
        expect(screen.getByTestId('user-count')).toHaveTextContent('2');
    });
});
