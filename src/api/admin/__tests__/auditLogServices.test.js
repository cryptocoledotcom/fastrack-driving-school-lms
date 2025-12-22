import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpsCallable } from 'firebase/functions';

import auditLogServices from '../auditLogServices';

// Mock Firebase Functions
vi.mock('firebase/functions', () => ({
    getFunctions: vi.fn(),
    httpsCallable: vi.fn(),
}));

// Mock ServiceWrapper to just execute the callback
vi.mock('../../base/ServiceWrapper', () => ({
    executeService: async (fn) => fn(),
}));

describe('auditLogServices', () => {
    const mockCallable = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        httpsCallable.mockReturnValue(mockCallable);
    });

    it('getAuditLogs calls correct function', async () => {
        mockCallable.mockResolvedValue({ data: { logs: [], totalCount: 0 } });

        await auditLogServices.getAuditLogs({ userId: '123' });

        expect(httpsCallable).toHaveBeenCalledWith(undefined, 'getAuditLogs');
        expect(mockCallable).toHaveBeenCalledWith(expect.objectContaining({
            filters: { userId: '123' },
            limit: 100
        }));
    });

    it('getAuditLogStats calls correct function', async () => {
        mockCallable.mockResolvedValue({ data: { stats: {} } });

        await auditLogServices.getAuditLogStats('2024-01-01', '2024-01-31');

        expect(httpsCallable).toHaveBeenCalledWith(undefined, 'getAuditLogStats');
        expect(mockCallable).toHaveBeenCalledWith({
            startDate: '2024-01-01',
            endDate: '2024-01-31'
        });
    });
});
