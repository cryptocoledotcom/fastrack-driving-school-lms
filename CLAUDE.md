# Fastrack LMS - Development Documentation

## Project Overview

**Fastrack Learning Management System** is a comprehensive web application for managing driving school courses, student progress, instructor assignments, and compliance tracking. Built with React 19, Vite, and Firebase 12, with Node.js 20 Cloud Functions backend using Firebase Functions v2 API. Fully compliant with Ohio OAC Chapter 4501-7 driver education requirements.

**Current Status**: 
- ✅ **Admin Dashboard** - Phase 4.2 Complete (Certificates, Revenue, Activity widgets)
- ✅ **100% test pass rate** (936+ tests: 829 frontend + 87 Cloud Functions + 107+ E2E)
- ✅ **RBAC migration complete** - Firebase custom claims + JWT token refresh
- ✅ **Security hardened** - CORS, CSRF, App Check (ReCaptcha V3), Firestore rules
- ✅ **Ohio compliance** - 100% (50/50 requirements, 24 Cloud Functions deployed)
- ✅ **Admin performance** - 15x faster (30s → <2s, JWT custom claims optimization)
- ✅ **Instant role access** - No delay after bootstrap or role changes
- ✅ **Production ready** - Sentry active, Playwright E2E verified, Landing Page live

---

## Architecture Overview

### Tech Stack
- **Frontend**: React 19 + Vite 5 + React Router 7 + Firebase 12
- **Backend**: Node.js 20 + Firebase Cloud Functions v2 + Stripe API
- **Database**: Firestore with role-based security rules
- **Testing**: Vitest (frontend), Jest (Cloud Functions), Playwright (E2E)
- **Deployment**: Firebase Hosting + Cloud Functions

### Directory Structure
```
src/
├── api/              # Service layer (domain-organized)
├── components/       # React components (Admin, Auth, Courses, etc)
├── context/          # React Context (Auth, Course, Modal, Timer)
├── pages/            # Page components
├── hooks/            # Custom React hooks
├── utils/            # Utilities
├── constants/        # App constants (roles, routes, validation)
├── config/           # Firebase & environment config
└── assets/           # Styles and static assets

functions/
├── src/
│   ├── payment/      # Stripe payment processing
│   ├── certificate/  # Certificate generation
│   ├── compliance/   # Compliance & audit functions
│   ├── user/         # User management
│   └── common/       # Shared utilities (audit logging, validation)
└── tests/            # Cloud Functions unit tests
```

---

## Completed Phases

### Phase 3: RBAC Migration & Bootstrap Security ✅

**Objective**: Implement secure role-based access control using Firebase custom claims instead of Firestore-based lookups.

**Key Achievement**: Reduced admin panel load time from **30+ seconds → <2 seconds** (15x improvement)

#### Bootstrap Authority Pattern
- **File**: `set-super-admin.js` (230 lines, runs locally before deployment)
- **Purpose**: One-time initialization to set initial super_admin without exposing system to unauthorized role assignment
- **Security**: Prevents first-caller-becomes-admin vulnerability
- **Status**: ✅ Successfully executed

#### Dual-Write/Dual-Read Architecture
**Write** (Cloud Function `setUserRole`):
1. Set JWT custom claim: `auth.setCustomUserClaims(uid, { role })`
2. Write Firestore: `users/{uid} → { role }`

**Read** (Firestore rules `userRole()` function):
1. Check JWT claim: `request.auth.token.role` (0 reads)
2. Fallback: `get(/databases/.../users/{uid}).data.role` (1 read)

#### Performance Impact
| Metric | Before | After | Gain |
|--------|--------|-------|------|
| Admin Load | 30+ sec | <2 sec | **15x** |
| Firestore Reads/Load | 100+ | 0 | **Eliminated** |
| Permission Check | Query | JWT | **Instant** |

#### Files Modified
- `set-super-admin.js` - Bootstrap initialization script
- `functions/src/user/userFunctions.js` - setUserRole Cloud Function
- `src/api/admin/userManagementServices.js` - Frontend Cloud Function wrapper
- `firestore.rules` - Dual-read pattern in userRole() helper
- `src/context/AuthContext.jsx` - JWT token refresh with extractJWTClaims()

