---
description: AI Agent Instructions - Fastrack LMS Development Style Guide
alwaysApply: true
---

# AI Agent Instructions - Fastrack LMS Development Style Guide

## Overview

This guide provides comprehensive instructions for AI agents (Claude, etc.) working on the Fastrack Learning Management System. It covers project context, code style, architecture patterns, development workflows, and quality standards.

**Project**: Fastrack Learning Management System (LMS)  
**Status**: Production-Ready (Phase 5 In Progress)  
**Tech Stack**: React 19 + Firebase 12 + Node.js 20 + Vitest + Playwright  
**Compliance**: 100% Ohio OAC Chapter 4501-7

---

## 1. Project Context & Quick Understanding

### What Is This Project?

Fastrack LMS is a **comprehensive learning management system for driving school education**. It provides:
- Multi-role access control (Student, Instructor, DMV Admin, Super Admin)
- Course management with video playback, lessons, quizzes, and assessments
- Dual certificate system (enrollment + completion)
- Stripe payment integration
- Ohio compliance tracking (1,440+ instruction minutes, 75% exam score, 4-hour daily limits)
- Real-time progress tracking and audit logging

### Key Statistics

| Metric | Value |
|--------|-------|
| **Test Coverage** | 1,044 tests (104.4% of 1,000+ target) |
| **Tests Passing** | 100% (all 1,044 tests pass) |
| **Cloud Functions** | 24 deployed (Firebase Functions v2 API) |
| **Compliance** | 50/50 Ohio OAC requirements (100%) |
| **Production Status** | ✅ Live with Sentry error tracking |
| **E2E Infrastructure** | ✅ Playwright setup complete, all 3 browsers passing |

### Architecture at a Glance

```
React Frontend (src/)
  ├── API Services (domain-organized)
  ├── React Context (Auth, Course, Modal, Timer)
  ├── Components (Admin, Auth, Courses, Enrollment, Student)
  └── Pages (Dashboard, Courses, Admin pages)
        ↓ (Firebase SDK)
Firebase Backend
  ├── Firestore (database)
  ├── Cloud Functions (24 deployed)
  └── Auth (email/password, Google Sign-In)
        ↓ (Server-side)
External Services
  ├── Stripe (payment processing)
  ├── Sentry (error tracking)
  └── Firebase Admin SDK
```

---

## 2. Code Style & Conventions

### 2.1 JavaScript Standards

```javascript
// ✅ DO: Use modern ES6+ syntax
const myFunction = (param1, param2) => param1 + param2;

// ✅ DO: Use const/let, never var
const immutableValue = 'value';
let mutableValue = 'value';

// ✅ DO: Use destructuring
const { userId, courseId } = data;
const [state, setState] = useState(null);

// ✅ DO: Use template literals
const message = `Hello ${name}`;

// ❌ DON'T: Use var or avoid destructuring
var oldStyle = 'avoid';
const firstName = props.profile.name;  // Instead: const { name } = props.profile

// ❌ DON'T: Use legacy callback syntax
.then(data => data)  // Good
.catch(error => { /* ... */ })  // Good
```

### 2.2 React Component Conventions

**Functional Components Only** - No class components:

```javascript
// ✅ DO: Functional component with hooks
export const CourseCard = ({ course, onEnroll }) => {
  const [loading, setLoading] = useState(false);
  const { enrollCourse } = useCoursesService();

  const handleEnroll = async () => {
    try {
      setLoading(true);
      await enrollCourse(course.id);
      onEnroll?.();
    } catch (error) {
      console.error('Enrollment failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2>{course.title}</h2>
      <button onClick={handleEnroll} disabled={loading}>
        {loading ? 'Enrolling...' : 'Enroll Now'}
      </button>
    </div>
  );
};

// ❌ DON'T: Class components or complex logic in render
class CourseCard extends React.Component { /* ... */ }
```

**File Structure** - Each component gets a folder:

```
src/components/courses/
├── CourseCard.jsx        # Component logic
├── CourseCard.test.jsx   # Tests (collocated)
├── CourseCard.module.css # Scoped styles
└── index.js              # Barrel export
```

### 2.3 Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| **Components** | PascalCase | `CourseCard.jsx`, `UserProfile.jsx` |
| **Files** | camelCase or PascalCase | `courseServices.js`, `CourseCard.jsx` |
| **Functions** | camelCase | `enrollCourse()`, `getUserStats()` |
| **Constants** | UPPER_SNAKE_CASE | `USER_ROLES`, `MAX_LOGIN_ATTEMPTS` |
| **Private methods** | _camelCase | `_applyFilters()`, `_validateInput()` |
| **CSS Classes** | kebab-case | `course-card`, `button-primary` |
| **Boolean functions** | is/has prefix | `isAdmin()`, `hasPermission()`, `isLoading` |

### 2.4 Imports Organization

