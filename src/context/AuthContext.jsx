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
import { validators } from '../constants/validationRules';

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

  const createFallbackProfile = (uid, email, displayName) => {
    return {
      uid,
      email,
      displayName: displayName || '',
      role: USER_ROLES.STUDENT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  const fetchUserProfile = async (uid, email = '', displayName = '') => {
    const startTime = performance.now();
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore fetch timeout')), 5000)
      );
      
      const fetchPromise = getDoc(doc(db, 'users', uid));
      const userDoc = await Promise.race([fetchPromise, timeoutPromise]);
      
      const fetchTime = performance.now() - startTime;
      console.debug(`Profile fetch for ${uid} completed in ${fetchTime.toFixed(2)}ms`);
      
      if (userDoc.exists()) {
        return userDoc.data();
      }
      
      console.debug(`Profile document does not exist for uid: ${uid}`);
      return null;
    } catch (err) {
      const fetchTime = performance.now() - startTime;
      console.warn(`Profile fetch failed for ${uid} after ${fetchTime.toFixed(2)}ms:`, err.message);
      return createFallbackProfile(uid, email, displayName);
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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Set default profile immediately to unblock loading state
        const defaultProfile = createFallbackProfile(
          firebaseUser.uid,
          firebaseUser.email || '',
          firebaseUser.displayName || ''
        );
        setUserProfile(defaultProfile);
        setLoading(false);
      } else {
        setUser(null);
        setUserProfile(null);
        setRequiresPasswordChange(false);
        setShowPasswordChangeModal(false);
        applyTheme(false);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Non-blocking profile update effect
  useEffect(() => {
    if (!user || !userProfile) return;
    
    const updateProfileAsync = async () => {
      const profile = await fetchUserProfile(
        user.uid,
        user.email || '',
        user.displayName || ''
      );
      
      if (profile) {
        setUserProfile(profile);
        
        if (profile?.requiresPasswordChange) {
          setRequiresPasswordChange(true);
          setShowPasswordChangeModal(true);
        } else {
          setRequiresPasswordChange(false);
          setShowPasswordChangeModal(false);
        }
        
        const settings = profile?.settings || {
          darkMode: false,
          notifications: true,
          emailNotifications: true
        };
        applyTheme(settings.darkMode);
      }
    };
    
    updateProfileAsync().catch(err => 
      console.warn('Background profile update failed:', err)
    );
  }, [user?.uid]);

  // Login with email and password
  const login = async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
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

      // Validate required fields for DTO 0201/0051 compliance
      const requiredFields = ['firstName', 'lastName', 'middleName', 'dateOfBirth', 'tipicNumber', 'address'];
      const missingFields = requiredFields.filter(field => !additionalData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields for registration: ${missingFields.join(', ')}`);
      }

      // If user is under 18, validate parent/guardian contact information
      const age = validators.calculateAge(additionalData.dateOfBirth);
      if (age !== null && age < 18) {
        if (!additionalData.parentGuardian?.email) {
          throw new Error('Parent/Guardian email is required for users under 18');
        }
        if (!additionalData.parentGuardian?.phone) {
          throw new Error('Parent/Guardian phone is required for users under 18');
        }
      }

      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name if provided
      if (additionalData.displayName) {
        await updateProfile(result.user, {
          displayName: additionalData.displayName
        });
      }

      // Create user profile in Firestore and await completion
      await createUserProfile(result.user.uid, {
        email,
        displayName: additionalData.displayName || '',
        ...additionalData
      });
      
      return result.user;
    } catch (err) {
      // If profile creation fails, delete the Auth user to prevent orphaned accounts
      if (auth.currentUser) {
        await auth.currentUser.delete();
      }
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

      // Update Firestore profile and refresh asynchronously
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      // Refresh profile in background
      fetchUserProfile(
        user.uid,
        user.email || '',
        user.displayName || ''
      ).then(updatedProfile => {
        if (updatedProfile) {
          setUserProfile(updatedProfile);
        }
      }).catch(err => console.warn('Profile refresh failed:', err));

      // Return current profile immediately
      return userProfile;
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