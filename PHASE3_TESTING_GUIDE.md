# PHASE 3 - COMPLIANCE REPORTING - COMPREHENSIVE TESTING GUIDE

**Purpose**: Verify all Phase 3 functionality works correctly in both staging and production  
**Date**: November 25, 2025  
**Duration**: 2-3 hours (all tests)

---

## Pre-Testing Checklist

### Environment Verification
- [ ] Admin user account logged in
- [ ] Firebase project configured (staging and production)
- [ ] Test data available (students with compliance records)
- [ ] Cloud Storage accessible
- [ ] Cloud Functions deployed
- [ ] Browser console open (for debugging)

### Test Data Requirements
Each test student should have:
- ✅ Completed enrollment in a course
- ✅ At least 1440+ minutes of session time
- ✅ Multiple quiz attempts (including final exam)
- ✅ Final exam passed
- ✅ PVQ verification attempts
- ✅ Certificate generated

### Access Requirements
- Admin dashboard access
- Compliance Reporting tab visible
- Write permissions to Cloud Storage
- Cloud Functions access

---

## TEST SUITE 1: PER-STUDENT EXPORT (CSV)

### Test 1.1: Export Single Student by ID (CSV Format)

**Objective**: Verify per-student export works by Student ID with CSV format

**Prerequisites**:
- Know test student's UID (e.g., `uid123`)
- Student has compliance data

**Step-by-Step Procedure**:

1. Navigate to Admin Dashboard
2. Click "Compliance Reporting" tab
3. **Export Type**: Select "Per-Student Export"
4. **Student ID**: Enter student UID (copy from test data)
5. **Export Format**: Select "CSV"
6. Click "Generate & Download Report"

**Expected Results**:
- ✅ Loading spinner appears
- ✅ Button becomes disabled
- ✅ After 1-3 seconds, success message: "CSV report generated and downloaded successfully!"
- ✅ Browser downloads file: `compliance-report-[courseId]-[timestamp].csv`
- ✅ Success message auto-dismisses after 3 seconds

**Validation**:
- [ ] CSV file opens in Excel/text editor
- [ ] Headers: studentId,studentName,studentEmail,courseId,totalSessions,totalMinutes,finalExamPassed,pvqCorrect,certificateIssued
- [ ] Data row contains correct student information
- [ ] Total minutes >= 1440
- [ ] finalExamPassed = "Yes" or "No"
- [ ] pvqCorrect = number (0-8+)
- [ ] certificateIssued = "Yes" or "No"

**Pass Criteria**: ✅ File downloads and contains correct data

---

### Test 1.2: Export Single Student by Name (CSV Format)

**Objective**: Verify student search by name works

**Prerequisites**:
- Know test student's name or email

**Step-by-Step Procedure**:

1. Navigate to Admin Dashboard
2. Click "Compliance Reporting" tab
3. **Export Type**: Select "Per-Student Export"
4. **Or Search by Name**: Enter student name or email
5. **Export Format**: Select "CSV"
6. Click "Generate & Download Report"

**Expected Results**:
- ✅ File downloads successfully
- ✅ Success message displayed

**Validation**:
- [ ] CSV file contains data for searched student
- [ ] Student name/email matches search query
- [ ] Data is accurate

**Pass Criteria**: ✅ Student search by name works

---

## TEST SUITE 2: PER-STUDENT EXPORT (JSON)

### Test 2.1: Export Single Student (JSON Format)

**Objective**: Verify JSON format export

**Step-by-Step Procedure**:

1. Navigate to Admin Dashboard
2. Click "Compliance Reporting" tab
3. **Export Type**: Select "Per-Student Export"
4. **Student ID**: Enter student UID
5. **Export Format**: Select "JSON"
6. Click "Generate & Download Report"

**Expected Results**:
- ✅ File downloads: `compliance-report-[courseId]-[timestamp].json`

**Validation**:
- [ ] Open JSON file in text editor
- [ ] JSON is valid and formatted
- [ ] Contains all fields:
  ```json
  {
    "studentId": "uid123",
    "studentName": "John Doe",
    "studentEmail": "john@example.com",
    "courseId": "fastrack-online",
    "sessions": {
      "totalSessions": 15,
      "totalMinutes": 1520,
      "minMet": true
    },
    "quizzes": {
      "totalAttempts": 25,
      "finalExamPassed": true
    },
    "pvq": {
      "totalAttempts": 8,
      "correctAnswers": 7
    },
    "certificate": {
      "certificateNumber": "FTDS-...",
      "issuedAt": "2025-11-20T..."
    },
    "generatedAt": "2025-11-25T..."
  }
  ```
