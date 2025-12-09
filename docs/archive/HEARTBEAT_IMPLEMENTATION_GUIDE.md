# Server-Side Heartbeat Implementation Guide

**Status**: Ready for Integration  
**Date**: December 3, 2025  
**Feature**: Ohio Compliance - 4-Hour Daily Limit Enforcement

---

## Overview

The server-side heartbeat system enforces the Ohio compliance requirement that no student can complete more than 4 hours (240 minutes) of training in a calendar day.

**Key Features**:
- ✅ Server-side time authority (prevents client-side manipulation)
- ✅ 60-second heartbeat interval
- ✅ EST/EDT timezone enforcement
- ✅ Atomic batch operations (consistency)
- ✅ Automatic daily limit lockout
- ✅ Complete audit logging
- ✅ Session tracking per day

---

## Architecture

### Cloud Function: `sessionHeartbeat`

**Location**: `functions/src/compliance/complianceFunctions.js` (line 142-304)

**Type**: `onCall` (callable HTTPS function)

**Called from**: Frontend hook `useComplianceHeartbeat` every 60 seconds

### Data Model

#### Daily Activity Log Collection
```
Collection: daily_activity_logs
Document ID: {userId}_{YYYY-MM-DD}

Fields:
- userId: string (user identifier)
- courseId: string (course being taken)
- date: string (YYYY-MM-DD in EST/EDT)
- minutesCompleted: number (cumulative minutes this calendar day)
- sessionCount: number (how many sessions today)
- sessions: array (list of session IDs active today)
- createdAt: timestamp (when daily log was created)
- lastHeartbeat: timestamp (last heartbeat received)
- status: string ('active' or 'locked')
```

#### Session Document (in subcollection)
```
Collection: users/{userId}/sessions/{sessionId}

Updated fields:
- lastHeartbeat: timestamp (server time of last heartbeat)
- lastHeartbeatTimestamp: number (milliseconds since epoch)
```

#### User Document
```
Collection: users/{userId}

Updated fields (when lockout occurs):
- dailyStatus: string ('locked_daily_limit')
- dailyLockedAt: timestamp (when lockout was set)
```

---

## Integration Steps

### Step 1: Frontend Hook Usage

In your course player or lesson component:

```javascript
import { useComplianceHeartbeat } from '../hooks/useComplianceHeartbeat';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';

function CoursePlayer() {
  const { user } = useAuth();
  const { course, currentSession } = useCourse();

  const handleDailyLimitReached = (data) => {
    // Show modal: "4-hour daily limit reached"
    // Unmount course player
    // Redirect to dashboard
    console.log('Daily limit reached:', data);
  };

  const handleHeartbeatSuccess = (data) => {
    console.log(`Time used: ${data.minutesCompleted}m / 240m`);
    console.log(`Remaining: ${data.remainingMinutes}m`);
  };

  const { sendHeartbeat } = useComplianceHeartbeat({
    userId: user?.uid,
    courseId: course?.id,
    sessionId: currentSession?.id,
    enabled: true, // Set to false during admin/pause
    onLimitReached: handleDailyLimitReached,
    onHeartbeatSuccess: handleHeartbeatSuccess
  });

  return (
    <div className="course-player">
      {/* Course content */}
    </div>
  );
}
```

### Step 2: Verify Cloud Function Deployment

```bash
# From functions directory
cd functions

# Deploy compliance functions
npm run deploy

# View logs
npm run logs -- --filter="sessionHeartbeat"
```

### Step 3: Firestore Security Rules Update

Add rule to block writes during lockout:

```javascript
// firestore.rules
match /databases/{database}/documents {
  match /users/{userId}/userProgress/{document=**} {
    allow write: if request.auth.uid == userId && 
                    (resource == null || 
                     resource.data.get('lockout_until', timestamp.now()) <= request.time);
  }
}
```

### Step 4: Client-Side Lockout Handling

When heartbeat returns error, React should:

```javascript
const handleHeartbeatError = (error) => {
  if (error.code === 'functions/resource-exhausted' ||
      error.message?.includes('DAILY_LIMIT_REACHED')) {
    
    // 1. Stop all timers and sessions
    stopTimer();
    closeSession();
    
    // 2. Show locked-out modal
    showModal({
      title: 'Daily Training Limit Reached',
      message: 'You have completed 4 hours of training today. You can resume tomorrow.',
      action: 'Back to Dashboard',
      onConfirm: () => navigate('/dashboard')
    });
    
    // 3. Prevent any progress saves
    setIsLockedOut(true);
  }
};
```

---

## Testing Checklist

### Manual Testing

1. **Start a session and verify heartbeat sends every 60 seconds**
   - Open browser DevTools → Network
   - Look for `sessionHeartbeat` Cloud Function calls
   - Should see call every 60 seconds