```javascript
// Order of imports (maintain this order):
// 1. React and framework imports
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. External library imports
import { doc, getDoc, setDoc } from 'firebase/firestore';

// 3. Internal imports (from same project)
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import CourseCard from './CourseCard';

// 4. Styles
import styles from './Courses.module.css';

// 5. Constants (if any)
import { COURSE_CATEGORIES } from '../../constants/courses';
```

### 2.5 Comments & Documentation

**No Inline Comments** - Code should be self-documenting. Use comments only for **why**, not **what**:

```javascript
// ✅ DO: Explain complex logic
const calculateMinutes = (sessions) => {
  // Filter out partial sessions (< 15 min) to meet compliance rules
  return sessions
    .filter(s => s.duration >= 15)
    .reduce((sum, s) => sum + s.duration, 0);
};

// ❌ DON'T: Obvious comments
const calculateMinutes = (sessions) => {
  // map over sessions (DON'T!)
  return sessions.map(s => s.duration).reduce((a, b) => a + b, 0);
};
```

**JSDoc for Complex Functions**:

```javascript
/**
 * Enrolls a student in a course with payment verification
 * @param {string} userId - Student ID
 * @param {string} courseId - Course ID
 * @param {Object} payment - Payment details { method, amount, token }
 * @returns {Promise<{enrollmentId, certificateId}>}
 * @throws {PaymentError} If payment fails
 */
export const enrollCourse = async (userId, courseId, payment) => {
  // Implementation...
};
```

---

## 3. Architecture & Design Patterns

### 3.1 Service Layer Pattern

**All API calls go through the service layer** (`src/api/`), never directly from components.

```javascript
// ✅ DO: Use service layer
import { enrollCourse } from '../../api/courses/courseServices';

export const CourseCard = ({ courseId }) => {
  const handleEnroll = async () => {
    try {
      await enrollCourse(userId, courseId);
    } catch (error) {
      // Handle error...
    }
  };
};

// ❌ DON'T: Direct Firebase calls from components
export const CourseCard = ({ courseId }) => {
  const handleEnroll = async () => {
    // DON'T! This breaks the service layer pattern
    const docRef = doc(db, 'enrollments', userId);
    await setDoc(docRef, { /* data */ });
  };
};
```

### 3.2 Service Class Pattern

Services extend `ServiceBase` for common functionality:

```javascript
import ServiceBase from '../base/ServiceBase.js';

class CourseService extends ServiceBase {
  constructor() {
    super('CourseService');
  }

  async enrollCourse(userId, courseId) {
    // Use inherited validation
    this.validate.validateId(userId);
    this.validate.validateId(courseId);

    // Use inherited methods
    const course = await this.getDoc('courses', courseId);
    const enrollment = await this.setDoc('enrollments', {
      userId,
      courseId,
      enrolledAt: new Date().toISOString()
    });

    return enrollment;
  }
}

export default new CourseService();
```

**Inherited Methods** from `ServiceBase`:
- `this.getCurrentUser()` - Get authenticated user
- `this.getCurrentUserId()` - Get user UID
- `this.getDoc(collection, docId)` - Get single document
- `this.getCollection(collection, filters)` - Get collection with optional filters
- `this.setDoc(collection, data)` - Create document
- `this.updateDoc(collection, docId, data)` - Update document
- `this.deleteDoc(collection, docId)` - Delete document
- `this.validate` - Validators object for input validation

### 3.3 React Context Pattern

Global state managed through Context + hooks. Never use Redux or other state managers.

```javascript
// ✅ DO: Create context with provider
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be inside AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ DO: Use context in components
export const Dashboard = () => {
  const { user } = useAuth();
  return <h1>Welcome {user.email}</h1>;
};

// ❌ DON'T: Use Redux or other managers
// ❌ DON'T: Prop drilling (pass context through multiple levels)
```

### 3.4 Error Handling Pattern

All errors should be custom `ApiError` subclasses:

```javascript
import { ApiError, ValidationError, AuthenticationError } from '../errors/ApiError';

// ✅ DO: Throw custom errors with context
export const enrollCourse = async (userId, courseId) => {
  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  try {
    const enrollment = await firebaseCall();
    return enrollment;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    
    // Wrap Firebase errors
    throw new ApiError(
      'ENROLLMENT_FAILED',
      'Could not enroll in course',
      500,
      error
    );
  }
};

// In component:
try {
  await enrollCourse(userId, courseId);
} catch (error) {
  // Use user-friendly message
  toast.error(error.getUserMessage());
  
  // Log detailed error
  console.error('Enrollment error:', error.code, error.originalError);
}
```

### 3.5 Validation Pattern

Validation rules centralized in `src/utils/api/validators.js`:

