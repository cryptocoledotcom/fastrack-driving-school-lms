import { auth, db } from '../../config/firebase.js';
import { writeBatch, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection } from 'firebase/firestore';
import { mapFirebaseError, ApiError } from '../errors/ApiError.js';
import loggingService from '../../services/loggingService.js';
import * as validators from '../validators/validators.js';

class ServiceBase {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.validate = validators;
  }

  getCurrentUser() {
    const user = auth.currentUser;
    if (!user) {
      throw new ApiError(
        'AUTH_ERROR',
        'User must be authenticated to perform this operation',
        null
      );
    }
    return user;
  }

  getCurrentUserId() {
    return this.getCurrentUser().uid;
  }

  async getDoc(collectionPath, docId) {
    try {
      const docRef = doc(db, collectionPath, docId);
      const docSnapshot = await getDoc(docRef);
      
      if (!docSnapshot.exists()) {
        throw new ApiError(
          'NOT_FOUND',
          `Document not found: ${collectionPath}/${docId}`,
          null
        );
      }

      return {
        id: docSnapshot.id,
        ...docSnapshot.data()
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw mapFirebaseError(error);
    }
  }

  async getCollection(collectionPath, filters = []) {
    try {
      let queryRef = null;
      
      if (typeof collectionPath === 'string') {
        const segments = collectionPath.split('/');
        if (segments.length % 2 === 1) {
          queryRef = collection(db, collectionPath);
        } else {
          queryRef = doc(db, collectionPath).parent;
        }
      } else {
        queryRef = collectionPath;
      }

      const querySnapshot = await getDocs(queryRef);
      let docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (filters && filters.length > 0) {
        docs = this._applyFilters(docs, filters);
      }

      return docs;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw mapFirebaseError(error);
    }
  }

  _applyFilters(docs, filters) {
    return docs.filter(doc => {
      return filters.every(filter => {
        const { field, operator, value } = filter;
        
        switch (operator) {
          case '==':
            return doc[field] === value;
          case '>':
            return doc[field] > value;
          case '<':
            return doc[field] < value;
          case '>=':
            return doc[field] >= value;
          case '<=':
            return doc[field] <= value;
          case 'in':
            return value.includes(doc[field]);
          case 'array-contains':
            return Array.isArray(doc[field]) && doc[field].includes(value);
          default:
            return true;
        }
      });
    });
  }

  async setDoc(collectionPath, docId, data) {
    try {
      const docRef = doc(db, collectionPath, docId);
      await setDoc(docRef, data, { merge: false });
      return { id: docId, ...data };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw mapFirebaseError(error);
    }
  }

  async updateDoc(collectionPath, docId, updates) {
    try {
      const docRef = doc(db, collectionPath, docId);
      await updateDoc(docRef, updates);
      return { id: docId, ...updates };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw mapFirebaseError(error);
    }
  }

  async deleteDoc(collectionPath, docId) {
    try {
      const docRef = doc(db, collectionPath, docId);
      await deleteDoc(docRef);
      return { id: docId, deleted: true };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw mapFirebaseError(error);
    }
  }

  batch() {
    return writeBatch(db);
  }

  log(message, context = {}) {
    loggingService.log(`[${this.serviceName}] ${message}`, context);
  }

  logError(error, context = {}) {
    const errorContext = {
      ...context,
      serviceName: this.serviceName,
      errorCode: error?.code || 'UNKNOWN'
    };
    loggingService.error(error, errorContext);
  }
}

export default ServiceBase;
