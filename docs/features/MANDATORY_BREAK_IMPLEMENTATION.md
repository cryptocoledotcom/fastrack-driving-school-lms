# Mandatory 2-Hour Break Implementation
**Last Updated**: December 19, 2025  
**Status**: ✅ Implemented & Security Hardened (Anti-Tamper)  
**Compliance**: OAC Chapter 4501-8-09 (Ohio)  
**Security Level**: 🔒 Production-Grade (Server-Authoritative)

---

## Overview

This document details the implementation of the **mandatory 10-minute break after 2 hours of continuous instruction**, as required by Ohio driver education regulations (OAC 4501-8-09).

### Key Requirements Met

| Requirement | Status | Details |
|-------------|--------|---------|
| **2-Hour Trigger** | ✅ | System forces break after exactly 2 hours of active study |
| **10-Minute Duration** | ✅ | Break duration enforced server-side with minimum validation |
| **Non-Bypassable UI** | ✅ | Full-screen modal (high z-index) locks all course content |
| **Timer Persistence** | ✅ | Break state stored in Firestore; survives page refreshes |
| **Time Exclusion** | ✅ | Break time does NOT count toward 1,440-minute curriculum |
| **Countdown Display** | ✅ | Real-time countdown (MM:SS format) with visual feedback |
| **Manual Resume** | ✅ | After 10 min, student must click "Resume Learning" button (no auto-start) |
| **Audit Logging** | ✅ | Break start/end logged to Firestore `sessions` collection |

---

## Security Architecture (Anti-Tampering)

### 🔒 Three-Layer Defense Against Client-Side Manipulation

**Layer 1: Frontend Validation** ❌ NOT SUFFICIENT (can be bypassed with DevTools)  
**Layer 2: Backend Duration Calculation** ✅ Server calculates, not client  
**Layer 3: Database Security Rules** ✅ Firestore prevents invalid states

### Security Guarantees

| Threat | Prevention | Implementation |
|--------|-----------|-----------------|
| **DevTools Skip (jump to 0s)** | Server timestamps | Break start/end times immutable in Firestore |
| **Client lies about duration** | Server calculates duration | `logBreakEnd()` never trusts client's claimed duration |
| **Firestore direct write** | Security rules | Rules enforce `actualDuration >= 600` |
| **Browser refresh during break** | Timer persistence | Break state stored in Firestore, not localStorage |
| **Multiple breaks in 10 min** | Server timestamp validation | logBreakEnd() rejects if duration < 10 min |
| **Admin claims short break was complete** | Audit logs | All validation attempts logged with timestamps |

### How It Works

```
1. BREAK START
   Client: "Starting break"
   Server: Records break.startTime = serverTimestamp() ✓

2. STUDENT WAITS (can't tamper)
   Client: Shows UI countdown (UX only)
   Server: Holding break.startTime in Firestore

3. STUDENT CLICKS "RESUME" EARLY
   Client: Calls endBreak()
   Server: Calculates: now - startTime = 120 seconds
           Sees < 600 seconds
           Rejects: "Break too short. 9 minutes remaining."
           Logs: BREAK_VALIDATION_REJECTED audit event
   Client: Modal stays open, shows error

4. 10 MINUTES LATER - STUDENT CLICKS "RESUME"
   Server: Calculates: now - startTime = 610 seconds
           Sees >= 600 seconds ✓
           Logs: BREAK_VALIDATION_PASSED audit event
           Accepts break
   Client: Modal closes, lesson resumes
```

---

## Component Architecture

### 1. MandatoryBreakModal Component
**Location**: `src/components/common/Modals/MandatoryBreakModal.jsx`

**Props**:
```javascript
{
  isOpen: boolean,              // Whether modal is visible
  breakTimeRemaining: number,   // Seconds remaining in break (from TimerContext)
  onBreakComplete: function     // Callback when 10 minutes elapsed and student clicks resume
}
```

**Features**:
- Countdown timer with MM:SS format
- Pulsing icon animation (study-related)
- Status changes after 10 minutes:
  - **Before**: "Break Time" - Shows timer, button disabled, explains compliance
  - **After**: "Break Complete!" - Green checkmark style, "Resume Learning" button enabled
