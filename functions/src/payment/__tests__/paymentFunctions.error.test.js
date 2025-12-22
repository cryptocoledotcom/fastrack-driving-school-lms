/* eslint-disable import/order */
const {
    createMockFirestore
} = require('../../__tests__/mocks');

vi.mock('firebase-admin', () => {
    return {
        initializeApp: vi.fn(),
        firestore: () => ({
            collection: vi.fn(() => ({
                add: vi.fn(() => Promise.resolve({ id: 'payment-doc-123' })),
                doc: vi.fn(() => ({
                    get: vi.fn(),
                    set: vi.fn(),
                    update: vi.fn()
                }))
            }))
        }),
        auth: () => ({})
    };
});

vi.mock('firebase-functions/v2/https', () => ({
    onCall: vi.fn((config, handler) => {
        // config might be the first arg, handler the second. 
        // Or just handler if no config. 
        // The source code uses { secrets: ... } as first arg.
        const fn = typeof config === 'function' ? config : handler;
        fn.run = fn;
        return fn;
    }),
    onRequest: vi.fn((handler) => handler)
}));

vi.mock('firebase-functions/params', () => ({
    defineSecret: vi.fn(() => ({ value: () => 'test-secret-key' }))
}));

// Mock Stripe
const mockStripeClient = {
    checkout: {
        sessions: {
            create: vi.fn()
        }
    },
    paymentIntents: {
        create: vi.fn()
    }
};

vi.mock('stripe', () => {
    return {
        default: vi.fn(() => mockStripeClient)
    };
});

const paymentFunctions = require('../paymentFunctions');
const firebaseUtils = require('../../common/firebaseUtils');
const { createCheckoutSession, createPaymentIntent } = paymentFunctions;

describe('Payment Functions - Error Scenarios', () => {
    let mockContext;
    let mockDb;

    beforeEach(() => {
        vi.clearAllMocks();
        mockDb = createMockFirestore();

        // Setup context
        mockContext = {
            auth: { uid: 'user-123' }
        };

        global.TEST_FIREBASE_UTILS = {
            getDb: vi.fn(() => mockDb),
        };
        firebaseUtils.setDb(mockDb);

        // Reset mock implementations
        mockStripeClient.checkout.sessions.create.mockResolvedValue({ id: 'sess_123' });
        mockStripeClient.paymentIntents.create.mockResolvedValue({ client_secret: 'secret_123' });
    });

    afterEach(() => {
        delete global.TEST_FIREBASE_UTILS;
        firebaseUtils.resetDb();
    });

    describe('createCheckoutSession', () => {
        it('should throw error on Stripe API failure', async () => {
            mockStripeClient.checkout.sessions.create.mockRejectedValue(new Error('Stripe Down'));

            const data = {
                courseId: 'course_1',
                amount: 100,
                paymentType: 'full'
            };

            try {
                await createCheckoutSession.run(data, mockContext);
                expect(true).toBe(false);
            } catch (error) {
                // If ReferenceError occurs (stripeClient not defined), we will see it here too
                expect(error.message).toMatch(/Stripe Down|Failed to create/);
            }
        });
    });

    describe('createPaymentIntent', () => {
        it('should throw error on Stripe API failure', async () => {
            mockStripeClient.paymentIntents.create.mockRejectedValue(new Error('Stripe API Error'));

            const data = {
                courseId: 'course_1',
                amount: 100,
                paymentType: 'full'
            };

            try {
                await createPaymentIntent.run(data, mockContext);
                expect(true).toBe(false);
            } catch (error) {
                expect(error.message).toMatch(/Stripe API Error|Failed to create/);
            }
        });
    });
});