- [ ] Data types are correct (strings, numbers, booleans)
- [ ] Timestamps are ISO format

**Pass Criteria**: ✅ Valid JSON with complete data structure

---

## TEST SUITE 3: PER-STUDENT EXPORT (PDF)

### Test 3.1: Export Single Student (PDF Format)

**Objective**: Verify PDF format export

**Step-by-Step Procedure**:

1. Navigate to Admin Dashboard
2. Click "Compliance Reporting" tab
3. **Export Type**: Select "Per-Student Export"
4. **Student ID**: Enter student UID
5. **Export Format**: Select "PDF"
6. Click "Generate & Download Report"

**Expected Results**:
- ✅ File downloads: `compliance-report-[courseId]-[timestamp].pdf`

**Validation**:
- [ ] Open PDF in Adobe Reader or browser
- [ ] PDF displays correctly (no corruption)
- [ ] Contains header: "Compliance Report"
- [ ] Shows course ID
- [ ] Shows generation date
- [ ] Contains student information:
  - [ ] Student name
  - [ ] Student email
  - [ ] Student ID
- [ ] Contains session data:
  - [ ] Number of sessions
  - [ ] Total minutes
  - [ ] 24-hour requirement met status (YES/NO)
- [ ] Contains quiz data:
  - [ ] Number of attempts
  - [ ] Final exam passed status
- [ ] Contains PVQ data:
  - [ ] Number of attempts
  - [ ] Correct answers count
- [ ] Contains certificate:
  - [ ] Certificate number (if issued)
  - [ ] Certificate not issued message (if not)

**Pass Criteria**: ✅ PDF displays all compliance data correctly

---

## TEST SUITE 4: COURSE-WIDE EXPORT

### Test 4.1: Export Course (CSV Format)

**Objective**: Verify course-wide export with multiple students

**Prerequisites**:
- Know course ID (e.g., `fastrack-online`)
- Course has 3+ enrolled students with compliance data

**Step-by-Step Procedure**:

1. Navigate to Admin Dashboard
2. Click "Compliance Reporting" tab
3. **Export Type**: Select "Course-Wide Export"
4. **Course ID**: Enter course ID
5. **Export Format**: Select "CSV"
6. Click "Generate & Download Report"

**Expected Results**:
- ✅ File downloads: `compliance-report-[courseId]-[timestamp].csv`

**Validation**:
- [ ] CSV opens in Excel/text editor
- [ ] Contains header row
- [ ] Contains multiple data rows (one per student)
- [ ] Row count = number of enrolled students with data
- [ ] All students have accurate data
- [ ] Data is consistent with individual reports

**Pass Criteria**: ✅ Course export includes all students

---

### Test 4.2: Export Course (JSON Format)

**Objective**: Verify course JSON export is array of students

**Step-by-Step Procedure**:

1. Navigate to Admin Dashboard
2. Click "Compliance Reporting" tab
3. **Export Type**: Select "Course-Wide Export"
4. **Course ID**: Enter course ID
5. **Export Format**: Select "JSON"
6. Click "Generate & Download Report"

**Expected Results**:
- ✅ File downloads as JSON

**Validation**:
- [ ] JSON is array (starts with `[`, ends with `]`)
- [ ] Array contains multiple objects (one per student)
- [ ] Each object has same structure as single student export
- [ ] Total objects = number of students

**Pass Criteria**: ✅ JSON array contains all students

---

### Test 4.3: Export Course (PDF Format)

**Objective**: Verify PDF contains multiple pages (one per student)

**Step-by-Step Procedure**:

1. Navigate to Admin Dashboard
2. Click "Compliance Reporting" tab
3. **Export Type**: Select "Course-Wide Export"
4. **Course ID**: Enter course ID
5. **Export Format**: Select "PDF"
6. Click "Generate & Download Report"

**Expected Results**:
- ✅ File downloads as PDF

**Validation**:
- [ ] PDF opens correctly
- [ ] First page: Course title and generation date
- [ ] Subsequent pages: One per student
- [ ] Page count > 1 (multiple students)
- [ ] Each page contains student's data
- [ ] Pages are properly separated

