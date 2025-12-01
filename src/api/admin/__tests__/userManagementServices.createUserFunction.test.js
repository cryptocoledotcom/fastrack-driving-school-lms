import userManagementServices from '../userManagementServices';
import { getFunctions, httpsCallable } from 'firebase/functions';

jest.mock('firebase/functions');

describe('User Management - createUser Function', () => {
  const mockFunction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    httpsCallable.mockReturnValue(mockFunction);
  });

  it('should call httpsCallable with createUser function name', async () => {
    mockFunction.mockResolvedValue({
      data: { success: true, uid: 'new-user-123' }
    });

    await userManagementServices.createUser('user@test.com', 'Pass123!', 'User', 'admin-id');

    expect(httpsCallable).toHaveBeenCalled();
  });

  it('should pass email, temporary password, display name, and role to Cloud Function', async () => {
    mockFunction.mockResolvedValue({
      data: { success: true, uid: 'new-user-123' }
    });

    await userManagementServices.createUser(
      'newuser@example.com',
      'TempPassword123!',
      'New User',
      'admin-id'
    );

    expect(mockFunction).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      temporaryPassword: 'TempPassword123!',
      displayName: 'New User',
      role: 'dmv_admin'
    });
  });

  it('should return user data on successful creation', async () => {
    const expectedData = {
      success: true,
      uid: 'new-user-456',
      email: 'user@example.com',
      displayName: 'Test User'
    };
    mockFunction.mockResolvedValue({ data: expectedData });

    const result = await userManagementServices.createUser(
      'user@example.com',
      'Password123!',
      'Test User',
      'admin-id'
    );

    expect(result).toEqual(expectedData);
  });

  it('should use email prefix as displayName when empty', async () => {
    mockFunction.mockResolvedValue({
      data: { success: true, uid: 'user-789' }
    });

    await userManagementServices.createUser(
      'john@example.com',
      'Password123!',
      '',
      'admin-id'
    );

    expect(mockFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'john'
      })
    );
  });

  it('should handle Cloud Function errors', async () => {
    const error = new Error('Failed to create user: Email already exists');
    mockFunction.mockRejectedValue(error);

    await expect(
      userManagementServices.createUser(
        'existing@example.com',
        'Password123!',
        'User',
        'admin-id'
      )
    ).rejects.toThrow('Failed to create user');
  });

  it('should handle authentication errors', async () => {
    mockFunction.mockRejectedValue(new Error('User must be authenticated'));

    await expect(
      userManagementServices.createUser('user@example.com', 'Pass123!', 'User', 'admin-id')
    ).rejects.toThrow();
  });

  it('should handle permission errors for non-super-admins', async () => {
    mockFunction.mockRejectedValue(new Error('Only Super Admins can create users'));

    await expect(
      userManagementServices.createUser('user@example.com', 'Pass123!', 'User', 'dmv-admin-id')
    ).rejects.toThrow('Only Super Admins');
  });

  it('should automatically set role to DMV_ADMIN', async () => {
    mockFunction.mockResolvedValue({
      data: { success: true, uid: 'user-new' }
    });

    await userManagementServices.createUser(
      'admin@test.com',
      'Password123!',
      'Admin',
      'super-admin-id'
    );

    expect(mockFunction).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'dmv_admin' })
    );
  });

  it('should handle network errors', async () => {
    mockFunction.mockRejectedValue(new Error('Network error'));

    await expect(
      userManagementServices.createUser('user@example.com', 'Pass123!', 'User', 'admin-id')
    ).rejects.toThrow();
  });
});
