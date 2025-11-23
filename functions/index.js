
/**
 * Cloud Functions for Fastrack Driving School LMS
 * Handles payment processing and Stripe webhooks
 */

// 1. CHANGE IMPORTS: Use the new v2 modules for the Callable and HTTPS functions
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { onCall, onRequest } = require('firebase-functions/v2/https');
// NEW IMPORTS: Use the parameters module to define the secret
const { defineSecret } = require('firebase-functions/params');
// Cloud Logging for audit trail
const { Logging } = require('@google-cloud/logging');

// 2. DEFINE SECRET: Declare the secret key from Secret Manager
const STRIPE_SECRET_KEY_SECRET = defineSecret("STRIPE_SECRET_KEY");
// Note: We will define the Stripe object later, inside the function, 
// using the bound environment variable.

initializeApp();
const db = getFirestore();
const logging = new Logging();

// 3. Update Stripe Initialization (moved into functions)
const stripe = require('stripe');

/**
 * Helper Function: Log audit event to Cloud Logging and Firestore
 * Tracks access to compliance records for regulatory audit trails
 * @param {string} userId - User performing the action
 * @param {string} action - Action type (read, create, delete, update)
 * @param {string} resource - Resource type (complianceLog, quizAttempt, certificate, etc.)
 * @param {string} resourceId - ID of the affected resource
 * @param {string} status - Action status (success, failure, denied)
 * @param {object} metadata - Additional metadata for audit trail
 */
async function logAuditEvent(userId, action, resource, resourceId, status, metadata = {}) {
  try {
    const timestamp = new Date().toISOString();
    const auditEntry = {
      userId,
      action,
      resource,
      resourceId,
      status,
      timestamp,
      metadata,
      cloudFunction: true
    };

    // Log to Cloud Logging (viewable in Cloud Console)
    const log = logging.log('compliance-audit-trail');
    const severity = status === 'denied' ? 'WARNING' : status === 'failure' ? 'ERROR' : 'INFO';
    const logEntry = log.entry({ severity }, {
      message: `${action.toUpperCase()} ${resource}: ${resourceId}`,
      userId,
      action,
      resource,
      resourceId,
      status,
      metadata
    });
    
    await log.write(logEntry);

    // Also store in Firestore for queryable audit trail
    await db.collection('auditLogs').add(auditEntry);
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Create Stripe Checkout Session
 * Called from the frontend to initiate payment
 */
// 4. BIND SECRET: Add the secret to the function options
exports.createCheckoutSession = onCall(
    { secrets: [STRIPE_SECRET_KEY_SECRET] },
    async (data, context) => {
        // Initialize Stripe using the environment variable made available by the 'secrets' option
        const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

        // Verify authentication
        if (!context.auth) {
            throw new Error('User must be authenticated to create checkout session');
        }

        const { courseId, amount, paymentType, successUrl, cancelUrl } = data;
        const userId = context.auth.uid;

        try {
            // Create payment record in Firestore
            const paymentRef = await db.collection('payments').add({
                userId,
                courseId,
                amount,
                paymentType,
                status: 'pending',
                currency: 'usd',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Create Stripe Checkout Session
            const session = await stripeClient.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: `Course Payment - ${courseId}`,
                                description: `${paymentType} payment for course enrollment`
                            },
                            unit_amount: amount
                        },
                        quantity: 1
                    }
                ],
                mode: 'payment',
                success_url: successUrl,
                cancel_url: cancelUrl,
                client_reference_id: paymentRef.id,
                metadata: {
                    userId,
                    courseId,
                    paymentType,
                    paymentId: paymentRef.id
                }
            });

            // Update payment record with session ID
            await paymentRef.update({
                stripeSessionId: session.id,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return {
                sessionId: session.id,
                paymentId: paymentRef.id
            };
        } catch (error) {
            console.error('Error creating checkout session:', error);
            // Changed to standard Error to align with v2
            throw new Error(`INTERNAL_ERROR: ${error.message}`);
        }
    }
);

/**
 * Create Payment Intent
 * Alternative to Checkout Session for embedded payment forms
 */
