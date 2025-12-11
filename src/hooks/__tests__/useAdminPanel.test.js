import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAdminPanel } from '../useAdminPanel';
import { enrollmentServices } from '../../api/enrollment';

vi.mock('../../api/enrollment');

describe('useAdminPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock window.confirm
        global.confirm = vi.fn(() => true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('initializes with default state', () => {
        const { result } = renderHook(() => useAdminPanel());
        expect(result.current.loading).toBe(true);
        expect(result.current.users).toEqual([]);
    });

    it('loadUsers fetches data successfully', async () => {
        const mockUsers = [{ id: 1, name: 'Test' }];
        enrollmentServices.getAllUsersWithEnrollments.mockResolvedValue(mockUsers);

        const { result } = renderHook(() => useAdminPanel());

        await act(async () => {
            await result.current.loadUsers();
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.users).toEqual(mockUsers);
        expect(result.current.error).toBe('');
    });

    it('loadUsers handles errors', async () => {
        enrollmentServices.getAllUsersWithEnrollments.mockRejectedValue(new Error('Fetch failed'));

        const { result } = renderHook(() => useAdminPanel());

        await act(async () => {
            await result.current.loadUsers();
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.users).toEqual([]);
        expect(result.current.error).toContain('Failed to load users');
    });

    it('handleResetEnrollment calls service and reloads', async () => {
        enrollmentServices.resetEnrollmentToPending.mockResolvedValue(true);
        enrollmentServices.getAllUsersWithEnrollments.mockResolvedValue([]);

        const { result } = renderHook(() => useAdminPanel());

        await act(async () => {
            await result.current.handleResetEnrollment('user1', 'course1');
        });

        expect(enrollmentServices.resetEnrollmentToPending).toHaveBeenCalledWith('user1', 'course1');
        expect(enrollmentServices.getAllUsersWithEnrollments).toHaveBeenCalled(); // reloads
        expect(result.current.success).toContain('successfully');
    });

    it('handleResetAllUserEnrollments confirms and calls service', async () => {
        enrollmentServices.resetUserEnrollmentsToPending.mockResolvedValue(true);

        const { result } = renderHook(() => useAdminPanel());

        await act(async () => {
            await result.current.handleResetAllUserEnrollments('user1', 'User Name');
        });

        expect(global.confirm).toHaveBeenCalled();
        expect(enrollmentServices.resetUserEnrollmentsToPending).toHaveBeenCalledWith('user1');
        expect(result.current.success).toContain('successfully');
    });

    it('handleResetAllUserEnrollments aborts if not confirmed', async () => {
        global.confirm.mockReturnValue(false);

        const { result } = renderHook(() => useAdminPanel());

        await act(async () => {
            await result.current.handleResetAllUserEnrollments('user1', 'User Name');
        });

        expect(enrollmentServices.resetUserEnrollmentsToPending).not.toHaveBeenCalled();
    });
});
