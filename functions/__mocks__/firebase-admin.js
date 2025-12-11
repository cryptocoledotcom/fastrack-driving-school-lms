import { vi } from 'vitest';

const mockAuth = {
    getUser: vi.fn(),
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    setCustomUserClaims: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
};

export const initializeApp = vi.fn();
export const credential = {
    cert: vi.fn(),
    applicationDefault: vi.fn(),
};
export const firestore = () => ({
    collection: vi.fn(() => ({
        doc: vi.fn(() => ({
            set: vi.fn(),
            get: vi.fn(),
            update: vi.fn()
        })),
        add: vi.fn()
    }))
});
export const auth = () => mockAuth;

export default {
    initializeApp,
    credential,
    firestore,
    auth
};
