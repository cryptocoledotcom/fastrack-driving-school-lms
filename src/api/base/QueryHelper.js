import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getCountFromServer
} from 'firebase/firestore';

import { db } from '../../config/firebase.js';
import { ApiError } from '../errors/ApiError.js';

class QueryHelper {
  static async paginate(collectionPath, pageSize = 10, filters = [], orderingField = null, orderingDirection = 'asc') {
    try {
      const q = collection(db, collectionPath);
      let constraints = [];

      if (filters && filters.length > 0) {
        constraints = filters.map(f => where(f.field, f.operator, f.value));
      }

      if (orderingField) {
        constraints.push(orderBy(orderingField, orderingDirection));
      }

      constraints.push(limit(pageSize));

      const queryRef = query(q, ...constraints);
      const countSnapshot = await getCountFromServer(
        query(collection(db, collectionPath), ...filters.map(f => where(f.field, f.operator, f.value)))
      );
      const total = countSnapshot.data().count;

      const snapshot = await getDocs(queryRef);
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];

      return {
        docs,
        total,
        pageSize,
        currentPage: 1,
        totalPages: Math.ceil(total / pageSize),
        hasNextPage: total > pageSize,
        lastVisible: lastVisible || null,
        pageInfo: {
          startIndex: 0,
          endIndex: Math.min(pageSize, total),
          totalResults: total
        }
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('FIRESTORE_ERROR', 'Failed to paginate collection', error);
    }
  }

  static async getNextPage(collectionPath, lastVisible, pageSize = 10, filters = [], orderingField = null, orderingDirection = 'asc') {
    try {
      if (!lastVisible) {
        throw new ApiError('PAGINATION_ERROR', 'Invalid pagination cursor', null);
      }

      const q = collection(db, collectionPath);
      let constraints = [];

      if (filters && filters.length > 0) {
        constraints = filters.map(f => where(f.field, f.operator, f.value));
      }

      if (orderingField) {
        constraints.push(orderBy(orderingField, orderingDirection));
      }

      constraints.push(startAfter(lastVisible));
      constraints.push(limit(pageSize));

      const queryRef = query(q, ...constraints);
      const snapshot = await getDocs(queryRef);

      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const newLastVisible = snapshot.docs[snapshot.docs.length - 1];

      return {
        docs,
        pageSize,
        hasNextPage: docs.length === pageSize,
        lastVisible: newLastVisible || null
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('FIRESTORE_ERROR', 'Failed to get next page', error);
    }
  }

  static async getPageAtIndex(collectionPath, pageNumber = 1, pageSize = 10, filters = [], orderingField = null, orderingDirection = 'asc') {
    try {
      if (pageNumber < 1) {
        throw new ApiError('PAGINATION_ERROR', 'Page number must be greater than 0', null);
      }

      const skipCount = (pageNumber - 1) * pageSize;
      const q = collection(db, collectionPath);
      let constraints = [];

      if (filters && filters.length > 0) {
        constraints = filters.map(f => where(f.field, f.operator, f.value));
      }

      if (orderingField) {
        constraints.push(orderBy(orderingField, orderingDirection));
      }

      const countSnapshot = await getCountFromServer(query(q, ...constraints));
      const total = countSnapshot.data().count;

      constraints.push(limit(skipCount + pageSize));
      const queryRef = query(q, ...constraints);
      const snapshot = await getDocs(queryRef);

      const allDocs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const docs = allDocs.slice(skipCount);

      return {
        docs,
        total,
        pageSize,
        currentPage: pageNumber,
        totalPages: Math.ceil(total / pageSize),
        hasNextPage: pageNumber < Math.ceil(total / pageSize),
        hasPreviousPage: pageNumber > 1
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('FIRESTORE_ERROR', 'Failed to get page at index', error);
    }
  }

  static async getCollectionCount(collectionPath, filters = []) {
    try {
      const q = collection(db, collectionPath);
      let constraints = [];

      if (filters && filters.length > 0) {
        constraints = filters.map(f => where(f.field, f.operator, f.value));
      }

      const countSnapshot = await getCountFromServer(query(q, ...constraints));
      return countSnapshot.data().count;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('FIRESTORE_ERROR', 'Failed to get collection count', error);
    }
  }
}

export default QueryHelper;