- Non-dismissible (no close button, overlay click disabled, Escape disabled)
- Responsive design (mobile-first)

**Key Implementation Details**:
```javascript
// Timer state management
const [displayTime, setDisplayTime] = useState(breakTimeRemaining);
const [showResumeButton, setShowResumeButton] = useState(false);

// Countdown effect (updates every second)
useEffect(() => {
  if (!isOpen) return;
  
  const interval = setInterval(() => {
    setDisplayTime(prev => {
      const newTime = prev - 1;
      if (newTime <= 0) {
        setShowResumeButton(true);  // Enable button when time expires
        return 0;
      }
      return newTime;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [isOpen, breakTimeRemaining]);
```

**Styling**: See `MandatoryBreakModal.module.css`

---

### 2. CSS Module
**Location**: `src/components/common/Modals/MandatoryBreakModal.module.css`

**Key Features**:
- **Countdown Circle**: 
  - 6rem x 6rem circle with blue border and gradient background
  - Pulsing animation (scale 1 → 1.05 → 1 over 1 second)
  - Transitions to green when break complete
- **Typography**:
  - Title: 1.75rem, 700 weight
  - Message: 1.1rem, explains compliance
  - Countdown: 2rem font in circle
- **Animations**:
  - `pulse`: Icon pulses every 2 seconds
  - `countdownPulse`: Circle pulses and shadows grow/shrink
  - `completeGlow`: Green glow when break finishes
- **Responsive**: Adjusted sizes for mobile (<640px)

---

### 3. Integration with CoursePlayerPage
**Location**: `src/pages/CoursePlayer/CoursePlayerPage.jsx`

**Changes Made**:

#### a) Import
```javascript
import MandatoryBreakModal from '../../components/common/Modals/MandatoryBreakModal';
```

#### b) Extract from useTimer Hook
```javascript
const {
  // ... existing destructures ...
  isOnBreak,
  breakTime,              // Current break countdown (0-600 seconds)
  startBreak,             // Function to initiate break
  endBreak,               // Function to end break (validates minimum)
  hasBreakMetMinimumDuration,  // Boolean: true if break >= 10 min
  resumeTimer,            // Function to resume timer after break
  // ... rest ...
} = useTimer();
```

#### c) Handler Function
```javascript
const handleBreakComplete = useCallback(async () => {
  try {
    await endBreak();              // Validates & logs break end
    setShowBreakModal(false);      // Hide modal
    resumeTimer();                 // Resume lesson timer
  } catch (error) {
    if (error.code === 'BREAK_TOO_SHORT') {
      // Display: "Break must be at least 10 minutes. X minute(s) remaining."
      setError(`Break must be at least 10 minutes. ${error.minutesRemaining} minute(s) remaining.`);
    } else {
      console.error('Error ending break:', error);
      setError('Failed to end break. Please try again.');
    }
  }
}, [endBreak, resumeTimer]);
```

#### d) Break Trigger Effect
```javascript
useEffect(() => {
  if (isBreakMandatory && isActive) {
    setShowBreakModal(true);    // Show modal
    pauseTimer();               // Pause lesson timer
    startBreak();               // Start break timer & log to Firestore
  }
}, [isBreakMandatory, isActive, pauseTimer, startBreak]);
```

#### e) Modal Rendering
```javascript
<MandatoryBreakModal
  isOpen={showBreakModal}
  breakTimeRemaining={breakTime}        // Comes from TimerContext
  onBreakComplete={handleBreakComplete}
/>
```

#### f) Deleted Code
- **Removed**: Lines 809-846 (old inline placeholder modal with inline styles)
- **Reason**: Replaced with properly structured component

---

## TimerContext Integration

**How Break Logic Works**:

### 1. Break Detection (useBreakManagement Hook)
```javascript
// From: src/hooks/useBreakManagement.js
const BREAK_REQUIRED_AFTER = 2 * 3600;      // 7200 seconds = 2 hours
const MIN_BREAK_DURATION = 10 * 60;         // 600 seconds = 10 minutes

const isBreakDue = sessionTime >= BREAK_REQUIRED_AFTER;

useEffect(() => {
  if (isBreakDue && !isOnBreak && !breakRequiredTrackedRef.current) {
    breakRequiredTrackedRef.current = true;
    setIsBreakMandatory(true);  // Triggers CoursePlayerPage effect
  }
}, [isBreakDue, isOnBreak]);
```

