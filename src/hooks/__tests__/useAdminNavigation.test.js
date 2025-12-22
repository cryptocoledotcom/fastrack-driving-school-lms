import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import useAdminNavigation from '../useAdminNavigation';
import { useAuth } from '../../context/AuthContext';
import { _ADMIN_SIDEBAR_ITEMS } from '../../config/adminRoutes';

vi.mock('../../context/AuthContext');

// Mock config if needed, or assume standard structure
vi.mock('../../config/adminRoutes', () => ({
    _ADMIN_SIDEBAR_ITEMS: [
        { path: '/admin/dashboard', label: 'Dashboard', requiredRoles: ['admin', 'super_admin'] },
        { path: '/admin/settings', label: 'Settings', requiredRoles: ['super_admin'] }
    ]
}));

describe('useAdminNavigation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns empty array when user has no role', () => {
        useAuth.mockReturnValue({ userProfile: {} });
        const { result } = renderHook(() => useAdminNavigation());
        expect(result.current).toEqual([]);
    });

    it('returns admin items for admin role', () => {
        useAuth.mockReturnValue({ userProfile: { role: 'admin' } });
        const { result } = renderHook(() => useAdminNavigation());

        expect(result.current).toHaveLength(1);
        expect(result.current[0].path).toBe('/admin/dashboard');
    });

    it('returns all items for super_admin role', () => {
        useAuth.mockReturnValue({ userProfile: { role: 'super_admin' } });
        const { result } = renderHook(() => useAdminNavigation());

        expect(result.current).toHaveLength(2);
    });
});
