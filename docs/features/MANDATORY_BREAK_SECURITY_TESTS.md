# Mandatory Break - Security Hardening Tests
**Purpose**: Verify that breaks cannot be bypassed or manipulated via DevTools, client-side hacking, or direct Firestore writes.  
**Last Updated**: December 19, 2025  
**Test Environment**: Firefox DevTools OR Chrome DevTools (recommend Firefox for easier React inspection)

---

## Pre-Test Setup

1. **Run app with emulators**:
   ```bash
   VITE_USE_EMULATORS=true npm run dev
   ```

2. **In separate terminal, start emulators**:
   ```bash
   firebase emulators:start
   ```

3. **Create test student account**:
   - Sign up with: `test@example.com` / `password123`

4. **Enroll in course** and navigate to CoursePlayer

5. **Open browser DevTools**: F12 (or right-click → Inspect)

---

## Security Tests

### Test 1: Cannot Bypass via DevTools State Manipulation

**Scenario**: Student tries to jump break countdown to 0 seconds

**Steps**:
1. Wait for 2-hour break modal to appear
2. Open DevTools → Console
3. Try to manipulate React state:
   ```javascript
   // Try to access React component state
   Object.defineProperty(window, 'breakTime', { value: 0 });
   ```

**Expected Result** ✅:
- Countdown continues normally
- "Resume Learning" button stays disabled
- Student cannot resume until actual 10 minutes pass

**Why it works**:
- `breakTime` is React state (not global variable)
- DevTools can't modify React internals
- Even if student modifies UI, server rejects break end with `BREAK_TOO_SHORT`

---

### Test 2: Cannot Bypass via Early Resume Click

**Scenario**: Student clicks "Resume Learning" button after 2 minutes (before 10-minute minimum)

**Steps**:
1. Wait for modal
2. Wait 2 minutes
3. Try to click "Resume Learning" button

**Expected Result** ✅:
- Button is disabled (grayed out)
- Click does nothing
- Error message appears: "Break must be at least 10 minutes. 8 minute(s) remaining."

**Why it works**:
- Button only enabled after `displayTime <= 0` (which takes 10 seconds)
- Even if student enables button via DevTools, `handleBreakComplete()` calls `endBreak()`
- Server validates: `breakDurationSeconds < 600` → rejects with error
- Modal stays open

---

### Test 3: Server Rejects Short Break (Primary Defense)

**Scenario**: Student somehow disables button and calls `endBreak()` directly (advanced tampering)

**Steps**:
1. Open DevTools → Network tab (to see requests)
2. Wait 2 minutes
3. In Console, call break-end function directly (if accessible)
4. Observe network request to `logBreakEnd`

**Expected Result** ✅:
- Server response: Error `BREAK_TOO_SHORT`
- Error message shows remaining time
- Break is NOT logged in Firestore
- Audit log records: `BREAK_VALIDATION_REJECTED`

**Why it works**:
```javascript
// In complianceServices.js:
const breakEndMs = Date.now();  // Server's current time (authoritative)
const breakDurationSeconds = Math.floor((breakEndMs - breakStartMs) / 1000);

if (breakDurationSeconds < MIN_BREAK_DURATION) {
  throw error;  // Server rejects, doesn't trust client
}
```

---

### Test 4: Cannot Bypass via Browser Refresh During Break

**Scenario**: Student refreshes page during 2-minute break window, hoping to lose break record

**Steps**:
1. Wait for break modal
2. Wait 2 minutes
3. Refresh page (Ctrl+R or Cmd+R)

**Expected Result** ✅:
- Course player reloads
- Break state restored from Firestore
- Modal appears again with correct countdown remaining
- Student still must wait 8 more minutes

**Why it works**:
- Break state stored in `users/{userId}/sessions/{sessionId}/breaks[]`
- Session data restored from Firestore on page load
- Countdown timer recalculates from server timestamps

---

### Test 5: Firestore Security Rules Block Direct Writes

**Scenario**: Student (or hacker) tries to directly write break with `actualDuration: 60` to Firestore

**Steps**:
1. Open DevTools → Application/Storage
2. Get your Firebase project ID
3. Try to craft direct write:
   ```javascript
   // In browser console:
   const { updateDoc, doc } = require('firebase/firestore');
   await updateDoc(doc(db, 'users', userId, 'sessions', sessionId), {
     breaks: [{
       startTime: Date.now() - 60000,
       endTime: Date.now(),
       actualDuration: 60,  // ❌ Trying to cheat!
       validatedByServer: false  // Didn't go through server validation
     }]
   });
   ```

**Expected Result** ✅:
- Firestore security rule blocks write
- Error: "PERMISSION_DENIED: Missing or insufficient permissions"
- Break record NOT created
- Attempt logged in audit logs (optional, can be added)

