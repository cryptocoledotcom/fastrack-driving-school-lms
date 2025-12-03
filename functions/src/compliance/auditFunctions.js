const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { onCall } = require('firebase-functions/v2/https');
const { AUDIT_EVENT_TYPES } = require('../common/auditLogger');

const db = getFirestore();

exports.getAuditLogs = onCall(async (data, context) => {
  if (!context.auth) {
    throw new Error('UNAUTHENTICATED: User must be authenticated');
  }

  try {
    const { userId } = context.auth;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists()) {
      throw new Error('NOT_FOUND: User not found');
    }

    const userData = userDoc.data();
    const isAdmin = userData.role === 'dmv_admin' || userData.role === 'super_admin';
    const isInstructor = userData.role === 'instructor';

    if (!isAdmin && !isInstructor) {
      throw new Error('PERMISSION_DENIED: Only admins and instructors can access audit logs');
    }

    const {
      filters = {},
      sortBy = 'timestamp',
      sortOrder = 'desc',
      limit = 100,
      offset = 0
    } = data;

    let query = db.collection('auditLogs');

    if (filters.userId) {
      query = query.where('userId', '==', filters.userId);
    }

    if (filters.action) {
      query = query.where('action', '==', filters.action);
    }

    if (filters.resource) {
      query = query.where('resource', '==', filters.resource);
    }

    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters.startDate && filters.endDate) {
      query = query
        .where('timestamp', '>=', filters.startDate)
        .where('timestamp', '<=', filters.endDate);
    }

    const snapshot = await query
      .orderBy(sortBy, sortOrder === 'asc' ? 'asc' : 'desc')
      .limit(limit + offset)
      .get();

    const totalCount = snapshot.size;
    const logs = [];

    snapshot.forEach((doc, index) => {
      if (index >= offset) {
        logs.push({
          id: doc.id,
          ...doc.data()
        });
      }
    });

    return {
      success: true,
      logs,
      count: logs.length,
      totalCount,
      hasMore: (offset + limit) < totalCount
    };
  } catch (error) {
    console.error('Error retrieving audit logs:', error);
    throw new Error(`Failed to retrieve audit logs: ${error.message}`);
  }
});

exports.getAuditLogStats = onCall(async (data, context) => {
  if (!context.auth) {
    throw new Error('UNAUTHENTICATED: User must be authenticated');
  }

  try {
    const { userId } = context.auth;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists()) {
      throw new Error('NOT_FOUND: User not found');
    }

    const userData = userDoc.data();
    const isAdmin = userData.role === 'dmv_admin' || userData.role === 'super_admin';
    const isInstructor = userData.role === 'instructor';

    if (!isAdmin && !isInstructor) {
      throw new Error('PERMISSION_DENIED: Only admins and instructors can access audit logs');
    }

    const { startDate, endDate } = data;

    const snapshot = await db.collection('auditLogs')
      .where('timestamp', '>=', startDate)
      .where('timestamp', '<=', endDate)
      .get();

    const stats = {
      totalEvents: snapshot.size,
      byStatus: {},
      byAction: {},
      byResource: {}
    };

    snapshot.forEach(doc => {
      const data = doc.data();

      stats.byStatus[data.status] = (stats.byStatus[data.status] || 0) + 1;
      stats.byAction[data.action] = (stats.byAction[data.action] || 0) + 1;
      stats.byResource[data.resource] = (stats.byResource[data.resource] || 0) + 1;
    });

    return {
      success: true,
      stats
    };
  } catch (error) {
    console.error('Error retrieving audit log stats:', error);
    throw new Error(`Failed to retrieve audit log stats: ${error.message}`);
  }
});

exports.getUserAuditTrail = onCall(async (data, context) => {
  if (!context.auth) {
    throw new Error('UNAUTHENTICATED: User must be authenticated');
  }

  try {
    const { userId } = context.auth;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists()) {
      throw new Error('NOT_FOUND: User not found');
    }

    const userData = userDoc.data();
    const isAdmin = userData.role === 'dmv_admin' || userData.role === 'super_admin';
    const isInstructor = userData.role === 'instructor';

    if (!isAdmin && !isInstructor) {
      throw new Error('PERMISSION_DENIED: Only admins and instructors can access audit logs');
    }

    const { targetUserId } = data;

    const snapshot = await db.collection('auditLogs')
      .where('userId', '==', targetUserId)
      .orderBy('timestamp', 'desc')
      .limit(500)
      .get();

    const trail = [];

    snapshot.forEach(doc => {
      trail.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      trail,
      count: trail.length
    };
  } catch (error) {
    console.error('Error retrieving user audit trail:', error);
    throw new Error(`Failed to retrieve user audit trail: ${error.message}`);
  }
});