#### Test Status: ✅ All Passing
- Frontend unit tests: 829/829 ✅
- Cloud Functions: 87/87 ✅
- E2E tests: 107+ ✅
- Firestore rules: 57/57 ✅

---

### Phase 3a: Admin Layout Shell Pattern ✅

**Objective**: Separate admin section into dedicated layout with isolated navigation and auth checks.

#### Components Created
1. **AdminLayout.jsx** (56 lines)
   - Defense-in-depth auth at layout boundary
   - Validates user is authenticated and has admin role
   - Auto-redirects non-admins to dashboard
   
2. **AdminSidebar.jsx** (68 lines)
   - Config-driven navigation from `adminRoutes.js`
   - 9 menu items with role-based filtering
   - Responsive design (vertical desktop, horizontal mobile)

#### Architecture
```
App.jsx Routes
├── /admin → AdminLayout + AdminDashboard
├── /admin/users → AdminLayout + UsersPage
├── /admin/enrollments → AdminLayout + EnrollmentManagementPage
├── /admin/scheduling → AdminLayout + SchedulingPage
├── /admin/analytics → AdminLayout + AnalyticsPage
├── /admin/compliance → AdminLayout + ComplianceReportsPage
├── /admin/dets-export → AdminLayout + DETSExportPage
├── /admin/audit-logs → AdminLayout + AuditLogsPage
├── /admin/courses → AdminLayout + AdminCoursesPage (placeholder)
└── /admin/lessons → AdminLayout + AdminLessonsPage (placeholder)
```

#### Benefits
- ✅ Admin routes isolated from user navigation
- ✅ Centralized auth checks at layout level
- ✅ Config-driven (scalable: add page = create file + add sidebar item)
- ✅ Zero breaking changes

#### Test Status: ✅ All Passing
- E2E tests: 13/13 ✅ (admin-layout-sidebar.spec.ts)

---

### Phase 4: Tab-to-Sidebar Refactoring ✅

**Objective**: Convert monolithic AdminPage with internal tab switching to clean, route-driven architecture with dedicated pages.

**See**: [`PHASE_4_COMPLETION_SUMMARY.md`](./PHASE_4_COMPLETION_SUMMARY.md) for detailed completion report

#### Architecture Transformation
**Before**: Single AdminPage.jsx (168 lines) with 7 hardcoded tabs + adminTabs.js config  
**After**: 9 dedicated page components + route-based sidebar navigation

#### Pages Created
```
src/pages/Admin/
├── AdminDashboard.jsx (13 lines)           [Placeholder - to implement in Phase 4.2]
├── EnrollmentManagementPage.jsx (73)       [Wraps EnrollmentManagementTab]
├── SchedulingPage.jsx (15)                 [Wraps SchedulingManagement]
├── ComplianceReportsPage.jsx (13)          [Wraps ComplianceReporting]
├── DETSExportPage.jsx (13)                 [Wraps DETSExportTab]
├── AnalyticsPage.jsx (35)                  [Wraps AnalyticsTab]
├── UsersPage.jsx (13)                      [Wraps UserManagementTab]
├── AdminCoursesPage.jsx (16)               [Placeholder]
└── AdminLessonsPage.jsx (16)               [Placeholder]
```

#### Code Quality
- **Removed**: 255 lines (AdminPage + adminTabs + useAdminTabs)
- **Added**: 523 lines (9 pages + E2E tests)
- **Net**: +268 lines, but much better organized (single responsibility)

#### Configuration
- `src/config/adminRoutes.js` - ADMIN_SIDEBAR_ITEMS (9 items)
- `src/constants/routes.js` - ADMIN_ROUTES constants (10 routes)
- `src/hooks/useAdminNavigation.js` - Role-based filtering

#### Build Verification: ✅
- Size: 1,660.42 kB (gzipped: 466.21 kB)
- Modules: 1,217 transformed successfully
- No new errors or warnings

#### Test Status: ✅ All Passing
- E2E tests: 30 tests across 3 browsers ✅ (admin-pages-refactoring.spec.ts)
- All route protection and page structure tests verified

---

---

### Phase 4.2: Admin Dashboard Implementation ✅

**Objective**: Implement professional health-check dashboard with 3 business-critical widgets.

**Completion**: December 2025

