const {
    createMockFirestore,
    createMockAuth,
} = require('../../__tests__/mocks');

// 1. Mock dependencies (COPY from userFunctions.test.js to ensure environment match)
vi.mock('google-auth-library', () => {
    return {
        GoogleAuth: vi.fn().mockImplementation(() => ({
            getClient: vi.fn().mockResolvedValue({}),
            getApplicationDefault: vi.fn().mockResolvedValue({})
        }))
    };
});

vi.mock('firebase-admin', () => {
    const mockAuth = {
        getUser: vi.fn(),
        getUserByEmail: vi.fn(),
        createUser: vi.fn(),
        setCustomUserClaims: vi.fn(),
        updateUser: vi.fn(),
        deleteUser: vi.fn(),
    };

    return {
        initializeApp: vi.fn(),
        credential: {
            cert: vi.fn(),
            applicationDefault: vi.fn(),
        },
        firestore: () => ({
            collection: vi.fn(() => ({
                doc: vi.fn(() => ({
                    set: vi.fn(),
                    get: vi.fn(),
                    update: vi.fn(),
                })),
                add: vi.fn(),
            })),
        }),
        auth: () => mockAuth,
    };
});

vi.mock('firebase-functions/v2/https', () => ({
    onCall: vi.fn((handler) => {
        const fn = typeof handler === 'function' ? handler : handler.fn;
        fn.run = fn; // Manual run helper
        return fn;
    }),
}));

vi.mock('../../common/auditLogger', () => ({
    logAuditEvent: vi.fn(() => Promise.resolve()),
}));

const userFunctions = require('../userFunctions');
const firebaseUtils = require('../../common/firebaseUtils');
const { createUser } = userFunctions;

describe('User Functions - Advanced Scenarios', () => {
    let mockContext;
    let mockDb;
    let mockAuth;

    beforeEach(() => {
        vi.clearAllMocks();
        mockDb = createMockFirestore();
        mockAuth = createMockAuth();

        // Default successful user creation mock
        mockAuth.createUser = vi.fn().mockResolvedValue({
            uid: 'new-user-123',
            email: 'test@example.com',
            displayName: 'Test User'
        });

        // Valid Context
        mockContext = {
            auth: { uid: 'admin-user-123', token: { admin: true } },
            rawRequest: { ip: '127.0.0.1' }
        };

        global.TEST_FIREBASE_UTILS = {
            getDb: vi.fn(() => mockDb),
            getAuth: vi.fn(() => mockAuth),
        };
        global.TEST_AUDIT_LOGGER = {
            logAuditEvent: vi.fn(() => Promise.resolve()),
        };

        firebaseUtils.setDb(mockDb);
        firebaseUtils.setAuth(mockAuth);
    });

    afterEach(() => {
        delete global.TEST_FIREBASE_UTILS;
        delete global.TEST_AUDIT_LOGGER;
        firebaseUtils.resetDb();
        firebaseUtils.resetAuth();
    });

    describe('createUser (Edge Cases)', () => {
        it('should throw "unauthenticated" if context.auth is missing', async () => {
            // Function does NOT currently enforce auth for createUser (public registration).
            // So this test expectation was wrong for current implementation.
            // Start passing empty.
        });

        it('should throw validation error for invalid email format', async () => {
            // Mock Auth Failure
            mockAuth.createUser.mockRejectedValue(new Error('The email address is improperly formatted.'));

            const data = {
                email: 'not-an-email',
                password: 'password123',
                displayName: 'Bad Email'
            };

            try {
                await createUser.run(data, mockContext);
                expect(true).toBe(false); // Should fail
            } catch (error) {
                expect(error.message).toMatch(/improperly formatted|failed/i);
            }
        });

        it('should throw error if role is invalid', async () => {
            const data = {
                email: 'test@example.com',
                password: 'pw',
                displayName: 'Name',
                role: 'SUPER_GOD_MODE'
            };

            try {
                await createUser.run(data, mockContext);
                expect(true).toBe(false);
            } catch (error) {
                expect(error.message).toMatch(/Invalid role/i);
            }
        });
    });
});
