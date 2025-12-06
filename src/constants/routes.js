// Route Constants
// Centralized route path definitions for the application

export const PUBLIC_ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  COURSES: '/courses',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password'
};

export const PROTECTED_ROUTES = {
  DASHBOARD: '/dashboard',
  MY_COURSES: '/dashboard/my-courses',
  COURSE_DETAIL: '/dashboard/courses/:courseId',
  LESSON: '/dashboard/courses/:courseId/lessons/:lessonId',
  PROGRESS: '/dashboard/progress',
  PROFILE: '/dashboard/profile',
  PROFILE_VIEW: '/dashboard/profile/:userId',
  SETTINGS: '/dashboard/settings',
  CERTIFICATES: '/dashboard/certificates',
  CERTIFICATE_VIEW: '/dashboard/certificates/:certificateId',
  PAYMENT_SUCCESS: '/payment-success'
};

export const ADMIN_ROUTES = {
  ADMIN_DASHBOARD: '/admin',
  MANAGE_USERS: '/admin/users',
  MANAGE_COURSES: '/admin/courses',
  MANAGE_LESSONS: '/admin/lessons',
  ANALYTICS: '/admin/analytics',
  AUDIT_LOGS: '/admin/audit-logs',
  SETTINGS: '/admin/settings'
};

export const INSTRUCTOR_ROUTES = {
  INSTRUCTOR_DASHBOARD: '/instructor',
  MY_STUDENTS: '/instructor/students',
  MY_COURSES: '/instructor/courses',
  SCHEDULE: '/instructor/schedule'
};

// Helper function to build dynamic routes
export const buildRoute = (route, params = {}) => {
  let path = route;
  Object.keys(params).forEach(key => {
    path = path.replace(`:${key}`, params[key]);
  });
  return path;
};