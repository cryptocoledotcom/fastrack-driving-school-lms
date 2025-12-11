# Fastrack LMS - Documentation Index

This file serves as the single source of truth for project documentation. All development information is organized below.

---

## 📚 Primary Documentation (Start Here)

### [`CLAUDE.md`](./CLAUDE.md) - **Main Development Reference**
Comprehensive development guide covering:
- Project overview and current status
- Architecture and tech stack
- Completed phases (Phase 3, 3a, 4, 4.2) with detailed explanations
- Researched Phase 5 & 6 with implementation roadmaps
- Optional future enhancements
- Testing overview
- Security features
- Deployment information
- Quick reference to key files

**Use this as your primary reference for understanding the project.**

### [`repo.md`](./repo.md) - **Project Setup & Quick-Start**
Quick reference covering:
- Installation and setup instructions
- Project structure and directory layout
- Tech stack overview
- Key features and compliance details
- Development status (completed phases table)
- Test coverage summary
- Architecture & design patterns
- Common development tasks
- Environment variables
- Troubleshooting guide

**Use this for getting started, setting up the development environment, and common tasks.**

---

## 📋 Detailed Phase Documentation

### [`PHASE_4_COMPLETION_SUMMARY.md`](./PHASE_4_COMPLETION_SUMMARY.md)
Standalone detailed summary of Phase 4: Tab-to-Sidebar Refactoring completion.
- Complete architecture transformation details
- Files created, modified, and deleted
- Code quality metrics
- Test results and E2E test coverage
- Build verification
- Root cause analysis of original test failures
- Solution implementation

**Reference this for in-depth understanding of Phase 4 changes.**

### [`PHASE_5_GREEN_TESTING_RESEARCH.md`](./PHASE_5_GREEN_TESTING_RESEARCH.md)
Comprehensive research for Phase 5: Green Testing - achieving 100% test coverage and 100% pass rate.
- Current test landscape analysis (936+ tests, coverage gaps)
- Coverage targets by module (frontend, backend, E2E, Firestore rules)
- 7-step implementation roadmap (profiling, test expansion, coverage targets)
- Component, API, Cloud Function, and E2E test specifications
- Success criteria (1,000+ tests, 100% coverage)
- Risk assessment and effort estimation (150+ hours, 6-8 weeks)

**Reference this when implementing Phase 5.**

### [`PHASE_6_MAINTENANCE_RESEARCH.md`](./PHASE_6_MAINTENANCE_RESEARCH.md)
Detailed research for Phase 6: Code Maintenance & Performance Enhancements.
- Performance baseline analysis (bundle size, load times, query latency)
- 8-step optimization roadmap (profiling, bundling, caching, components, queries, functions, error handling, accessibility)
- Bundle optimization targets (466 kB → 350 kB gzipped, -25%)
- Database query optimization (40% read reduction through batching and caching)
- React component performance (60% fewer re-renders through memoization)
- Accessibility and mobile responsiveness improvements
- Technical debt elimination and code quality enhancements
- Risk assessment and timeline (120+ hours, 4-6 weeks)

**Reference this when implementing Phase 6.**

---

## 🔧 Configuration Files (No Changes Needed)

- **`firestore.rules`** - Security rules for Firestore access control
- **`firestore.indexes.json`** - Firestore index configuration
- **`firebase.json`** - Firebase project configuration
- **`vite.config.js`** - Vite build configuration
- **`vitest.config.js`** - Unit test configuration
- **`playwright.config.ts`** - E2E test configuration
- **`.env.example`** - Environment variable template

---

## 📂 Project Directory Structure

```
📦 Fastrack LMS Root
├── 📄 CLAUDE.md                          ← START HERE (main dev reference)
├── 📄 repo.md                            ← Quickstart & project overview
├── 📄 DOCUMENTATION_INDEX.md             ← This file
├── 📄 PHASE_4_COMPLETION_SUMMARY.md      ← Phase 4 detailed summary
├── 📄 PHASE_4_2_DASHBOARD_RESEARCH.md    ← Phase 4.2 research & plan
├── 📄 README.md                          ← Basic project intro (minimal)
│
├── 📁 src/                               ← Frontend React code
│   ├── api/                              ← API service layer
│   ├── components/                       ← React components
│   │   └── layout/                       ← Layout components (AdminLayout, Sidebar)
│   ├── context/                          ← React Context (Auth, etc)
│   ├── pages/                            ← Page components
│   │   └── Admin/                        ← Admin pages
│   ├── hooks/                            ← Custom React hooks
│   ├── constants/                        ← Constants (routes, roles, etc)
│   ├── config/                           ← Configuration files
│   └── utils/                            ← Utility functions
│
├── 📁 functions/                         ← Backend Cloud Functions
│   └── src/
│       ├── payment/                      ← Payment processing
│       ├── certificate/                  ← Certificate generation
│       ├── compliance/                   ← Compliance & audit
│       ├── user/                         ← User management
│       └── common/                       ← Shared utilities
│
├── 📁 tests/                             ← E2E tests (Playwright)
│   └── e2e/
│       ├── permission-boundaries.spec.ts
│       ├── admin-layout-sidebar.spec.ts
│       ├── admin-pages-refactoring.spec.ts
│       └── ... (more test files)
│
├── 📁 docs/                              ← Additional documentation (archived sessions)
└── 📁 public/                            ← Static assets
```

---

## 🚀 Development Workflow

### Getting Started
1. Read [`repo.md`](./repo.md) - Setup and installation
2. Read [`CLAUDE.md`](./CLAUDE.md) - Project overview and architecture
3. Check specific phase documentation as needed