```javascript
// ✅ DO: Use centralized validators
import { validators } from '../../utils/api/validators';

export const updateUserRole = async (userId, newRole) => {
  validators.validateId(userId);
  validators.validateUserRole(newRole);
  
  // Safe to proceed - inputs validated
};

// ❌ DON'T: Inline validation logic
if (!userId || userId.length < 20) {
  throw new Error('Invalid ID');
}
```

### 3.6 Domain Organization

Services and components organized by business domain:

```
src/api/
├── admin/               # Admin-only services
├── auth/                # Authentication
├── courses/             # Course management
├── enrollment/          # Enrollment workflows
├── payment/             # Payment processing
├── compliance/          # Ohio compliance
├── student/             # Student data
├── errors/              # Custom error classes
├── base/                # ServiceBase class
└── validators/          # Validation rules

src/components/
├── admin/               # Admin components
├── auth/                # Auth forms
├── courses/             # Course display
├── enrollment/          # Enrollment flows
├── student/             # Student features
└── layout/              # Layout shells
```

---

## 4. Development Workflow

### 4.1 Branch Naming

```bash
feature/user-authentication       # New feature
bugfix/payment-error-handling     # Bug fix
docs/update-readme                # Documentation
test/add-enrollment-tests         # Tests
refactor/reduce-bundle-size       # Refactoring
```

### 4.2 Development Process

**1. Create Feature Branch**
```bash
git checkout -b feature/new-feature
```

**2. Write Tests First (TDD)**
```bash
# Create test file alongside code
src/api/courses/
├── courseServices.js
├── courseServices.test.js        ← Create this first!
```

**3. Run Tests Locally**
```bash
npm test -- courseServices.test.js --watch
# Watch mode helps development with immediate feedback
```

**4. Write Implementation**
- Follow code style guidelines
- Use service layer pattern
- Add proper error handling
- Update documentation if needed

**5. Ensure Tests Pass**
```bash
npm test                          # All unit tests must pass
npm run lint                      # No linting errors
npm run test:e2e                  # E2E tests (uses emulators)
npm run build                     # Build must succeed
```

**6. Manual Testing on Port 3000 (Production Build)**
```bash
# Test against Production Firebase to verify integration
npm run dev

# Verify:
# - App loads on localhost:3000
# - All features work as expected
# - No console errors
# - Responsive design works on mobile
```

**7. Commit with Meaningful Message**
```
feature(courses): add course search with filters

- Add searchCourses() service function
- Support filtering by difficulty, duration, category
- Add 8 unit tests covering all paths
```

**8. Update Documentation**
Update relevant doc files:
- `CLAUDE.md` - if architecture changed
- `docs/reference/API.md` - if API changed
- Component headers - if new patterns introduced

### 4.3 Test Requirements

**For Every Feature**:
- ✅ Unit tests for all services
- ✅ Component tests for UI features
- ✅ E2E tests for critical user flows
- ✅ All tests passing locally before commit

**Test Coverage Targets**:
- API Services: >90% coverage
- React Components: >85% coverage
- Cloud Functions: >95% coverage
- E2E: All critical user journeys

**Test File Naming**:
```
ComponentName.jsx          → ComponentName.test.jsx
serviceFunction.js         → serviceFunction.test.js
utilityFunction.js         → utilityFunction.test.js
```

---

## 5. Testing Guidelines

### 5.0 Testing Environments

**Unit & Component Tests** (Vitest)
- Run with `npm test`
- Use Firebase Emulators via `VITE_USE_EMULATORS=true` (optional but recommended)
- Fast feedback loop (100+ tests per second)
- Perfect for development

**E2E Tests** (Playwright)
- Run with `npm run test:e2e`
- Automatically uses Firebase Emulators (Port 3001)
- Tests complete user workflows
- Runs on Chromium, Firefox, and WebKit
- Important for critical user flows before commit

**Production Manual Testing** (Port 3000)
- Run `npm run dev` (connects to Production Firebase)
- Verify integration with real backend services
- Required before final commit/deployment
- Test real payment flows (with test Stripe keys)

### 5.1 Unit Tests (Vitest)

```javascript
// ✅ DO: Comprehensive test coverage
describe('enrollCourse', () => {
  it('enrolls user in course successfully', async () => {
    const result = await enrollCourse('user123', 'course456');
    expect(result).toHaveProperty('enrollmentId');
    expect(result.enrolledAt).toBeDefined();
  });

  it('throws error for invalid user ID', async () => {
    await expect(enrollCourse(null, 'course456'))
      .rejects.toThrow('User ID is required');
  });

  it('throws error for duplicate enrollment', async () => {
    await expect(enrollCourse('user123', 'course456'))
      .rejects.toThrow('Already enrolled');
  });

  it('updates user progress after enrollment', async () => {
    await enrollCourse('user123', 'course456');
    const progress = await getUserProgress('user123');
    expect(progress.enrolledCourses).toContain('course456');
  });
});
```

