// Authentication Context
// Manages user authentication state and provides auth methods throughout the app

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { USER_ROLES } from '../constants/userRoles';

const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);

  // Apply theme based on preference
  const applyTheme = (isDarkMode) => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
    }
  };

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  };

  // Create user profile in Firestore
  const createUserProfile = async (uid, data) => {
    try {
      const userRef = doc(db, 'users', uid);
      const profileData = {
        uid,
        email: data.email,
        displayName: data.displayName || '',
        role: data.role || USER_ROLES.STUDENT,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data
      };
      await setDoc(userRef, profileData);
      return profileData;
    } catch (err) {
      console.error('Error creating user profile:', err);
      throw err;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        let profile = await fetchUserProfile(firebaseUser.uid);
        
        // If profile doesn't exist, create it with default role
        if (!profile) {
          profile = await createUserProfile(firebaseUser.uid, {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || ''
          });
        }
        
        setUserProfile(profile);
        
        // Check if user needs to change password
        if (profile?.requiresPasswordChange) {
          setRequiresPasswordChange(true);
          setShowPasswordChangeModal(true);
        } else {
          setRequiresPasswordChange(false);
          setShowPasswordChangeModal(false);
        }
        
        // Apply theme from user settings
        const settings = profile?.settings || {
          darkMode: false,
          notifications: true,
          emailNotifications: true
        };
        applyTheme(settings.darkMode);
      } else {
        setUser(null);
        setUserProfile(null);
        setRequiresPasswordChange(false);
        setShowPasswordChangeModal(false);
        // Default to light mode for unauthenticated users
        applyTheme(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Login with email and password
  const login = async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      let profile = await fetchUserProfile(result.user.uid);
      
      // If profile doesn't exist, create it
      if (!profile) {
        profile = await createUserProfile(result.user.uid, {
          email: result.user.email,
          displayName: result.user.displayName || ''
        });
      }
      
      setUserProfile(profile);
      return result.user;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // Register new user
  const register = async (email, password, additionalData = {}) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name if provided
      if (additionalData.displayName) {
        await updateProfile(result.user, {
          displayName: additionalData.displayName
        });
      }

      // Create user profile in Firestore
      const profile = await createUserProfile(result.user.uid, {
        email,
        displayName: additionalData.displayName || '',
        ...additionalData
      });
      
      setUserProfile(profile);
      return result.user;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user profile exists, if not create one
      let profile = await fetchUserProfile(result.user.uid);
      if (!profile) {
        profile = await createUserProfile(result.user.uid, {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL
        });
      }
      
      setUserProfile(profile);
      return result.user;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    try {
      setError(null);
      if (!user) throw new Error('No user logged in');

      // Update Firebase Auth profile if display name or photo URL changed
      if (updates.displayName || updates.photoURL) {
        await updateProfile(user, {
          displayName: updates.displayName || user.displayName,
          photoURL: updates.photoURL || user.photoURL
        });
      }

      // Update Firestore profile
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      // Refresh user profile
      const updatedProfile = await fetchUserProfile(user.uid);
      setUserProfile(updatedProfile);
      
      return updatedProfile;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    if (!userProfile) return false;
    if (Array.isArray(role)) {
      return role.includes(userProfile.role);
    }
    return userProfile.role === role;
  };

  // Get user's full name
  const getUserFullName = () => {
    if (!userProfile) return '';
    return userProfile.displayName || userProfile.email?.split('@')[0] || 'User';
  };

  const value = {
    user,
    userProfile,
    loading,
    error,
    requiresPasswordChange,
    showPasswordChangeModal,
    setShowPasswordChangeModal,
    login,
    register,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    hasRole,
    getUserFullName,
    isAuthenticated: !!user,
    isAdmin: hasRole([USER_ROLES.DMV_ADMIN, USER_ROLES.SUPER_ADMIN]),
    isInstructor: hasRole(USER_ROLES.INSTRUCTOR),
    isStudent: hasRole(USER_ROLES.STUDENT)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;