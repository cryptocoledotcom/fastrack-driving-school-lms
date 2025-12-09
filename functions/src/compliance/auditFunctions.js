const admin = require('firebase-admin');
const { onCall } = require('firebase-functions/v2/https');
const { AUDIT_EVENT_TYPES } = require('../common/auditLogger');
const { getDb } = require('../common/firebaseUtils');

exports.getAuditLogs = onCall(async (request) => {
  const { auth, data } = request;
  
  if (!auth) {
    throw new Error('UNAUTHENTICATED: User must be authenticated');
  }

  try {
    const userId = auth.uid;
    const userDoc = await getDb().collection('users').doc(userId).get();

    if (!userDoc.exists) {
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

    let query = getDb().collection('auditLogs');

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
      let startDate = filters.startDate;
      let endDate = filters.endDate;
      
      if (typeof startDate === 'string') {
        startDate = admin.firestore.Timestamp.fromDate(new Date(startDate));
      }
      if (typeof endDate === 'string') {
        endDate = admin.firestore.Timestamp.fromDate(new Date(endDate));
      }
      
      query = query
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate);
    }

    const snapshot = await query.get();

    const allLogs = [];
    snapshot.forEach(doc => {
      allLogs.push({
        id: doc.id,
        ...doc.data()
      });
    });

    allLogs.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal === undefined || bVal === undefined) {
        return 0;
      }
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (aVal instanceof admin.firestore.Timestamp && bVal instanceof admin.firestore.Timestamp) {
        return sortOrder === 'asc' 
          ? aVal.toMillis() - bVal.toMillis()
          : bVal.toMillis() - aVal.toMillis();
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    const totalCount = allLogs.length;
    const logs = allLogs.slice(offset, offset + limit);

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

exports.getAuditLogStats = onCall(async (request) => {
  const { auth, data } = request;
  
  if (!auth) {
    throw new Error('UNAUTHENTICATED: User must be authenticated');
  }

  try {
    const userId = auth.uid;
    const userDoc = await getDb().collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new Error('NOT_FOUND: User not found');
    }

    const userData = userDoc.data();
    const isAdmin = userData.role === 'dmv_admin' || userData.role === 'super_admin';
    const isInstructor = userData.role === 'instructor';

    if (!isAdmin && !isInstructor) {
      throw new Error('PERMISSION_DENIED: Only admins and instructors can access audit logs');
    }

    let { startDate, endDate } = data;

    if (!startDate || !endDate) {
      throw new Error('BAD_REQUEST: startDate and endDate are required');
    }

    if (typeof startDate === 'string') {
      startDate = admin.firestore.Timestamp.fromDate(new Date(startDate));
    }
    if (typeof endDate === 'string') {
      endDate = admin.firestore.Timestamp.fromDate(new Date(endDate));
    }

    if (!startDate || !endDate || typeof startDate.toMillis !== 'function' || typeof endDate.toMillis !== 'function') {
      throw new Error('BAD_REQUEST: startDate and endDate must be valid Firestore Timestamps');
    }

    const snapshot = await getDb().collection('auditLogs')
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
      const docData = doc.data();

      stats.byStatus[docData.status] = (stats.byStatus[docData.status] || 0) + 1;
      stats.byAction[docData.action] = (stats.byAction[docData.action] || 0) + 1;
      stats.byResource[docData.resource] = (stats.byResource[docData.resource] || 0) + 1;
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

exports.getUserAuditTrail = onCall(async (request) => {
  const { auth, data } = request;
  
  if (!auth) {
    throw new Error('UNAUTHENTICATED: User must be authenticated');
  }

  try {
    const userId = auth.uid;
    const userDoc = await getDb().collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new Error('NOT_FOUND: User not found');
    }

    const userData = userDoc.data();
    const isAdmin = userData.role === 'dmv_admin' || userData.role === 'super_admin';
    const isInstructor = userData.role === 'instructor';

    if (!isAdmin && !isInstructor) {
      throw new Error('PERMISSION_DENIED: Only admins and instructors can access audit logs');
    }

    const { targetUserId } = data;

    const snapshot = await getDb().collection('auditLogs')
      .where('userId', '==', targetUserId)
      .get();

    const trail = [];

    snapshot.forEach(doc => {
      trail.push({
        id: doc.id,
        ...doc.data()
      });
    });

    trail.sort((a, b) => {
      const aTime = a.timestamp instanceof admin.firestore.Timestamp 
        ? a.timestamp.toMillis() 
        : a.timestamp;
      const bTime = b.timestamp instanceof admin.firestore.Timestamp 
        ? b.timestamp.toMillis() 
        : b.timestamp;
      return bTime - aTime;
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
