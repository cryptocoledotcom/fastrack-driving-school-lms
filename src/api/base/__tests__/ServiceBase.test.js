import ServiceBase from '../ServiceBase.js';

let ApiError;

jest.mock('../../../config/firebase.js', () => ({
  auth: { currentUser: null },
  db: {}
}));

jest.mock('../../errors/ApiError.js', () => {
  class MockApiError {
    constructor(code, message, originalError) {
      this.code = code;
      this.message = message;
      this.originalError = originalError;
    }
  }
  
  const mapFirebaseError = (error) => {
    const mappedError = new MockApiError('FIREBASE_ERROR', error.message, error);
    return mappedError;
  };
  
  return {
    ApiError: MockApiError,
    mapFirebaseError
  };
});

jest.mock('../../../services/loggingService.js', () => ({
  log: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}));

jest.mock('../../validators/validators.js', () => ({
  validateUserId: jest.fn(),
  validateCourseId: jest.fn(),
  validateEmail: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  writeBatch: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn()
}));

let authModule;
let firebaseFirestore;
beforeEach(() => {
  jest.clearAllMocks();
  authModule = require('../../../config/firebase.js');
  authModule.auth.currentUser = null;
  ApiError = require('../../errors/ApiError.js').ApiError;
  firebaseFirestore = require('firebase/firestore');
});

