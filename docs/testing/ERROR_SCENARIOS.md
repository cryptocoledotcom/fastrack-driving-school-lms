# Error Scenarios & Edge Cases

**Manual Testing Checklist for Error Handling**

These scenarios test how the system handles errors, invalid inputs, and edge cases. Test each one and document the result.

---

## Scenario 1: Invalid Payment Amount

**Objective:** System rejects invalid payment amounts

**Steps:**
1. Go to enrollment payment section
2. Try entering:
   - ✅ Negative amount (e.g., `-$50`)
   - ✅ Zero amount (`$0`)
   - ✅ Amount greater than remaining balance
   - ✅ Non-numeric input (letters, symbols)
   - ✅ Extremely large amount (e.g., `$999,999`)

**Expected Behavior:**
- ✅ Form validation prevents submission
- ✅ Clear error message displays
- ✅ No database write occurs
- ✅ Previous enrollment state unchanged

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Scenario 2: Duplicate Payment Attempt

**Objective:** Prevent double-charging if payment submitted twice

**Steps:**
1. Start payment for remaining balance
2. Quickly click "Submit Payment" twice
3. Wait for both requests to complete
4. Verify only ONE payment recorded

**Expected Behavior:**
- ✅ Atomic batch operations prevent duplicate
- ✅ Second attempt shows error or ignored
- ✅ Database shows only one payment
- ✅ Balance correctly reflects single payment

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Scenario 3: Network Interruption During Payment

**Objective:** System handles network failure gracefully

**Steps:**
1. Start payment process
2. Simulate network disconnect (unplug ethernet or turn off WiFi)
3. Wait 5-10 seconds
4. Reconnect network
5. Check:
   - ✅ Retry logic engages
   - ✅ Payment eventually completes OR shows clear error
   - ✅ No partial payment in database

**Expected Behavior:**
- ✅ Error message appears (not silent failure)
- ✅ User knows to retry or contact support
- ✅ Enrollment state consistent

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Scenario 4: Firebase Connection Failure

**Objective:** Handle backend database errors

**Steps:**
1. Make payment attempt
2. (Simulated in dev tools) Network tab → throttle to "offline"
3. Try completing payment
4. Wait for timeout
5. Check response

**Expected Behavior:**
- ✅ Clear error message displays
- ✅ User can retry
- ✅ No incomplete transaction in database

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Scenario 5: Course Not Found

**Objective:** Handle missing course gracefully

**Steps:**
1. Try accessing enrollment for non-existent course (edit URL manually)
2. Try making payment for non-existent course
3. Verify error handling

**Expected Behavior:**
- ✅ Redirect to courses page OR
- ✅ Display "Course not found" message
- ✅ No error thrown to console
- ✅ No partial state in database

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Scenario 6: User Not Authenticated

**Objective:** Prevent unauthorized payment attempts

**Steps:**
1. Log out of application
2. Try accessing enrollment page directly (bookmark)
3. Try making payment (curl/manual request)
4. Verify redirection

**Expected Behavior:**
- ✅ Redirect to login page
- ✅ Session cleared
- ✅ No database writes

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Scenario 7: Insufficient Permissions

**Objective:** Prevent user from modifying another user's enrollment

**Steps:**
1. Get enrollment ID of different user (from database/URL)
2. Try to modify their payment (manual request)
3. Verify permission check

**Expected Behavior:**
- ✅ Permission denied error
- ✅ No database modification
- ✅ Error logged for security audit

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Scenario 8: Concurrent Enrollment Deletion

**Objective:** Handle deletion while payment in progress

**Steps:**
1. Start payment process
2. In another window/tab, delete the enrollment
3. Allow payment to complete
4. Check database state

**Expected Behavior:**
- ✅ Either payment completes then shows "enrollment deleted" error
- ✅ OR payment fails with "enrollment not found"
- ✅ No orphaned payment records

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Scenario 9: Invalid Payment Session

**Objective:** Handle expired payment sessions

**Steps:**
1. Start payment
2. Wait 30 minutes without completing
3. Try to submit payment
4. Verify session handling

**Expected Behavior:**
- ✅ Session expires gracefully
- ✅ Clear message: "Session expired, please try again"
- ✅ Can restart payment flow
- ✅ No stuck transactions

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Scenario 10: Browser Refresh During Payment

**Objective:** Handle mid-transaction refresh

**Steps:**
1. Start payment
2. Before clicking submit, refresh page (F5)
3. Verify page state
4. Try payment again

**Expected Behavior:**
- ✅ Form clears or retains data appropriately
- ✅ No partial writes to database
- ✅ User can retry payment

**Result:** [ ] PASS / [ ] FAIL
**Notes:**

---

## Testing Checklist

**Before Staging Deployment:**

- [ ] Scenario 1: Invalid Amounts ✅ / ❌
- [ ] Scenario 2: Duplicate Payment ✅ / ❌
- [ ] Scenario 3: Network Interruption ✅ / ❌
- [ ] Scenario 4: Firebase Offline ✅ / ❌
- [ ] Scenario 5: Missing Course ✅ / ❌
- [ ] Scenario 6: Unauthenticated Access ✅ / ❌
- [ ] Scenario 7: Permission Checks ✅ / ❌
- [ ] Scenario 8: Concurrent Deletion ✅ / ❌
- [ ] Scenario 9: Session Expiry ✅ / ❌
- [ ] Scenario 10: Mid-Transaction Refresh ✅ / ❌

**Estimated Time:** 30-45 minutes

**Date Tested:** _______________

**Tester Name:** _______________

**Issues Found:** (describe any failures below)

---

## Priority Levels

- **CRITICAL** (must fix before production): Scenarios 1, 2, 5, 6, 7
- **HIGH** (should fix before production): Scenarios 3, 4, 8, 9
- **MEDIUM** (nice to fix): Scenario 10

---

**Last Updated:** November 30, 2025