**Test Patterns**:
- Test happy path (success case)
- Test error cases (invalid input, permissions, conflicts)
- Test side effects (does it update related data?)
- Test edge cases (empty arrays, null values, timeouts)

### 5.2 Component Tests

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CourseCard } from './CourseCard';

describe('CourseCard', () => {
  it('renders course title and enroll button', () => {
    const course = { id: '1', title: 'React Basics', price: 99 };
    render(<CourseCard course={course} />);
    
    expect(screen.getByText('React Basics')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enroll/i })).toBeInTheDocument();
  });

  it('calls onEnroll callback when button clicked', async () => {
    const onEnroll = vi.fn();
    const course = { id: '1', title: 'React' };
    
    render(<CourseCard course={course} onEnroll={onEnroll} />);
    fireEvent.click(screen.getByRole('button', { name: /enroll/i }));
    
    await waitFor(() => {
      expect(onEnroll).toHaveBeenCalledWith(course.id);
    });
  });

  it('shows loading state during enrollment', async () => {
    const course = { id: '1', title: 'React' };
    render(<CourseCard course={course} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/enrolling/i)).toBeInTheDocument();
  });
});
```

### 5.3 E2E Tests (Playwright)

```javascript
import { test, expect } from '@playwright/test';

test('student completes course enrollment flow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'student@test.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('text=Sign In');
  
  // View course
  await page.click('text=React Basics');
  await expect(page).toHaveURL('/courses/react-basics');
  
  // Enroll in course
  await page.click('text=Enroll Now');
  
  // Verify enrollment (payment or free)
  if (page.url().includes('/checkout')) {
    // Payment flow
    await page.fill('[name="cardNumber"]', '4242424242424242');
    await page.click('text=Complete Purchase');
  }
  
  // Verify enrollment successful
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('text=React Basics')).toBeVisible();
});
```

### 5.4 Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test courseServices.test.js

# Watch mode (reruns on file changes)
npm test -- --watch

# Run with coverage
npm test -- --coverage

# E2E tests
npm run test:e2e

# E2E interactive mode
npm run test:e2e:ui

# E2E debug mode
npm run test:e2e:debug

# Vitest UI dashboard
npm run test:ui
```

---

## 6. Cloud Functions Guidelines

### 6.1 Function Structure (v2 API) - STANDARDIZED

**All Cloud Functions use Firebase Functions v2 API with `async (request)` signature** (100% standardized as of Phase 5.1).

**CRITICAL PATTERN**: Validate parameters BEFORE initializing expensive services (Stripe, etc). This ensures validation errors return proper messages instead of service initialization errors.

```javascript
const { onCall } = require('firebase-functions/v2/https');
const { db } = require('../common/firebase-admin');

exports.enrollCourse = onCall(async (request) => {
  try {
    // 1. Authentication check
    const { data, auth, rawRequest } = request;
    if (!auth) {
      throw new Error('UNAUTHENTICATED: User must be authenticated');
    }

    // 2. Input validation (BEFORE expensive operations)
    const { userId, courseId, amount } = data;
    if (!userId || !courseId || !amount) {
      throw new Error('INVALID_ARGUMENTS: Missing required fields');
    }

    // 3. Permission check
    if (auth.uid !== userId) {
      throw new Error('PERMISSION_DENIED: Cannot enroll other users');
    }

    // 4. NOW safe to initialize expensive services
    // Example: const stripe = new Stripe(apiKey);

    // 5. Business logic
    const enrollmentRef = db.collection('enrollments').doc();
    await enrollmentRef.set({
      userId,
      courseId,
      amount,
      enrolledAt: new Date().toISOString(),
      status: 'active'
    });

    // 6. Return success
    return {
      success: true,
      enrollmentId: enrollmentRef.id,
      message: 'Enrollment successful'
    };

  } catch (error) {
    // Error logging (use Sentry or Cloud Logging)
    console.error('Enrollment failed:', error);
    
    // Return proper error
    if (error.message.includes('UNAUTHENTICATED')) {
      throw new functions.https.HttpsError('unauthenticated', error.message);
    }
    if (error.message.includes('PERMISSION_DENIED')) {
      throw new functions.https.HttpsError('permission-denied', error.message);
    }
    
    throw new functions.https.HttpsError('internal', 'Enrollment failed');
  }
});
```

**Key Gen 2 Features**:
- `request.data` - Function call data (replaces Gen 1 `data` parameter)
- `request.auth` - Authentication context (replaces Gen 1 `context.auth`)
- `request.rawRequest` - Raw Express request (for headers, IP, etc)

### 6.2 Common Patterns

**Calling Cloud Functions from Frontend**:

