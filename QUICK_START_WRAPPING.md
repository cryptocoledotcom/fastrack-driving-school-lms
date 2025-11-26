# Quick Start: Complete Remaining Function Wrapping

## Current Status
- ✅ 25 functions fully wrapped and tested
- ✅ All imports added to all 13 services
- ⏳ 108 functions remaining to wrap

## To Wrap Each Remaining Function (Template)

### 1. Open service file (e.g., src/api/progressServices.js)

### 2. Find function (e.g., initializeProgress):
```javascript
export const initializeProgress = async (userId, courseId, totalLessons = 0) => {
  try {
    // ... existing code
  } catch (error) {
    console.error('...', error);
    throw error;
  }
};
```

### 3. Replace with:
```javascript
export const initializeProgress = async (userId, courseId, totalLessons = 0) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    if (typeof totalLessons !== 'number' || totalLessons < 0) {
      throw new ValidationError('totalLessons must be non-negative number');
    }
    
    // ... existing code (without try/catch)
  }, 'initializeProgress');
};
```

## Key Rules
1. **Keep all existing logic** - only wrap it
2. **Remove** `try { ... } catch (error) { console.error(...); throw error; }`
3. **Add validation** at top of executeService block
4. **Keep function signature** exactly the same
5. **Test after each service** with `npm test`

## Services in Order (Recommended)

| # | Service | Functions | Est. Time |
|---|---------|-----------|-----------|
| 1 | progressServices.js | 11 | 20 min |
| 2 | enrollmentServices.js | 16 | 30 min |
| 3 | quizServices.js | 12 | 25 min |
| 4 | complianceServices.js | 15 | 30 min |
| 5 | courseServices.js | 9 | 15 min |
| 6 | paymentServices.js | 10 | 15 min |
| 7 | lessonServices.js | 11 | 20 min |
| 8 | schedulingServices.js | 9 | 15 min |
| 9 | pvqServices.js | 7 | 12 min |
| 10 | securityServices.js | 8 | 15 min |

**Total Est. Time: 3-4 hours**

## Commands
```bash
# After each service - check syntax
node -c src/api/[ServiceName].js

# After 2-3 services - run tests
npm test

# After all done - final check
npm run build
```

## Validation Rules by Service

### progressServices.js
```javascript
validateUserId(userId)
validateCourseId(courseId)
if (typeof totalLessons !== 'number') throw new ValidationError('...')
```

### enrollmentServices.js
```javascript
validateUserId(userId)
validateCourseId(courseId)
if (userEmail && !userEmail.includes('@')) throw new ValidationError('...')
```

### quizServices.js
```javascript
validateUserId(userId)
validateCourseId(courseId)
if (!quizData || !quizData.answers) throw new ValidationError('Quiz data required')
if (typeof quizData.score !== 'number' || quizData.score < 0 || quizData.score > 100) {
  throw new ValidationError('Score must be 0-100')
}
```

### complianceServices.js
```javascript
validateUserId(userId)
validateCourseId(courseId)
if (!sessionData || typeof sessionData !== 'object') throw new ValidationError('...')
```

### courseServices.js
```javascript
validateCourseId(courseId)
validateCourseData(courseData)
```

### paymentServices.js
```javascript
validateUserId(userId)
validateCourseId(courseId)
validatePaymentData(userId, courseId, amount, paymentType)
```

### lessonServices.js
```javascript
validateLessonData(lessonData)
```

### schedulingServices.js
```javascript
validateTimeSlotData(timeSlotData)
```

### pvqServices.js
```javascript
validatePVQData(pvqData)
```

### securityServices.js
```javascript
validateUserId(userId)
if (!questions || !Array.isArray(questions)) throw new ValidationError('...')
```

## Example: Complete Wrapping

**BEFORE:**
```javascript
export const getProgress = async (userId, courseId) => {
  try {
    const progressRef = getUserProgressRef(userId);
    const progressDoc = await getDoc(progressRef);
    
    if (!progressDoc.exists()) {
      throw new Error('Progress not found');
    }
    
    return progressDoc.data()[courseId] || {};
  } catch (error) {
    console.error('Error getting progress:', error);
    throw error;
  }
};
```

**AFTER:**
```javascript
export const getProgress = async (userId, courseId) => {
  return executeService(async () => {
    validateUserId(userId);
    validateCourseId(courseId);
    
    const progressRef = getUserProgressRef(userId);
    const progressDoc = await getDoc(progressRef);
    
    if (!progressDoc.exists()) {
      throw new ProgressError(`Progress not found for user ${userId}`, courseId);
    }
    
    return progressDoc.data()[courseId] || {};
  }, 'getProgress');
};
```

## Done! Next Steps After Wrapping All

1. Commit: `git commit -m "Phase 1: Wrap all remaining service functions"`
2. Push: `git push origin phase-1-wrapping`
3. Create PR with title: "Phase 1 Complete: Error Handling & Validation Layer"
4. Merge to main
5. Deploy to staging
6. Monitor errors in production

---

**Questions?** Refer to WRAPPING_GUIDE.md for more details