2. **Verify minutes accumulate**
   - Check Firestore console
   - Look at `daily_activity_logs/{userId}_{date}` document
   - `minutesCompleted` should increment by 1 each heartbeat

3. **Test 4-hour lockout**
   - Manually set `minutesCompleted: 239` in Firestore
   - Next heartbeat should trigger lockout
   - User document should have `dailyStatus: 'locked_daily_limit'`

4. **Verify timezone enforcement**
   - Note: Testing across timezones requires Cloud Function timezone to be EST/EDT
   - Verify daily reset happens at midnight EST, not UTC

5. **Test new day reset**
   - At midnight EST, new daily log document created
   - Minutes reset to 1 (first heartbeat of new day)
   - Previous day's log is archived

6. **Audit logging**
   - Check `audit_logs` collection
   - Should see `SESSION_HEARTBEAT` events for each successful heartbeat
   - Should see `DAILY_LIMIT_REACHED` event when lockout triggered

### Automated Tests

```bash
# Run heartbeat hook tests
npm test src/hooks/useComplianceHeartbeat.test.js

# Run Cloud Function tests (Firebase emulator)
cd functions
npm test src/compliance/sessionHeartbeat.test.js
```

---

## Response Format

### Success Response (HTTP 200)
```json
{
  "success": true,
  "minutesCompleted": 45,
  "remainingMinutes": 195,
  "isNewDay": false,
  "dateKey": "2025-12-03",
  "serverTimestamp": 1733270400000
}
```

### Error Response (HTTP 403)
```json
{
  "code": "RESOURCE_EXHAUSTED",
  "message": "DAILY_LIMIT_REACHED: You have reached the 4-hour daily training limit"
}
```

### Error Response (HTTP 400)
```json
{
  "code": "INVALID_ARGUMENT",
  "message": "Heartbeat processing failed: Missing required parameters: userId, courseId, sessionId"
}
```

---

## Troubleshooting

### Issue: Heartbeat not being called
**Solution**: Verify hook is enabled and has all required parameters

```javascript
// Check enabled flag
enabled: currentCourse && currentSession ? true : false

// Check user is logged in
userId: user?.uid || null
```

### Issue: Different minute counts on client vs server
**Solution**: Server is the source of truth. Client must sync with server response.

```javascript
// After heartbeat succeeds, update client state:
setMinutesUsedToday(response.minutesCompleted);
```

### Issue: Lockout not persisting across sessions
**Solution**: Check Firestore rules allow reading `lockout_until` timestamp on user doc

```javascript
// On app load, check if still locked:
const userDoc = await getDoc(doc(db, 'users', userId));
if (userDoc.data().dailyLockedAt) {
  const lockTime = userDoc.data().dailyLockedAt.toDate();
  const now = new Date();
  if (now < new Date(lockTime.getTime() + 24 * 60 * 60 * 1000)) {
    // Still locked
  }
}
```

### Issue: Timezone showing wrong date
**Solution**: Cloud Function forces EST/EDT. Client should display time in user's local timezone but server uses EST for daily tracking.

```javascript
// Display to user in local timezone
const options = { timeZone: 'America/New_York', ... };
const formattedTime = localDate.toLocaleString('en-US', options);
```

---

## Performance Considerations

- **Heartbeat load**: 1 Cloud Function call per user per 60 seconds
- **Database writes**: 2 writes per heartbeat (daily_activity_logs + session)
- **Firestore cost**: ~1,440 writes/day per concurrent student (24 hrs × 1 write/min)
- **Scaling**: At 1,000 concurrent students = ~1.44M writes/day (acceptable)

---

## Security Considerations

1. **Server-side validation**: All time calculations on server (client can't bypass)
2. **User ID matching**: Function validates `auth.uid == userId`
3. **Atomic operations**: Batch writes prevent partial updates
4. **Audit trail**: Every heartbeat logged with user, timestamp, and result
5. **No time manipulation**: Client clock can't affect server calculations

---

## Next Steps

1. **Deploy Cloud Function** to Firebase
2. **Integrate hook** into course player component
3. **Test with 1 user** for full 4-hour session
4. **Monitor audit logs** for 24 hours
5. **Enable for all students** once verified

---

## Files Changed

- ✅ `functions/src/compliance/complianceFunctions.js` (added sessionHeartbeat)
- ✅ `src/hooks/useComplianceHeartbeat.js` (new frontend hook)
- ✅ `src/hooks/useComplianceHeartbeat.test.js` (hook tests)
- ✅ `functions/src/compliance/sessionHeartbeat.test.js` (Cloud Function tests)

## Files To Update Next

- `src/components/courses/CoursePlayerPage.jsx` (integrate hook)
- `firestore.rules` (add lockout rule)
- `COMPLIANCE_VERIFICATION_CHECKLIST.md` (mark as ✅ implemented)

---

**Prepared by**: Zencoder AI  
**Status**: Ready for deployment