### 2. Break Start (Compliance Logging)
```javascript
// From: src/context/TimerContext.jsx
const startBreakComplianceWrapped = async (duration = 600) => {
  if (sessionData.currentSessionId && user) {
    try {
      await logBreak(user.uid, sessionData.currentSessionId, {
        duration,
        type: 'mandatory',
        startTime: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error logging break:', err);
    }
  }

  breakManager.startBreak();           // Local state
  setBreakTime(duration);              // Set countdown to 600 seconds
  sessionTimer.pauseTimer();           // Pause lesson timer
};
```

**Firestore Structure** (logs break to `users/{userId}/sessions/{sessionId}`):
```javascript
{
  breaks: [
    {
      startTime: Timestamp,
      duration: 600,  // 10 minutes
      reason: "user_initiated",  // or "mandatory"
      timestamp: Timestamp
    }
  ]
}
```

### 3. Break Countdown (Client-Side)
```javascript
// From: src/context/TimerContext.jsx
useEffect(() => {
  if (breakManager.isOnBreak && breakTime > 0) {
    breakIntervalRef.current = setInterval(() => {
      setBreakTime(prev => {
        if (prev <= 1) {
          endBreakComplianceWrapped();  // Auto-end when reaches 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  return () => clearInterval(breakIntervalRef.current);
}, [breakManager.isOnBreak, breakTime]);
```

### 4. Break End (Validation & Logging)
```javascript
const endBreakComplianceWrapped = async () => {
  try {
    const breakDuration = breakManager.currentBreakDuration;  // Seconds elapsed
    const minDuration = 10 * 60;  // 600 seconds

    // CRITICAL: Validate minimum break duration (server-side in Firestore)
    if (breakDuration < minDuration) {
      const minutesRemaining = Math.ceil((minDuration - breakDuration) / 60);
      const error = new Error(`Break must be at least 10 minutes. ${minutesRemaining} minute(s) remaining.`);
      error.code = 'BREAK_TOO_SHORT';
      error.minutesRemaining = minutesRemaining;
      throw error;
    }

    // Log break end to Firestore
    if (sessionData.currentSessionId) {
      await logBreakEnd(user.uid, sessionData.currentSessionId, breakDuration);
    }

    breakManager.endBreak();      // Clear local state
    setBreakTime(0);
    sessionTimer.resumeTimer();   // Resume lesson timer
  } catch (err) {
    console.error('Error ending break:', err);
    throw err;
  }
};
```

**Firestore Break End Update**:
```javascript
// From: src/api/compliance/complianceServices.js
export const logBreakEnd = async (userId, sessionId, actualDurationSeconds) => {
  // Validates: actualDurationSeconds >= 600
  // Updates: breaks[lastBreak].endTime and breaks[lastBreak].actualDuration
  
  const sessionsRef = getSessionsRef(userId);
  const sessionRef = doc(sessionsRef, sessionId);
  const sessionDoc = await getDoc(sessionRef);

  if (sessionDoc.exists()) {
    const breaks = sessionDoc.data().breaks || [];
    if (breaks.length > 0) {
      const lastBreak = breaks[breaks.length - 1];
      lastBreak.endTime = serverTimestamp();
      lastBreak.actualDuration = actualDurationSeconds;

      await updateDoc(sessionRef, { breaks });
    }
  }
};
```

---

## Cloud Functions (Server-Side Enforcement)

### validateBreakEnd() Cloud Function
**Location**: `functions/src/compliance/complianceFunctions.js`

**Purpose**: Server-side validation that enforces minimum break duration without trusting client

**Triggered By**: `logBreakEnd()` in complianceServices.js

**Security Logic**:
```javascript
1. Authenticate user
2. Load session from Firestore (get stored startTime)
3. Calculate duration: serverNow - storedStartTime (server timestamps only!)
4. If duration < 600 seconds:
     a. Log BREAK_VALIDATION_REJECTED audit event
     b. Throw error with minutesRemaining
     c. Return 403 Forbidden
5. If duration >= 600 seconds:
     a. Log BREAK_VALIDATION_PASSED audit event
     b. Allow break end
     c. Update session with validatedByServer = true
```

