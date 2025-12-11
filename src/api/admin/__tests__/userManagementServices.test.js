import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { vi } from 'vitest';
import { db } from '../../../config/firebase';
import userManagementServices from '../userManagementServices';
import { USER_ROLES } from '../../../constants/userRoles';

vi.mock('firebase/firestore');
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(),
}));

import { httpsCallable } from 'firebase/functions';

describe('User Management Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default success mock for cloud functions
    vi.mocked(httpsCallable).mockReturnValue(() => Promise.resolve({ data: { success: true, oldRole: 'STUDENT', newRole: 'DMV_ADMIN' } }));
  });

  describe('getAllUsers', () => {
    it('should fetch and return all users', async () => {
      const mockUsers = [
        { uid: 'uid1', displayName: 'User 1', email: 'user1@test.com', role: USER_ROLES.STUDENT },
        { uid: 'uid2', displayName: 'User 2', email: 'user2@test.com', role: USER_ROLES.DMV_ADMIN },
      ];

      const mockSnapshot = {
        docs: mockUsers.map(user => ({
          id: user.uid,
          data: () => ({ displayName: user.displayName, email: user.email, role: user.role }),
        })),
      };

      getDocs.mockResolvedValue(mockSnapshot);

      const result = await userManagementServices.getAllUsers();

      expect(result).toEqual(mockUsers);
      expect(getDocs).toHaveBeenCalledWith(collection(db, 'users'));
    });

    it('should handle empty user list', async () => {
      getDocs.mockResolvedValue({ docs: [] });

      const result = await userManagementServices.getAllUsers();

      expect(result).toEqual([]);
    });

    it('should throw error on fetch failure', async () => {
      const error = new Error('Firestore error');
      getDocs.mockRejectedValue(error);

      await expect(userManagementServices.getAllUsers()).rejects.toThrow('Firestore error');
    });
  });

  describe('getUserById', () => {
    it('should fetch user by ID', async () => {
      const userId = 'uid123';
      const userData = { displayName: 'Test User', email: 'test@test.com', role: USER_ROLES.STUDENT };

      const mockDocSnapshot = {
        exists: () => true,
        id: userId,
        data: () => userData,
      };

      getDoc.mockResolvedValue(mockDocSnapshot);

      const result = await userManagementServices.getUserById(userId);

      expect(result).toEqual({ uid: userId, ...userData });
      expect(getDoc).toHaveBeenCalledWith(doc(db, 'users', userId));
    });

    it('should return null if user does not exist', async () => {
      const mockDocSnapshot = {
        exists: () => false,
      };

      getDoc.mockResolvedValue(mockDocSnapshot);

      const result = await userManagementServices.getUserById('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error on fetch failure', async () => {
      const error = new Error('Firestore error');
      getDoc.mockRejectedValue(error);

      await expect(userManagementServices.getUserById('uid123')).rejects.toThrow('Firestore error');
    });
  });

  describe('updateUserRole', () => {
    it('should update user role and log activity', async () => {
      const userId = 'uid123';
      const adminId = 'admin123';
      const newRole = USER_ROLES.DMV_ADMIN;
      const oldRole = USER_ROLES.STUDENT;

      const mockUserDoc = {
        exists: () => true,
        data: () => ({ role: oldRole, email: 'test@test.com' }),
      };

      getDoc.mockResolvedValue(mockUserDoc);
      updateDoc.mockResolvedValue(undefined);
      addDoc.mockResolvedValue({ id: 'log123' });

      const result = await userManagementServices.updateUserRole(userId, newRole, adminId);

      expect(result.role).toBe(newRole);
      // Expectation removed: updateUserRole uses Cloud Function, not direct updateDoc

      expect(addDoc).toHaveBeenCalledWith(
        collection(db, 'activityLogs'),
        expect.objectContaining({
          type: 'ROLE_CHANGED',
          targetUserId: userId,
          performedByAdminId: adminId,
        })
      );
    });

    it('should throw error for invalid role', async () => {
      await expect(
        userManagementServices.updateUserRole('uid123', 'invalid_role', 'admin123')
      ).rejects.toThrow('Invalid role');
    });

    it('should throw error if user not found', async () => {
      // Mock cloud function returning failure
      const mockSetUserRole = vi.fn().mockResolvedValue({
        data: { success: false, message: 'User not found' }
      });
      httpsCallable.mockReturnValue(mockSetUserRole);

      await expect(
        userManagementServices.updateUserRole('nonexistent', USER_ROLES.DMV_ADMIN, 'admin123')
      ).rejects.toThrow('User not found');
    });
  });

  describe('logActivity', () => {
    it('should log activity with timestamp', async () => {
      const activityData = {
        type: 'ROLE_CHANGED',
        targetUserId: 'uid123',
        performedByAdminId: 'admin123',
      };

      addDoc.mockResolvedValue({ id: 'log123' });

      const result = await userManagementServices.logActivity(activityData);

      expect(result.id).toBe('log123');
      expect(result.type).toBe('ROLE_CHANGED');
      expect(addDoc).toHaveBeenCalledWith(
        collection(db, 'activityLogs'),
        expect.objectContaining(activityData)
      );
    });

    it('should throw error on log failure', async () => {
      const error = new Error('Failed to log');
      addDoc.mockRejectedValue(error);

      await expect(
        userManagementServices.logActivity({ type: 'TEST' })
      ).rejects.toThrow('Failed to log');
    });
  });

  describe('getActivityLogs', () => {
    it('should fetch all activity logs', async () => {
      const mockLogs = [
        { id: 'log1', type: 'ROLE_CHANGED', timestamp: new Date() },
        { id: 'log2', type: 'USER_DELETED', timestamp: new Date() },
      ];

      const mockSnapshot = {
        docs: mockLogs.map(log => ({
          id: log.id,
          data: () => ({ type: log.type, timestamp: log.timestamp }),
        })),
      };

      getDocs.mockResolvedValue(mockSnapshot);

      const result = await userManagementServices.getActivityLogs();

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('ROLE_CHANGED');
    });

    it('should filter logs by targetUserId', async () => {
      const userId = 'uid123';
      const mockSnapshot = { docs: [] };
      getDocs.mockResolvedValue(mockSnapshot);

      await userManagementServices.getActivityLogs({ targetUserId: userId });

      expect(getDocs).toHaveBeenCalled();
    });

    it('should filter logs by type', async () => {
      const mockSnapshot = { docs: [] };
      getDocs.mockResolvedValue(mockSnapshot);

      await userManagementServices.getActivityLogs({ type: 'ROLE_CHANGED' });

      expect(getDocs).toHaveBeenCalled();
    });

    it('should throw error on fetch failure', async () => {
      const error = new Error('Firestore error');
      getDocs.mockRejectedValue(error);

      await expect(userManagementServices.getActivityLogs()).rejects.toThrow('Firestore error');
    });
  });

  describe('getUserActivityHistory', () => {
    it('should fetch user activity history', async () => {
      const userId = 'uid123';
      const mockLogs = [
        { id: 'log1', type: 'ROLE_CHANGED', targetUserId: userId },
        { id: 'log2', type: 'USER_DELETED', targetUserId: userId },
      ];

      const mockSnapshot = {
        docs: mockLogs.map(log => ({
          id: log.id,
          data: () => ({ type: log.type, targetUserId: log.targetUserId }),
        })),
      };

      getDocs.mockResolvedValue(mockSnapshot);

      const result = await userManagementServices.getUserActivityHistory(userId);

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('ROLE_CHANGED');
    });

    it('should throw error on fetch failure', async () => {
      const error = new Error('Firestore error');
      getDocs.mockRejectedValue(error);

      await expect(
        userManagementServices.getUserActivityHistory('uid123')
      ).rejects.toThrow('Firestore error');
    });
  });

  describe('getAdminActivityHistory', () => {
    it('should fetch admin activity history', async () => {
      const adminId = 'admin123';
      const mockLogs = [
        { id: 'log1', type: 'ROLE_CHANGED', performedByAdminId: adminId },
      ];

      const mockSnapshot = {
        docs: mockLogs.map(log => ({
          id: log.id,
          data: () => ({ type: log.type, performedByAdminId: log.performedByAdminId }),
        })),
      };

      getDocs.mockResolvedValue(mockSnapshot);

      const result = await userManagementServices.getAdminActivityHistory(adminId);

      expect(result).toHaveLength(1);
    });

    it('should throw error on fetch failure', async () => {
      const error = new Error('Firestore error');
      getDocs.mockRejectedValue(error);

      await expect(
        userManagementServices.getAdminActivityHistory('admin123')
      ).rejects.toThrow('Firestore error');
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user and log activity', async () => {
      const userId = 'uid123';
      const adminId = 'admin123';

      updateDoc.mockResolvedValue(undefined);
      addDoc.mockResolvedValue({ id: 'log123' });

      const result = await userManagementServices.deleteUser(userId, adminId);

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalledWith(
        doc(db, 'users', userId),
        expect.objectContaining({ deleted: true })
      );
      expect(addDoc).toHaveBeenCalledWith(
        collection(db, 'activityLogs'),
        expect.objectContaining({
          type: 'USER_DELETED',
          targetUserId: userId,
          performedByAdminId: adminId,
        })
      );
    });

    it('should throw error on delete failure', async () => {
      const error = new Error('Failed to delete');
      updateDoc.mockRejectedValue(error);

      await expect(
        userManagementServices.deleteUser('uid123', 'admin123')
      ).rejects.toThrow('Failed to delete');
    });
  });

  describe('restoreUser', () => {
    it('should restore deleted user and log activity', async () => {
      const userId = 'uid123';
      const adminId = 'admin123';

      updateDoc.mockResolvedValue(undefined);
      addDoc.mockResolvedValue({ id: 'log123' });

      const result = await userManagementServices.restoreUser(userId, adminId);

      expect(result.success).toBe(true);
      expect(updateDoc).toHaveBeenCalledWith(
        doc(db, 'users', userId),
        expect.objectContaining({ deleted: false })
      );
      expect(addDoc).toHaveBeenCalledWith(
        collection(db, 'activityLogs'),
        expect.objectContaining({
          type: 'USER_RESTORED',
          targetUserId: userId,
          performedByAdminId: adminId,
        })
      );
    });

    it('should throw error on restore failure', async () => {
      const error = new Error('Failed to restore');
      updateDoc.mockRejectedValue(error);

      await expect(
        userManagementServices.restoreUser('uid123', 'admin123')
      ).rejects.toThrow('Failed to restore');
    });
  });

  describe('getUserStats', () => {
    it('should calculate user statistics by role', async () => {
      const mockUsers = [
        { id: 'uid1', role: USER_ROLES.STUDENT },
        { id: 'uid2', role: USER_ROLES.STUDENT },
        { id: 'uid3', role: USER_ROLES.DMV_ADMIN },
        { id: 'uid4', role: USER_ROLES.SUPER_ADMIN },
      ];

      const mockSnapshot = {
        docs: mockUsers.map(user => ({
          id: user.id,
          data: () => ({ role: user.role }),
        })),
      };

      getDocs.mockResolvedValue(mockSnapshot);

      const result = await userManagementServices.getUserStats();

      expect(result.totalUsers).toBe(4);
      expect(result.byRole[USER_ROLES.STUDENT]).toBe(2);
      expect(result.byRole[USER_ROLES.DMV_ADMIN]).toBe(1);
      expect(result.byRole[USER_ROLES.SUPER_ADMIN]).toBe(1);
      expect(result.active).toBe(4);
    });

    it('should count deleted users', async () => {
      const mockUsers = [
        { id: 'uid1', role: USER_ROLES.STUDENT, deleted: false },
        { id: 'uid2', role: USER_ROLES.STUDENT, deleted: true },
      ];

      const mockSnapshot = {
        docs: mockUsers.map(user => ({
          id: user.id,
          data: () => ({ role: user.role, deleted: user.deleted }),
        })),
      };

      getDocs.mockResolvedValue(mockSnapshot);

      const result = await userManagementServices.getUserStats();

      expect(result.deleted).toBe(1);
      expect(result.active).toBe(1);
    });

    it('should throw error on fetch failure', async () => {
      const error = new Error('Firestore error');
      getDocs.mockRejectedValue(error);

      await expect(userManagementServices.getUserStats()).rejects.toThrow('Firestore error');
    });
  });
});
