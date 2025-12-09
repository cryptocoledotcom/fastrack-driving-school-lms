// Main App Component
// Application routing and context providers

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CourseProvider } from './context/CourseContext';
import { TimerProvider } from './context/TimerContext';
import { ModalProvider } from './context/ModalContext';
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary';

// Route Guards
import { ProtectedRoute, PublicRoute, RoleBasedRoute, UserAccessGuard, AdminDashboardRoute, AdminOrInstructorRoute } from './components/guards';

// Layouts
import { MainLayout, DashboardLayout, AuthLayout, AdminLayout } from './components/layout';

// Public Pages
import HomePage from './pages/Home/HomePage';
import CoursesPage from './pages/Courses/CoursesPage';
import AboutPage from './pages/About/AboutPage';
import ContactPage from './pages/Contact/ContactPage';
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';

// Protected Pages
import DashboardPage from './pages/Dashboard/DashboardPage';
import MyCoursesPage from './pages/MyCourses/MyCoursesPage';
import CourseDetailPage from './pages/CourseDetail/CourseDetailPage';
import LessonPage from './pages/Lesson/LessonPage';
import CoursePlayerPage from './pages/CoursePlayer/CoursePlayerPage';
import ProgressPage from './pages/Progress/ProgressPage';
import ProfilePage from './pages/Profile/ProfilePage';
import SettingsPage from './pages/Settings/SettingsPage';
import CertificatesPage from './pages/Certificates/CertificatesPage';
import PaymentSuccessPage from './pages/PaymentSuccess/PaymentSuccessPage';

// Admin Pages
import AdminPage from './pages/Admin/AdminPage';
import AuditLogsPage from './pages/Admin/AuditLogsPage';

// 404 Page
import NotFoundPage from './pages/NotFound/NotFoundPage';

// Landing Page (Coming Soon)
import LandingPage from './pages/LandingPage/LandingPage';

// Routes
import { PUBLIC_ROUTES, PROTECTED_ROUTES, ADMIN_ROUTES } from './constants/routes';
import { USER_ROLES } from './constants/userRoles';

// Auth Components
import { ForcePasswordChangeModal } from './components/auth';

// Styles
import './assets/styles/global.css';
import './assets/styles/theme.css';
import './assets/styles/animations.css';

import { useAuth } from './context/AuthContext';

function AppRoutes() {
  const { showPasswordChangeModal, setShowPasswordChangeModal } = useAuth();

  return (
    <>
      <ForcePasswordChangeModal
        isOpen={showPasswordChangeModal}
        onComplete={() => setShowPasswordChangeModal(false)}
      />
      <Routes>
                {/* Public Routes */}
                <Route path={PUBLIC_ROUTES.HOME} element={
                  <MainLayout>
                    <HomePage />
                  </MainLayout>
                } />
                
                <Route path={PUBLIC_ROUTES.COURSES} element={
                  <MainLayout>
                    <CoursesPage />
                  </MainLayout>
                } />
                
                <Route path={PUBLIC_ROUTES.ABOUT} element={
                  <MainLayout>
                    <AboutPage />
                  </MainLayout>
                } />
                
                <Route path={PUBLIC_ROUTES.CONTACT} element={
                  <MainLayout>
                    <ContactPage />
                  </MainLayout>
                } />

                <Route path={PUBLIC_ROUTES.PRIVACY_POLICY} element={
                  <MainLayout>
                    <PrivacyPolicy />
                  </MainLayout>
                } />

                {/* Auth Routes */}
                <Route path={PUBLIC_ROUTES.LOGIN} element={
                  <PublicRoute>
                    <AuthLayout>
                      <LoginPage />
                    </AuthLayout>
                  </PublicRoute>
                } />
                
                <Route path={PUBLIC_ROUTES.REGISTER} element={
                  <PublicRoute>
                    <AuthLayout>
                      <RegisterPage />
                    </AuthLayout>
                  </PublicRoute>
                } />
                
                <Route path={PUBLIC_ROUTES.FORGOT_PASSWORD} element={
                  <PublicRoute>
                    <AuthLayout>
                      <ForgotPasswordPage />
                    </AuthLayout>
                  </PublicRoute>
                } />

                {/* Protected Routes */}
                <Route path={PROTECTED_ROUTES.DASHBOARD} element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <DashboardPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                
                <Route path={PROTECTED_ROUTES.MY_COURSES} element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <MyCoursesPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                
                <Route path={PROTECTED_ROUTES.COURSE_DETAIL} element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <CourseDetailPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                
                <Route path={PROTECTED_ROUTES.LESSON} element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <LessonPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/course-player/:courseId" element={
                  <ProtectedRoute>
                    <CoursePlayerPage />
                  </ProtectedRoute>
                } />
                
                <Route path={PROTECTED_ROUTES.PROGRESS} element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ProgressPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                
                <Route path={PROTECTED_ROUTES.PROFILE_VIEW} element={
                  <ProtectedRoute>
                    <UserAccessGuard accessType="profile">
                      <DashboardLayout>
                        <ProfilePage />
                      </DashboardLayout>
                    </UserAccessGuard>
                  </ProtectedRoute>
                } />

                <Route path={PROTECTED_ROUTES.PROFILE} element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <ProfilePage />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                
                <Route path={PROTECTED_ROUTES.SETTINGS} element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SettingsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />
                
                <Route path={PROTECTED_ROUTES.CERTIFICATE_VIEW} element={
                  <ProtectedRoute>
                    <UserAccessGuard accessType="certificate">
                      <DashboardLayout>
                        <CertificatesPage />
                      </DashboardLayout>
                    </UserAccessGuard>
                  </ProtectedRoute>
                } />

                <Route path={PROTECTED_ROUTES.CERTIFICATES} element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <CertificatesPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                } />

                <Route path={PROTECTED_ROUTES.PAYMENT_SUCCESS} element={
                  <ProtectedRoute>
                    <PaymentSuccessPage />
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path={ADMIN_ROUTES.ADMIN_DASHBOARD} element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <AdminPage />
                    </AdminLayout>
                  </ProtectedRoute>
                } />

                <Route path={ADMIN_ROUTES.AUDIT_LOGS} element={
                  <ProtectedRoute>
                    <AdminOrInstructorRoute>
                      <DashboardLayout>
                        <AuditLogsPage />
                      </DashboardLayout>
                    </AdminOrInstructorRoute>
                  </ProtectedRoute>
                } />

                <Route path={ADMIN_ROUTES.MANAGE_USERS} element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <AdminPage />
                    </AdminLayout>
                  </ProtectedRoute>
                } />

                <Route path={ADMIN_ROUTES.MANAGE_COURSES} element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <AdminPage />
                    </AdminLayout>
                  </ProtectedRoute>
                } />

                <Route path={ADMIN_ROUTES.ANALYTICS} element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <AdminPage />
                    </AdminLayout>
                  </ProtectedRoute>
                } />

                {/* 404 Route */}
                <Route path="*" element={
                  <MainLayout>
                    <NotFoundPage />
                  </MainLayout>
                } />
              </Routes>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <CourseProvider>
            <TimerProvider>
              <ModalProvider>
                <AppRoutes />
              </ModalProvider>
            </TimerProvider>
          </CourseProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;