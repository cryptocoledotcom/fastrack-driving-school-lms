import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import AdminDashboard from '../AdminDashboard';
import { useDashboardStats } from '../../../hooks/admin/useDashboardStats';

// Mock the hook
vi.mock('../../../hooks/admin/useDashboardStats');

// Mock child widgets to test prop passing logic
vi.mock('../../../components/admin/dashboard/CertificatesWidget', () => ({
    default: ({ count, loading }) => (
        <div data-testid="certificates-widget">
            Count: {count}, Loading: {loading.toString()}
        </div>
    )
}));

vi.mock('../../../components/admin/dashboard/RevenueWidget', () => ({
    default: ({ amount, loading }) => (
        <div data-testid="revenue-widget">
            Amount: {amount}, Loading: {loading.toString()}
        </div>
    )
}));

vi.mock('../../../components/admin/dashboard/ActivityWidget', () => ({
    default: ({ activities, loading }) => (
        <div data-testid="activity-widget">
            Activities: {activities.length}, Loading: {loading.toString()}
        </div>
    )
}));

describe('AdminDashboard', () => {
    it('renders loading state from hook', () => {
        useDashboardStats.mockReturnValue({
            pendingCertificates: 0,
            monthlyRevenue: 0,
            recentActivity: [],
            loading: true,
            error: null
        });

        render(<AdminDashboard />);

        expect(screen.getByTestId('certificates-widget')).toHaveTextContent('Loading: true');
        expect(screen.getByTestId('revenue-widget')).toHaveTextContent('Loading: true');
        expect(screen.getByTestId('activity-widget')).toHaveTextContent('Loading: true');
    });

    it('renders error banner when hook returns error', () => {
        useDashboardStats.mockReturnValue({
            pendingCertificates: 0,
            monthlyRevenue: 0,
            recentActivity: [],
            loading: false,
            error: 'Test Error Message'
        });

        render(<AdminDashboard />);

        expect(screen.getByText('⚠️ Test Error Message')).toBeInTheDocument();
    });

    it('passes data correctly to widgets', () => {
        useDashboardStats.mockReturnValue({
            pendingCertificates: 5,
            monthlyRevenue: 10000,
            recentActivity: [{}, {}],
            loading: false,
            error: null
        });

        render(<AdminDashboard />);

        expect(screen.getByTestId('certificates-widget')).toHaveTextContent('Count: 5');
        expect(screen.getByTestId('revenue-widget')).toHaveTextContent('Amount: 10000');
        expect(screen.getByTestId('activity-widget')).toHaveTextContent('Activities: 2');

        expect(screen.queryByText(/⚠️/)).not.toBeInTheDocument();
    });
});