**Pass Criteria**: ✅ PDF has multiple pages with all students

---

## TEST SUITE 5: ERROR HANDLING

### Test 5.1: Missing Required Field (Course Export)

**Objective**: Verify error when Course ID is empty

**Step-by-Step Procedure**:

1. Navigate to Admin Dashboard
2. Click "Compliance Reporting" tab
3. **Export Type**: Select "Course-Wide Export"
4. **Course ID**: Leave empty
5. Click "Generate & Download Report"

**Expected Results**:
- ✅ Button is **DISABLED** (greyed out)
- ✅ Cannot submit form

**Validation**:
- [ ] Button is disabled
- [ ] No error message needed (UI prevents submission)

**Pass Criteria**: ✅ UI validation prevents empty submission

---

### Test 5.2: Missing Student Identifier

**Objective**: Verify error when neither ID nor Name is provided

**Step-by-Step Procedure**:

1. Navigate to Admin Dashboard
2. Click "Compliance Reporting" tab
3. **Export Type**: Select "Per-Student Export"
4. **Student ID**: Leave empty
5. **Search by Name**: Leave empty
6. Click "Generate & Download Report"

**Expected Results**:
- ✅ Button is **DISABLED**

**Pass Criteria**: ✅ UI validation requires at least one identifier

---

### Test 5.3: Student Not Found (Backend Error)

**Objective**: Verify error handling when student doesn't exist

**Prerequisites**:
- Have test course ID ready
- Have a non-existent student ID (e.g., `fake-uid-12345`)

**Step-by-Step Procedure**:

1. Navigate to Admin Dashboard
2. Click "Compliance Reporting" tab
3. **Export Type**: Select "Per-Student Export"
4. **Student ID**: Enter fake/non-existent ID
5. **Course ID**: Enter valid course ID
6. **Export Format**: Select "CSV"
7. Click "Generate & Download Report"

**Expected Results**:
- ✅ Loading spinner appears
- ✅ After 2-3 seconds, error message appears
- ✅ Error text: `Failed to generate report: User not found`
- ✅ Button re-enables

**Validation**:
- [ ] Error message displays
- [ ] Message is descriptive
- [ ] Form remains usable for retry

**Pass Criteria**: ✅ Error handled gracefully

---

### Test 5.4: Invalid Course ID

**Objective**: Verify error when course doesn't exist

**Step-by-Step Procedure**:

1. Navigate to Admin Dashboard
2. Click "Compliance Reporting" tab
3. **Export Type**: Select "Course-Wide Export"
4. **Course ID**: Enter non-existent course (e.g., `fake-course-xyz`)
5. **Export Format**: Select "CSV"
6. Click "Generate & Download Report"

**Expected Results**:
- ✅ Error message: `Failed to generate report: No compliance data found`

**Pass Criteria**: ✅ Error message displayed

---

## TEST SUITE 6: FILE DOWNLOADS & LINKS

### Test 6.1: Download Link Validity (7 Days)

**Objective**: Verify signed download URLs are valid

**Step-by-Step Procedure**:

1. Generate a compliance report (any type/format)
2. Note the download URL from browser
3. Open URL in new tab directly

**Expected Results**:
- ✅ File downloads successfully from signed URL
- ✅ No authentication required for signed URL

**Validation**:
- [ ] Direct URL access works
- [ ] File is not corrupted
- [ ] File content is correct

**Pass Criteria**: ✅ Signed URLs work for direct download

---

### Test 6.2: Check Cloud Storage

**Objective**: Verify files are stored in Cloud Storage

**Step-by-Step Procedure**:

1. Generate a compliance report
2. Open GCP Console
3. Navigate to Cloud Storage
4. Browse `compliance-reports/` folder
5. Find the generated file

**Expected Results**:
- ✅ File exists in Cloud Storage
- ✅ File name matches: `compliance-report-[courseId]-[timestamp].[ext]`
- ✅ File has correct size for format

**Validation**:
- [ ] File appears in Cloud Storage
- [ ] File name is correct
- [ ] File size is reasonable:
  - CSV: 1-50 KB (usually 5-20 KB)
  - JSON: 3-100 KB (usually 10-30 KB)
  - PDF: 20-500 KB (usually 50-200 KB)

**Pass Criteria**: ✅ Files stored in Cloud Storage

---

## TEST SUITE 7: AUDIT LOGGING

