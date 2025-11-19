// User Services
// User profile operations

import { 
  doc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
export { getUserStats } from './progressServices';

const USERS_COLLECTION = 'users';

// Get user profile by ID
export const getUser = async (userId) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Update user profile
export const updateProfile = async (userId, updates) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(userRef, updateData);
    
    // Return updated user
    return await getUser(userId);
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Update user settings (including dark mode)
export const updateUserSettings = async (userId, settings) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      settings: settings,
      updatedAt: new Date().toISOString()
    });
    
    return await getUser(userId);
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

// Get user settings
export const getUserSettings = async (userId) => {
  try {
    const user = await getUser(userId);
    return user.settings || {
      darkMode: false,
      notifications: true,
      emailNotifications: true
    };
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
};

// Get user's certificates
export const getUserCertificates = async (userId) => {
  try {
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
  } catch (error) {
    console.error('Error fetching certificates:', error);
    throw error;
  }
};

// Update user preferences
export const updateUserPreferences = async (userId, preferences) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      preferences: preferences,
      updatedAt: new Date().toISOString()
    });
    
    return await getUser(userId);
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
};

// Get user's recent activity
export const getUserRecentActivity = async (userId, limit = 10) => {
  try {
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
    
    // Sort by last accessed and limit
    activities.sort((a, b) => 
      new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt)
    );
    
    return activities.slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw error;
  }
};

// Check if username is available
export const isUsernameAvailable = async (username) => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.empty;
  } catch (error) {
    console.error('Error checking username:', error);
    throw error;
  }
};

// Get user by username
export const getUserByUsername = async (username) => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('User not found');
    }
    
    const userDoc = querySnapshot.docs[0];
    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('Error fetching user by username:', error);
    throw error;
  }
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
  getUserSettings
};

export default userServices;