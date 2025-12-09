const admin = require('firebase-admin');
const { Logging } = require('@google-cloud/logging');
const { getDb } = require('./firebaseUtils');

let cachedLogging = null;
let loggingError = null;

function getLogging() {
  if (cachedLogging) {
    return cachedLogging;
  }
  if (loggingError) {
    return null;
  }
  try {
    cachedLogging = new Logging();
    return cachedLogging;
  } catch (error) {
    loggingError = error;
    return null;
  }
}

const AUDIT_EVENT_TYPES = {
  SESSION_START: 'SESSION_START',
  SESSION_END: 'SESSION_END',
  SESSION_IDLE_TIMEOUT: 'SESSION_IDLE_TIMEOUT',
  DAILY_LIMIT_REACHED: 'DAILY_LIMIT_REACHED',
  PVQ_TRIGGERED: 'PVQ_TRIGGERED',
  PVQ_ATTEMPT: 'PVQ_ATTEMPT',
  PVQ_FAILED: 'PVQ_FAILED',
  PVQ_PASSED: 'PVQ_PASSED',
  PVQ_LOCKOUT: 'PVQ_LOCKOUT',
  VIDEO_STARTED: 'VIDEO_STARTED',
  VIDEO_COMPLETED: 'VIDEO_COMPLETED',
  VIDEO_QUESTION_ANSWERED: 'VIDEO_QUESTION_ANSWERED',
  VIDEO_QUESTION_FAILED: 'VIDEO_QUESTION_FAILED',
  QUIZ_STARTED: 'QUIZ_STARTED',
  QUIZ_SUBMITTED: 'QUIZ_SUBMITTED',
  QUIZ_PASSED: 'QUIZ_PASSED',
  QUIZ_FAILED: 'QUIZ_FAILED',
  EXAM_ATTEMPT: 'EXAM_ATTEMPT',
  EXAM_PASSED: 'EXAM_PASSED',
  EXAM_FAILED: 'EXAM_FAILED',
  EXAM_LOCKOUT: 'EXAM_LOCKOUT',
  EXAM_ACADEMIC_RESET_FLAGGED: 'EXAM_ACADEMIC_RESET_FLAGGED',
  ENROLLMENT_CERTIFICATE_GENERATED: 'ENROLLMENT_CERTIFICATE_GENERATED',
  ENROLLMENT_CERTIFICATE_CLAIMED: 'ENROLLMENT_CERTIFICATE_CLAIMED',
  COMPLETION_CERTIFICATE_GENERATED: 'COMPLETION_CERTIFICATE_GENERATED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  ADMIN_ACTION: 'ADMIN_ACTION',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS'
};

const RETENTION_DAYS = 1095;

async function logAuditEvent(userId, action, resource, resourceId, status, metadata = {}, context = null) {
  try {
    const timestamp = new Date();
    const iso8601Timestamp = timestamp.toISOString();
    
    const cleanedMetadata = Object.fromEntries(
      Object.entries(metadata).filter(([_, value]) => value !== undefined && value !== null)
    );

    const auditEntry = {
      userId,
      action,
      resource,
      resourceId,
      status,
      timestamp: iso8601Timestamp,
      serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: cleanedMetadata,
      retentionExpiresAt: new Date(timestamp.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      ipAddress: context?.ipAddress || 'unknown',
      userAgent: context?.userAgent || 'unknown'
    };

    await getDb().collection('auditLogs').add(auditEntry);

    const logging = getLogging();
    if (logging) {
      const log = logging.log('compliance-audit-trail');
      const severity = status === 'denied' ? 'WARNING' : status === 'error' || status === 'failure' ? 'ERROR' : 'INFO';
      const logEntry = log.entry({ severity }, {
        userId,
        action,
        resource,
        resourceId,
        status,
        timestamp: iso8601Timestamp,
        metadata: cleanedMetadata
      });

      await log.write(logEntry);
    }
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

async function logAuditEventWithContext(userId, action, resource, resourceId, status, request, metadata = {}) {
  const context = {
    ipAddress: request.ip || request.rawRequest?.headers?.['x-forwarded-for'] || 'unknown',
    userAgent: request.userAgent || request.rawRequest?.headers?.['user-agent'] || 'unknown'
  };
  return logAuditEvent(userId, action, resource, resourceId, status, metadata, context);
}

async function deleteExpiredAuditLogs() {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() - RETENTION_DAYS);
  const expirationTimestamp = expirationDate.toISOString();

  const snapshot = await getDb().collection('auditLogs')
    .where('timestamp', '<', expirationTimestamp)
    .limit(1000)
    .get();

  if (snapshot.empty) {
    console.log('No expired audit logs to delete');
    return 0;
  }

  const batch = getDb().batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  return snapshot.size;
}

module.exports = {
  logAuditEvent,
  logAuditEventWithContext,
  deleteExpiredAuditLogs,
  AUDIT_EVENT_TYPES,
  RETENTION_DAYS
};
