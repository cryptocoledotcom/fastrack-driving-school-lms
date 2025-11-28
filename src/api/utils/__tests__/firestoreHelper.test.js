import {
  mergeOrCreate,
  updateWithTimestampField,
  getDocumentSafely,
  checkDocumentExists,
  updateIfExists,
  createOrUpdate
} from '../firestoreHelper.js';

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, ...path) => ({ path: [...path], _isRef: true })),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  getDoc: jest.fn()
}));

import * as firestoreLib from 'firebase/firestore';

describe('firestoreHelper', () => {
  let mockDb;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = { _isDb: true };
  });

  describe('mergeOrCreate', () => {
    it('should create document with merge by default', async () => {
      await mergeOrCreate(mockDb, 'users', 'user123', { name: 'John' });
      
      expect(firestoreLib.setDoc).toHaveBeenCalled();
      const callArgs = firestoreLib.setDoc.mock.calls[0];
      expect(callArgs[2]).toEqual({ merge: true });
    });

    it('should return data with id', async () => {
      firestoreLib.setDoc.mockResolvedValue(undefined);
      const result = await mergeOrCreate(mockDb, 'users', 'user123', { name: 'John' });
      
      expect(result).toEqual({ id: 'user123', name: 'John' });
    });

    it('should respect merge parameter', async () => {
      await mergeOrCreate(mockDb, 'users', 'user123', { name: 'John' }, false);
      
      const callArgs = firestoreLib.setDoc.mock.calls[0];
      expect(callArgs[2]).toEqual({ merge: false });
    });

    it('should create doc ref with correct path', async () => {
      await mergeOrCreate(mockDb, 'users', 'user123', { name: 'John' });
      
      expect(firestoreLib.doc).toHaveBeenCalledWith(mockDb, 'users', 'user123');
    });
  });

  describe('updateWithTimestampField', () => {
    it('should update document with timestamp', async () => {
      await updateWithTimestampField(mockDb, 'users', 'user123', { status: 'active' });
      
      expect(firestoreLib.updateDoc).toHaveBeenCalled();
      const updateData = firestoreLib.updateDoc.mock.calls[0][1];
      expect(updateData).toHaveProperty('status', 'active');
      expect(updateData).toHaveProperty('updatedAt');
      expect(updateData).toHaveProperty('lastUpdated');
    });

    it('should preserve original data fields', async () => {
      await updateWithTimestampField(mockDb, 'users', 'user123', { name: 'Jane', age: 30 });
      
      const updateData = firestoreLib.updateDoc.mock.calls[0][1];
      expect(updateData.name).toBe('Jane');
      expect(updateData.age).toBe(30);
    });
  });

  describe('getDocumentSafely', () => {
    it('should return data if document exists', async () => {
      const mockData = { name: 'John', age: 30 };
      firestoreLib.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockData
      });
      
      const result = await getDocumentSafely(mockDb, 'users', 'user123');
      
      expect(result).toEqual(mockData);
    });

    it('should return null if document does not exist', async () => {
      firestoreLib.getDoc.mockResolvedValue({
        exists: () => false
      });
      
      const result = await getDocumentSafely(mockDb, 'users', 'user123');
      
      expect(result).toBeNull();
    });

    it('should call getDoc with correct ref', async () => {
      firestoreLib.getDoc.mockResolvedValue({
        exists: () => false
      });
      
      await getDocumentSafely(mockDb, 'users', 'user123');
      
      expect(firestoreLib.doc).toHaveBeenCalledWith(mockDb, 'users', 'user123');
      expect(firestoreLib.getDoc).toHaveBeenCalled();
    });
  });

  describe('checkDocumentExists', () => {
    it('should return true if document exists', async () => {
      firestoreLib.getDoc.mockResolvedValue({
        exists: () => true
      });
      
      const result = await checkDocumentExists(mockDb, 'users', 'user123');
      
      expect(result).toBe(true);
    });

    it('should return false if document does not exist', async () => {
      firestoreLib.getDoc.mockResolvedValue({
        exists: () => false
      });
      
      const result = await checkDocumentExists(mockDb, 'users', 'user123');
      
      expect(result).toBe(false);
    });
  });

  describe('updateIfExists', () => {
    it('should update and return merged data if exists', async () => {
      const existingData = { name: 'John', age: 30 };
      firestoreLib.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => existingData
      });
      
      const result = await updateIfExists(mockDb, 'users', 'user123', { age: 31 });
      
      expect(result).toHaveProperty('name', 'John');
      expect(result).toHaveProperty('age', 31);
      expect(result).toHaveProperty('updatedAt');
      expect(firestoreLib.updateDoc).toHaveBeenCalled();
    });

    it('should return null if document does not exist', async () => {
      firestoreLib.getDoc.mockResolvedValue({
        exists: () => false
      });
      
      const result = await updateIfExists(mockDb, 'users', 'user123', { age: 31 });
      
      expect(result).toBeNull();
      expect(firestoreLib.updateDoc).not.toHaveBeenCalled();
    });

    it('should not update if document does not exist', async () => {
      firestoreLib.getDoc.mockResolvedValue({
        exists: () => false
      });
      
      await updateIfExists(mockDb, 'users', 'user123', { age: 31 });
      
      expect(firestoreLib.updateDoc).not.toHaveBeenCalled();
    });
  });

  describe('createOrUpdate', () => {
    it('should update if document exists', async () => {
      const existingData = { name: 'John' };
      firestoreLib.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => existingData
      });
      
      const result = await createOrUpdate(mockDb, 'users', 'user123', { status: 'active' });
      
      expect(firestoreLib.updateDoc).toHaveBeenCalled();
      expect(result).toHaveProperty('name', 'John');
      expect(result).toHaveProperty('status', 'active');
    });

    it('should create if document does not exist', async () => {
      firestoreLib.getDoc.mockResolvedValue({
        exists: () => false
      });
      
      const result = await createOrUpdate(mockDb, 'users', 'user123', { name: 'Jane' });
      
      expect(firestoreLib.setDoc).toHaveBeenCalled();
      expect(result).toEqual({ id: 'user123', name: 'Jane' });
    });

    it('should merge data correctly on create', async () => {
      firestoreLib.getDoc.mockResolvedValue({
        exists: () => false
      });
      
      await createOrUpdate(mockDb, 'users', 'user123', { name: 'Jane' });
      
      const callArgs = firestoreLib.setDoc.mock.calls[0];
      expect(callArgs[2]).toEqual({ merge: true });
    });

    it('should return document id on update', async () => {
      firestoreLib.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ id: 'user123' })
      });
      
      const result = await createOrUpdate(mockDb, 'users', 'user123', { status: 'active' });
      
      expect(result).toHaveProperty('id', 'user123');
    });
  });
});
