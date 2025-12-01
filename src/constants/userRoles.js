// User Roles Constants
// Define user role types and permissions

export const USER_ROLES = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  DMV_ADMIN: 'dmv_admin',
  SUPER_ADMIN: 'super_admin'
};

export const ROLE_PERMISSIONS = {
  [USER_ROLES.STUDENT]: {
    canEnrollCourses: true,
    canViewCourses: true,
    canTakeLessons: true,
    canTakeQuizzes: true,
    canViewProgress: true,
    canDownloadCertificates: true,
    canEditProfile: true,
    canViewDashboard: true
  },
  
  [USER_ROLES.INSTRUCTOR]: {
    canEnrollCourses: true,
    canViewCourses: true,
    canTakeLessons: true,
    canTakeQuizzes: true,
    canViewProgress: true,
    canDownloadCertificates: true,
    canEditProfile: true,
    canViewDashboard: true,
    canViewStudents: true,
    canGradeQuizzes: true,
    canCreateLessons: true,
    canEditLessons: true,
    canViewAnalytics: true
  },
  
  [USER_ROLES.DMV_ADMIN]: {
    canViewStudents: true,
    canViewAllProgress: true,
    canGenerateReports: true,
    canAssignLessons: true,
    canManageLessonSlots: true,
    canViewComplianceData: true,
    canExportComplianceReports: true,
    canEditProfile: true
  },
  
  [USER_ROLES.SUPER_ADMIN]: {
    canEnrollCourses: true,
    canViewCourses: true,
    canTakeLessons: true,
    canTakeQuizzes: true,
    canViewProgress: true,
    canDownloadCertificates: true,
    canEditProfile: true,
    canViewDashboard: true,
    canViewStudents: true,
    canGradeQuizzes: true,
    canCreateLessons: true,
    canEditLessons: true,
    canViewAnalytics: true,
    canManageUsers: true,
    canManageCourses: true,
    canManageModules: true,
    canManageLessons: true,
    canViewAllProgress: true,
    canGenerateReports: true,
    canManageSettings: true,
    canManageAdmins: true,
    canAccessSystemSettings: true,
    canDeleteAnything: true,
    canAssignLessons: true,
    canManageLessonSlots: true,
    canViewComplianceData: true,
    canExportComplianceReports: true
  }
};

// Helper function to check if user has permission
export const hasPermission = (userRole, permission) => {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions ? rolePermissions[permission] === true : false;
};

// Helper function to check if user has any of the specified roles
export const hasRole = (userRole, allowedRoles) => {
  if (Array.isArray(allowedRoles)) {
    return allowedRoles.includes(userRole);
  }
  return userRole === allowedRoles;
};

// Helper function to get role display name
export const getRoleDisplayName = (role) => {
  const displayNames = {
    [USER_ROLES.STUDENT]: 'Student',
    [USER_ROLES.INSTRUCTOR]: 'Instructor',
    [USER_ROLES.DMV_ADMIN]: 'DMV Administrator',
    [USER_ROLES.SUPER_ADMIN]: 'Super Administrator'
  };
  return displayNames[role] || 'Unknown Role';
};

const userRoles = {
  USER_ROLES,
  ROLE_PERMISSIONS,
  hasPermission,
  hasRole,
  getRoleDisplayName
};

export default userRoles;