#### Components Implemented
1. ✅ `src/hooks/admin/useDashboardStats.js` - Centralized Firestore data fetching
2. ✅ `src/components/admin/dashboard/CertificatesWidget.jsx` - Tracks undownloaded certificates
3. ✅ `src/components/admin/dashboard/RevenueWidget.jsx` - Monthly revenue aggregation
4. ✅ `src/components/admin/dashboard/ActivityWidget.jsx` - Recent user login activity
5. ✅ `src/pages/Admin/AdminDashboard.jsx` - Dashboard integration

#### Metrics Achieved
- ✅ Dashboard renders at `/admin` (replaces placeholder)
- ✅ All 3 widgets display correctly with error handling
- ✅ Responsive grid layout (1-3 columns, mobile-optimized)
- ✅ <1s load time with proper loading states
- ✅ Zero Firestore index creation needed (auto-created)

#### Test Status: ✅ Verified
- ✅ Build verification passed (1,660.42 kB)
- ✅ Manual CSS compliance check passed
- ✅ E2E tests confirm functionality

---

### Phase 5: Green Testing (100% Coverage & Passability) 📋

**Objective**: Achieve 100% test coverage across all modules and 100% test pass rate.

**See**: [`PHASE_5_GREEN_TESTING_RESEARCH.md`](./PHASE_5_GREEN_TESTING_RESEARCH.md) for complete research

**Status**: Researched & Ready to Implement

#### Key Goals
- Expand from 936+ to 1,000+ total tests
- Identify and test all untested code paths
- Achieve >90% coverage on API services
- Achieve >85% coverage on React components
- Add comprehensive E2E tests for all user journeys

#### Coverage Targets
| Module | Current | Target |
|--------|---------|--------|
| API Services | 70% | 95% |
| Components | 60% | 85% |
| Cloud Functions | 95% | 99% |
| E2E Tests | 107 tests | 150+ tests |
| Firestore Rules | 57 tests | 100+ tests |

#### Effort & Timeline
- Effort: 150+ hours (6-8 weeks)
- Risk: 🟡 Medium
- Can execute: Anytime, Phase 5 independent of Phase 6

---

### Phase 6: Code Maintenance & Performance Enhancements 📋

**Objective**: Optimize performance, reduce technical debt, improve code quality.

**See**: [`PHASE_6_MAINTENANCE_RESEARCH.md`](./PHASE_6_MAINTENANCE_RESEARCH.md) for complete research

**Status**: Researched & Ready to Implement

#### Performance Optimization Targets
| Metric | Current | Target | Method |
|--------|---------|--------|--------|
| Bundle Size | 466 kB | 350 kB | Code split, tree-shake (-25%) |
| Admin Dashboard Load | <2s | <1s | Cache, lazy load |
| Firestore Reads | Baseline | -40% | Batch, cache, denormalize |
| Re-renders | Baseline | -60% | memo, useCallback |

#### Work Streams
1. **Bundle Optimization** (16 hours) - Code splitting, dependency audit
2. **Database Optimization** (20 hours) - Caching, query batching, N+1 fixes
3. **React Performance** (16 hours) - Memoization, dependency optimization
4. **Error Handling** (12 hours) - Standardized error codes and logging
5. **Accessibility** (12 hours) - WCAG 2.1 AA compliance, mobile improvements
6. **Technical Debt** (16 hours) - Code duplication removal, pattern standardization

#### Effort & Timeline
- Effort: 120+ hours (4-6 weeks)
- Risk: 🟡 Medium
- Can execute: **Parallel with Phase 5** or sequential after

---

## Optional Future Enhancements

### Post-Phase 4.2 Improvements

**Skeleton Loading States** (3-4 hours, low priority, high UX value)
- Add animated skeleton loaders to high-data pages
- Pages: EnrollmentManagement, Analytics, AuditLogs, Users
- Timing: Wait until actual load times exceed 200ms on 4G throttle
- Status: Documented in research, not required for MVP

**Performance Optimizations** (Phase 5+)
- Real-time dashboard updates via Firestore listeners
- Cloud Function aggregation for monthly revenue (>500 payments/month)
- Admin bundle code-splitting (separate from main bundle)
- Batch user lookups instead of sequential queries

---

## Testing

### Test Suites & Results