```javascript
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase';

export const enrollCourse = async (userId, courseId, amount) => {
  const enrollCourseFunction = httpsCallable(functions, 'enrollCourse');
  
  try {
    const result = await enrollCourseFunction({
      userId,
      courseId,
      amount
    });
    return result.data;
  } catch (error) {
    throw new ApiError(
      'ENROLLMENT_FAILED',
      error.message,
      500,
      error
    );
  }
};
```

**Firestore Batch Operations**:

```javascript
const batch = db.batch();

// Add multiple operations
batch.set(db.collection('enrollments').doc(), enrollmentData);
batch.update(db.collection('users').doc(userId), {
  lastAction: new Date().toISOString()
});
batch.update(db.collection('courses').doc(courseId), {
  enrollmentCount: increment(1)
});

// Commit all at once (atomic)
await batch.commit();
```

### 6.3 Testing Cloud Functions (Gen 2 Pattern)

```javascript
const { enrollCourse } = require('../../src/myfeature/myFunctions');

describe('enrollCourse', () => {
  it('enrolls user successfully', async () => {
    const result = await enrollCourse.run({
      auth: { uid: 'user123' },
      data: {
        userId: 'user123',
        courseId: 'course456',
        amount: 9999
      },
      rawRequest: { 
        headers: { 'user-agent': 'test-agent' }
      }
    });

    expect(result.success).toBe(true);
    expect(result.enrollmentId).toBeDefined();
  });

  it('rejects unauthenticated requests', async () => {
    await expect(
      enrollCourse.run({
        auth: null,
        data: {
          userId: 'user123',
          courseId: 'course456',
          amount: 9999
        }
      })
    ).rejects.toThrow('UNAUTHENTICATED');
  });

  it('rejects invalid input', async () => {
    await expect(
      enrollCourse.run({
        auth: { uid: 'user123' },
        data: { userId: 'user123' }  // Missing courseId, amount
      })
    ).rejects.toThrow('INVALID_ARGUMENTS');
  });

  it('rejects permission denied', async () => {
    await expect(
      enrollCourse.run({
        auth: { uid: 'user123' },
        data: {
          userId: 'different-user',  // Different from auth.uid
          courseId: 'course456',
          amount: 9999
        }
      })
    ).rejects.toThrow('PERMISSION_DENIED');
  });
});
```

**Gen 2 Test Pattern**:
- Use `.run({ data, auth, rawRequest })` to invoke functions
- `data` - Arguments passed to the function
- `auth` - Authentication context with `uid` property
- `rawRequest` - Express request object (for headers, IP, user-agent)

---

## 7. Common Workflows & Tasks

### 7.1 Add a New Course Feature

**1. Create Service** (`src/api/courses/courseServices.js`)
```javascript
export const getCourseFeedback = async (courseId) => {
  this.validate.validateId(courseId);
  const feedback = await this.getCollection(`courses/${courseId}/feedback`);
  return feedback;
};
```

**2. Write Tests** (`src/api/courses/__tests__/courseServices.test.js`)
```javascript
describe('getCourseFeedback', () => {
  it('returns feedback for course', async () => {
    const feedback = await getCourseFeedback('course123');
    expect(Array.isArray(feedback)).toBe(true);
  });
  // Add more tests...
});
```

**3. Create Component** (`src/components/courses/CourseFeedback.jsx`)
```javascript
export const CourseFeedback = ({ courseId }) => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await getCourseFeedback(courseId);
        setFeedback(data);
      } catch (error) {
        console.error('Failed to load feedback:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [courseId]);

  if (loading) return <LoadingSpinner />;
  return (
    <div>
      {feedback.map(item => (
        <FeedbackCard key={item.id} feedback={item} />
      ))}
    </div>
  );
};
```

**4. Run Tests**
```bash
npm test -- courseServices.test.js
npm test -- CourseFeedback.test.js
npm run lint
```

**5. Update Documentation**
- Update `docs/reference/API.md` with new functions
- Update `CLAUDE.md` if architecture changed

### 7.2 Add a Cloud Function

**1. Create Function** (`functions/src/courses/courseFunctions.js`)
```javascript
const { onCall } = require('firebase-functions/v2/https');
const { db } = require('../common/firebase-admin');

exports.submitCourseFeedback = onCall(async (request) => {
  const { courseId, rating, comment } = request.data;
  const userId = request.auth.uid;

  // Validate...
  // Business logic...
  // Return result...
});
```

**2. Deploy**
```bash
cd functions
npm install  # if dependencies added
firebase deploy --only functions
```

**3. Verify Deployment**
```bash
firebase functions:list
# Should show new function in list
```

### 7.3 Deploy to Production

**1. Verify All Tests Pass**
```bash
npm test
npm run lint
npm run build
```

**2. Deploy Frontend**
```bash
firebase deploy --only hosting
```

**3. Deploy Cloud Functions**
```bash
firebase deploy --only functions
```

**4. Verify Deployment**
```bash
# Check frontend
open https://fastrackdrive.com

# Check functions
firebase functions:list
# Or check Cloud Console
```

