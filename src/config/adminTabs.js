import { USER_ROLES } from '../constants/userRoles';
import EnrollmentManagementTab from '../components/admin/tabs/EnrollmentManagementTab';
import AnalyticsTab from '../components/admin/tabs/AnalyticsTab';
import UserManagementTab from '../components/admin/tabs/UserManagementTab';
import AuditLogsTab from '../components/admin/tabs/AuditLogsTab';
import DETSExportTab from '../components/admin/tabs/DETSExportTab';
import SchedulingManagement from '../components/admin/SchedulingManagement';
import ComplianceReporting from '../components/admin/ComplianceReporting';

export const ADMIN_TABS = [
  {
    id: 'enrollment-management',
    label: 'Enrollment Management',
    component: EnrollmentManagementTab,
    requiredRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.DMV_ADMIN, USER_ROLES.INSTRUCTOR],
    wrapInCard: false
  },
  {
    id: 'scheduling',
    label: 'Lesson Scheduling',
    component: SchedulingManagement,
    requiredRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.DMV_ADMIN, USER_ROLES.INSTRUCTOR],
    wrapInCard: true,
    cardProps: { padding: 'large' }
  },
  {
    id: 'analytics',
    label: 'Analytics',
    component: AnalyticsTab,
    requiredRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.DMV_ADMIN, USER_ROLES.INSTRUCTOR],
    wrapInCard: false
  },
  {
    id: 'compliance-reporting',
    label: 'Compliance Reports',
    component: ComplianceReporting,
    requiredRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.DMV_ADMIN, USER_ROLES.INSTRUCTOR],
    wrapInCard: false
  },
  {
    id: 'audit-logs',
    label: 'Audit Logs',
    component: AuditLogsTab,
    requiredRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.DMV_ADMIN, USER_ROLES.INSTRUCTOR],
    wrapInCard: false
  },
  {
    id: 'dets-export',
    label: 'DETS Export',
    component: DETSExportTab,
    requiredRoles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.DMV_ADMIN],
    wrapInCard: false
  },
  {
    id: 'user-management',
    label: 'User Management',
    component: UserManagementTab,
    requiredRoles: [USER_ROLES.SUPER_ADMIN],
    wrapInCard: false
  }
];
