# Manual Test Cases - Complete User Flows

**Status:** ✅ All Test Cases Passing (November 30, 2025)

These are the critical user flows that have been manually verified. Use this checklist before any deployment.

---

## Test Case 1: Complete Course Enrollment - Full Payment

**Objective:** User enrolls in a course and pays in full

**Steps:**
1. Navigate to Course Catalog
2. Select a course (e.g., "Basic Driver Training")
3. Click "Enroll Now"
4. Verify course appears in "My Courses"
5. Click "View Course"
6. Select "Full Payment" option
7. Enter payment amount (full course cost)
8. Complete payment
9. Verify:
   - ✅ Course shows "Paid in Full" badge
   - ✅ Payment status updates immediately
   - ✅ Course modules are accessible
   - ✅ Session is created in database

**Result:** ✅ PASSING

---

## Test Case 2: Complete Course Enrollment - Partial Payment

**Objective:** User enrolls and makes partial payment, then completes remaining balance

**Steps:**
1. Navigate to Course Catalog
2. Select a course (e.g., "Advanced Driver Training")
3. Click "Enroll Now"
4. Click "View Course"
5. Select "Partial Payment" option
6. Enter partial amount (e.g., 50% of course cost)
7. Complete first payment
8. Verify:
   - ✅ Course shows "Partially Paid" badge
   - ✅ Remaining balance displays correctly
   - ✅ Payment progress visible
9. Make second payment (remaining balance)
10. Verify:
    - ✅ Badge updates to "Paid in Full"
    - ✅ All remaining balance cleared
    - ✅ Course fully accessible

**Result:** ✅ PASSING

---

## Test Case 3: Course Access & Session Creation

**Objective:** Verify course player launches and sessions are created

**Steps:**
1. Access a paid course
2. Click "Start Course" or "Course Player"
3. Verify course player loads
4. Navigate through course modules
5. Verify:
   - ✅ Session created in database
   - ✅ Progress tracked
   - ✅ Module completion recorded
   - ✅ Timestamps accurate

**Result:** ✅ PASSING

---

## Test Case 4: State Management - Course Deletion & Re-enrollment

**Objective:** Delete enrollment and re-enroll, verify clean state

**Steps:**
1. Enroll and pay for Course A
2. Verify "Paid in Full" status
3. Delete enrollment from "My Courses"
4. Verify course removed from UI
5. Re-enroll in Course A
6. Verify:
   - ✅ No stale data from previous enrollment
   - ✅ Payment status reset correctly
   - ✅ New session created
   - ✅ Modules accessible

**Result:** ✅ PASSING

---

## Test Case 5: Multiple Course Enrollment

**Objective:** Enroll in and pay for all 3 courses, verify isolation

**Steps:**
1. Enroll and pay for Course 1 (Basic Driver Training) - Full Payment
   - ✅ "Paid in Full" badge
   - ✅ Session created
2. Enroll and pay for Course 2 (Advanced Driver Training) - Partial Payment
   - ✅ "Partially Paid" badge
   - ✅ Remaining balance shows
3. Enroll and pay for Course 3 (Commercial Driver License) - Partial Payment
   - ✅ "Partially Paid" badge
4. Complete remaining payment for Course 2
   - ✅ Badge updates to "Paid in Full"
5. Verify:
   - ✅ Each course maintains independent state
   - ✅ No data bleeding between courses
   - ✅ All sessions created separately
   - ✅ Progress tracked separately per course

**Result:** ✅ PASSING

---

## Test Case 6: Payment State & Flow Handling

**Objective:** Verify payment options and state transitions

**Steps:**
1. Enroll in a course
2. Click payment section
3. Verify payment options display correctly:
   - ✅ Full payment option available
   - ✅ Partial payment option available
   - ✅ Correct amounts shown
4. Select payment option
5. Verify:
   - ✅ UI updates to reflect selection
   - ✅ Disabled states work correctly
   - ✅ Error messages display properly (if invalid input)

**Result:** ✅ PASSING

---

## Test Case 7: Badge Display - All Payment States

**Objective:** Verify correct badges display for each payment state

**Steps:**
1. Course 1 - Full Payment Complete
   - ✅ Shows "Paid in Full" badge (green)
2. Course 2 - Partial Payment (50%)
   - ✅ Shows "Partially Paid" badge (yellow)
   - ✅ Shows remaining balance
3. Course 3 - No Payment
   - ✅ Shows unpaid state correctly

**Result:** ✅ PASSING

---

## Pre-Deployment Checklist

Before pushing to production, re-run these tests:

- [ ] Test Case 1: Full Payment Flow
- [ ] Test Case 2: Partial Payment + Completion
- [ ] Test Case 3: Course Access & Sessions
- [ ] Test Case 4: Clean State After Re-enrollment
- [ ] Test Case 5: Multiple Courses
- [ ] Test Case 6: Payment Options
- [ ] Test Case 7: Badge Display

**Estimated Time:** 15-20 minutes

**Test Environment:** Staging server with test Firebase account

---

## Known Limitations (Acceptable)

- Load testing shows 5-10 user purchases/month expected
- Concurrent payment testing only critical at scale (not current concern)
- Error scenarios covered separately in `ERROR_SCENARIOS.md`

---

**Last Updated:** November 30, 2025
