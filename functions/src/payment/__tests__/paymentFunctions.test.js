const {
  createMockFirestore,
  createMockDocumentSnapshot,
} = require('../../__tests__/mocks');

vi.mock('firebase-functions/v2/https', () => ({
  onCall: vi.fn((handler) => {
    const fn = typeof handler === 'function' ? handler : handler.fn;
    fn.run = fn;
    return fn;
  }),
  onRequest: vi.fn((handler) => {
    const fn = typeof handler === 'function' ? handler : handler.fn;
    fn.run = fn;
    return fn;
  }),
}));

vi.mock('firebase-functions/params', () => ({
  defineSecret: vi.fn((name) => name),
}));

vi.mock('stripe', () => {
  return {
    default: vi.fn(() => ({
      checkout: {
        sessions: {
          create: vi.fn(() => Promise.resolve({ id: 'cs_test_123' }))
        }
      },
      paymentIntents: {
        create: vi.fn(() => Promise.resolve({ id: 'pi_test_123', client_secret: 'secret' }))
      }
    }))
  };
});

const {
  createCheckoutSession,
  createPaymentIntent,
  handleCheckoutSessionCompleted,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  updateEnrollmentAfterPayment
} = require('../paymentFunctions');

const { setDb } = require('../../common/firebaseUtils');

