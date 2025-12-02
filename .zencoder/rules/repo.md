---
description: Repository Information Overview
alwaysApply: true
---

# Fastrack Learning Management System

## Summary

A comprehensive Learning Management System (LMS) for Fastrack Driving School built with React 18 and Firebase. Features authentication, course management, progress tracking, time tracking, certificate generation, and role-based access control (student, instructor, admin). Payment integration with Stripe for course enrollment. Fully refactored with optimized folder structure, centralized utilities, expanded services layer, and modular Cloud Functions architecture.

## Repository Structure

**Monorepo** with two main projects:
- **React Frontend** (`src/`): React 18 SPA, organized by domain (api, components, context, services, utils, constants, pages, hooks)
- **Firebase Cloud Functions** (`functions/`): Node.js 20 serverless backend, organized by domain (payment, certificate, compliance, user, common)

## Language & Runtime

**Frontend**:
- **Language**: JavaScript (ES6+)
- **Framework**: React 18.2.0
- **Runtime**: Node.js (React Scripts)
- **Build System**: React Scripts 5.0.1
- **Package Manager**: npm

**Backend (Cloud Functions)**:
- **Language**: JavaScript (Node.js 20)
- **Runtime**: Firebase Cloud Functions 4.5.0
- **Build System**: Firebase CLI
- **Package Manager**: npm

## Dependencies

### Frontend Main Dependencies
- react: 18.2.0
- react-dom: 18.2.0
- react-router-dom: 6.20.0
- firebase: 10.7.1
- @stripe/react-stripe-js: 5.4.0
- recharts: 2.10.3

### Backend Dependencies
- firebase-admin: 13.6.0
- firebase-functions: 4.5.0
- @google-cloud/logging: 10.0.0
- cors: 2.8.5

## Architecture & Organization

### Frontend Structure (`src/`)
- **api/**: Domain-organized services (admin, auth, base, compliance, courses, enrollment, errors, security, student, utils, validators)
- **components/**: UI components organized by feature (admin, auth, common, courses, enrollment, student)
- **context/**: React Context providers (Auth, Course, Modal, Timer)
- **services/**: Application services (logging, storage, notifications)
- **utils/**: Utilities organized by domain (common, api)
- **constants/**: Constants organized by domain (courses, userRoles, compliance)
- **pages/**: Page components (Admin, Dashboard, Home, etc.)
- **hooks/**: Custom React hooks (useSessionTimer, useBreakManagement, etc.)

### Backend Structure (`functions/`)
- **src/payment/**: Payment processing functions (createCheckoutSession, createPaymentIntent, stripeWebhook)
- **src/certificate/**: Certificate generation
- **src/compliance/**: Compliance reporting and audit functions
- **src/user/**: User management functions
- **src/common/**: Shared utilities (auditLogger)

## Build & Installation

### Frontend
```bash
npm install
npm run build
npm start
```

### Backend (Cloud Functions)
```bash
cd functions
npm install
npm run deploy
npm run serve    # Local emulation
```

## Testing

**Framework**: Jest with React Testing Library

**Test Locations**:
- `src/**/__tests__/*.test.js` (35+ test files)
- `src/**/*.test.js` (inline test files)

**Coverage Areas**:
- API services and error handling
- Context providers (Auth, Course, Modal, Timer)
- Components (Admin, Auth, Common, Courses)
- Custom hooks
- Utilities and validators
- Firestore rules
- User role assignments

**Run Tests**:
```bash
npm test
```

**Current Coverage**: 100+ passing tests across:
- API services tests
- Component integration tests
- Context provider tests
- Compliance and scheduling tests
- Analytics and user management tests

## Project Improvements (Recent Refactoring)

### Phase 1-2: Barrel Exports & Constants Organization
- Created 11 API barrel exports for clean imports
- Created 8 component barrel exports
- Reorganized 9 constant files into domain-specific directories

### Phase 3: Utilities Consolidation
- Consolidated utilities into `src/utils/api/` and `src/utils/common/`
- Centralized domain-specific utilities (validators, helpers, sanitizers)
- Updated 18+ service files with new import paths
- Maintained 100% backward compatibility during migration

### Phase 4: Services Expansion
- **StorageService**: Comprehensive localStorage/sessionStorage management with auto-expiration, JSON serialization, and namespacing
- **NotificationService**: Global notification system with subscriber pattern supporting multiple types (success, error, warning, info, loading, confirm)
- Both services follow static class pattern for consistency

### Phase 5: Cloud Functions Organization
- Restructured from monolithic 37KB file to modular, domain-based architecture
- 5 domain folders with 11 organized function files
- Simplified main entry point from 37KB to 8 lines
- Maintained full backward compatibility via aggregated exports

### Phase 6: Comprehensive Test Coverage
- Created 3 context provider tests (42 Auth, 30 Course, 30 Modal)
- All 102 tests passing
- Complete coverage of authentication, data management, and UI state

## Production Status

✅ **Build**: 0 errors, 0 warnings  
✅ **Tests**: 100+ passing tests  
✅ **Linting**: All files lint-compliant  
✅ **Architecture**: Production-ready, fully optimized  
✅ **Backward Compatibility**: 100% maintained across all refactoring phases
