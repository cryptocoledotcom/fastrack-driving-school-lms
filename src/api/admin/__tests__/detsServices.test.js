import { describe, it, expect, vi, beforeEach } from 'vitest';
import detsServices from '../detsServices';
import { httpsCallable } from 'firebase/functions';

vi.mock('firebase/functions', () => ({
    getFunctions: vi.fn(),
    httpsCallable: vi.fn(),
}));

vi.mock('../../base/ServiceWrapper', () => ({
    executeService: async (fn) => fn(),
}));

describe('detsServices', () => {
    const mockCallable = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        httpsCallable.mockReturnValue(mockCallable);
    });

    it('generateDETSReport calls correct function', async () => {
        mockCallable.mockResolvedValue({ data: { reportId: '123' } });

        await detsServices.generateDETSReport('course1', '2024-01-01', '2024-01-31');

        expect(httpsCallable).toHaveBeenCalledWith(undefined, 'exportDETSReport');
        expect(mockCallable).toHaveBeenCalledWith(expect.objectContaining({
            courseId: 'course1',
            startDate: '2024-01-01'
        }));
    });

    it('submitDETSReport calls correct function', async () => {
        mockCallable.mockResolvedValue({ data: { success: true } });

        await detsServices.submitDETSReport('report1');

        expect(httpsCallable).toHaveBeenCalledWith(undefined, 'submitDETSToState');
        expect(mockCallable).toHaveBeenCalledWith({ reportId: 'report1' });
    });
});