| Suite | Count | Status | Framework |
|-------|-------|--------|-----------|
| Frontend unit tests | 829 | ✅ 100% | Vitest |
| Cloud Functions unit tests | 87 | ✅ 100% | Jest |
| E2E tests | 107+ | ✅ 100% | Playwright |
| Firestore rules | 57 | ✅ 100% | Firebase emulator |
| **Total** | **936+** | **✅ 100%** | **Mixed** |

### Running Tests
```bash
# Unit tests
npm test

# E2E tests (Chromium)
npm run test:e2e -- --project=chromium

# E2E interactive
npm run test:e2e:ui

# E2E debug
npm run test:e2e:debug
```

---

## Security Features

✅ **CORS Hardening** - Whitelist production domains only  
✅ **CSRF Protection** - Token validation on all form submissions  
✅ **App Check** - ReCaptcha V3 integration (debug token for dev)  
✅ **Firestore Rules** - Role-based access control + dual-read pattern  
✅ **Stripe Security** - API key isolation, webhook signature validation  
✅ **Audit Logging** - 40+ event types, 3-year retention, immutable logs  

---

## Deployment

### Current Deployments
- **Frontend**: Firebase Hosting (fastrackdrive.com)
- **Backend**: 24 Cloud Functions (Firebase Functions v2 API)
- **Database**: Firestore (Ohio data residency)
- **Error Tracking**: Sentry (errors + performance monitoring)

### Production Domains
- `https://fastrackdrive.com`
- `https://www.fastrackdrive.com`

### Required Environment Variables
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_STRIPE_PUBLISHABLE_KEY
VITE_APP_CHECK_DEBUG_TOKEN (dev only)
```

---

## Quick Reference: Key Files

### Core Components
- `src/context/AuthContext.jsx` - Auth state + JWT token refresh
- `src/components/layout/AdminLayout.jsx` - Admin layout shell
- `src/components/layout/AdminSidebar/AdminSidebar.jsx` - Admin navigation
- `src/pages/Admin/AdminDashboard.jsx` - Admin dashboard (placeholder)

### Configuration
- `src/config/adminRoutes.js` - Admin sidebar items
- `src/constants/routes.js` - Route constants (ADMIN_ROUTES)
- `src/constants/userRoles.js` - Role definitions
- `firestore.rules` - Security rules (dual-read pattern)

### Cloud Functions
- `functions/src/user/userFunctions.js` - User management (setUserRole)
- `functions/src/common/auditLogger.js` - Audit logging (40+ event types)
- `functions/src/certificate/certificateFunctions.js` - Certificate generation
- `functions/src/payment/paymentFunctions.js` - Payment processing

### Testing
- `tests/e2e/permission-boundaries.spec.ts` - Auth tests (19 tests)
- `tests/e2e/admin-layout-sidebar.spec.ts` - Admin layout tests (13 tests)
- `tests/e2e/admin-pages-refactoring.spec.ts` - Admin pages tests (30 tests)
- `vitest.config.js` - Unit test configuration
- `playwright.config.ts` - E2E test configuration

---

## Current Focus

**Phase 4 Completion**: ✅ COMPLETE & VERIFIED  
**Phase 4.2 Completion**: ✅ COMPLETE & VERIFIED  
**Phase 5 (Green Testing)**: 🚀 **IN PROGRESS - AUTH & STUDENT COMPLETE**
  - ✅ Auth Services tests VERIFIED (38/38 passing) - Security-critical path complete
  - ✅ Student Services tests VERIFIED (52/52 passing) - Student progression fully tested
  - 🟡 Course Services tests (0% → 95% coverage) - Next priority
  - 🟡 Cloud Functions error paths (95% → 99% coverage) - Queue
  - **Test count: 948 → 1,038 (+90 tests), 100% pass rate maintained**
  - **1,000+ test goal ACHIEVED ✅ (103.8% of target)**
  - Estimated completion: 6-8 weeks from start
**Phase 6 (Maintenance)**: 📋 RESEARCHED - Ready to implement (can run parallel with Phase 5)

**Current Work**:
1. Expanding test coverage from 948 to 1,000+ tests
2. Targeting >90% coverage on API services
3. Reference: [`PHASE_5_IMPLEMENTATION_TRACKER.md`](./PHASE_5_IMPLEMENTATION_TRACKER.md)

---

**Last Updated**: December 11, 2025, 12:03 PM  
**Status**: Production Ready - Phase 5 Auth & Student Services Complete (1,038 tests, 100% passing)
