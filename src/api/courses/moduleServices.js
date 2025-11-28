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
import { db } from '../../config/firebase';
import { executeService } from '../base/ServiceWrapper';
import { ValidationError, ModuleError } from '../errors/ApiError';
import { validateCourseId, validateModuleId } from '../validators/validators';
import { getTimestamps, getUpdatedTimestamp } from '../utils/timestampHelper.js';

const MODULES_COLLECTION = 'modules';

// Get all modules for a course
export const getModules = async (courseId) => {
  return executeService(async () => {
    validateCourseId(courseId);
    
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
  }, 'getModules');
};

// Get module by ID
export const getModuleById = async (moduleId) => {
  return executeService(async () => {
    validateModuleId(moduleId);
    
    const moduleRef = doc(db, MODULES_COLLECTION, moduleId);
    const moduleDoc = await getDoc(moduleRef);
    
    if (!moduleDoc.exists()) {
      throw new ModuleError('Module not found');
    }
    
    return {
      id: moduleDoc.id,
      ...moduleDoc.data()
    };
  }, 'getModuleById');
};

// Create new module
export const createModule = async (moduleData) => {
  return executeService(async () => {
    if (typeof moduleData !== 'object' || !moduleData) {
      throw new ValidationError('Module data must be a valid object');
    }
    
    const modulesRef = collection(db, MODULES_COLLECTION);
    const newModule = {
      ...moduleData,
      ...getTimestamps()
    };
    
    const docRef = await addDoc(modulesRef, newModule);
    return {
      id: docRef.id,
      ...newModule
    };
  }, 'createModule');
};

// Update module
export const updateModule = async (moduleId, updates) => {
  return executeService(async () => {
    validateModuleId(moduleId);
    if (typeof updates !== 'object' || !updates) {
      throw new ValidationError('Updates must be a valid object');
    }
    
    const moduleRef = doc(db, MODULES_COLLECTION, moduleId);
    const updateData = {
      ...updates,
      ...getUpdatedTimestamp()
    };
    
    await updateDoc(moduleRef, updateData);
    
    return await getModuleById(moduleId);
  }, 'updateModule');
};

// Delete module
export const deleteModule = async (moduleId) => {
  return executeService(async () => {
    validateModuleId(moduleId);
    
    const moduleRef = doc(db, MODULES_COLLECTION, moduleId);
    await deleteDoc(moduleRef);
  }, 'deleteModule');
};

// Reorder modules
export const reorderModules = async (courseId, moduleOrders) => {
  return executeService(async () => {
    validateCourseId(courseId);
    if (!Array.isArray(moduleOrders)) {
      throw new ValidationError('Module orders must be an array');
    }
    
    const updatePromises = moduleOrders.map(({ moduleId, order }) => {
      const moduleRef = doc(db, MODULES_COLLECTION, moduleId);
      return updateDoc(moduleRef, { 
        order,
        ...getUpdatedTimestamp()
      });
    });
    
    await Promise.all(updatePromises);
  }, 'reorderModules');
};

// Get module with lessons count
export const getModuleWithStats = async (moduleId) => {
  return executeService(async () => {
    validateModuleId(moduleId);
    
    const module = await getModuleById(moduleId);
    
    const lessonsRef = collection(db, 'lessons');
    const q = query(lessonsRef, where('moduleId', '==', moduleId));
    const lessonsSnapshot = await getDocs(q);
    
    return {
      ...module,
      lessonsCount: lessonsSnapshot.size
    };
  }, 'getModuleWithStats');
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