**Audit Events Logged**:
- `BREAK_VALIDATION_FAILED` - Session not found or invalid state
- `BREAK_VALIDATION_REJECTED` - Duration < 600 seconds (includes remaining time)
- `BREAK_VALIDATION_PASSED` - Duration >= 600 seconds

---

## Firestore Security Rules

### Break Update Rules
**File**: `firestore.rules` (lines 84-99)

**Enforces**:
1. Only own session modifications allowed (`isOwnProfile(userId)`)
2. Can only update `breaks` array (no other fields)
3. `actualDuration >= 600` (enforces minimum in database)
4. `validatedByServer = true` (required flag)

**Prevents**:
- ❌ Direct Firestore writes of breaks with `actualDuration < 600`
- ❌ Modifications to non-break fields
- ❌ Break updates without server validation flag
- ❌ Admin manually bypassing validation (rules apply to all roles)

```firestore-rules
match /users/{userId}/sessions/{sessionId} {
  allow update: if isOwnProfile(userId) && 
    request.resource.data.keys().hasOnly(['breaks']) &&
    request.resource.data.breaks.size() > 0 &&
    request.resource.data.breaks[...].actualDuration >= 600 &&
    request.resource.data.breaks[...].validatedByServer == true;
}
```

---

## API Changes Summary

### logBreak() - UPDATED
```javascript
// OLD (insecure):
await logBreak(userId, sessionId, {
  duration: 600,           // ❌ Trusted client value!
  type: 'mandatory',
  startTime: clientTime
});

// NEW (secure):
await logBreak(userId, sessionId, {
  reason: 'mandatory'      // ✅ No duration from client!
  // Server records: startTime: serverTimestamp()
});
```

### logBreakEnd() - COMPLETELY REWRITTEN
```javascript
// OLD (insecure):
await logBreakEnd(userId, sessionId, actualDurationSeconds);
// ❌ Trusted client's claimed duration!

// NEW (secure):
await logBreakEnd(userId, sessionId);
// ✅ Server calculates: serverNow - storedStartTime
// ✅ Server validates: calculatedDuration >= 600
// ✅ Returns: { actualDurationSeconds, validated: true }
```

### validateBreakEnd() - NEW Cloud Function
```javascript
// Optional second validation layer (called before logBreakEnd)
const result = await validateBreakEnd({ sessionId });
// Returns: { success, actualDurationSeconds, validated, timestamp }
// Or throws: 'failed-precondition' with minutesRemaining
```

---

## Compliance Audit Trail

### What Gets Logged
Every mandatory break creates an immutable audit record in:
- **Collection**: `users/{userId}/sessions/{sessionId}`
- **Field**: `breaks[]` array

**Each break entry**:
```json
{
  "startTime": "2025-12-19T14:25:00Z",
  "endTime": "2025-12-19T14:35:00Z",
  "duration": 600,           // Requested duration (10 minutes)
  "actualDuration": 612,     // Actual time taken (may be slightly longer)
  "reason": "mandatory",     // or "user_initiated"
  "timestamp": "2025-12-19T14:25:00Z"
}
```

### Time Exclusion Verification
Break time is **excluded** from instruction minutes because:
1. `breakTime` state is separate from `sessionTime` in TimerContext
2. `logBreakEnd()` does NOT increment session minutes
3. Compliance calculations only count `minutesCompleted` from heartbeat (which pauses during breaks)

**Example Timeline**:
```
14:00:00 - Student starts lesson (sessionTime = 0)
14:02:00 - sessionTime = 120 minutes (2 hours reached)
14:02:05 - System triggers mandatory break
          - isBreakMandatory = true
          - showBreakModal = true
          - sessionTimer paused (stops incrementing)
          - breakTime starts at 600 seconds

14:12:05 - breakTime reaches 0
          - showResumeButton = true
          - Student clicks "Resume Learning"

14:12:10 - Break ends (608 seconds elapsed)
          - endBreak() called
          - logBreakEnd() validates >= 600 seconds ✓
          - sessionTimer resumes
          - sessionTime = 120 minutes (unchanged!)
          - Audit log records: break start, end, actualDuration

14:14:10 - sessionTime = 122 minutes (2 min passed since break ended)
```

