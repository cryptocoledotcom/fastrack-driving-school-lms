const admin = require('firebase-admin');
const { onCall, onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { getDb } = require('../common/firebaseUtils');
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,https://fastrackdrive.com,https://www.fastrackdrive.com').split(',');

const cors = require('cors')({
  origin: corsOrigins,
  credentials: true
});

const STRIPE_SECRET_KEY_SECRET = defineSecret("STRIPE_SECRET_KEY");

const stripe = require('stripe');

async function handleCheckoutSessionCompleted(session) {
  const metadata = session.metadata || {};
  const userId = metadata.userId;
  const courseId = metadata.courseId;
  const paymentAmount = session.amount_total;
  const paymentType = metadata.paymentType || 'checkout';

  if (!userId || !courseId) {
    throw new Error('Missing required metadata in Stripe session');
  }

  await updateEnrollmentAfterPayment(userId, courseId, paymentAmount, paymentType);
}

async function handlePaymentIntentSucceeded(paymentIntent) {
  const metadata = paymentIntent.metadata || {};
  const userId = metadata.userId;
  const courseId = metadata.courseId;
  const paymentAmount = paymentIntent.amount;
  const paymentType = metadata.paymentType || 'intent';

  if (!userId || !courseId) {
    throw new Error('Missing required metadata in Stripe payment intent');
  }

  await updateEnrollmentAfterPayment(userId, courseId, paymentAmount, paymentType);
}

async function handlePaymentIntentFailed(paymentIntent) {
  const metadata = paymentIntent.metadata || {};
  const userId = metadata.userId;
  const courseId = metadata.courseId;

  if (!userId || !courseId) return;

  const paymentRef = getDb().collection('payments').doc(paymentIntent.id);
  await paymentRef.update({
    status: 'failed',
    updatedAt: new Date()
  });
}

async function updateEnrollmentAfterPayment(userId, courseId, paymentAmount, paymentType) {
  const enrollmentRef = getDb().collection('enrollments').doc(`${userId}_${courseId}`);
  const enrollmentDoc = await enrollmentRef.get();

  if (!enrollmentDoc.exists) {
    await enrollmentRef.set({
      userId,
      courseId,
      enrollmentDate: new Date(),
      paymentStatus: 'completed',
      paymentAmount: paymentAmount / 100,
      paymentType,
      accessLevel: 'full'
    });
  } else {
    await enrollmentRef.update({
      paymentStatus: 'completed',
      paymentAmount: paymentAmount / 100,
      paymentType,
      updatedAt: new Date()
    });
  }
}

const createCheckoutSession = onCall(
  { secrets: [STRIPE_SECRET_KEY_SECRET] },
  async (data, context) => {
    try {
      if (!context.auth) {
        throw new Error('Authentication required');
      }

      const { courseId, amount, paymentType, successUrl, cancelUrl } = data;
      const userId = context.auth.uid;

      if (!courseId || !amount || !paymentType) {
        throw new Error('Missing required parameters');
      }

      const paymentRef = await getDb().collection('payments').add({
        userId,
        courseId,
        amount,
        paymentType,
        status: 'pending',
        createdAt: new Date()
      });

      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Course Payment - ${courseId}`
              },
              unit_amount: Math.round(amount * 100)
            },
            quantity: 1
          }
        ],
        success_url: successUrl || 'http://localhost:3000/success',
        cancel_url: cancelUrl || 'http://localhost:3000/cancel',
        metadata: {
          userId,
          courseId,
          paymentType,
          paymentId: paymentRef.id
        }
      });

      return { sessionId: session.id, paymentId: paymentRef.id };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }
);

const createPaymentIntent = onCall(
  { secrets: [STRIPE_SECRET_KEY_SECRET] },
  async (data, context) => {
    try {
      if (!context.auth) {
        throw new Error('Authentication required');
      }

      const { courseId, amount, paymentType } = data;
      const userId = context.auth.uid;

      if (!courseId || !amount || !paymentType) {
        throw new Error('Missing required parameters');
      }

      const paymentRef = await getDb().collection('payments').add({
        userId,
        courseId,
        amount,
        paymentType,
        status: 'pending',
        createdAt: new Date()
      });

      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        metadata: {
          userId,
          courseId,
          paymentType,
          paymentId: paymentRef.id
        }
      });

      return { clientSecret: paymentIntent.client_secret, paymentId: paymentRef.id };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }
);

const stripeWebhook = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripeClient.webhooks.constructEvent(
        req.rawBody || JSON.stringify(req.body),
        sig,
        webhookSecret
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
      return;
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event.data.object);
          break;

        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object);
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error processing webhook event:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

module.exports = {
  createCheckoutSession,
  createPaymentIntent,
  stripeWebhook,
  handleCheckoutSessionCompleted,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  updateEnrollmentAfterPayment
};
