import { getAllStudents } from '../userServices';
import * as firestoreModule from 'firebase/firestore';
import { USER_ROLES } from '../../../constants/userRoles';

jest.mock('firebase/firestore');
jest.mock('../../base/ServiceWrapper', () => ({
  executeService: jest.fn((fn) => fn())
}));

describe('User Services - getAllStudents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all students with role STUDENT', async () => {
    const mockStudent1 = {
      id: 'student-1',
      email: 'alice@example.com',
      displayName: 'Alice',
      role: USER_ROLES.STUDENT
    };
    const mockStudent2 = {
      id: 'student-2',
      email: 'bob@example.com',
      displayName: 'Bob',
      role: USER_ROLES.STUDENT
    };

    const mockQuerySnapshot = {
      forEach: jest.fn((callback) => {
        callback({ id: 'student-1', data: () => mockStudent1 });
        callback({ id: 'student-2', data: () => mockStudent2 });
      })
    };

    firestoreModule.collection.mockReturnValueOnce({ path: 'users' });
    firestoreModule.query.mockReturnValueOnce({});
    firestoreModule.getDocs.mockResolvedValueOnce(mockQuerySnapshot);

    const result = await getAllStudents();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0].role).toBe(USER_ROLES.STUDENT);
    expect(result[1].role).toBe(USER_ROLES.STUDENT);
  });

  it('should sort students by displayName', async () => {
    const mockStudent1 = {
      id: 'student-1',
      email: 'alice@example.com',
      displayName: 'Zoe',
      role: USER_ROLES.STUDENT
    };
    const mockStudent2 = {
      id: 'student-2',
      email: 'bob@example.com',
      displayName: 'Alice',
      role: USER_ROLES.STUDENT
    };

    const mockQuerySnapshot = {
      forEach: jest.fn((callback) => {
        callback({ id: 'student-1', data: () => mockStudent1 });
        callback({ id: 'student-2', data: () => mockStudent2 });
      })
    };

    firestoreModule.collection.mockReturnValueOnce({ path: 'users' });
    firestoreModule.query.mockReturnValueOnce({});
    firestoreModule.getDocs.mockResolvedValueOnce(mockQuerySnapshot);

    const result = await getAllStudents();

    expect(result[0].displayName).toBe('Alice');
    expect(result[1].displayName).toBe('Zoe');
  });

  it('should sort by email when displayName is not available', async () => {
    const mockStudent1 = {
      id: 'student-1',
      email: 'zebra@example.com',
      displayName: '',
      role: USER_ROLES.STUDENT
    };
    const mockStudent2 = {
      id: 'student-2',
      email: 'apple@example.com',
      displayName: '',
      role: USER_ROLES.STUDENT
    };

    const mockQuerySnapshot = {
      forEach: jest.fn((callback) => {
        callback({ id: 'student-1', data: () => mockStudent1 });
        callback({ id: 'student-2', data: () => mockStudent2 });
      })
    };

    firestoreModule.collection.mockReturnValueOnce({ path: 'users' });
    firestoreModule.query.mockReturnValueOnce({});
    firestoreModule.getDocs.mockResolvedValueOnce(mockQuerySnapshot);

    const result = await getAllStudents();

    expect(result[0].email).toBe('apple@example.com');
    expect(result[1].email).toBe('zebra@example.com');
  });

  it('should return empty array when no students exist', async () => {
    const mockQuerySnapshot = {
      forEach: jest.fn()
    };

    firestoreModule.collection.mockReturnValueOnce({ path: 'users' });
    firestoreModule.query.mockReturnValueOnce({});
    firestoreModule.getDocs.mockResolvedValueOnce(mockQuerySnapshot);

    const result = await getAllStudents();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it('should include all student data fields', async () => {
    const mockStudent = {
      id: 'student-1',
      email: 'alice@example.com',
      displayName: 'Alice Smith',
      role: USER_ROLES.STUDENT,
      createdAt: '2024-01-01',
      enrollments: []
    };

    const mockQuerySnapshot = {
      forEach: jest.fn((callback) => {
        callback({ id: 'student-1', data: () => mockStudent });
      })
    };

    firestoreModule.collection.mockReturnValueOnce({ path: 'users' });
    firestoreModule.query.mockReturnValueOnce({});
    firestoreModule.getDocs.mockResolvedValueOnce(mockQuerySnapshot);

    const result = await getAllStudents();

    expect(result[0]).toEqual({
      id: 'student-1',
      ...mockStudent
    });
    expect(result[0].email).toBe('alice@example.com');
    expect(result[0].enrollments).toEqual([]);
  });

  it('should use query filter for STUDENT role', async () => {
    const mockQuerySnapshot = {
      forEach: jest.fn()
    };

    firestoreModule.collection.mockReturnValueOnce({ path: 'users' });
    firestoreModule.query.mockReturnValueOnce({});
    firestoreModule.getDocs.mockResolvedValueOnce(mockQuerySnapshot);

    await getAllStudents();

    expect(firestoreModule.query).toHaveBeenCalled();
  });
});