### Understanding Current State
- **Phase 3**: ✅ RBAC Migration & Bootstrap Security - [See CLAUDE.md](./CLAUDE.md#phase-3-rbac-migration--bootstrap-security-)
- **Phase 3a**: ✅ Admin Layout Shell Pattern - [See CLAUDE.md](./CLAUDE.md#phase-3a-admin-layout-shell-pattern-)
- **Phase 4**: ✅ Tab-to-Sidebar Refactoring - [See PHASE_4_COMPLETION_SUMMARY.md](./PHASE_4_COMPLETION_SUMMARY.md)
- **Phase 4.2**: ✅ Admin Dashboard Implementation - [See CLAUDE.md](./CLAUDE.md#phase-42-admin-dashboard-implementation-)
- **Phase 5**: 📋 Green Testing (100% Coverage) - [See PHASE_5_GREEN_TESTING_RESEARCH.md](./PHASE_5_GREEN_TESTING_RESEARCH.md)
- **Phase 6**: 📋 Code Maintenance & Performance - [See PHASE_6_MAINTENANCE_RESEARCH.md](./PHASE_6_MAINTENANCE_RESEARCH.md)

### When Implementing Phase 5 or Phase 6
1. Choose Phase 5 (test coverage), Phase 6 (performance), or both in parallel
2. Reference [`PHASE_5_GREEN_TESTING_RESEARCH.md`](./PHASE_5_GREEN_TESTING_RESEARCH.md) or [`PHASE_6_MAINTENANCE_RESEARCH.md`](./PHASE_6_MAINTENANCE_RESEARCH.md)
3. Follow the detailed implementation roadmap
4. Update [`CLAUDE.md`](./CLAUDE.md) upon completion
5. Follow testing guidelines in [`repo.md`](./repo.md)

### Common Tasks
See "Common Tasks" section in [`repo.md`](./repo.md) for:
- Adding a new admin page
- Adding a Cloud Function
- Creating a new test suite
- Deploying to production

---

## ✅ Current Status Summary

| Item | Status |
|------|--------|
| **Core Features** | ✅ 100% Complete |
| **Test Pass Rate** | ✅ 936+ tests (100%) |
| **Ohio Compliance** | ✅ 50/50 requirements |
| **Security** | ✅ CORS, CSRF, App Check, Firestore rules |
| **Admin Dashboard** | ✅ Phase 4.2 Complete (3 widgets implemented) |
| **Production Ready** | ✅ Yes - Sentry active, E2E verified |
| **Phase 5 (Green Testing)** | 📋 Researched - 100% coverage planning complete |
| **Phase 6 (Maintenance)** | 📋 Researched - Performance optimization roadmap complete |

---

## 📚 Information Architecture

```
Documentation Hierarchy:

Entry Points:
├── repo.md (setup, quick-start, quick reference)
└── CLAUDE.md (development reference, architecture)

Deep Dives:
├── PHASE_4_COMPLETION_SUMMARY.md (Phase 4 details)
└── PHASE_4_2_DASHBOARD_RESEARCH.md (Phase 4.2 specification)

Configuration:
├── firestore.rules
├── firebase.json
├── Environment variables (.env.example)
└── Build configs (vite, vitest, playwright)
```

---

## 🔄 Documentation Maintenance

### What to Update When
- **After completing a phase**: Update CLAUDE.md Phase section + add PHASE_X_COMPLETION_SUMMARY.md
- **After implementing research**: Update CLAUDE.md "Completed Phases" section
- **Before starting new phase**: Create PHASE_X_RESEARCH.md with specification
- **For quick-start changes**: Update repo.md installation/setup sections
- **For architecture changes**: Update CLAUDE.md architecture section

### Files to Ignore (Archived Old Sessions)
Old documentation from previous sessions is archived in `/docs/ARCHIVE/` and should not be referenced for current development. These include:
- RBAC_*.md (multiple files - see CLAUDE.md Phase 3 instead)
- DETS_*.md (integration complete - see CLAUDE.md instead)
- SESSION_*.md (old session notes - for reference only)
- E2E_FAILURE_REPORT.md, etc. (issues resolved - see PHASE_4_COMPLETION_SUMMARY.md instead)

---

## 🎯 Next Phases

### Phase 5: Green Testing (100% Coverage & Passability)
**Status**: Researched & Ready to Implement  
**Effort**: 6-8 weeks (150+ hours)  
**Risk**: 🟡 MEDIUM  
**Reference**: [`PHASE_5_GREEN_TESTING_RESEARCH.md`](./PHASE_5_GREEN_TESTING_RESEARCH.md)

**Scope**:
- Expand from 936+ tests to 1,000+ tests
- Achieve >90% coverage on all API services
- Achieve >85% coverage on React components
- Add 40+ new test files (unit, integration, E2E)
- Identify and test all untested code paths

### Phase 6: Code Maintenance & Performance Enhancements
**Status**: Researched & Ready to Implement (can run parallel with Phase 5)  
**Effort**: 4-6 weeks (120+ hours)  
**Risk**: 🟡 MEDIUM  
**Reference**: [`PHASE_6_MAINTENANCE_RESEARCH.md`](./PHASE_6_MAINTENANCE_RESEARCH.md)

**Scope**:
- Reduce bundle size: 466 kB → 350 kB gzipped (-25%)
- Reduce Firestore reads by 40% (caching + batching)
- Reduce re-renders by 60% (memoization + optimization)
- Improve load times: Admin Dashboard <1s, Courses <1s
- Standardize error handling and logging
- Improve accessibility (WCAG 2.1 AA) and mobile UX

---

**Last Updated**: December 11, 2025  
**Current Phase**: Phase 4.2 Complete, Phase 5-6 Researched  
**Maintainer**: Cole Bowersock