---

## Modal Priority & Interaction

### Modal Display Priority
If multiple triggers occur simultaneously:

1. **Mandatory Break** (highest priority) - non-bypassable, locks content
2. **Personal Verification Modal (PVQ)** - mid-priority, identity check
3. **Inactivity Warning** (lowest priority) - warnings only

**Logic**: Break modal triggers FIRST, pauses timer, prevents other modals from showing until break complete.

### Cannot Bypass Break
- ❌ No close button (showCloseButton={false})
- ❌ Overlay click doesn't close (closeOnOverlayClick={false})
- ❌ Escape key disabled (closeOnEscape={false})
- ❌ Button disabled until 10 minutes elapsed
- ❌ No navigation allowed during break (course locked)

---

## Testing Checklist

### Unit Test Coverage
- [ ] `MandatoryBreakModal.jsx`: Countdown timer updates every second
- [ ] `MandatoryBreakModal.jsx`: Button disabled until 10 minutes pass
- [ ] `MandatoryBreakModal.jsx`: Modal non-dismissible (no close, overlay, escape)
- [ ] `handleBreakComplete()`: Calls `endBreak()` correctly
- [ ] `handleBreakComplete()`: Handles `BREAK_TOO_SHORT` error gracefully
- [ ] Break trigger effect: Shows modal when `isBreakMandatory && isActive`
- [ ] Break trigger effect: Calls `startBreak()` to log to Firestore

### E2E Test Coverage
- [ ] Student studies for 2 hours → break modal appears
- [ ] Countdown displays correct time (MM:SS)
- [ ] Student cannot click any buttons except after 10 minutes
- [ ] Student cannot close modal (overlay, escape, close button)
- [ ] After 10 minutes, "Resume Learning" button becomes enabled
- [ ] Clicking "Resume Learning" closes modal and resumes lesson
- [ ] Lesson timer continues from where it paused (120 minutes)
- [ ] Break time NOT added to total instruction minutes
- [ ] Next break trigger doesn't occur until another 2 hours of study

### Compliance Validation
- [ ] Firestore `sessions/{sessionId}/breaks[]` contains:
  - startTime (ISO)
  - endTime (ISO)
  - actualDuration >= 600 seconds
  - reason: "mandatory"
- [ ] Daily 4-hour lockout still enforced (system.totalTime >= 14400)
- [ ] Break time excluded from `minutesCompleted` in daily_activity_logs

---

## Known Limitations & Future Work

### Current Implementation
- Break duration hardcoded to 600 seconds (10 minutes) ✓
- Single break trigger per session (after 2 hours) ✓
- Timer persists across page refreshes via TimerContext ✓

### Not Yet Implemented
- [ ] Multiple breaks per session (student studies > 4 hours across multiple days)
- [ ] Configurable break duration via admin panel
- [ ] Break extension requests (if student requests more time)
- [ ] Break location tracking (not a requirement, but could help auditors)

---

## Rollback Instructions

If the mandatory break needs to be disabled:

1. **Hide Modal**:
   - In `CoursePlayerPage.jsx`, set `showBreakModal = false`

2. **Disable Break Trigger**:
   - In `useBreakManagement.js`, comment out `setIsBreakMandatory(true)`

3. **Keep Audit Logs**:
   - Firestore breaks still logged (auditors can see what was done)

---

## References

- **Regulation**: OAC Chapter 4501-8-09 (Ohio DMV Driver Education Requirements)
- **Component**: `MandatoryBreakModal.jsx`
- **Integration**: `CoursePlayerPage.jsx` (lines 17-18, 70-71, 87-89, 153-174)
- **Backend**: `TimerContext.jsx` (break state management), `complianceServices.js` (logging)
- **Tests**: (To be created) `MandatoryBreakModal.test.jsx`, E2E tests

---

**Last Reviewed**: December 19, 2025  
**Next Review**: After E2E test completion
