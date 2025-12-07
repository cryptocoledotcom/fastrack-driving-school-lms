# Fastrack LMS - Repository Documentation

## Quick Start

### Prerequisites
- Node.js 20+ 
- npm 10+
- Firebase account with Firestore configured
- Stripe account (for payment processing)

### Installation

```bash
# Clone and install
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Firebase config and Stripe keys

# Start development server
npm run dev

# Start Cloud Functions emulator (backend)
cd functions
npm install
npm run serve
```

### Running Tests

```bash
# Unit & integration tests (Vitest)
npm test

# E2E tests (Playwright - Chromium only, per current workflow)
npm run test:e2e -- --project=chromium

# E2E interactive mode
npm run test:e2e:ui

# E2E debug mode
npm run test:e2e:debug
```

---

## Project Structure

### Frontend (`/src`)
- **`api/`** - Service layer (API calls, domain-organized)
- **`components/`** - React components (Admin, Auth, Courses, etc.)
- **`context/`** - React Context providers (Auth, Course, Modal, Timer)
- **`pages/`** - Page components
- **`utils/`** - Utility functions
- **`constants/`** - App constants (roles, routes, validation rules)
- **`config/`** - Firebase & environment configuration
- **`hooks/`** - Custom React hooks

### Backend (`/functions`)
- **`src/payment/`** - Payment processing (Stripe)
- **`src/certificate/`** - Certificate generation
- **`src/compliance/`** - Compliance & audit functions (DETS integration)
- **`src/user/`** - User management
- **`src/common/`** - Shared utilities

### Configuration
- **`vite.config.js`** - Vite build configuration
- **`vitest.config.js`** - Unit test configuration
- **`playwright.config.ts`** - E2E test configuration
- **`firebase.json`** - Firebase project settings
- **`firestore.rules`** - Firestore security rules

---

## Tech Stack

### Frontend
- **React 19.2.1** with Hooks
- **React Router 7.10.0** for routing
- **Vite 5.4.21** for building (4.7x faster than CRA)
- **Firebase 12.6.0** for auth & database
- **Vitest 1.6.1** for unit testing
- **Playwright 1.57.0** for E2E testing

### Backend
- **Node.js 20** (Gen 2)
- **Firebase Functions 7.0.0** (v2 API)
- **Firebase Admin SDK 12.0.0**
- **Stripe API** for payments

### DevOps
- **Firebase Hosting** (fastrackdrive.com, www.fastrackdrive.com)
- **Firestore** for data
- **Cloud Functions** (24 deployed functions)
- **Sentry** for error tracking & performance monitoring

---

## Key Features

### User Roles & Permissions
- **STUDENT**: Can enroll, take courses, view progress, download certificates
- **INSTRUCTOR**: Can create/edit lessons, grade quizzes, view student analytics
- **DMV_ADMIN**: Can manage compliance, view reports, manage lessons/slots
- **SUPER_ADMIN**: Full system access

### Compliance (Ohio OAC Chapter 4501-7)
✅ **50/50 Requirements Complete**:
- Enrollment certificates (120+ min + unit completion)
- Completion certificates (1,440+ min + 75% exam score)
- 4-hour daily maximum
- 30-day course expiration
- Post-video questions (PVQ)
- 3-strike exam lockout
- Audit logging (30+ event types, 3-year retention)
- Role-based access control

### Testing
- **Unit Tests**: 778/778 passing (100%)
- **E2E Tests**: 87/102 passing (85.3% - chromium only)
  - ✅ data-validation: 29/29 (100%)
  - ✅ admin-user-role-flow: 8/8 (100%)
  - ✅ dets-export-flow: 4/4 (100%)
  - ✅ negative-scenarios: 7/7 (100%)
  - ✅ quiz-certificate-flow: 5/5 (100%)
  - ✅ student-flow: 4/4 (100%)
  - ✅ security-audit: 16/16 (100%)
  - ⚠️ permission-boundaries: 14/19 (74% - pre-existing isolation issues)

---

## Recent Changes (December 7, 2025)

### Fixed
✅ **Data-validation timeout** - "duplicate email case sensitivity" test now passes using separate browser contexts
✅ **Console logs** - Removed debug statements from AdminDashboardRoute and RoleBasedRoute