// 4. BIND SECRET: Add the secret to the function options
exports.createPaymentIntent = onCall(
    { secrets: [STRIPE_SECRET_KEY_SECRET] },
    async (data, context) => {
        // Initialize Stripe using the environment variable
        const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

        if (!context.auth) {
            throw new Error('User must be authenticated');
        }

        const { courseId, amount, paymentType } = data;
        const userId = context.auth.uid;

        try {
            // Create payment record
            const paymentRef = await db.collection('payments').add({
                userId,
                courseId,
                amount,
                paymentType,
                status: 'pending',
                currency: 'usd',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Create Stripe Payment Intent
            const paymentIntent = await stripeClient.paymentIntents.create({
                amount,
                currency: 'usd',
                metadata: {
                    userId,
                    courseId,
                    paymentType,
                    paymentId: paymentRef.id
                }
            });

            // Update payment record
            await paymentRef.update({
                stripePaymentIntentId: paymentIntent.id,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return {
                clientSecret: paymentIntent.client_secret,
                paymentId: paymentRef.id
            };
        } catch (error) {
            console.error('Error creating payment intent:', error);
            throw new Error(`INTERNAL_ERROR: ${error.message}`);
        }
    }
);

/**
 * Stripe Webhook Handler
 * Processes Stripe events (payment success, failure, etc.)
 */
// 4. BIND SECRET: Add the secret to the function options
exports.stripeWebhook = onRequest(
    { secrets: [STRIPE_SECRET_KEY_SECRET] },
    async (req, res) => {
        // Initialize Stripe using the environment variable
        const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

        const sig = req.headers['stripe-signature'];
        // NOTE: The webhook secret MUST be handled separately from the API key.
        // It's still sensitive but is not bound to the functions:secrets method above.
        // I recommend moving this to a separate, dedicated environment configuration
        // (like a dedicated secret or functions:config:set) if you are moving away from functions.config().
        // For now, I'll assume you have a way to set functions.config().stripe.webhook_secret
        // OR you can use another dedicated secret for this.
        const webhookSecret = functions.config().stripe.webhook_secret; 
        
        let event;

        try {
            event = stripeClient.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle the event
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
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    }
);


// The rest of your helper functions are good to go:
// handleCheckoutSessionCompleted, handlePaymentIntentSucceeded, handlePaymentIntentFailed, updateEnrollmentAfterPayment

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(session) {
    const paymentId = session.client_reference_id;
    const { userId, courseId, paymentType } = session.metadata;

    try {
        // Update payment record
        await db.collection('payments').doc(paymentId).update({
            status: 'completed',
            stripePaymentIntentId: session.payment_intent,
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Get payment details
        const paymentDoc = await db.collection('payments').doc(paymentId).get();
        const payment = paymentDoc.data();

        // Update enrollment
        await updateEnrollmentAfterPayment(userId, courseId, payment.amount, paymentType);

        console.log(`Payment ${paymentId} completed successfully`);
    } catch (error) {
        console.error('Error handling checkout session completed:', error);
    }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
    const { userId, courseId, paymentType, paymentId } = paymentIntent.metadata;

    try {
        // Update payment record
        await db.collection('payments').doc(paymentId).update({
            status: 'completed',
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Get payment details
        const paymentDoc = await db.collection('payments').doc(paymentId).get();
        const payment = paymentDoc.data();

        // Update enrollment
        await updateEnrollmentAfterPayment(userId, courseId, payment.amount, paymentType);

        console.log(`Payment intent ${paymentIntent.id} succeeded`);
    } catch (error) {
        console.error('Error handling payment intent succeeded:', error);
    }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent) {
    const { paymentId } = paymentIntent.metadata;

    try {
        await db.collection('payments').doc(paymentId).update({
            status: 'failed',
            errorMessage: paymentIntent.last_payment_error?.message || 'Payment failed',
            failedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Payment intent ${paymentIntent.id} failed`);
    } catch (error) {
        console.error('Error handling payment intent failed:', error);
    }
}

/**
 * Update enrollment after successful payment
 */
async function updateEnrollmentAfterPayment(userId, courseId, paymentAmount, paymentType) {
    const enrollmentId = `${userId}_${courseId}`;
    const enrollmentRef = db.collection('enrollments').doc(enrollmentId);

    try {
        const enrollmentDoc = await enrollmentRef.get();
        
        if (!enrollmentDoc.exists) {
            throw new Error('Enrollment not found');
        }

        const enrollment = enrollmentDoc.data();
        const newAmountPaid = (enrollment.amountPaid || 0) + paymentAmount;
        const newAmountDue = enrollment.totalAmount - newAmountPaid;

        let updates = {
            amountPaid: newAmountPaid,
            amountDue: newAmountDue,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Determine payment status
        if (newAmountPaid >= enrollment.totalAmount) {
            updates.paymentStatus = 'completed';
            updates.status = 'active';
        } else if (newAmountPaid > 0) {
            updates.paymentStatus = 'partial';
        }

        // Handle course-specific logic
        if (courseId === 'fastrack-online') {
            updates.accessStatus = 'unlocked';
            updates.status = 'active';
        } else if (courseId === 'fastrack-behind-the-wheel') {
            if (enrollment.certificateGenerated && newAmountPaid >= enrollment.totalAmount) {
                updates.accessStatus = 'unlocked';
                updates.status = 'active';
            }
        } else if (courseId === 'fastrack-complete') {
            if (paymentType === 'upfront') {
                updates.accessStatus = 'unlocked';
                updates.remainingAmount = 450;
                
                // Unlock online course component
                const onlineEnrollmentId = `${userId}_fastrack-online`;
                await db.collection('enrollments').doc(onlineEnrollmentId).update({
                    accessStatus: 'unlocked',
                    status: 'active',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            } else if (paymentType === 'remaining' && newAmountPaid >= enrollment.totalAmount) {
                // Unlock behind-the-wheel component
                const btwEnrollmentId = `${userId}_fastrack-behind-the-wheel`;
                await db.collection('enrollments').doc(btwEnrollmentId).update({
                    accessStatus: 'unlocked',
                    status: 'active',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        }

        await enrollmentRef.update(updates);
        console.log(`Enrollment ${enrollmentId} updated after payment`);
    } catch (error) {
        console.error('Error updating enrollment after payment:', error);
        throw error;
    }
}

/**
 * Generate certificate after course completion
 * Validates: 24-hour requirement, quiz passage, final exam (3 attempts max), PVQ completion
 */
exports.generateCertificate = onCall(async (data, context) => {
    if (!context.auth) {
        throw new Error('User must be authenticated');
    }

    const { courseId } = data;
    const userId = context.auth.uid;
    const REQUIRED_MINUTES = 24 * 60;
    const PASSING_SCORE = 70;
    const MAX_FINAL_EXAM_ATTEMPTS = 3;

    try {
        // 1. Verify course completion (lesson progress)
        const progressRef = db.collection('progress').doc(`${userId}_${courseId}`);
        const progressDoc = await progressRef.get();

        if (!progressDoc.exists || progressDoc.data().overallProgress < 100) {
            throw new Error('Course must be completed before generating certificate');
        }

        // 2. Verify 24-hour requirement
        const complianceLogs = await db.collection('complianceLogs')
            .where('userId', '==', userId)
            .where('courseId', '==', courseId)
            .where('status', '==', 'completed')
            .get();

        let totalSeconds = 0;
        complianceLogs.forEach(doc => {
            const data = doc.data();
            if (data.duration) {
                totalSeconds += data.duration;
            }
        });

        const totalMinutes = Math.floor(totalSeconds / 60);
        
        if (totalMinutes < REQUIRED_MINUTES) {
            throw new Error(`Certificate requires ${REQUIRED_MINUTES} minutes of instruction time. Current: ${totalMinutes} minutes.`);
        }

        // 3. Verify quiz attempts and final exam restrictions
        const quizAttempts = await db.collection('quizAttempts')
            .where('userId', '==', userId)
            .where('courseId', '==', courseId)
            .get();

        const finalExamAttempts = [];
        const quizzes = {};

        quizAttempts.forEach(doc => {
            const attempt = doc.data();
            if (attempt.isFinalExam === true) {
                finalExamAttempts.push(attempt);
            } else if (attempt.quizId) {
                if (!quizzes[attempt.quizId]) {
                    quizzes[attempt.quizId] = [];
                }
                quizzes[attempt.quizId].push(attempt);
            }
        });

        // Check final exam: max 3 attempts, must pass
        if (finalExamAttempts.length > 0) {
            if (finalExamAttempts.length > MAX_FINAL_EXAM_ATTEMPTS) {
                throw new Error(`Final exam exceeded maximum attempts (${MAX_FINAL_EXAM_ATTEMPTS}). Attempts made: ${finalExamAttempts.length}.`);
            }

            const passedFinalExams = finalExamAttempts.filter(a => a.passed === true);
            if (passedFinalExams.length === 0) {
                throw new Error('Final exam must be passed before generating certificate.');
            }
        } else if (courseId.includes('online') || courseId.includes('complete')) {
            // Final exam may be required for certain courses
            // Adjust based on course requirements
        }

        // Check all module quizzes are passed (if they exist)
        const failedQuizzes = [];
        for (const quizId in quizzes) {
            const quizAttemptList = quizzes[quizId];
            const passedAttempts = quizAttemptList.filter(a => a.passed === true);
            
            if (quizAttemptList.length > 0 && passedAttempts.length === 0) {
                const lastAttempt = quizAttemptList.sort((a, b) => 
                    new Date(b.startedAt) - new Date(a.startedAt)
                )[0];
                failedQuizzes.push({
                    quizId,
                    quizTitle: lastAttempt.quizTitle,
                    score: lastAttempt.score || 0
                });
            }
        }

        if (failedQuizzes.length > 0) {
            const failedQuizNames = failedQuizzes.map(q => q.quizTitle).join(', ');
            throw new Error(`All quizzes must be passed. Failed: ${failedQuizNames}`);
        }

        // 4. Verify PVQ completion
        const identityVerifications = await db.collection('identityVerifications')
            .where('userId', '==', userId)
            .where('courseId', '==', courseId)
            .get();

        const pvqRecords = [];
        identityVerifications.forEach(doc => {
            pvqRecords.push(doc.data());
        });

        if (pvqRecords.length === 0) {
            throw new Error('Identity verification (PVQ) must be completed before generating certificate.');
        }

        const correctPVQs = pvqRecords.filter(p => p.isCorrect === true);
        if (correctPVQs.length === 0) {
            throw new Error('At least one identity verification question must be answered correctly.');
        }

        // 5. Create certificate record
        const certificateRef = await db.collection('certificates').add({
            userId,
            courseId,
            issuedAt: admin.firestore.FieldValue.serverTimestamp(),
            certificateNumber: `FTDS-${Date.now()}-${userId.substring(0, 8)}`,
            status: 'active',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            complianceData: {
                totalMinutes,
                quizAttempts: quizAttempts.size,
                finalExamAttempts: finalExamAttempts.length,
                pvqAttempts: pvqRecords.length,
                pvqPassed: correctPVQs.length
            }
        });

        // 6. Update enrollment
        const enrollmentId = `${userId}_${courseId}`;
        await db.collection('enrollments').doc(enrollmentId).update({
            certificateGenerated: true,
            certificateId: certificateRef.id,
            certificateGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
            complianceVerified: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Log certificate creation to audit trail
        await logAuditEvent(userId, 'create', 'certificate', certificateRef.id, 'success', {
            courseId,
            certificateNumber: `FTDS-${Date.now()}-${userId.substring(0, 8)}`,
            totalMinutes,
            complianceChecks: {
                courseDone: true,
                hoursVerified: totalMinutes >= 1440,
                quizzesRequired: finalExamAttempts.length > 0,
                pvqRequired: correctPVQs.length > 0
            }
        });

        // Log enrollment update to audit trail
        await logAuditEvent(userId, 'update', 'enrollment', enrollmentId, 'success', {
            action: 'certificate_issued',
            certificateId: certificateRef.id
        });

        return {
            certificateId: certificateRef.id,
            message: 'Certificate generated successfully',
            complianceData: {
                totalMinutes,
                quizAttempts: quizAttempts.size,
                finalExamAttempts: finalExamAttempts.length,
                pvqAttempts: pvqRecords.length
            }
        };
    } catch (error) {
        console.error('Error generating certificate:', error);
        throw new Error(`INTERNAL_ERROR: ${error.message}`);
    }
});

/**
 * Audit Compliance Record Access
 * Called to log and monitor access to compliance records
 * Used for DMV compliance audit trail
 */
exports.auditComplianceAccess = onCall(async (data, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new Error('User must be authenticated');
    }

    const { action, resource, resourceId, details } = data;
    const userId = context.auth.uid;

    try {
        // Log the access attempt
        await logAuditEvent(userId, action, resource, resourceId, 'success', {
            ...details,
            timestamp: new Date().toISOString()
        });

        return {
            success: true,
            message: `${action} action logged for ${resource}`,
            auditId: `${userId}-${resource}-${Date.now()}`
        };
    } catch (error) {
        console.error('Error logging compliance access:', error);
        await logAuditEvent(userId, action, resource, resourceId, 'failure', {
            error: error.message
        });
        throw new Error(`Failed to audit compliance access: ${error.message}`);
    }
});