# ESLint Code Quality Guide

**Status**: ✅ ZERO ESLint issues as of Session 13 (December 22, 2025)

This guide explains the ESLint configuration, best practices, and when (rarely) suppressions are legitimate.

---

## Philosophy

**Fix code issues, not suppress them.**

ESLint violations are real problems 99% of the time. The remaining 1% are intentional patterns documented with inline comments explaining why the rule is being violated.

---

## Configuration

### Rule Categories

#### React Rules
- **`react/react-in-jsx-scope`**: OFF - React 17+ doesn't need React import for JSX
- **`react/prop-types`**: OFF - Using TypeScript-like patterns instead
- **`react/jsx-uses-react`**: OFF - React 17+ automatic JSX transform
- **`react/jsx-uses-vars`**: ERROR - Variables used in JSX must be kept
- **`react/no-unescaped-entities`**: OFF - React handles HTML entities

#### React Hooks Rules (CRITICAL - DO NOT DISABLE)
- **`react-hooks/rules-of-hooks`**: ERROR - Hooks must be called at top level, inside functions
- **`react-hooks/exhaustive-deps`**: WARN - Dependency arrays must include all used variables

#### General Rules
| Rule | Level | Purpose |
|------|-------|---------|
| `no-console` | WARN | Allow `console.warn()` and `console.error()` only, no `console.log()` |
| `no-unused-vars` | ERROR | Variables must be used (prefix with `_` to mark intentionally unused) |
| `no-var` | ERROR | Always use `const` or `let`, never `var` |
| `prefer-const` | ERROR | Use `const` when variable value doesn't change |
| `prefer-arrow-callback` | WARN | Arrow functions preferred over function expressions |
| `eqeqeq` | ERROR | Use `===` instead of `==` |
| `no-eval` | ERROR | Never use `eval()` |
| `no-implied-eval` | ERROR | Don't use eval via setTimeout/setInterval |
| `no-with` | ERROR | Don't use `with` statement |
| `no-extend-native` | ERROR | Don't modify built-in object prototypes |

#### Import Rules
- **`import/no-unresolved`**: ERROR - All import paths must be resolvable
- **`import/no-cycle`**: WARN - Warn about circular dependencies
- **`import/order`**: WARN - Enforce consistent import ordering:
  1. Builtin imports (`fs`, `path`)
  2. External imports (`react`, `firebase`)
  3. Internal imports (`../api/services`)
  4. Parent directory imports (`../../components`)
  5. Sibling imports (`./sibling.js`)
  6. Index imports (`.` or `./index.js`)

**Blank lines required** between each import group.

---

## Running ESLint

### Check for Issues
```bash
# Check all files
npm run lint

# Check specific file
npx eslint src/components/MyComponent.jsx

# Check with full output
npm run lint -- --format=detailed
```

### Auto-Fix Issues
```bash
# Fix most issues automatically
npm run lint -- --fix

# Fix specific file
npx eslint src/components/MyComponent.jsx --fix
```

### Watch Mode
```bash
# Re-lint on file changes (using Vitest)
npm test -- --watch
```

---

## Common Issues & Fixes

### Issue 1: Unused Variables

**Error**:
```
'myVar' is assigned a value but never used  no-unused-vars
```

**Fix Option A** - Remove the variable:
```javascript
// ❌ BAD
const myVar = getData();

// ✅ GOOD
getData();  // Call removed unused variable
```

**Fix Option B** - Prefix with underscore:
```javascript
// When intentionally unused (like in destructuring)
const { userId, _unusedProp, courseId } = data;

// Or:
const _debugValue = calculateSomething();  // TODO: use this later
```

### Issue 2: Dependency Array Missing Variables

**Error**:
```
React Hook useEffect has missing dependencies: 'userId', 'fetchUser'. 
Either include them or remove the dependency array.
```

**Fix** - Add to dependency array:
```javascript
// ❌ WRONG
useEffect(() => {
  const user = fetchUser(userId);
  setUser(user);
}, []);  // Missing userId, fetchUser

// ✅ RIGHT
useEffect(() => {
  const user = fetchUser(userId);
  setUser(user);
}, [userId, fetchUser]);
```

### Issue 3: Import Ordering

**Error**:
```
Imports should be sorted within groups  import/order
```

**Fix** - Reorder imports by category:
```javascript
// ❌ WRONG ORDER
import { useState } from 'react';
import './styles.css';
import { getUserData } from '../api/user';
import { Button } from './Button';

// ✅ RIGHT ORDER
import { useState } from 'react';

import { getUserData } from '../api/user';

import { Button } from './Button';

import './styles.css';
```

**Order**: React → External → Internal → Styles

### Issue 4: console.log in Production

**Error**:
```
Unexpected console statement  no-console
```

**Fix** - Use console.warn() or console.error():
```javascript
// ❌ NOT ALLOWED
console.log('User ID:', userId);

// ✅ ALLOWED (for debugging)
console.warn('This should not happen:', error);
console.error('Failed to load user:', error);

// ✅ BEST - Remove before commit
console.log(...);  // Remove this debug line
```

### Issue 5: Using `var` Instead of `const`/`let`

**Error**:
```
Unexpected var, use let or const instead  no-var
```

**Fix**:
```javascript
// ❌ WRONG
var myValue = 'test';

// ✅ RIGHT
const myValue = 'test';
```

---

## When to Suppress Rules (Rare Cases)

### ONLY suppress when:
1. **Adding the dependency would create an infinite loop**
2. **The pattern is intentional and documented**
3. **The code has been reviewed and team understands why**