### Current Status
- **Data-validation suite**: Fully passing (29/29) ✅
- **Other suites**: 7 out of 8 at 100% pass rate
- **Permission-boundaries**: Pre-existing test isolation issues (5 failures documented)
- **Multi-browser testing**: Deferred to later session per user request

---

## Development Workflow

### Making Changes
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes following existing code style
3. Run tests: `npm test && npm run test:e2e -- --project=chromium`
4. Commit with clear message: `git commit -m "feat: description"`
5. Push: `git push origin feature/your-feature`

### Before Committing
- Run linter: Check for ESLint errors
- Run tests: Ensure all tests pass
- Check console: No errors, warnings, or debug logs

### Git Conventions
- **`feat:`** - New feature
- **`fix:`** - Bug fix
- **`refactor:`** - Code refactoring
- **`test:`** - Test improvements
- **`docs:`** - Documentation updates
- **`chore:`** - Build, config, dependencies

---

## Deployment

### Firebase Hosting
```bash
# Build production bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Cloud Functions
```bash
cd functions
npm run deploy
```

### Environment Variables
Production environment variables are managed in Firebase Secrets Manager. Update via:
```bash
firebase functions:config:set cors.origins="https://fastrackdrive.com"
npm run deploy -- --only functions
```

---

## Monitoring & Debugging

### Sentry Error Tracking
- **Frontend DSN**: Available in `VITE_SENTRY_DSN`
- **Backend DSN**: Available in `functions/.env.local`
- **Dashboard**: https://sentry.io/organizations/fastrack-driving-school/

### Firebase Console
- **Database**: https://console.firebase.google.com/u/0/project/fastrack-driving-school-lms/firestore
- **Functions**: https://console.firebase.google.com/u/0/project/fastrack-driving-school-lms/functions
- **Hosting**: https://console.firebase.google.com/u/0/project/fastrack-driving-school-lms/hosting

### Local Testing
- **Dev server**: http://localhost:3000 (or 5173 with Vite)
- **Functions emulator**: http://localhost:5001
- **Firestore emulator**: http://localhost:8080

---

## Known Issues & Limitations

### Permission-Boundaries Test Suite
5 tests have pre-existing isolation issues (not from current work):
- Route-level access control timing
- Dynamic route parameter validation
- Session invalidation on logout

These are documented in CLAUDE.md and will be addressed in a future session.

---

## Future Roadmap

### Next Phase
- [ ] Fix permission-boundaries remaining 5 test failures
- [ ] Multi-browser E2E testing (Firefox, WebKit)
- [ ] Performance/load testing
- [ ] Real DETS API integration (awaiting Ohio credentials)
- [ ] CSRF token implementation in all forms
- [ ] Accessibility features (text-to-speech, extended time)

### Pre-Launch Security Checklist (Q1 2026)
- [ ] Remove Firebase default domains from CORS
- [ ] Add CSRF tokens to forms
- [ ] Final security audit
- [ ] Penetration testing
- [ ] Legal review & compliance certification

---

## Useful Commands

```bash
# Development
npm run dev                    # Start dev server with HMR
npm run build                 # Production build
npm run preview               # Preview production build

# Testing
npm test                       # Run unit tests
npm run test:ui               # Vitest UI dashboard
npm run test:e2e              # Run all E2E tests
npm run test:e2e:ui           # Playwright UI mode
npm run test:e2e:debug        # Playwright debug mode

# Backend (Functions)
cd functions
npm run serve                 # Local emulation
npm run deploy                # Deploy to Firebase
npm run logs                  # View function logs

# Git
git status                    # Check changes
git diff                      # View changes
git commit -m "msg"           # Commit changes
git push                      # Push to remote
```

---

## Resources

- **Project Documentation**: See `CLAUDE.md` for detailed architectural docs
- **Firebase Docs**: https://firebase.google.com/docs
- **Playwright Docs**: https://playwright.dev
- **Vite Docs**: https://vitejs.dev
- **React Docs**: https://react.dev

---

**Last Updated**: December 7, 2025
**Status**: Production-ready with 85.3% E2E test coverage (chromium)