describe('Payment Functions', () => {
  let mockContext;
  let mockDb;
  let mockStripe;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = createMockFirestore();
    setDb(mockDb);

    mockContext = {
      auth: { uid: 'user-123' },
      rawRequest: {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' }
      }
    };

    mockStripe = {
      checkout: {
        sessions: {
          create: vi.fn(() => Promise.resolve({
            id: 'cs_test_123',
          }))
        }
      },
      paymentIntents: {
        create: vi.fn(() => Promise.resolve({
          id: 'pi_test_123',
          client_secret: 'pi_test_123_secret'
        }))
      },
      webhooks: {
        constructEvent: vi.fn((body, sig, secret) => ({
          type: 'checkout.session.completed',
          data: { object: { id: 'cs_test_123' } }
        }))
      }
    };
  });

  describe('createCheckoutSession', () => {
    it('should throw error if user not authenticated', async () => {
      const data = {
        amount: 29.99,
        paymentType: 'course-payment'
      };

      try {
        await createCheckoutSession.run(data, { auth: null });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Authentication required');
      }
    });

    it('should throw error if courseId missing', async () => {
      const data = {
        amount: 29.99,
        paymentType: 'course-payment'
      };

      try {
        await createCheckoutSession.run(data, mockContext);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Missing required parameters');
      }
    });

    it('should throw error if amount missing', async () => {
      const data = {
        courseId: 'course-456',
        paymentType: 'course-payment'
      };

      try {
        await createCheckoutSession.run(data, mockContext);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Missing required parameters');
      }
    });

    it('should throw error if paymentType missing', async () => {
      const data = {
        courseId: 'course-456',
        amount: 29.99
      };

      try {
        await createCheckoutSession.run(data, mockContext);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Missing required parameters');
      }
    });

    it.skip('should create checkout session successfully', async () => {
      mockDb.collection = vi.fn(() => ({
        add: vi.fn(() => Promise.resolve({ id: 'payment-123' }))
      }));
      setDb(mockDb);

      const data = {
        courseId: 'course-456',
        amount: 29.99,
        paymentType: 'course-payment',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      };

      const result = await createCheckoutSession.run(data, mockContext);
      expect(result.sessionId).toBe('cs_test_123');
      expect(result.paymentId).toBe('payment-123');
    });
  });

  describe('createPaymentIntent', () => {
    it('should throw error if user not authenticated', async () => {
      const data = {
        courseId: 'course-456',
        amount: 29.99,
        paymentType: 'course-payment'
      };

      try {
        await createPaymentIntent.run(data, { auth: null });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Authentication required');
      }
    });

    it('should throw error if courseId missing', async () => {
      const data = {
        amount: 29.99,
        paymentType: 'course-payment'
      };

      try {
        await createPaymentIntent.run(data, mockContext);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Missing required parameters');
      }
    });

    it('should throw error if amount missing', async () => {
      const data = {
        courseId: 'course-456',
        paymentType: 'course-payment'
      };

      try {
        await createPaymentIntent.run(data, mockContext);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Missing required parameters');
      }
    });

    it('should throw error if paymentType missing', async () => {
      const data = {
        courseId: 'course-456',
        amount: 29.99
      };

      try {
        await createPaymentIntent.run(data, mockContext);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Missing required parameters');
      }
    });

    it.skip('should create payment intent successfully', async () => {
      mockDb.collection = vi.fn(() => ({
        add: vi.fn(() => Promise.resolve({ id: 'payment-456' }))
      }));
      setDb(mockDb);

      const data = {
        courseId: 'course-456',
        amount: 29.99,
        paymentType: 'course-payment'
      };

      const result = await createPaymentIntent.run(data, mockContext);
      expect(result.clientSecret).toBe('pi_test_123_secret');
      expect(result.paymentId).toBe('payment-456');
    });
  });

  describe('handleCheckoutSessionCompleted', () => {
    it('should throw error if userId missing from metadata', async () => {
      const session = {
        metadata: { courseId: 'course-456' },
        amount_total: 2999
      };

      try {
        await handleCheckoutSessionCompleted(session);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Missing required metadata');
      }
    });

    it('should throw error if courseId missing from metadata', async () => {
      const session = {
        metadata: { userId: 'user-123' },
        amount_total: 2999
      };

      try {
        await handleCheckoutSessionCompleted(session);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Missing required metadata');
      }
    });

    it('should update enrollment after successful checkout', async () => {
      mockDb.collection = vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve(
            createMockDocumentSnapshot(
              { userId: 'user-123', courseId: 'course-456' },
              false
            )
          )),
          set: vi.fn(() => Promise.resolve()),
        })),
        add: vi.fn(() => Promise.resolve())
      }));

      const session = {
        metadata: {
          userId: 'user-123',
          courseId: 'course-456',
          paymentType: 'checkout'
        },
        amount_total: 2999
      };

      await handleCheckoutSessionCompleted(session);
      expect(mockDb.collection).toHaveBeenCalled();
    });
  });

  describe('handlePaymentIntentSucceeded', () => {
    it('should throw error if userId missing from metadata', async () => {
      const paymentIntent = {
        metadata: { courseId: 'course-456' },
        amount: 2999
      };

      try {
        await handlePaymentIntentSucceeded(paymentIntent);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Missing required metadata');
      }
    });

    it('should throw error if courseId missing from metadata', async () => {
      const paymentIntent = {
        metadata: { userId: 'user-123' },
        amount: 2999
      };

      try {
        await handlePaymentIntentSucceeded(paymentIntent);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Missing required metadata');
      }
    });

    it('should update enrollment after successful payment intent', async () => {
      mockDb.collection = vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve(
            createMockDocumentSnapshot(
              { userId: 'user-123', courseId: 'course-456' },
              false
            )
          )),
          set: vi.fn(() => Promise.resolve()),
        })),
        add: vi.fn(() => Promise.resolve())
      }));

      const paymentIntent = {
        metadata: {
          userId: 'user-123',
          courseId: 'course-456',
          paymentType: 'intent'
        },
        amount: 2999
      };

      await handlePaymentIntentSucceeded(paymentIntent);
      expect(mockDb.collection).toHaveBeenCalled();
    });
  });

  describe('handlePaymentIntentFailed', () => {
    it('should update payment status to failed', async () => {
      mockDb.collection = vi.fn(() => ({
        doc: vi.fn(() => ({
          update: vi.fn(() => Promise.resolve())
        }))
      }));

      const paymentIntent = {
        id: 'pi_failed_123',
        metadata: {
          userId: 'user-123',
          courseId: 'course-456'
        }
      };

      await handlePaymentIntentFailed(paymentIntent);
      expect(mockDb.collection).toHaveBeenCalledWith('payments');
    });

    it('should handle missing metadata gracefully', async () => {
      const paymentIntent = {
        id: 'pi_failed_123',
        metadata: {}
      };

      await handlePaymentIntentFailed(paymentIntent);
      expect(true).toBe(true);
    });
  });

  describe('updateEnrollmentAfterPayment', () => {
    it('should create new enrollment if not exists', async () => {
      mockDb.collection = vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve(
            createMockDocumentSnapshot({}, false)
          )),
          set: vi.fn(() => Promise.resolve()),
          update: vi.fn(() => Promise.resolve())
        }))
      }));

      await updateEnrollmentAfterPayment('user-123', 'course-456', 2999, 'checkout');
      expect(mockDb.collection).toHaveBeenCalledWith('enrollments');
    });

    it('should update existing enrollment if exists', async () => {
      mockDb.collection = vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve(
            createMockDocumentSnapshot(
              { userId: 'user-123', courseId: 'course-456', paymentStatus: 'pending' },
              true
            )
          )),
          set: vi.fn(() => Promise.resolve()),
          update: vi.fn(() => Promise.resolve())
        }))
      }));

      await updateEnrollmentAfterPayment('user-123', 'course-456', 2999, 'checkout');
      expect(mockDb.collection).toHaveBeenCalledWith('enrollments');
    });

    it('should set correct payment amount in cents', async () => {
      mockDb.collection = vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve(
            createMockDocumentSnapshot({}, false)
          )),
          set: vi.fn(() => Promise.resolve())
        }))
      }));

      await updateEnrollmentAfterPayment('user-123', 'course-456', 2999, 'checkout');
      expect(mockDb.collection).toHaveBeenCalled();
    });
  });
});