### 7.4 Add Admin Page

**1. Create Page Component** (`src/pages/Admin/NewAdminPage.jsx`)
```javascript
export const NewAdminPage = () => {
  const { userProfile } = useAuth();

  // Permission check handled by AdminLayout
  return (
    <div>
      <h1>Admin Feature</h1>
      {/* Page content */}
    </div>
  );
};
```

**2. Add Route** (`src/config/adminRoutes.js`)
```javascript
export const ADMIN_SIDEBAR_ITEMS = [
  // ... existing items
  {
    label: 'New Feature',
    route: '/admin/new-feature',
    icon: '⚙️'
  }
];
```

**3. Add Route Config** (`src/constants/routes.js`)
```javascript
export const ADMIN_ROUTES = {
  // ... existing routes
  NEW_FEATURE: '/admin/new-feature'
};
```

**4. Update Router** (`src/App.jsx`)
```javascript
<Route path="/admin/new-feature" element={<AdminLayout><NewAdminPage /></AdminLayout>} />
```

**5. Test**
- E2E test: Verify navigation works
- Verify role-based access control

---

## 8. Quality Standards & Checklists

### 8.1 Before Submitting Code

**Code Quality**
- [ ] No ESLint errors: `npm run lint`
- [ ] Code follows style guide
- [ ] No console errors/warnings
- [ ] No secrets or API keys in code
- [ ] No commented-out code

**Testing**
- [ ] All tests passing: `npm test`
- [ ] New features have tests
- [ ] Tests cover happy path and error cases
- [ ] E2E tests for user flows
- [ ] >85% coverage on new code

**Documentation**
- [ ] README updated if needed
- [ ] JSDoc comments on complex functions
- [ ] Error messages are user-friendly
- [ ] CLAUDE.md updated if architecture changed
- [ ] API docs updated for new endpoints

**Performance**
- [ ] Build size acceptable: `npm run build`
- [ ] No N+1 queries
- [ ] Proper loading states
- [ ] Memoization used for expensive components
- [ ] No memory leaks

### 8.2 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Tests failing after code change | Run `npm test -- --update` to update snapshots if intentional |
| Linting errors | Run `npm run lint --fix` to auto-fix most issues |
| Build warnings | Check `vite.config.js` for ignored warnings |
| Firestore timeout | Increase timeout in `ServiceBase.js` getCollection method |
| Auth context errors | Ensure AuthProvider wraps entire app in `App.jsx` |
| Firebase credentials error | Check `.env` file has all required variables |

---

## 9. Important Files Reference

### Core Architecture Files

| File | Purpose |
|------|---------|
| `src/config/firebase.js` | Firebase initialization and config |
| `src/context/AuthContext.jsx` | Global auth state management |
| `src/api/base/ServiceBase.js` | Base class for all services |
| `src/api/errors/ApiError.js` | Custom error classes |
| `src/utils/api/validators.js` | Centralized validation rules |
| `firestore.rules` | Firestore security rules |
| `functions/src/common/ServiceWrapper.js` | Cloud Function base class |

### Documentation Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Main development reference (phases, architecture) |
| `repo.md` | Quick-start and project overview |
| `DOCUMENTATION_INDEX.md` | Navigation guide for all docs |
| `docs/reference/ERROR_HANDLING_GUIDE.md` | Error handling patterns |
| `docs/reference/API.md` | API services documentation |
| `docs/development/CONTRIBUTING.md` | Contributing guidelines |
| `docs/development/API_DOCUMENTATION.md` | Cloud Functions API reference |

### Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.js` | Frontend build config |
| `vitest.config.js` | Unit test config |
| `playwright.config.ts` | E2E test config |
| `firestore.indexes.json` | Firestore index definitions |
| `firebase.json` | Firebase project config |
| `.env.example` | Environment variables template |

---

## 10. Development Environment Setup

### 10.1 Required Tools

```bash
# Node.js 20+ (LTS)
node --version  # Should be v20+

# npm 8+
npm --version

# Firebase CLI (required for emulators and deployment)
npm install -g firebase-tools
firebase --version

# Java 11+ (required for Firebase Emulators only)
java -version  # Only needed if running firebase emulators:start

# Git
git --version
```

**Optional Tools**:
- **Chrome/Chromium**: For Playwright E2E tests
- **Docker**: For alternative emulator setup (not required)

### 10.2 Initial Setup

```bash
# Clone repository
git clone <repo-url>
cd fastrack-lms

# Install dependencies
npm install
cd functions && npm install && cd ..

# Create .env file
cp .env.example .env
# Edit .env with your Firebase credentials
```

### 10.3 Development Environment Strategy

The Fastrack LMS supports two development environments with automatic switching:

#### Port 3000: Production Build (Default)
Connects to **Production Firebase** for testing against real backend services.

