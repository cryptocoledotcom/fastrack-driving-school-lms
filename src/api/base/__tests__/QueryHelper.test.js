import QueryHelper from '../QueryHelper.js';

let ApiError;

jest.mock('../../../config/firebase.js', () => ({
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

  return {
    ApiError: MockApiError
  };
});

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  getDocs: jest.fn(),
  getCountFromServer: jest.fn()
}));

let firebaseFirestore;

beforeEach(() => {
  jest.clearAllMocks();
  firebaseFirestore = require('firebase/firestore');
  ApiError = require('../../errors/ApiError.js').ApiError;
});

describe('QueryHelper', () => {
  describe('paginate', () => {
    it('should retrieve first page with pagination metadata', async () => {
      const mockDocs = [
        { id: 'doc1', data: () => ({ name: 'Item 1' }) },
        { id: 'doc2', data: () => ({ name: 'Item 2' }) },
        { id: 'doc3', data: () => ({ name: 'Item 3' }) }
      ];

      firebaseFirestore.collection.mockReturnValue('mockCollection');
      firebaseFirestore.query.mockReturnValue('mockQuery');
      firebaseFirestore.limit.mockReturnValue('limitConstraint');

      const mockCountSnapshot = {
        data: () => ({ count: 10 })
      };

      firebaseFirestore.getCountFromServer.mockResolvedValue(mockCountSnapshot);
      firebaseFirestore.getDocs.mockResolvedValue({
        docs: mockDocs
      });

      const result = await QueryHelper.paginate('courses', 10);

      expect(result).toHaveProperty('docs');
      expect(result).toHaveProperty('total', 10);
      expect(result).toHaveProperty('pageSize', 10);
      expect(result).toHaveProperty('currentPage', 1);
      expect(result).toHaveProperty('totalPages', 1);
      expect(result).toHaveProperty('hasNextPage', false);
      expect(result).toHaveProperty('lastVisible');
      expect(result).toHaveProperty('pageInfo');
      expect(result.pageInfo).toHaveProperty('startIndex', 0);
      expect(result.pageInfo).toHaveProperty('totalResults', 10);
    });

    it('should apply filters when provided', async () => {
      firebaseFirestore.collection.mockReturnValue('mockCollection');
      firebaseFirestore.where.mockReturnValue('filterConstraint');
      firebaseFirestore.query.mockReturnValue('mockQuery');
      firebaseFirestore.limit.mockReturnValue('limitConstraint');

      firebaseFirestore.getCountFromServer.mockResolvedValue({
        data: () => ({ count: 5 })
      });

      firebaseFirestore.getDocs.mockResolvedValue({
        docs: []
      });

      const filters = [{ field: 'category', operator: '==', value: 'electronics' }];
      await QueryHelper.paginate('products', 10, filters);

      expect(firebaseFirestore.where).toHaveBeenCalledWith('category', '==', 'electronics');
    });

    it('should apply ordering when provided', async () => {
      firebaseFirestore.collection.mockReturnValue('mockCollection');
      firebaseFirestore.orderBy.mockReturnValue('orderConstraint');
      firebaseFirestore.query.mockReturnValue('mockQuery');
      firebaseFirestore.limit.mockReturnValue('limitConstraint');

      firebaseFirestore.getCountFromServer.mockResolvedValue({
        data: () => ({ count: 5 })
      });

      firebaseFirestore.getDocs.mockResolvedValue({
        docs: []
      });

      await QueryHelper.paginate('courses', 10, [], 'createdAt', 'desc');

      expect(firebaseFirestore.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('should indicate hasNextPage = true when total > pageSize', async () => {
      firebaseFirestore.collection.mockReturnValue('mockCollection');
      firebaseFirestore.query.mockReturnValue('mockQuery');
      firebaseFirestore.limit.mockReturnValue('limitConstraint');

      firebaseFirestore.getCountFromServer.mockResolvedValue({
        data: () => ({ count: 25 })
      });

      firebaseFirestore.getDocs.mockResolvedValue({
        docs: [{ id: 'doc1', data: () => ({}) }]
      });

      const result = await QueryHelper.paginate('courses', 10);

      expect(result.hasNextPage).toBe(true);
      expect(result.totalPages).toBe(3);
    });

    it('should throw ApiError on query failure', async () => {
      firebaseFirestore.collection.mockReturnValue('mockCollection');
      firebaseFirestore.query.mockReturnValue('mockQuery');

      firebaseFirestore.getCountFromServer.mockRejectedValue(
        new Error('Firestore error')
      );

      try {
        await QueryHelper.paginate('courses', 10);
        fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.code).toBe('FIRESTORE_ERROR');
      }
    });
  });

  describe('getNextPage', () => {
    it('should retrieve next page using cursor', async () => {
      const mockLastVisible = { id: 'cursor-doc' };
      const mockDocs = [
        { id: 'doc4', data: () => ({ name: 'Item 4' }) },
        { id: 'doc5', data: () => ({ name: 'Item 5' }) }
      ];

      firebaseFirestore.collection.mockReturnValue('mockCollection');
      firebaseFirestore.startAfter.mockReturnValue('startAfterConstraint');
      firebaseFirestore.limit.mockReturnValue('limitConstraint');
      firebaseFirestore.query.mockReturnValue('mockQuery');

      firebaseFirestore.getDocs.mockResolvedValue({
        docs: mockDocs
      });

      const result = await QueryHelper.getNextPage('courses', mockLastVisible, 10);

      expect(result).toHaveProperty('docs');
      expect(result).toHaveProperty('pageSize', 10);
      expect(result).toHaveProperty('hasNextPage', true);
      expect(result).toHaveProperty('lastVisible');
      expect(firebaseFirestore.startAfter).toHaveBeenCalledWith(mockLastVisible);
    });

    it('should throw error if lastVisible is null', async () => {
      try {
        await QueryHelper.getNextPage('courses', null, 10);
        fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.code).toBe('PAGINATION_ERROR');
      }
    });

    it('should indicate hasNextPage = false when fewer docs than pageSize returned', async () => {
      const mockLastVisible = { id: 'cursor-doc' };
      const mockDocs = [
        { id: 'doc9', data: () => ({ name: 'Item 9' }) }
      ];

      firebaseFirestore.collection.mockReturnValue('mockCollection');
      firebaseFirestore.startAfter.mockReturnValue('startAfterConstraint');
      firebaseFirestore.limit.mockReturnValue('limitConstraint');
      firebaseFirestore.query.mockReturnValue('mockQuery');

      firebaseFirestore.getDocs.mockResolvedValue({
        docs: mockDocs
      });

      const result = await QueryHelper.getNextPage('courses', mockLastVisible, 10);

      expect(result.hasNextPage).toBe(false);
    });

    it('should throw ApiError on query failure', async () => {
      const mockLastVisible = { id: 'cursor-doc' };

      firebaseFirestore.collection.mockReturnValue('mockCollection');
      firebaseFirestore.startAfter.mockReturnValue('startAfterConstraint');
      firebaseFirestore.limit.mockReturnValue('limitConstraint');
      firebaseFirestore.query.mockReturnValue('mockQuery');

      firebaseFirestore.getDocs.mockRejectedValue(
        new Error('Firestore error')
      );

      try {
        await QueryHelper.getNextPage('courses', mockLastVisible, 10);
        fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.code).toBe('FIRESTORE_ERROR');
      }
    });
  });

  describe('getPageAtIndex', () => {
    it('should retrieve specific page by number', async () => {
      const mockDocs = [
        { id: 'doc11', data: () => ({ name: 'Item 11' }) },
        { id: 'doc12', data: () => ({ name: 'Item 12' }) }
      ];

      firebaseFirestore.collection.mockReturnValue('mockCollection');
      firebaseFirestore.query.mockReturnValue('mockQuery');
      firebaseFirestore.limit.mockReturnValue('limitConstraint');

      firebaseFirestore.getCountFromServer.mockResolvedValue({
        data: () => ({ count: 25 })
      });

      firebaseFirestore.getDocs.mockResolvedValue({
        docs: mockDocs
      });

      const result = await QueryHelper.getPageAtIndex('courses', 2, 10);

      expect(result).toHaveProperty('docs');
      expect(result).toHaveProperty('total', 25);
      expect(result).toHaveProperty('currentPage', 2);
      expect(result).toHaveProperty('totalPages', 3);
      expect(result).toHaveProperty('hasNextPage', true);
      expect(result).toHaveProperty('hasPreviousPage', true);
    });

    it('should throw error if pageNumber < 1', async () => {
      try {
        await QueryHelper.getPageAtIndex('courses', 0, 10);
        fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.code).toBe('PAGINATION_ERROR');
      }
    });

    it('should calculate correct skip count for pagination', async () => {
      firebaseFirestore.collection.mockReturnValue('mockCollection');
      firebaseFirestore.query.mockReturnValue('mockQuery');
      firebaseFirestore.limit.mockReturnValue('limitConstraint');

      firebaseFirestore.getCountFromServer.mockResolvedValue({
        data: () => ({ count: 100 })
      });

      firebaseFirestore.getDocs.mockResolvedValue({
        docs: Array.from({ length: 30 }, (_, i) => ({
          id: `doc${i}`,
          data: () => ({ name: `Item ${i}` })
        }))
      });

      const result = await QueryHelper.getPageAtIndex('courses', 3, 10);

      expect(result.docs.length).toBeLessThanOrEqual(10);
      expect(result.currentPage).toBe(3);
    });

    it('should have hasPreviousPage = false on first page', async () => {
      firebaseFirestore.collection.mockReturnValue('mockCollection');
      firebaseFirestore.query.mockReturnValue('mockQuery');
      firebaseFirestore.limit.mockReturnValue('limitConstraint');

      firebaseFirestore.getCountFromServer.mockResolvedValue({
        data: () => ({ count: 25 })
      });

      firebaseFirestore.getDocs.mockResolvedValue({
        docs: []
      });

      const result = await QueryHelper.getPageAtIndex('courses', 1, 10);

      expect(result.hasPreviousPage).toBe(false);
      expect(result.hasNextPage).toBe(true);
    });

    it('should have hasNextPage = false on last page', async () => {
      firebaseFirestore.collection.mockReturnValue('mockCollection');
      firebaseFirestore.query.mockReturnValue('mockQuery');
      firebaseFirestore.limit.mockReturnValue('limitConstraint');

      firebaseFirestore.getCountFromServer.mockResolvedValue({
        data: () => ({ count: 25 })
      });

      firebaseFirestore.getDocs.mockResolvedValue({
        docs: []
      });

      const result = await QueryHelper.getPageAtIndex('courses', 3, 10);

      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(true);
    });

    it('should throw ApiError on query failure', async () => {
      firebaseFirestore.collection.mockReturnValue('mockCollection');
      firebaseFirestore.query.mockReturnValue('mockQuery');

      firebaseFirestore.getCountFromServer.mockRejectedValue(
        new Error('Firestore error')
      );

      try {
        await QueryHelper.getPageAtIndex('courses', 1, 10);
        fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.code).toBe('FIRESTORE_ERROR');
      }
    });
  });

  describe('getCollectionCount', () => {
    it('should return collection document count', async () => {
      firebaseFirestore.collection.mockReturnValue('mockCollection');
      firebaseFirestore.query.mockReturnValue('mockQuery');

      firebaseFirestore.getCountFromServer.mockResolvedValue({
        data: () => ({ count: 42 })
      });

      const result = await QueryHelper.getCollectionCount('courses');

      expect(result).toBe(42);
    });

    it('should apply filters when provided', async () => {
      firebaseFirestore.collection.mockReturnValue('mockCollection');
      firebaseFirestore.where.mockReturnValue('filterConstraint');
      firebaseFirestore.query.mockReturnValue('mockQuery');

      firebaseFirestore.getCountFromServer.mockResolvedValue({
        data: () => ({ count: 15 })
      });

      const filters = [{ field: 'status', operator: '==', value: 'active' }];
      const result = await QueryHelper.getCollectionCount('courses', filters);

      expect(result).toBe(15);
      expect(firebaseFirestore.where).toHaveBeenCalledWith('status', '==', 'active');
    });

    it('should throw ApiError on query failure', async () => {
      firebaseFirestore.collection.mockReturnValue('mockCollection');
      firebaseFirestore.query.mockReturnValue('mockQuery');

      firebaseFirestore.getCountFromServer.mockRejectedValue(
        new Error('Permission denied')
      );

      try {
        await QueryHelper.getCollectionCount('courses');
        fail('Should have thrown ApiError');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.code).toBe('FIRESTORE_ERROR');
      }
    });

    it('should return 0 for empty collection', async () => {
      firebaseFirestore.collection.mockReturnValue('mockCollection');
      firebaseFirestore.query.mockReturnValue('mockQuery');

      firebaseFirestore.getCountFromServer.mockResolvedValue({
        data: () => ({ count: 0 })
      });

      const result = await QueryHelper.getCollectionCount('empty-collection');

      expect(result).toBe(0);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle multiple filters correctly', async () => {
      firebaseFirestore.collection.mockReturnValue('mockCollection');
      firebaseFirestore.where.mockReturnValue('filterConstraint');
      firebaseFirestore.query.mockReturnValue('mockQuery');
      firebaseFirestore.limit.mockReturnValue('limitConstraint');

      firebaseFirestore.getCountFromServer.mockResolvedValue({
        data: () => ({ count: 3 })
      });

      firebaseFirestore.getDocs.mockResolvedValue({
        docs: []
      });

      const filters = [
        { field: 'category', operator: '==', value: 'electronics' },
        { field: 'price', operator: '<=', value: 1000 },
        { field: 'inStock', operator: '==', value: true }
      ];

      await QueryHelper.paginate('products', 10, filters);

      expect(firebaseFirestore.where).toHaveBeenCalledTimes(3);
    });

    it('should handle pagination chain: first -> next -> next', async () => {
      firebaseFirestore.collection.mockReturnValue('mockCollection');
      firebaseFirestore.query.mockReturnValue('mockQuery');
      firebaseFirestore.limit.mockReturnValue('limitConstraint');
      firebaseFirestore.startAfter.mockReturnValue('startAfterConstraint');

      const mockDoc1 = { id: 'doc1', data: () => ({}) };
      const mockDoc2 = { id: 'doc2', data: () => ({}) };
      const mockDoc3 = { id: 'doc3', data: () => ({}) };

      firebaseFirestore.getCountFromServer.mockResolvedValue({
        data: () => ({ count: 30 })
      });

      firebaseFirestore.getDocs.mockResolvedValueOnce({
        docs: [mockDoc1]
      });

      firebaseFirestore.getDocs.mockResolvedValueOnce({
        docs: [mockDoc2]
      });

      firebaseFirestore.getDocs.mockResolvedValueOnce({
        docs: [mockDoc3]
      });

      const page1 = await QueryHelper.paginate('courses', 10);
      expect(page1.hasNextPage).toBe(true);

      const page2 = await QueryHelper.getNextPage('courses', page1.lastVisible, 10);
      expect(page2.hasNextPage).toBe(true);

      const page3 = await QueryHelper.getNextPage('courses', page2.lastVisible, 10);
      expect(page3).toBeDefined();
    });
  });
});
