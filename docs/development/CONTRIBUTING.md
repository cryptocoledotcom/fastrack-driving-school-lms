# Contributing Guide

## Development Workflow

Guidelines for developing features, fixing bugs, and contributing to the Fastrack LMS.

---

## Local Setup

### Prerequisites

- Node.js 18+ 
- npm 8+
- Firebase CLI
- Git

### Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/fastrack-lms.git
cd fastrack-lms

# Install frontend dependencies
npm install

# Install Cloud Functions dependencies
cd functions
npm install
cd ..

# Create .env file (use .env.example as template)
cp .env.example .env

# Fill in Firebase credentials from Firebase Console
# Edit .env with your values
```

### Firebase Emulator (Optional)

```bash
# Install Firestore emulator
firebase setup:emulators:firestore

# Start emulators
firebase emulators:start
```

---

## Development Workflow

### 1. Create Feature Branch

```bash
# Branch naming convention
git checkout -b feature/user-authentication
# or
git checkout -b bugfix/payment-error-handling
# or
git checkout -b docs/update-readme

# Naming: feature/, bugfix/, docs/, test/, refactor/
```

### 2. Make Changes

#### Frontend Development

```bash
# Start dev server
npm start

# Opens http://localhost:3000

# File structure to follow
src/
├── api/domain/    # New domain services
├── components/    # New React components
├── context/       # New Context if needed
├── utils/         # New utility functions
└── constants/     # New constants
```

#### Cloud Functions Development

```bash
# Start functions emulator
cd functions
firebase emulators:start

# Functions located in
functions/src/domain/
```

### 3. Code Style

#### JavaScript Standards

```javascript
// Use ES6+ syntax
const myFunction = (param1, param2) => {
  return param1 + param2;
};

// Use const/let, never var
const immutableValue = 'value';
let mutableValue = 'value';

// Use destructuring
const { userId, courseId } = props;
const [state, setState] = useState(null);

// Use template literals
const message = `Hello ${name}`;
```

#### React Components

```javascript
// Functional components only
export const CourseCard = ({ course, onEnroll }) => {
  const [enrolled, setEnrolled] = useState(false);

  const handleEnroll = async () => {
    try {
      await enrollCourse(course.id);
      setEnrolled(true);
    } catch (error) {
      console.error('Enrollment failed:', error);
    }
  };

  return (
    <div className="course-card">
      <h2>{course.title}</h2>
      <button onClick={handleEnroll}>
        {enrolled ? 'Enrolled' : 'Enroll Now'}
      </button>
    </div>
  );
};
```

#### File Organization

```
src/components/admin/
├── AdminDashboard.jsx        # Main component
├── AdminDashboard.module.css  # Scoped styles
├── AdminDashboard.test.js     # Tests
├── tabs/                      # Sub-components
│   ├── UserManagementTab.jsx
│   ├── AnalyticsTab.jsx
│   └── __tests__/             # Component tests
└── index.js                   # Barrel export
```

### 4. Testing

#### Write Tests

```bash
# Test file naming
ComponentName.test.js      # Component tests
serviceName.test.js        # Service tests
utilityName.test.js        # Utility tests

# Run specific test file
npm test -- ComponentName.test.js

# Watch mode
npm test -- --watch
```

#### Test Example

```javascript
// src/components/admin/__tests__/UserManagementTab.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import { UserManagementTab } from '../UserManagementTab';

describe('UserManagementTab', () => {
  it('renders user list', () => {
    render(<UserManagementTab />);
    expect(screen.getByText(/users/i)).toBeInTheDocument();
  });

  it('creates new user', async () => {
    render(<UserManagementTab />);
    fireEvent.click(screen.getByText(/create user/i));
    // Assert new user created
  });
});
```

#### Test Coverage

- [ ] All new components have tests
- [ ] New services have tests
- [ ] Critical user flows tested
- [ ] Error cases tested

### 5. Linting & Formatting

#### ESLint

Always ensure your code passes ESLint checks:

```bash
# Check for linting issues (must be 0 errors, 0 warnings)
npm run lint

# Auto-fix most issues
npm run lint -- --fix

# Check specific file
npx eslint src/components/MyComponent.jsx
```

**ESLint is MANDATORY** - do not commit code with violations.

#### ESLint Suppression Policy

**Philosophy**: Fix code issues, not suppress them. ESLint violations are real problems 99% of the time.

**WRONG** ❌ - Never suppress at file level:
```javascript
/* eslint-disable */  // ❌ NEVER DO THIS
/* eslint-disable no-unused-vars */  // ❌ WRONG
```

**RIGHT** ✅ - Use inline comment ONLY when necessary:
```javascript
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [user]);  // Intentional: adding userProfile here causes infinite loop
```

**When suppression IS legitimate**:
1. Adding a dependency would create an infinite loop or major performance issue
2. The pattern is intentional and documented in a comment
3. The code has been reviewed and understood by the team

See `docs/development/ESLINT_GUIDE.md` for detailed guidelines and examples.

#### Common ESLint Fixes

| Issue | Solution |
|-------|----------|
| `'x' is assigned but never used` | Remove variable or prefix with `_` |
| `Missing dependencies in effect` | Add variables to dependency array `[userId, fetchUser]` |
| `Imports should be sorted` | Reorder: React → External → Internal → Styles |
| `Unexpected console statement` | Use `console.warn()` or `console.error()` instead |
| `Unexpected var` | Replace with `const` or `let` |

---

### 6. Code Quality Checklist

Before submitting code, verify:

**ESLint** 
- [ ] `npm run lint` shows 0 errors, 0 warnings
- [ ] No file-level eslint-disable comments
- [ ] Any inline suppressions have explaining comments
- [ ] Run `npm run lint -- --fix` to auto-fix common issues

**Code Review**
- [ ] Follow naming conventions (PascalCase components, camelCase functions)
- [ ] Use service layer pattern (no direct Firebase calls from components)
- [ ] Proper error handling with custom ApiError classes
- [ ] No console.log in production code
- [ ] No commented-out code blocks
- [ ] No secrets or API keys hardcoded

### 7. Commit Messages

**Format**:
```
type(scope): brief description

