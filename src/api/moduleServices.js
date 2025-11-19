// Module Services
// Firestore module operations

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

const MODULES_COLLECTION = 'modules';

// Get all modules for a course
export const getModules = async (courseId) => {
  try {
    const modulesRef = collection(db, MODULES_COLLECTION);
    const q = query(
      modulesRef,
      where('courseId', '==', courseId)
    );
    const querySnapshot = await getDocs(q);
    
    const modules = [];
    querySnapshot.forEach((doc) => {
      modules.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    modules.sort((a, b) => (a.order || 0) - (b.order || 0));
    return modules;
  } catch (error) {
    console.error('Error fetching modules:', error);
    throw error;
  }
};

// Get module by ID
export const getModuleById = async (moduleId) => {
  try {
    const moduleRef = doc(db, MODULES_COLLECTION, moduleId);
    const moduleDoc = await getDoc(moduleRef);
    
    if (!moduleDoc.exists()) {
      throw new Error('Module not found');
    }
    
    return {
      id: moduleDoc.id,
      ...moduleDoc.data()
    };
  } catch (error) {
    console.error('Error fetching module:', error);
    throw error;
  }
};

// Create new module
export const createModule = async (moduleData) => {
  try {
    const modulesRef = collection(db, MODULES_COLLECTION);
    const newModule = {
      ...moduleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(modulesRef, newModule);
    return {
      id: docRef.id,
      ...newModule
    };
  } catch (error) {
    console.error('Error creating module:', error);
    throw error;
  }
};

// Update module
export const updateModule = async (moduleId, updates) => {
  try {
    const moduleRef = doc(db, MODULES_COLLECTION, moduleId);
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(moduleRef, updateData);
    
    // Return updated module
    return await getModuleById(moduleId);
  } catch (error) {
    console.error('Error updating module:', error);
    throw error;
  }
};

// Delete module
export const deleteModule = async (moduleId) => {
  try {
    const moduleRef = doc(db, MODULES_COLLECTION, moduleId);
    await deleteDoc(moduleRef);
  } catch (error) {
    console.error('Error deleting module:', error);
    throw error;
  }
};

// Reorder modules
export const reorderModules = async (courseId, moduleOrders) => {
  try {
    const updatePromises = moduleOrders.map(({ moduleId, order }) => {
      const moduleRef = doc(db, MODULES_COLLECTION, moduleId);
      return updateDoc(moduleRef, { 
        order,
        updatedAt: new Date().toISOString()
      });
    });
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error reordering modules:', error);
    throw error;
  }
};

// Get module with lessons count
export const getModuleWithStats = async (moduleId) => {
  try {
    const module = await getModuleById(moduleId);
    
    // Get lessons count for this module
    const lessonsRef = collection(db, 'lessons');
    const q = query(lessonsRef, where('moduleId', '==', moduleId));
    const lessonsSnapshot = await getDocs(q);
    
    return {
      ...module,
      lessonsCount: lessonsSnapshot.size
    };
  } catch (error) {
    console.error('Error fetching module with stats:', error);
    throw error;
  }
};

const moduleServices = {
  getModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
  getModuleWithStats
};

export default moduleServices;