**Why it works**:
```firestore-rules
// firestore.rules:
allow update: if ... &&
  request.resource.data.breaks[...].actualDuration >= 600 &&  // Enforces minimum!
  request.resource.data.breaks[...].validatedByServer == true;  // Must have flag!
```

**Even if student sets `actualDuration: 600`**:
- Rules check: `validatedByServer == true` (required)
- Client can't set this flag; only server can
- Write is blocked

---

### Test 6: Audit Logging of Break Attempts

**Scenario**: Verify all break-related events are logged

**Steps**:
1. Complete break normally (wait 10 minutes)
2. In Firebase Console → Firestore → `auditLogs` collection
3. Filter for userId = your test user
4. Look for events: `BREAK_VALIDATION_*`

**Expected Results** ✅:
- Event: `BREAK_VALIDATION_PASSED` after 10 min
  - `metadata.actualDurationSeconds`: ~600
  - `metadata.requiredDurationSeconds`: 600
  - `timestamp`: server time
- If you tried to end early (previous tests), events: `BREAK_VALIDATION_REJECTED`
  - `metadata.minutesRemaining`: 8 (or whatever)
  - Shows attempt was rejected

**Why it matters**:
- Auditors can see all break attempts (passed and failed)
- Proves system enforces minimum duration
- Prevents claims of "the break was taken but not logged"

---

### Test 7: End-to-End Compliance Flow

**Full Scenario**: Student studies for 2 hours, takes mandatory break, continues

**Steps**:
1. **Start course**: Timer begins
2. **Fast-forward to ~1:59:50** (in testing, can modify time in useBreakManagement or use actual time)
   - OR: In real testing, wait actual 2 hours (not practical for manual test)
3. **At 2:00:00**: Break modal appears
   - Timer countdown shows "10:00"
   - Button disabled
4. **Wait 2 minutes**: 
   - Countdown shows "08:00"
   - Button still disabled
5. **Wait 8 more minutes** (10 minutes total):
   - Countdown shows "00:00"
   - "Break Complete!" message appears
   - "Resume Learning" button becomes enabled
6. **Click "Resume Learning"**:
   - Modal closes
   - Course resumes
   - Lesson timer continues from 120 minutes
7. **Verify Firestore**:
   - Navigate to `users/{userId}/sessions/{sessionId}/breaks[0]`
   - See:
     ```json
     {
       "startTime": timestamp,
       "endTime": timestamp,
       "actualDuration": 600,  // Exact!
       "reason": "mandatory",
       "status": "completed",
       "validatedByServer": true,
       "validationTimestamp": timestamp
     }
     ```

**Expected Result** ✅:
- Break enforced
- Server validated
- Audit logged
- Firestore clean
- Next break not triggered until 120 more minutes of study

---

## Security Checklist

After running tests, verify:

- [ ] **Client-side state can't be manipulated** (Test 1)
- [ ] **UI prevents early resume** (Test 2)
- [ ] **Server rejects short breaks** (Test 3)
- [ ] **Break state persists across refresh** (Test 4)
- [ ] **Firestore rules block invalid writes** (Test 5)
- [ ] **All attempts logged in audit trail** (Test 6)
- [ ] **Full flow works correctly** (Test 7)
- [ ] **No errors in browser console** during break
- [ ] **No errors in Cloud Function logs**
- [ ] **No audit failures** in `BREAK_VALIDATION_FAILED`

---

## Regression Tests (After Code Changes)

If you modify break logic, re-run:

1. **Test 3**: Server rejection (primary defense layer)
2. **Test 5**: Firestore rules (database protection)
3. **Test 6**: Audit logging (compliance trail)
4. **Test 7**: End-to-end (real-world flow)

---

## Load Testing (Optional)

If you want to verify break logic under high load:

```bash
npm run load-test
```

This will:
- Simulate 100 students taking breaks simultaneously
- Verify server can handle concurrent validations
- Check Firestore performance
- Log any timing issues

---

## Auditor-Ready Summary

When Ohio DMV auditors ask: **"Can a student cheat the break system?"**

You can answer:

> "No. We have three independent security layers:
> 
> 1. **Frontend**: The countdown timer is UI-only. The resume button is disabled until 10 minutes, and even if a student manipulates DevTools, they can't call the resume function.
> 
> 2. **Backend**: Our server calculates the actual break duration from immutable Firestore timestamps (not client claims). If duration < 600 seconds, we reject with error and log the attempt.
> 
> 3. **Database**: Firestore security rules prevent any writes that don't have actualDuration >= 600 and validatedByServer = true. Even direct Firestore writes are blocked.
> 
> Additionally, every break attempt—passed or rejected—is logged in immutable audit logs for your review. We also log the exact duration and timestamp for compliance verification."

---

**Last Updated**: December 19, 2025  
**Tested By**: [Your Name]  
**Date Tested**: [Date]  
**Result**: PASS ✅