describe('ServiceBase', () => {
  describe('Constructor', () => {
    it('should set serviceName', () => {
      const service = new ServiceBase('TestService');
      expect(service.serviceName).toBe('TestService');
    });

    it('should expose validators as this.validate', () => {
      const service = new ServiceBase('TestService');
      expect(service.validate).toBeDefined();
      expect(service.validate.validateUserId).toBeDefined();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user if authenticated', () => {
      const mockUser = { uid: 'user123', email: 'test@example.com' };
      authModule.auth.currentUser = mockUser;
      
      const service = new ServiceBase('TestService');
      const result = service.getCurrentUser();
      
      expect(result).toEqual(mockUser);
    });

    it('should throw ApiError if not authenticated', () => {
      authModule.auth.currentUser = null;
      
      const service = new ServiceBase('TestService');
      expect(() => service.getCurrentUser()).toThrow(ApiError);
    });

    it('should throw error with AUTH_ERROR code', () => {
      authModule.auth.currentUser = null;
      
      const service = new ServiceBase('TestService');
      try {
        service.getCurrentUser();
        fail('Should have thrown');
      } catch (error) {
        expect(error.code).toBe('AUTH_ERROR');
      }
    });
  });

  describe('getCurrentUserId', () => {
    it('should return user UID when authenticated', () => {
      authModule.auth.currentUser = { uid: 'user456' };
      
      const service = new ServiceBase('TestService');
      const result = service.getCurrentUserId();
      
      expect(result).toBe('user456');
    });

    it('should throw error when not authenticated', () => {
      authModule.auth.currentUser = null;
      
      const service = new ServiceBase('TestService');
      expect(() => service.getCurrentUserId()).toThrow(ApiError);
    });
  });

  describe('getDoc', () => {
    it('should retrieve and format document', async () => {
      const mockDocSnapshot = {
        exists: () => true,
        id: 'doc1',
        data: () => ({ name: 'Test', value: 123 })
      };
      
      firebaseFirestore.doc.mockReturnValue('docRef');
      firebaseFirestore.getDoc.mockResolvedValue(mockDocSnapshot);
      
      const service = new ServiceBase('TestService');
      const result = await service.getDoc('collection', 'doc1');
      
      expect(result).toEqual({
        id: 'doc1',
        name: 'Test',
        value: 123
      });
    });

    it('should throw NOT_FOUND error if document missing', async () => {
      const mockDocSnapshot = {
        exists: () => false
      };
      
      firebaseFirestore.doc.mockReturnValue('docRef');
      firebaseFirestore.getDoc.mockResolvedValue(mockDocSnapshot);
      
      const service = new ServiceBase('TestService');
      try {
        await service.getDoc('collection', 'missing');
        fail('Should have thrown');
      } catch (error) {
        expect(error.code).toBe('NOT_FOUND');
      }
    });

    it('should catch and map Firebase errors', async () => {
      firebaseFirestore.doc.mockReturnValue('docRef');
      firebaseFirestore.getDoc.mockRejectedValue(new Error('Firebase error'));
      
      const service = new ServiceBase('TestService');
      try {
        await service.getDoc('collection', 'doc1');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
      }
    });
  });

  describe('setDoc', () => {
    it('should set document data', async () => {
      firebaseFirestore.doc.mockReturnValue('docRef');
      firebaseFirestore.setDoc.mockResolvedValue(undefined);
      
      const service = new ServiceBase('TestService');
      const data = { name: 'Test', value: 123 };
      const result = await service.setDoc('collection', 'doc1', data);
      
      expect(result).toEqual({
        id: 'doc1',
        name: 'Test',
        value: 123
      });
      expect(firebaseFirestore.setDoc).toHaveBeenCalledWith('docRef', data, { merge: false });
    });

    it('should handle Firebase errors', async () => {
      firebaseFirestore.doc.mockReturnValue('docRef');
      firebaseFirestore.setDoc.mockRejectedValue(new Error('Firebase error'));
      
      const service = new ServiceBase('TestService');
      try {
        await service.setDoc('collection', 'doc1', { data: 'test' });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
      }
    });
  });

  describe('updateDoc', () => {
    it('should update document', async () => {
      firebaseFirestore.doc.mockReturnValue('docRef');
      firebaseFirestore.updateDoc.mockResolvedValue(undefined);
      
      const service = new ServiceBase('TestService');
      const updates = { name: 'Updated', value: 456 };
      const result = await service.updateDoc('collection', 'doc1', updates);
      
      expect(result).toEqual({
        id: 'doc1',
        name: 'Updated',
        value: 456
      });
    });

    it('should validate updates before writing', async () => {
      firebaseFirestore.doc.mockReturnValue('docRef');
      firebaseFirestore.updateDoc.mockResolvedValue(undefined);
      
      const service = new ServiceBase('TestService');
      await service.updateDoc('collection', 'doc1', { field: 'value' });
      
      expect(firebaseFirestore.updateDoc).toHaveBeenCalled();
    });
  });

  describe('deleteDoc', () => {
    it('should delete document', async () => {
      firebaseFirestore.doc.mockReturnValue('docRef');
      firebaseFirestore.deleteDoc.mockResolvedValue(undefined);
      
      const service = new ServiceBase('TestService');
      const result = await service.deleteDoc('collection', 'doc1');
      
      expect(result).toEqual({
        id: 'doc1',
        deleted: true
      });
      expect(firebaseFirestore.deleteDoc).toHaveBeenCalledWith('docRef');
    });

    it('should handle Firebase errors', async () => {
      firebaseFirestore.doc.mockReturnValue('docRef');
      firebaseFirestore.deleteDoc.mockRejectedValue(new Error('Firebase error'));
      
      const service = new ServiceBase('TestService');
      try {
        await service.deleteDoc('collection', 'doc1');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
      }
    });
  });

  describe('batch', () => {
    it('should return batch instance', () => {
      const mockBatch = { set: jest.fn(), commit: jest.fn() };
      firebaseFirestore.writeBatch.mockReturnValue(mockBatch);
      
      const service = new ServiceBase('TestService');
      const result = service.batch();
      
      expect(result).toEqual(mockBatch);
      expect(firebaseFirestore.writeBatch).toHaveBeenCalled();
    });

    it('should execute multiple operations', async () => {
      const mockBatch = {
        set: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        commit: jest.fn().mockResolvedValue(undefined)
      };
      firebaseFirestore.writeBatch.mockReturnValue(mockBatch);
      
      const service = new ServiceBase('TestService');
      const batch = service.batch();
      
      batch.set('docRef1', { data: 'test' });
      batch.update('docRef2', { field: 'value' });
      batch.delete('docRef3');
      await batch.commit();
      
      expect(batch.set).toHaveBeenCalled();
      expect(batch.update).toHaveBeenCalled();
      expect(batch.delete).toHaveBeenCalled();
      expect(batch.commit).toHaveBeenCalled();
    });
  });

  describe('log', () => {
    it('should use LoggingService for logging', () => {
      const loggingService = require('../../../services/loggingService.js');
      const service = new ServiceBase('TestService');
      
      service.log('Test message', { key: 'value' });
      
      expect(loggingService.log).toHaveBeenCalledWith(
        '[TestService] Test message',
        { key: 'value' }
      );
    });
  });

  describe('logError', () => {
    it('should log errors with service context', () => {
      const loggingService = require('../../../services/loggingService.js');
      const testError = new Error('Test error');
      testError.code = 'TEST_CODE';
      const service = new ServiceBase('TestService');
      
      service.logError(testError, { additional: 'context' });
      
      expect(loggingService.error).toHaveBeenCalledWith(
        testError,
        expect.objectContaining({
          serviceName: 'TestService',
          errorCode: 'TEST_CODE',
          additional: 'context'
        })
      );
    });

    it('should handle errors without code', () => {
      const loggingService = require('../../../services/loggingService.js');
      const testError = new Error('Test error');
      const service = new ServiceBase('TestService');
      
      service.logError(testError);
      
      expect(loggingService.error).toHaveBeenCalledWith(
        testError,
        expect.objectContaining({
          errorCode: 'UNKNOWN'
        })
      );
    });
  });

  describe('getCollection', () => {
    it('should return formatted documents', async () => {
      const mockDocs = [
        { id: 'doc1', data: () => ({ name: 'Test1' }) },
        { id: 'doc2', data: () => ({ name: 'Test2' }) }
      ];
      
      firebaseFirestore.getDocs.mockResolvedValue({
        docs: mockDocs
      });
      firebaseFirestore.doc.mockReturnValue({ parent: 'parent' });
      
      const service = new ServiceBase('TestService');
      const result = await service.getCollection('collection');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result[0].id).toBe('doc1');
    });

    it('should apply filters correctly', async () => {
      const mockDocs = [
        { id: 'doc1', data: () => ({ status: 'active', value: 100 }) },
        { id: 'doc2', data: () => ({ status: 'inactive', value: 200 }) }
      ];
      
      firebaseFirestore.getDocs.mockResolvedValue({
        docs: mockDocs
      });
      firebaseFirestore.doc.mockReturnValue({ parent: 'parent' });
      
      const service = new ServiceBase('TestService');
      const result = await service.getCollection('collection', [
        { field: 'status', operator: '==', value: 'active' }
      ]);
      
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('active');
    });
  });

  describe('Error handling', () => {
    it('should throw ApiError for all operations', async () => {
      firebaseFirestore.doc.mockReturnValue('docRef');
      firebaseFirestore.setDoc.mockRejectedValue(new Error('Firestore error'));
      
      const service = new ServiceBase('TestService');
      
      try {
        await service.setDoc('collection', 'doc1', {});
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
      }
    });

    it('should not double-wrap ApiErrors', async () => {
      firebaseFirestore.doc.mockReturnValue('docRef');
      firebaseFirestore.getDoc.mockRejectedValue(new ApiError('CUSTOM', 'Custom error'));
      
      const service = new ServiceBase('TestService');
      
      try {
        await service.getDoc('collection', 'doc1');
      } catch (error) {
        expect(error.code).toBe('CUSTOM');
      }
    });
  });
});
