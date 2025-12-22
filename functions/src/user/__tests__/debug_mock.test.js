import { vi, describe, it, expect } from 'vitest';

vi.mock('../../common/firebaseUtils', () => ({
    getDb: vi.fn(),
    getAuth: vi.fn(),
}));

describe('Debug Mocking', () => {
    it('should mock import', async () => {
        const fu = await import('../../common/firebaseUtils');
        console.log('ESM Import keys:', Object.keys(fu));
        if (fu.getDb) {
            console.log('ESM getDb is mock:', vi.isMockFunction(fu.getDb));
        }
        expect(vi.isMockFunction(fu.getDb)).toBe(true);
    });

    it.skip('should mock require in source', async () => {
        // This imports a CJS file that uses require()
        // Vitest should transform that file and inject mock 
        const source = await import('./debug_source.js');
        const fu = source.default; // or source if exports match

        console.log('Source export keys:', Object.keys(fu));
        if (fu.getDb) {
            console.log('Source getDb is mock:', vi.isMockFunction(fu.getDb));
        }
        expect(vi.isMockFunction(fu.getDb)).toBe(true);
    });
});
