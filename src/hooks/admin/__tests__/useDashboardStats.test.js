import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDocs } from 'firebase/firestore';

import { useDashboardStats } from '../useDashboardStats';

// Mock Firebase dependencies
vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    getDocs: vi.fn(),
    Timestamp: {
        fromDate: (date) => date
    }
}));

vi.mock('../../config/firebase', () => ({
    db: {}
}));

describe('useDashboardStats', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initially returns loading state', () => {
        // Return a promise that never resolves indefinitely to test loading state? 
        // Or just check initial render
        getDocs.mockReturnValue(new Promise(() => { }));

        const { result } = renderHook(() => useDashboardStats());

        expect(result.current).toEqual({
            pendingCertificates: 0,
            monthlyRevenue: 0,
            recentActivity: [],
            loading: true,
            error: null
        });
    });

    it('fetches and calculates stats correctly on success', async () => {
        // Mock Data
        const mockCerts = {
            docs: [
                { data: () => ({ downloadCount: 0 }) }, // Pending
                { data: () => ({ downloadCount: 1 }) }, // Downloaded (should be ignored)
                { data: () => ({ downloadCount: 0 }) }  // Pending
            ]
        };

        const mockPayments = {
            docs: [
                { data: () => ({ amount: 5000 }) }, // $50.00
                { data: () => ({ amount: 2500 }) }  // $25.00
            ]
        };

        const mockActivity = {
            docs: [
                { id: '1', data: () => ({ action: 'USER_LOGIN', metadata: { email: 'user@test.com' }, timestamp: '2023-01-01' }) }
            ]
        };

        // Sequential mock returns for the 3 parallel calls
        // Note: Promise.all order in hook: certs, payments, activity
        getDocs
            .mockResolvedValueOnce(mockCerts)
            .mockResolvedValueOnce(mockPayments)
            .mockResolvedValueOnce(mockActivity);

        const { result } = renderHook(() => useDashboardStats());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current).toEqual({
            pendingCertificates: 2, // 2 pending
            monthlyRevenue: 7500,   // 5000 + 2500
            recentActivity: [{
                id: '1',
                action: 'USER_LOGIN',
                metadata: { email: 'user@test.com' },
                timestamp: '2023-01-01',
                userName: 'user@test.com'
            }],
            loading: false,
            error: null
        });
    });

    it('handles errors gracefully', async () => {
        const error = new Error('Network error');
        getDocs.mockRejectedValue(error);

        const { result } = renderHook(() => useDashboardStats());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe('Failed to load dashboard statistics');
        expect(result.current.loading).toBe(false);
    });
});
