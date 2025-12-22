import { httpsCallable, getFunctions } from 'firebase/functions';

import { executeService } from '../base/ServiceWrapper';

const getCallables = () => {
  const functions = getFunctions();
  return {
    getAuditLogs: httpsCallable(functions, 'getAuditLogs'),
    getAuditLogStats: httpsCallable(functions, 'getAuditLogStats'),
    getUserAuditTrail: httpsCallable(functions, 'getUserAuditTrail'),
  };
};

const auditLogServices = {
  getAuditLogs: async (filters = {}, sortBy = 'timestamp', sortOrder = 'desc', limit = 100, offset = 0) => {
    return executeService(async () => {
      const { getAuditLogs } = getCallables();
      const response = await getAuditLogs({
        filters,
        sortBy,
        sortOrder,
        limit,
        offset
      });

      return response.data;
    }, 'getAuditLogs');
  },

  getAuditLogsByDateRange: async (startDate, endDate) => {
    return executeService(async () => {
      const { getAuditLogs } = getCallables();
      const response = await getAuditLogs({
        filters: { startDate, endDate },
        sortBy: 'timestamp',
        sortOrder: 'desc',
        limit: 1000,
        offset: 0
      });

      return response.data;
    }, 'getAuditLogsByDateRange');
  },

  getAuditLogsByUser: async (userId, limit = 500) => {
    return executeService(async () => {
      const { getAuditLogs } = getCallables();
      const response = await getAuditLogs({
        filters: { userId },
        sortBy: 'timestamp',
        sortOrder: 'desc',
        limit,
        offset: 0
      });

      return response.data;
    }, 'getAuditLogsByUser');
  },

  getAuditLogsByAction: async (action, limit = 500) => {
    return executeService(async () => {
      const { getAuditLogs } = getCallables();
      const response = await getAuditLogs({
        filters: { action },
        sortBy: 'timestamp',
        sortOrder: 'desc',
        limit,
        offset: 0
      });

      return response.data;
    }, 'getAuditLogsByAction');
  },

  getAuditLogsByStatus: async (status, limit = 500) => {
    return executeService(async () => {
      const { getAuditLogs } = getCallables();
      const response = await getAuditLogs({
        filters: { status },
        sortBy: 'timestamp',
        sortOrder: 'desc',
        limit,
        offset: 0
      });

      return response.data;
    }, 'getAuditLogsByStatus');
  },

  getAuditLogStats: async (startDate, endDate) => {
    return executeService(async () => {
      const { getAuditLogStats } = getCallables();
      const response = await getAuditLogStats({
        startDate,
        endDate
      });

      return response.data.stats;
    }, 'getAuditLogStats');
  },

  getUserAuditTrail: async (userId) => {
    return executeService(async () => {
      const { getUserAuditTrail } = getCallables();
      const response = await getUserAuditTrail({
        targetUserId: userId
      });

      return response.data;
    }, 'getUserAuditTrail');
  }
};

export default auditLogServices;
