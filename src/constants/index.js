// Main Constants Export
// Centralized exports from all constant subdirectories

export * as appConstants from './app';
export * as domainConstants from './domain';
export * as messageConstants from './messages';

// Backward compatibility - also export commonly used items directly
export { appConfig, routes, validationRules } from './app';
export { courses, userRoles, lessonTypes, progressStatus } from './domain';
export { errorMessages, successMessages } from './messages';
export { default as OHIO_COMPLIANCE } from './compliance.js';

// Most frequently used exports for convenience
export { COURSE_IDS, COURSE_PRICING, COURSE_TYPES, PAYMENT_STATUS, ENROLLMENT_STATUS, ACCESS_STATUS } from './domain/courses.js';
export { USER_ROLES, ROLE_PERMISSIONS, hasPermission, hasRole, getRoleDisplayName } from './domain/userRoles.js';
export { LESSON_TYPES, LESSON_TYPE_CONFIG } from './domain/lessonTypes.js';
export { PROGRESS_STATUS, STATUS_CONFIG } from './domain/progressStatus.js';
export { PUBLIC_ROUTES, PROTECTED_ROUTES, ADMIN_ROUTES, INSTRUCTOR_ROUTES, buildRoute } from './app/routes.js';
export { VALIDATION_RULES, validators } from './app/validationRules.js';
export { APP_CONFIG } from './app/appConfig.js';