### HOW to suppress:

**✅ CORRECT** - Use inline comment:
```javascript
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [user]);  // Intentional: adding userProfile here causes infinite loop
```

**❌ WRONG** - Never use file-level suppression:
```javascript
/* eslint-disable react-hooks/exhaustive-deps */  // ❌ DON'T DO THIS
```

### Real Example: AuthContext.jsx

**File**: `src/context/AuthContext.jsx:199`

```javascript
// Non-blocking profile update effect with JWT claim priority
useEffect(() => {
  if (!user || !userProfile) return;

  const updateProfileAsync = async () => {
    const jwtClaim = await extractJWTClaims(user);
    const profile = await fetchUserProfile(user.uid, user.email || '', user.displayName || '');
    
    if (profile) {
      setUserProfile(finalProfile);  // ← Updates userProfile
      // ...
    }
  };

  updateProfileAsync().catch(err =>
    console.warn('Background profile update failed:', err)
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user]);  // ← Only depends on user, not userProfile (which it updates)
```

**Why suppression is legitimate**:
- If we add `userProfile` to dependencies, the effect would:
  1. Run when `userProfile` changes
  2. Inside, update `userProfile` via `setUserProfile()`
  3. This triggers the effect again
  4. Infinite loop ∞

**What the code actually does**:
- Effect runs ONLY when `user` object changes
- Inside, it fetches fresh profile data asynchronously
- Doesn't cause re-renders during the fetch
- Updates `userProfile` once after async work completes

---

## Best Practices

### 1. Fix Issues Immediately
Don't accumulate ESLint violations. Fix them as you write code.

```bash
# After writing code
npm run lint -- --fix

# Commit when clean
git add .
git commit -m "feature(auth): add password reset with email verification"
```

### 2. Use Meaningful Variable Names
Help ESLint catch bugs by using clear names:

```javascript
// ✅ GOOD - Clear intent
const { id, email, role } = user;

// ❌ BAD - Unclear, might be accidentally unused
const { x, y, z } = props;
```

### 3. Prefix Unused Variables with Underscore
When destructuring but not using a variable:

```javascript
// ✅ GOOD
const { userId, _unused, email } = userData;

// ❌ WRONG
const { userId, unused, email } = userData;  // ESLint error if 'unused' not referenced
```

### 4. Comment WHY, Not WHAT
Code should be self-documenting. Comments explain decisions:

```javascript
// ✅ GOOD - Explains why this pattern exists
useEffect(() => {
  fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [userId]);  // Intentional: only fetch when userId changes, not after we set data

// ❌ BAD - Comments what code does, which is obvious
const data = fetchData();  // Fetch data from API
```

### 5. Use Console Wisely
```javascript
// ✅ GOOD - For actual warnings/errors
console.warn('User not authenticated, redirecting to login');
console.error('Failed to process payment:', error);

// ✅ GOOD - Remove before committing
console.log('DEBUG: user =', user);  // Remove this debug line

// ❌ WRONG - console.log in production code
console.log('User ID:', userId);
```

---

## Session 13 Summary: Path to Zero Issues

### Starting Point
- **1,486 ESLint issues** across all sessions
- 94.6% reduction in Sessions 1-3 (Cloud Functions cleanup)
- 57.5% reduction in Session 4 (Component fixes)
- 94.1% reduction in Session 5 (Import ordering + suppressions)

### Final Phase
- **PostVideoQuestionModal.jsx:41** - Fixed by changing dependency array
  - Changed `[isOpen, question?.id, ...]` → `[isOpen, question, ...]`
  - Effect body uses full `question` object, not just `question.id`
  
- **AuthContext.jsx:199** - Documented legitimate suppression
  - Added inline comment explaining why `userProfile` can't be added
  - Would cause infinite loop if added to dependencies
  - Effect intentionally runs only on `user` change

### Final Status
✅ **0 errors, 0 warnings** - ZERO ESLint issues

---

## Troubleshooting

### Q: ESLint won't fix an issue with --fix

**A**: Manual fix needed. Run `npm run lint` to see error message with line number, fix manually.

### Q: I'm using a variable imported in JSX, why does it say "unused"?

**A**: ESLint properly detects JSX usage. Make sure import is in the file:
```javascript
// ✅ RIGHT
import { Button } from './Button';  // Used in JSX below

export const MyComponent = () => (
  <Button>Click me</Button>
);

// ❌ WRONG - Import exists but used elsewhere
import { Button } from './Button';  // Says unused but...
export const other = () => <div>No Button here</div>;
```

### Q: Can I disable a rule for the whole project?

**A**: Don't. Fix the code instead. ESLint violations indicate real problems. If a rule is always violated, the rule itself might be wrong for this project, but that's very rare.

### Q: My code works but ESLint complains. Isn't this a false positive?

**A**: Probably not. Examples:
- **Missing dependency**: Will cause bugs later when dependencies change
- **Unused variable**: Dead code that should be removed
- **Import ordering**: Consistency and readability
- **No-eval**: Security risk

Test your code more thoroughly. ESLint catches issues static analysis misses.

---

## References

- **ESLint Official**: https://eslint.org/
- **React Hooks**: https://react.dev/reference/rules-of-hooks
- **Import Plugin**: https://github.com/import-js/eslint-plugin-import
- **Config File**: `eslint.config.js` (flat config format)

---

**Last Updated**: December 22, 2025  
**Status**: Production Ready (0 issues)