### Test 7.1: Check Audit Trail (Success)

**Objective**: Verify exports are logged in Cloud Logging

**Step-by-Step Procedure**:

1. Generate a compliance report (note courseId and format)
2. Open GCP Console
3. Navigate to Cloud Logging → Logs Explorer
4. Set filter to search recent logs:
   ```
   resource.type="cloud_function"
   AND jsonPayload.action="create"
   AND jsonPayload.resource="compliance_report"
   AND timestamp>="2025-11-25T..."  # Recent time
   ```
5. Look for entry with status="success"

**Expected Results**:
- ✅ Log entry appears in Cloud Logging
- ✅ Entry shows:
  - action: "create"
  - resource: "compliance_report"
  - status: "success"
  - metadata with: exportType, courseId, format

**Validation**:
- [ ] Log entry exists
- [ ] Metadata is correct
- [ ] Timestamp is recent

**Pass Criteria**: ✅ Success logged in Cloud Logging

---

### Test 7.2: Check Firestore Audit Logs

**Objective**: Verify exports are logged in Firestore

**Step-by-Step Procedure**:

1. Generate a compliance report
2. Open Firebase Console
3. Go to Firestore → Collections
4. Find `auditLogs` collection
5. Look for recent entry with:
   - action: "create"
   - resource: "compliance_report"
   - status: "success"

**Expected Results**:
- ✅ Audit log document exists
- ✅ Contains all required fields

**Validation**:
- [ ] Document exists
- [ ] Fields are correct
- [ ] Timestamp is recent

**Pass Criteria**: ✅ Audit logged in Firestore

---

### Test 7.3: Check Error Logging

**Objective**: Verify failed exports are logged

**Step-by-Step Procedure**:

1. Attempt to generate report with fake student ID (should fail)
2. Note the error
3. Check Cloud Logging for failed attempt:
   ```
   resource.type="cloud_function"
   AND jsonPayload.status="failure"
   AND jsonPayload.resource="compliance_report"
   ```

**Expected Results**:
- ✅ Failure logged with error message

**Pass Criteria**: ✅ Failures are logged

---

## TEST SUITE 8: DATA ACCURACY

### Test 8.1: Verify Session Data

**Objective**: Ensure exported session data matches Firestore

**Step-by-Step Procedure**:

1. Export single student report
2. Note total minutes in report
3. Manually check Firestore:
   - Go to `complianceLogs` collection
   - Filter by studentId + courseId + status="completed"
   - Sum all duration values
   - Calculate total minutes = totalSeconds / 60

**Expected Results**:
- ✅ Report total minutes matches Firestore sum
- ✅ Within 1 minute rounding tolerance

**Pass Criteria**: ✅ Session data accurate

---

### Test 8.2: Verify Quiz Data

**Objective**: Ensure quiz attempts are correctly counted

**Step-by-Step Procedure**:

1. Export single student report
2. Note "Quiz Attempts" and "Final Exam Passed" fields
3. Manually check Firestore:
   - Go to `quizAttempts` collection
   - Filter by studentId + courseId
   - Count total records = Quiz Attempts
   - Check if any record has isFinalExam=true AND passed=true

**Expected Results**:
- ✅ Quiz attempt count matches
- ✅ Final exam status is correct

**Pass Criteria**: ✅ Quiz data accurate

---

### Test 8.3: Verify PVQ Data

**Objective**: Ensure PVQ records are correct

**Step-by-Step Procedure**:

1. Export single student report
2. Note "PVQ Attempts" and "Correct Answers"
3. Manually check Firestore:
   - Go to `identityVerifications` collection
   - Filter by studentId + courseId
   - Count total records = PVQ Attempts
   - Count records where studentAnswer === correctAnswer

**Expected Results**:
- ✅ PVQ attempt count matches
- ✅ Correct answer count matches

**Pass Criteria**: ✅ PVQ data accurate

---

### Test 8.4: Verify Certificate Status

**Objective**: Ensure certificate info is correct

**Step-by-Step Procedure**:

1. Export student with certificate
2. Note certificate number in report
3. Check Firestore:
   - Go to `certificates` collection
   - Find matching studentId + courseId
   - Compare certificateNumber

**Expected Results**:
- ✅ Certificate number matches
- ✅ Issue date matches

**Pass Criteria**: ✅ Certificate data accurate

---

