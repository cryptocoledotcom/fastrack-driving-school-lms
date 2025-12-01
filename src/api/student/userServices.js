// User Services
// User profile operations

import { 
  doc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  CollectionReference
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { executeService } from '../base/ServiceWrapper';
import { ValidationError, NotFoundError } from '../errors/ApiError';
import { validateUserId } from '../validators/validators';
import { getUpdatedTimestamp } from '../utils/timestampHelper.js';
import { USER_ROLES } from '../../constants/userRoles';
export { getUserStats } from './progressServices';

const USERS_COLLECTION = 'users';

export const getUser = async (userId) => {
  return executeService(async () => {
    validateUserId(userId);
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new NotFoundError('User', userId);
    }
    
    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  }, 'getUser');
};

export const updateProfile = async (userId, updates) => {
  return executeService(async () => {
    validateUserId(userId);
    if (typeof updates !== 'object' || !updates) {
      throw new ValidationError('Updates must be a valid object');
    }
    
    const userRef = doc(db, USERS_COLLECTION, userId);
    const updateData = {
      ...updates,
      ...getUpdatedTimestamp()
    };
    
    await updateDoc(userRef, updateData);
    
    return await getUser(userId);
  }, 'updateProfile');
};

export const updateUserSettings = async (userId, settings) => {
  return executeService(async () => {
    validateUserId(userId);
    if (typeof settings !== 'object' || !settings) {
      throw new ValidationError('Settings must be a valid object');
    }
    
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      settings: settings,
      ...getUpdatedTimestamp()
    });
    
    return await getUser(userId);
  }, 'updateUserSettings');
};

export const getUserSettings = async (userId) => {
  return executeService(async () => {
    validateUserId(userId);
    const user = await getUser(userId);
    return user.settings || {
      darkMode: false,
      notifications: true,
      emailNotifications: true
    };
  }, 'getUserSettings');
};

export const getUserCertificates = async (userId) => {
  return executeService(async () => {
    validateUserId(userId);
    const certificatesRef = collection(db, 'certificates');
    const q = query(certificatesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const certificates = [];
    querySnapshot.forEach((doc) => {
      certificates.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return certificates;
  }, 'getUserCertificates');
};

export const updateUserPreferences = async (userId, preferences) => {
  return executeService(async () => {
    validateUserId(userId);
    if (typeof preferences !== 'object' || !preferences) {
      throw new ValidationError('Preferences must be a valid object');
    }
    
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      preferences: preferences,
      ...getUpdatedTimestamp()
    });
    
    return await getUser(userId);
  }, 'updateUserPreferences');
};

export const getUserRecentActivity = async (userId, limit = 10) => {
  return executeService(async () => {
    validateUserId(userId);
    if (typeof limit !== 'number' || limit < 1) {
      throw new ValidationError('Limit must be a positive number');
    }
    
    const progressRef = collection(db, 'progress');
    const q = query(
      progressRef,
      where('userId', '==', userId),
      where('lastAccessedAt', '!=', null)
    );
    const querySnapshot = await getDocs(q);
    
    const activities = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.lastAccessedAt) {
        activities.push({
          courseId: data.courseId,
          lastAccessedAt: data.lastAccessedAt,
          overallProgress: data.overallProgress
        });
      }
    });
    
    activities.sort((a, b) => 
      new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt)
    );
    
    return activities.slice(0, limit);
  }, 'getUserRecentActivity');
};

export const isUsernameAvailable = async (username) => {
  return executeService(async () => {
    if (typeof username !== 'string' || !username.trim()) {
      throw new ValidationError('Username must be a non-empty string');
    }
    
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.empty;
  }, 'isUsernameAvailable');
};

export const getUserByUsername = async (username) => {
  return executeService(async () => {
    if (typeof username !== 'string' || !username.trim()) {
      throw new ValidationError('Username must be a non-empty string');
    }
    
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new NotFoundError('User with username', username);
    }
    
    const userDoc = querySnapshot.docs[0];
    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  }, 'getUserByUsername');
};

export const updateUserRole = async (userId, role) => {
  return executeService(async () => {
    validateUserId(userId);
    if (typeof role !== 'string' || !role.trim()) {
      throw new ValidationError('Role must be a non-empty string');
    }
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role,
      ...getUpdatedTimestamp()
    });
    
    return await getUser(userId);
  }, 'updateUserRole');
};

export const getAllStudents = async () => {
  return executeService(async () => {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('role', '==', USER_ROLES.STUDENT));
    const querySnapshot = await getDocs(q);
    
    const students = [];
    querySnapshot.forEach((doc) => {
      students.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return students.sort((a, b) => {
      const nameA = (a.displayName || a.email || '').toLowerCase();
      const nameB = (b.displayName || b.email || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, 'getAllStudents');
};

const userServices = {
  getUser,
  updateProfile,
  getUserCertificates,
  updateUserPreferences,
  getUserRecentActivity,
  isUsernameAvailable,
  getUserByUsername,
  updateUserSettings,
  getUserSettings,
  updateUserRole,
  getAllStudents
};

export default userServices;
