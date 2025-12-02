const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { Logging } = require('@google-cloud/logging');

const db = getFirestore();
const logging = new Logging();

async function logAuditEvent(userId, action, resource, resourceId, status, metadata = {}) {
  try {
    const timestamp = new Date().toISOString();

    const cleanedMetadata = Object.fromEntries(
      Object.entries(metadata).filter(([_, value]) => value !== undefined && value !== null)
    );

    const auditEntry = {
      userId,
      action,
      resource,
      resourceId,
      status,
      timestamp,
      metadata: cleanedMetadata
    };

    await db.collection('auditTrail').add(auditEntry);

    const log = logging.log('compliance-audit-trail');
    const severity = status === 'denied' ? 'WARNING' : status === 'failure' ? 'ERROR' : 'INFO';
    const logEntry = log.entry({ severity }, {
      userId,
      action,
      resource,
      resourceId,
      status,
      timestamp
    });

    await log.write(logEntry);
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

module.exports = { logAuditEvent };