```bash
# Start development on Port 3000 (default, connects to Production Firebase)
npm run dev
```

**Environment**: 
- **Port**: 3000
- **Firebase**: Production Firebase (uses VITE_FIREBASE_PROJECT_ID)
- **Use Case**: Testing integration with production services, staging changes, manual QA
- **Environment Variable**: `VITE_USE_EMULATORS=false` (or omitted - this is the default)

#### Port 3001: Emulator Build
Connects to **Firebase Emulators** for isolated testing without affecting production data.

```bash
# Start development on Port 3001 (with Firebase Emulators)
VITE_USE_EMULATORS=true npm run dev
```

**Environment**:
- **Port**: 3001 (automatically assigned if 3000 is occupied)
- **Firebase**: Local Firebase Emulators (Auth, Firestore, Cloud Functions on localhost:9099, 8080, 5001)
- **Project ID**: Overridden to 'demo-test' for emulator compatibility
- **Use Case**: Unit/integration testing, E2E tests, development without production data concerns
- **Environment Variable**: `VITE_USE_EMULATORS=true`

#### How to Switch Between Environments

**On Windows**:
```bash
# Production Firebase (Port 3000)
npm run dev

# Firebase Emulators (Port 3001)
set VITE_USE_EMULATORS=true && npm run dev
```

**On macOS/Linux**:
```bash
# Production Firebase (Port 3000)
npm run dev

# Firebase Emulators (Port 3001)
VITE_USE_EMULATORS=true npm run dev
```

#### Running Firebase Emulators Locally

If using the emulator build, start the Firebase Emulators in a separate terminal:

```bash
# Terminal 1: Start Firebase Emulators (Auth, Firestore, Cloud Functions)
firebase emulators:start

# Terminal 2: Start development server with emulators enabled
VITE_USE_EMULATORS=true npm run dev
```

**Emulator Services**:
- **Auth Emulator**: http://127.0.0.1:9099
- **Firestore Emulator**: http://127.0.0.1:8080
- **Cloud Functions Emulator**: http://127.0.0.1:5001
- **Firestore UI**: http://127.0.0.1:4000

### 10.4 Environment Variables

Required in `.env`:

```
# Firebase Configuration (Production)
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=xxx

# Sentry Error Tracking
VITE_SENTRY_DSN=xxx

# App Check (Development Token - Optional)
VITE_APP_CHECK_DEBUG_TOKEN=xxx (dev only)

# Firebase Emulator Toggle (Optional)
# Set to 'true' to use Firebase Emulators instead of Production Firebase
# Default: 'false' (uses Production Firebase)
VITE_USE_EMULATORS=false
```

**Note**: You can override `VITE_USE_EMULATORS` at runtime without adding it to `.env`:
```bash
VITE_USE_EMULATORS=true npm run dev
```

---

## 11. Communication & Documentation

### 11.1 Commit Message Format

```
type(scope): subject line

Detailed explanation of what changed and why.
Include relevant issue numbers.

Fixes #123
Relates to #456
```

**Types**: feature, bugfix, docs, test, refactor, chore

**Example**:
```
feature(courses): implement course search with filters

- Add searchCourses() function to courseServices
- Support filtering by difficulty, duration, price
- Add full text search on course title/description
- Include 8 unit tests covering all paths
- Update API documentation

Fixes #123
```

### 11.2 Documentation Updates

When making changes, update relevant documentation:

**Architecture/Design Changes** → Update `CLAUDE.md`
**New API Functions** → Update `docs/reference/API.md`
**New Cloud Functions** → Update `docs/development/API_DOCUMENTATION.md`
**Setup Changes** → Update `repo.md`
**Contributing Guidelines** → Update `docs/development/CONTRIBUTING.md`

### 11.3 Phase Completion

When completing a phase:
1. Create `PHASE_X_COMPLETION_SUMMARY.md`
2. Update `CLAUDE.md` with phase section
3. Update `DOCUMENTATION_INDEX.md`
4. Update `README.md` status section

---

## 12. Current Phase Status

### Phase 5: Green Testing (IN PROGRESS)

**Objective**: Achieve 1,000+ tests with >90% code coverage

**Current Progress**:
- ✅ Auth Services: 38/38 tests
- ✅ Student Services: 52/52 tests
- ✅ Course/Lesson/Quiz Services: 39/39 tests
- ✅ Component Tests: 24/24 tests (CheckoutForm, PaymentModal, EnrollmentCard, LessonBooking, UpcomingLessons, Layout components)
- ✅ E2E Tests: 100+ tests (Student Complete Journey passing)
- ✅ Cloud Functions Unit Tests: 87/87 tests (All Gen 2 signature, payment + compliance)
- **Total**: 1,044 tests (104.4% of goal)