Detailed explanation of changes (optional)
Fixes #123 (if fixing issue)
```

**Types**: feature, bugfix, docs, refactor, test, chore  
**Scope**: admin, auth, payment, etc.

**Example**:
```
feature(payment): implement Stripe webhook handling

- Added stripeWebhook function in functions/src/payment
- Verify webhook signature
- Handle payment.intent.succeeded event
- Update user enrollment status
Fixes #456
```

### 8. Create Pull Request

**PR Description**:
```markdown
## Description
Brief explanation of changes

## Type of Change
- [ ] Feature
- [ ] Bugfix
- [ ] Documentation
- [ ] Refactor

## Testing
- [ ] Unit tests added
- [ ] Manual testing completed
- [ ] All tests passing

## Checklist
- [ ] Code follows style guidelines
- [ ] No console errors
- [ ] Documentation updated
- [ ] No breaking changes
```

### 9. Code Review

**Self-Review Before Requesting Review**:
- [ ] Code follows project standards
- [ ] All tests passing: `npm test`
- [ ] No linting issues: `npm run lint`
- [ ] No console warnings/errors
- [ ] PR description complete

**Review Focus Areas**:
- Code quality and readability
- Test coverage
- Security implications
- Performance impact
- Documentation completeness

---

## Testing Requirements

### Unit Tests

Every service and utility should have tests:

```javascript
// src/api/student/userServices.test.js
describe('getUserStats', () => {
  it('returns user statistics', async () => {
    const userId = 'user123';
    const stats = await getUserStats(userId);
    expect(stats).toHaveProperty('enrolledCourses');
    expect(stats).toHaveProperty('completedCourses');
  });

  it('throws error for invalid userId', async () => {
    await expect(getUserStats(null)).rejects.toThrow('Invalid userId');
  });
});
```

### Integration Tests

Critical user flows should be tested end-to-end:

```javascript
// Test authentication flow
// Test enrollment flow
// Test payment flow
// Test certificate generation
```

### Run All Tests

```bash
npm test
# Expected: All passing, 0 failures
```

---

## Code Review Checklist

**For Reviewer**:
- [ ] Code follows style guidelines
- [ ] Tests are adequate and passing
- [ ] No security vulnerabilities introduced
- [ ] Performance impact acceptable
- [ ] Documentation updated
- [ ] Breaking changes documented

---

## Common Development Tasks

### Add New API Service

**File**: `src/api/newdomain/newServices.js`

```javascript
import ServiceBase from '../base/ServiceBase.js';
import { db } from '../../config/firebase.js';

class NewDomainService extends ServiceBase {
  constructor() {
    super('NewDomainService');
  }

  async getItem(itemId) {
    this.validate.validateId(itemId);
    return await this.getDoc('items', itemId);
  }

  async createItem(itemData) {
    this.validate.validateItemData(itemData);
    return await this.setDoc('items', itemData);
  }
}

export default new NewDomainService();
```

### Add New React Component

**File**: `src/components/feature/ComponentName.jsx`

```javascript
import React, { useState } from 'react';
import './ComponentName.module.css';

export const ComponentName = ({ prop1, prop2 }) => {
  const [state, setState] = useState(null);

  return (
    <div className={styles.container}>
      {/* Component JSX */}
    </div>
  );
};
```

### Add New Context

**File**: `src/context/NewContext.js`

```javascript
import React, { createContext, useContext, useState } from 'react';

const NewContext = createContext();

export const NewProvider = ({ children }) => {
  const [value, setValue] = useState(null);

  return (
    <NewContext.Provider value={{ value, setValue }}>
      {children}
    </NewContext.Provider>
  );
};

export const useNew = () => {
  const context = useContext(NewContext);
  if (!context) throw new Error('useNew must be in NewProvider');
  return context;
};
```

### Add Cloud Function

**File**: `functions/src/domain/domainFunctions.js`

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.myFunction = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    // Process request
    const result = await processData(data);

    return { success: true, result };
  } catch (error) {
    console.error('Function error:', error);
    throw error;
  }
});
```

---

## Debugging

### Frontend Debugging

```javascript
// Use console carefully (remove for production)
console.log('State:', state);
console.error('Error:', error);

// Use debugger (DevTools)
debugger; // Code execution pauses here

// React DevTools Chrome extension
// Inspect component state and props
```

### Cloud Functions Debugging

```bash
# View function logs
firebase functions:log --lines 50
firebase functions:log --follow  # Real-time monitoring

# Debug locally
firebase emulators:start --debug
```

---

## Performance Optimization

- Avoid unnecessary re-renders: Use React.memo, useMemo
- Code splitting: Lazy load heavy components
- Bundle size: Monitor and optimize
- Database queries: Use indexes, filter early

---

**Last Updated**: December 2, 2025
