import { USER_ROLES } from '../constants/userRoles';
import { ADMIN_ROUTES } from '../constants/routes';

export const ADMIN_SIDEBAR_ITEMS = [
  {
    path: ADMIN_ROUTES.ADMIN_DASHBOARD,
    label: 'Dashboard',
    icon: '📊',
    requiredRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.DMV_ADMIN]
  },
  {
    path: ADMIN_ROUTES.MANAGE_USERS,
    label: 'Users',
    icon: '👥',
    requiredRoles: [USER_ROLES.SUPER_ADMIN]
  },
  {
    path: ADMIN_ROUTES.MANAGE_COURSES,
    label: 'Courses',
    icon: '📚',
    requiredRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.DMV_ADMIN]
  },
  {
    path: ADMIN_ROUTES.MANAGE_LESSONS,
    label: 'Lessons',
    icon: '📝',
    requiredRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.DMV_ADMIN]
  },
  {
    path: ADMIN_ROUTES.ANALYTICS,
    label: 'Analytics',
    icon: '📈',
    requiredRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.DMV_ADMIN]
  },
  {
    path: ADMIN_ROUTES.AUDIT_LOGS,
    label: 'Audit Logs',
    icon: '📋',
    requiredRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.DMV_ADMIN, USER_ROLES.INSTRUCTOR]
  },
  {
    path: ADMIN_ROUTES.SETTINGS,
    label: 'Settings',
    icon: '⚙️',
    requiredRoles: [USER_ROLES.SUPER_ADMIN]
  }
];