## TEST SUITE 9: ENVIRONMENT-SPECIFIC TESTS

### Test 9.1: Staging Environment

**Objective**: Verify all functionality works in staging

**Procedure**:
1. Repeat Test Suites 1-4 in staging
2. Verify Cloud Storage path is correct
3. Verify Firestore data is staging data

**Pass Criteria**: ✅ All tests pass in staging

---

### Test 9.2: Production Environment

**Objective**: Verify all functionality works in production

**Procedure**:
1. Repeat Test Suites 1-4 in production
2. Verify Cloud Storage path is correct
3. Verify Firestore data is production data

**Pass Criteria**: ✅ All tests pass in production

---

## TEST SUITE 10: PERFORMANCE

### Test 10.1: Single Student Export Speed

**Objective**: Verify reasonable performance for single student

**Step-by-Step Procedure**:

1. Start timer
2. Click "Generate & Download Report" (single student, CSV)
3. Stop timer when download completes

**Expected Results**:
- ✅ Completes in 1-3 seconds

**Acceptable Range**: 1-5 seconds

**Pass Criteria**: ✅ Performance is acceptable

---

### Test 10.2: Course Export Speed (Multiple Students)

**Objective**: Verify performance for course with 20+ students

**Prerequisites**:
- Course with 20+ enrolled students

**Step-by-Step Procedure**:

1. Start timer
2. Click "Generate & Download Report" (course, CSV)
3. Stop timer when download completes

**Expected Results**:
- ✅ Completes in 5-20 seconds (depending on student count)

**Acceptable Range**: Up to 30 seconds

**Pass Criteria**: ✅ Performance is acceptable

---

## TEST SUITE 11: USER EXPERIENCE

### Test 11.1: Loading State

**Objective**: Verify loading indicator works

**Step-by-Step Procedure**:

1. Generate a report
2. Observe button during generation

**Expected Results**:
- ✅ Button shows loading spinner
- ✅ Button text changes to "Generating Report..."
- ✅ Button is disabled during generation
- ✅ Spinner disappears when complete

**Pass Criteria**: ✅ Loading UX works correctly

---

### Test 11.2: Success Message

**Objective**: Verify success feedback

**Step-by-Step Procedure**:

1. Generate successful report
2. Observe success message

**Expected Results**:
- ✅ Green success message appears
- ✅ Message: "[FORMAT] report generated and downloaded successfully!"
- ✅ Auto-dismisses after 3 seconds

**Pass Criteria**: ✅ Success feedback works

---

### Test 11.3: Error Message

**Objective**: Verify error feedback

**Step-by-Step Procedure**:

1. Attempt invalid export (non-existent student)
2. Observe error message

**Expected Results**:
- ✅ Red error message appears
- ✅ Message describes the error clearly
- ✅ Can dismiss error
- ✅ Form remains usable

**Pass Criteria**: ✅ Error feedback works

---

## FINAL VALIDATION CHECKLIST

### Core Functionality
- [ ] Per-student exports work (all formats)
- [ ] Course exports work (all formats)
- [ ] Student search by ID works
- [ ] Student search by name works
- [ ] All 3 formats download correctly
- [ ] Files open without corruption

### Data Accuracy
- [ ] Session data matches Firestore
- [ ] Quiz data matches Firestore
- [ ] PVQ data matches Firestore
- [ ] Certificate data matches Firestore
- [ ] 24-hour calculation is correct

### Error Handling
- [ ] UI validation prevents invalid submissions
- [ ] Backend errors are caught and displayed
- [ ] User can retry after error
- [ ] No sensitive data in error messages

### Audit & Security
- [ ] All exports logged (success)
- [ ] All errors logged (failure)
- [ ] Cloud Storage files are secure
- [ ] Signed URLs expire after 7 days
- [ ] Authentication is required

### Performance
- [ ] Single student exports < 3 seconds
- [ ] Course exports reasonable for student count
- [ ] No timeout errors
- [ ] No memory issues

### User Experience
- [ ] Loading state visible
- [ ] Success messages display
- [ ] Error messages are helpful
- [ ] Form is easy to use
- [ ] Downloads work reliably

---

## SUMMARY

**Total Tests**: 30+  
**Estimated Duration**: 2-3 hours  
**Test Categories**: Functionality, Data Accuracy, Error Handling, Audit, Performance, UX

**Success Criteria**: All tests pass in both staging and production

