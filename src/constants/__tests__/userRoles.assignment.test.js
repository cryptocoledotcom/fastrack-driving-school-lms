import {
  USER_ROLES,
  ROLE_PERMISSIONS,
  hasPermission,
  hasRole
} from '../userRoles';

describe('User Roles - Admin Assignment Permissions', () => {
  describe('Role Definitions', () => {
    it('should define SUPER_ADMIN role', () => {
      expect(USER_ROLES.SUPER_ADMIN).toBe('super_admin');
    });

    it('should define DMV_ADMIN role', () => {
      expect(USER_ROLES.DMV_ADMIN).toBe('dmv_admin');
    });

    it('should define STUDENT role', () => {
      expect(USER_ROLES.STUDENT).toBe('student');
    });

    it('should define INSTRUCTOR role', () => {
      expect(USER_ROLES.INSTRUCTOR).toBe('instructor');
    });
  });

  describe('DMV Admin Permissions', () => {
    it('should allow DMV admin to view students', () => {
      expect(hasPermission(USER_ROLES.DMV_ADMIN, 'canViewStudents')).toBe(true);
    });

    it('should allow DMV admin to assign lessons', () => {
      expect(hasPermission(USER_ROLES.DMV_ADMIN, 'canAssignLessons')).toBe(true);
    });

    it('should allow DMV admin to manage lesson slots', () => {
      expect(
        hasPermission(USER_ROLES.DMV_ADMIN, 'canManageLessonSlots')
      ).toBe(true);
    });

    it('should allow DMV admin to view compliance data', () => {
      expect(hasPermission(USER_ROLES.DMV_ADMIN, 'canViewComplianceData')).toBe(
        true
      );
    });

    it('should allow DMV admin to export compliance reports', () => {
      expect(
        hasPermission(USER_ROLES.DMV_ADMIN, 'canExportComplianceReports')
      ).toBe(true);
    });

    it('should allow DMV admin to generate reports', () => {
      expect(hasPermission(USER_ROLES.DMV_ADMIN, 'canGenerateReports')).toBe(
        true
      );
    });

    it('should allow DMV admin to view all progress', () => {
      expect(hasPermission(USER_ROLES.DMV_ADMIN, 'canViewAllProgress')).toBe(
        true
      );
    });

    it('should allow DMV admin to edit profile', () => {
      expect(hasPermission(USER_ROLES.DMV_ADMIN, 'canEditProfile')).toBe(true);
    });

    it('should NOT allow DMV admin to manage users', () => {
      expect(hasPermission(USER_ROLES.DMV_ADMIN, 'canManageUsers')).not.toBe(
        true
      );
    });

    it('should NOT allow DMV admin to manage courses', () => {
      expect(hasPermission(USER_ROLES.DMV_ADMIN, 'canManageCourses')).not.toBe(
        true
      );
    });

    it('should NOT allow DMV admin to enroll courses', () => {
      expect(hasPermission(USER_ROLES.DMV_ADMIN, 'canEnrollCourses')).not.toBe(
        true
      );
    });

    it('should NOT allow DMV admin to take lessons', () => {
      expect(hasPermission(USER_ROLES.DMV_ADMIN, 'canTakeLessons')).not.toBe(
        true
      );
    });

    it('should only have assignment-focused permissions', () => {
      const dmvAdminPerms = ROLE_PERMISSIONS[USER_ROLES.DMV_ADMIN];
      const permCount = Object.values(dmvAdminPerms).filter(p => p === true).length;
      expect(permCount).toBe(8);
    });
  });

  describe('Super Admin Permissions', () => {
    it('should allow SUPER_ADMIN to assign lessons', () => {
      expect(hasPermission(USER_ROLES.SUPER_ADMIN, 'canAssignLessons')).toBe(
        true
      );
    });

    it('should allow SUPER_ADMIN to manage users', () => {
      expect(hasPermission(USER_ROLES.SUPER_ADMIN, 'canManageUsers')).toBe(
        true
      );
    });

    it('should allow SUPER_ADMIN to manage admins', () => {
      expect(hasPermission(USER_ROLES.SUPER_ADMIN, 'canManageAdmins')).toBe(
        true
      );
    });

    it('should allow SUPER_ADMIN to access system settings', () => {
      expect(
        hasPermission(USER_ROLES.SUPER_ADMIN, 'canAccessSystemSettings')
      ).toBe(true);
    });

    it('should allow SUPER_ADMIN to delete anything', () => {
      expect(hasPermission(USER_ROLES.SUPER_ADMIN, 'canDeleteAnything')).toBe(
        true
      );
    });

    it('should have all available permissions', () => {
      const superAdminPerms = ROLE_PERMISSIONS[USER_ROLES.SUPER_ADMIN];
      const dmvAdminPerms = ROLE_PERMISSIONS[USER_ROLES.DMV_ADMIN];

      Object.keys(dmvAdminPerms).forEach(permission => {
        expect(superAdminPerms[permission]).toBe(true);
      });
    });
  });

  describe('Student Permissions', () => {
    it('should NOT allow STUDENT to assign lessons', () => {
      expect(hasPermission(USER_ROLES.STUDENT, 'canAssignLessons')).not.toBe(
        true
      );
    });

    it('should NOT allow STUDENT to manage lesson slots', () => {
      expect(hasPermission(USER_ROLES.STUDENT, 'canManageLessonSlots')).not.toBe(
        true
      );
    });

    it('should allow STUDENT to enroll in courses', () => {
      expect(hasPermission(USER_ROLES.STUDENT, 'canEnrollCourses')).toBe(true);
    });

    it('should allow STUDENT to take lessons', () => {
      expect(hasPermission(USER_ROLES.STUDENT, 'canTakeLessons')).toBe(true);
    });
  });

  describe('Instructor Permissions', () => {
    it('should NOT allow INSTRUCTOR to assign lessons', () => {
      expect(hasPermission(USER_ROLES.INSTRUCTOR, 'canAssignLessons')).not.toBe(
        true
      );
    });

    it('should allow INSTRUCTOR to grade quizzes', () => {
      expect(hasPermission(USER_ROLES.INSTRUCTOR, 'canGradeQuizzes')).toBe(
        true
      );
    });

    it('should allow INSTRUCTOR to view students', () => {
      expect(hasPermission(USER_ROLES.INSTRUCTOR, 'canViewStudents')).toBe(
        true
      );
    });
  });

  describe('hasRole Function', () => {
    it('should check single role correctly', () => {
      expect(hasRole(USER_ROLES.DMV_ADMIN, USER_ROLES.DMV_ADMIN)).toBe(true);
      expect(hasRole(USER_ROLES.DMV_ADMIN, USER_ROLES.SUPER_ADMIN)).toBe(false);
    });

    it('should check multiple roles correctly', () => {
      expect(
        hasRole(USER_ROLES.DMV_ADMIN, [USER_ROLES.DMV_ADMIN, USER_ROLES.SUPER_ADMIN])
      ).toBe(true);
      expect(
        hasRole(USER_ROLES.DMV_ADMIN, [USER_ROLES.STUDENT, USER_ROLES.INSTRUCTOR])
      ).toBe(false);
    });
  });

  describe('hasPermission Function', () => {
    it('should return false for undefined permission', () => {
      expect(hasPermission(USER_ROLES.ADMIN, 'nonExistentPermission')).toBe(
        false
      );
    });

    it('should handle null role gracefully', () => {
      expect(hasPermission(null, 'canAssignLessons')).toBe(false);
    });

    it('should handle undefined role gracefully', () => {
      expect(hasPermission(undefined, 'canAssignLessons')).toBe(false);
    });
  });
});