#### Phase 5.1: Gen 2 Cloud Functions Migration (COMPLETED)
- ✅ Payment Functions: `createCheckoutSession`, `createPaymentIntent` (Gen 2 signature)
- ✅ Video Question Functions: `checkVideoQuestionAnswer`, `getVideoQuestion`, `recordVideoQuestionResponse` (Gen 2 signature)
- ✅ Test Suite: All 87 Cloud Functions tests updated to Gen 2 calling convention
- ✅ Impact: All 23 failing tests fixed, 100% standardization achieved

**Next Focus**:
- Expand E2E tests (Instructor workflows, Admin operations)
- Add more error path coverage
- Achieve E2E test stability across browsers

### Phase 6: Performance & Maintenance (RESEARCHED)

**Objectives**:
- Reduce bundle size: 466 kB → 350 kB (-25%)
- Reduce Firestore reads by 40%
- Reduce re-renders by 60%
- Improve accessibility

**Status**: Ready to implement in parallel with Phase 5

---

## 13. Quick Reference Commands

### Development Environment

```bash
# Production Firebase (Port 3000) - DEFAULT
npm run dev              # Start dev server on localhost:3000

# Firebase Emulators (Port 3001)
VITE_USE_EMULATORS=true npm run dev  # Linux/macOS
set VITE_USE_EMULATORS=true && npm run dev  # Windows

# Firebase Emulators (separate terminal)
firebase emulators:start # Start Auth, Firestore, Cloud Functions emulators
```

### Testing

```bash
npm test                # Run all unit tests
npm test -- --watch    # Watch mode (reruns on file changes)
npm test -- --coverage # With coverage report
npm run test:ui        # Vitest UI dashboard

# E2E Tests (runs against Port 3001 with Emulators by default)
npm run test:e2e        # Run all E2E tests (headless)
npm run test:e2e:ui    # E2E interactive mode
npm run test:e2e:debug  # E2E debug mode
```

### Building & Deployment

```bash
npm run build           # Production build (optimized)
npm run preview         # Preview production build locally
npm run lint            # ESLint check
npm run lint --fix      # Auto-fix linting issues
```

### Firebase CLI

```bash
# Deployment
firebase deploy                      # Deploy everything (hosting + functions)
firebase deploy --only hosting       # Deploy frontend only
firebase deploy --only functions     # Deploy Cloud Functions only

# Verification
firebase functions:list              # List deployed functions
firebase logs read -n 50             # View function logs

# Local Emulation
firebase emulators:start             # Start all emulators
firebase emulators:start --only auth,firestore  # Start specific emulators
```

---

## 14. Known Patterns & Common Pitfalls

### Authentication State Management Pattern

**Pitfall**: Authentication functions (register, login) often have race conditions where navigation happens before the auth context state updates.

**Root Cause**: Firebase `onAuthStateChanged()` is asynchronous. If you call `navigate()` immediately after `await register()`, the `user` state may still be null because the listener hasn't fired yet.

**Solution**: Explicitly set user/profile state in the auth function itself after successful authentication, rather than relying on the async listener.

```javascript
// ✅ CORRECT PATTERN - in AuthContext.jsx
const register = async (email, password, additionalData) => {
  // ... validation and auth creation ...
  const result = await createUserWithEmailAndPassword(auth, email, password);
  
  // Create profile in Firestore
  const profileData = await createUserProfile(result.user.uid, {...data});
  
  // IMMEDIATELY set state - don't wait for onAuthStateChanged listener
  setUser(result.user);
  setUserProfile(profileData);
  setLoading(false);
  
  return result.user;
};

// In RegisterPage.jsx - now safe to navigate
await register(email, password, data);
navigate('/dashboard'); // user state is already set
```

**Files Using This Pattern**:
- `src/context/AuthContext.jsx`: Lines 209-210 (login), 259-261 (register), 284-285 (loginWithGoogle)

**Related**: This pattern is essential for ProtectedRoute to work correctly, as it checks `user` state to determine redirect.

---

## 15. Key Principles

**When Developing for Fastrack LMS, Remember**:

1. **Service Layer First** - All data access through services, never direct Firebase
2. **Test-Driven** - Write tests before implementation
3. **Error Handling** - Use custom ApiError classes with proper error messages
4. **Security First** - Firestore rules enforce access control, not just frontend
5. **Performance Conscious** - Batch operations, memoize components, lazy load routes
6. **Documentation** - Code changes = documentation updates
7. **Accessibility** - Components must be keyboard navigable, semantic HTML
8. **Compliance** - Ohio OAC rules are non-negotiable
9. **Production Ready** - Every commit could be deployed
10. **User Focused** - Error messages and UX for real users, not developers

---

**Last Updated**: December 16, 2025  
**For**: AI Agent Guidance (Claude, etc.)  
**Purpose**: Consistent development style across all contributors
**Latest Session**: Fixed registration race condition, E2E test infrastructure verified (all 3 browsers passing)