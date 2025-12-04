import { db } from '../../config/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp,
  getDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { USER_ROLES } from '../../constants/userRoles';

const ACTIVITY_LOG_COLLECTION = 'activityLogs';
const USERS_COLLECTION = 'users';

class UserManagementService {
  async getAllUsers() {
    try {
      const snapshot = await getDocs(collection(db, USERS_COLLECTION));
      const users = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      return users;
    } catch (err) {
      console.error('Error fetching all users:', err);
      throw err;
    }
  }

  async getUserById(uid) {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
      if (userDoc.exists()) {
        return {
          uid: userDoc.id,
          ...userDoc.data()
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching user:', err);
      throw err;
    }
  }

  async updateUserRole(userId, newRole, performedByAdminId) {
    try {
      const validRoles = Object.values(USER_ROLES);
      if (!validRoles.includes(newRole)) {
        throw new Error(`Invalid role: ${newRole}`);
      }

      const userRef = doc(db, USERS_COLLECTION, userId);
      const userData = await getDoc(userRef);
      
      if (!userData.exists()) {
        throw new Error('User not found');
      }

      const oldRole = userData.data().role;

      await updateDoc(userRef, {
        role: newRole,
        updatedAt: serverTimestamp()
      });

      await this.logActivity({
        type: 'ROLE_CHANGED',
        targetUserId: userId,
        performedByAdminId,
        changes: {
          oldRole,
          newRole
        },
        description: `Role changed from ${oldRole} to ${newRole}`
      });

      return {
        uid: userId,
        ...userData.data(),
        role: newRole
      };
    } catch (err) {
      console.error('Error updating user role:', err);
      throw err;
    }
  }

  async logActivity(activityData) {
    try {
      const logEntry = {
        ...activityData,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, ACTIVITY_LOG_COLLECTION), logEntry);
      return {
        id: docRef.id,
        ...logEntry
      };
    } catch (err) {
      console.error('Error logging activity:', err);
      throw err;
    }
  }

  async getActivityLogs(filters = {}) {
    try {
      let q = collection(db, ACTIVITY_LOG_COLLECTION);
      const constraints = [];

      if (filters.targetUserId) {
        constraints.push(where('targetUserId', '==', filters.targetUserId));
      }

      if (filters.performedByAdminId) {
        constraints.push(where('performedByAdminId', '==', filters.performedByAdminId));
      }

      if (filters.type) {
        constraints.push(where('type', '==', filters.type));
      }

      if (constraints.length > 0) {
        q = query(q, ...constraints, orderBy('timestamp', 'desc'), limit(100));
      } else {
        q = query(q, orderBy('timestamp', 'desc'), limit(100));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (err) {
      console.error('Error fetching activity logs:', err);
      throw err;
    }
  }

  async getUserActivityHistory(userId, limitCount = 50) {
    try {
      const q = query(
        collection(db, ACTIVITY_LOG_COLLECTION),
        where('targetUserId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (err) {
      console.error('Error fetching user activity history:', err);
      throw err;
    }
  }

  async getAdminActivityHistory(adminId, limitCount = 50) {
    try {
      const q = query(
        collection(db, ACTIVITY_LOG_COLLECTION),
        where('performedByAdminId', '==', adminId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (err) {
      console.error('Error fetching admin activity history:', err);
      throw err;
    }
  }

  async deleteUser(userId, performedByAdminId) {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      
      await updateDoc(userRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await this.logActivity({
        type: 'USER_DELETED',
        targetUserId: userId,
        performedByAdminId,
        description: 'User account deleted'
      });

      return { success: true };
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  }

  async restoreUser(userId, performedByAdminId) {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      
      await updateDoc(userRef, {
        deleted: false,
        restoredAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await this.logActivity({
        type: 'USER_RESTORED',
        targetUserId: userId,
        performedByAdminId,
        description: 'User account restored'
      });

      return { success: true };
    } catch (err) {
      console.error('Error restoring user:', err);
      throw err;
    }
  }

  async getUserStats() {
    try {
      const snapshot = await getDocs(collection(db, USERS_COLLECTION));
      const users = snapshot.docs.map(doc => doc.data());

      const stats = {
        totalUsers: users.length,
        byRole: {
          [USER_ROLES.STUDENT]: users.filter(u => u.role === USER_ROLES.STUDENT).length,
          [USER_ROLES.INSTRUCTOR]: users.filter(u => u.role === USER_ROLES.INSTRUCTOR).length,
          [USER_ROLES.DMV_ADMIN]: users.filter(u => u.role === USER_ROLES.DMV_ADMIN).length,
          [USER_ROLES.SUPER_ADMIN]: users.filter(u => u.role === USER_ROLES.SUPER_ADMIN).length
        },
        deleted: users.filter(u => u.deleted).length,
        active: users.filter(u => !u.deleted).length
      };

      return stats;
    } catch (err) {
      console.error('Error fetching user stats:', err);
      throw err;
    }
  }

  async createUser(email, temporaryPassword, displayName, performedByAdminId) {
    try {
      const functions = getFunctions();
      const createUserFunction = httpsCallable(functions, 'createUser');
      
      const result = await createUserFunction({
        email,
        temporaryPassword,
        displayName: displayName || email.split('@')[0],
        role: USER_ROLES.DMV_ADMIN
      });

      return result.data;
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  }
}

const userManagementService = new UserManagementService();
export default userManagementService;
