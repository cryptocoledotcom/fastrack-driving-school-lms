# DETS Integration Plan - Session 4

**Last Updated**: December 3, 2025  
**Status**: Planning & Architecture Phase  
**Estimated Effort**: 8-10 hours  
**Priority**: HIGH (State Reporting Requirement)

---

## 1. DETS Overview & Research

### What is DETS?
**DETS** = Ohio Department of Education and Workforce (ODEW) Driver Education Training System

DETS is Ohio's state system for tracking driver education course completion. Schools and training providers must report student completion data to DETS for state compliance verification.

### Requirements (To Be Verified)
- [ ] DETS API documentation obtained
- [ ] Authentication method confirmed (likely API key or certificate-based)
- [ ] Required data fields identified
- [ ] Upload format specified (JSON, XML, CSV)
- [ ] Endpoint URL documented
- [ ] Rate limiting and batch size limits understood
- [ ] Error handling and retry logic requirements

### Research Checklist
- [ ] Contact Ohio ODEW for DETS API documentation
- [ ] Obtain API credentials/sandbox access
- [ ] Review API authentication methods
- [ ] Confirm data field requirements
- [ ] Test API connectivity

---

## 2. Data Model - Student Completion Export

### Available Student Data (Current System)

#### From `users` collection
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  role: string,
  createdAt: timestamp,
  
  // Student profile fields (to be captured)
  firstName: string,         // DETS required
  lastName: string,          // DETS required
  dateOfBirth: string,       // DETS required (format: YYYY-MM-DD)
  driverLicense: string,     // DETS required (format: ^[A-Z]{2}\d{6}$)
  driverLicenseState: string, // DETS required (default: 'OH')
  address: string,           // DETS may require
  city: string,              // DETS may require
  state: string,             // DETS may require (default: 'OH')
  zipCode: string,           // DETS may require
  phone: string,             // DETS may require
  
  // Enrollment tracking
  enrollments: {
    [courseId]: {
      enrolledAt: timestamp,
      status: 'active' | 'completed' | 'pending_payment',
      paymentStatus: 'pending' | 'partial' | 'completed'
    }
  }
}
```

#### From `certificates` collection
```javascript
{
  id: string,
  userId: string,           // DETS required
  type: 'enrollment' | 'completion', // DETS required
  courseId: string,         // DETS required
  courseName: string,       // DETS required
  studentName: string,      // DETS required
  awardedAt: timestamp,     // DETS required
  certificateNumber: string, // DETS required
  instructionTime: number,  // minutes - DETS required
  examScore: number,        // percentage - DETS required (for completion certs)
  instructorId: string,     // DETS may require
  schoolName: string        // DETS may require
}
```

#### From progress tracking
```javascript
// users/{userId}/userProgress/progress
{
  [courseId]: {
    overallProgress: number,
    completedLessons: number,
    totalLessons: number,
    lessonProgress: {},
    moduleProgress: {}
  }
}
```

#### From daily_activity_logs
```javascript
{
  userId_YYYY-MM-DD: {
    minutes_completed: number,
    status: 'active' | 'completed',
    // Track total course minutes
  }
}
```

---

## 3. DETS Export Data Structure (Proposed)

### Completion Report Record
```javascript
{
  // Student Identifier
  studentId: string,              // Unique in our system (uid)
  firstName: string,              // From user profile
  lastName: string,               // From user profile
  dateOfBirth: string,            // YYYY-MM-DD format
  driverLicense: string,          // Validation: ^[A-Z]{2}\d{6}$
  driverLicenseState: string,     // Always 'OH' for Ohio

  // School/Instructor Info
  schoolId: string,               // Organization identifier
  schoolName: string,             // Organization name
  instructorId: string,           // Assigned instructor UID
  instructorName: string,         // Instructor name

  // Course Completion
  courseCode: string,             // e.g., 'fastrack-online'
  courseName: string,             // e.g., 'Fastrack Online Course'
  completionDate: string,         // YYYY-MM-DD format
  totalInstructionMinutes: number, // 1440 minimum
  
  // Exam Results
  examScore: number,              // 0-100 percentage
  examPassed: boolean,            // Score >= 75%
  examAttempts: number,           // Count of attempts
  finalAttemptDate: string,       // YYYY-MM-DD

  // Compliance Verification
  certificateId: string,          // Certificate number for auditing
  timeEnforced: boolean,          // true (server-side verified)
  pvqCompleted: boolean,          // PVQ verification completed
  videoCompletionVerified: boolean, // Post-video questions answered

  // Metadata
  exportedAt: string,             // ISO 8601 timestamp
  exportedBy: string,             // Admin/system identifier
  status: 'pending' | 'submitted' | 'confirmed' | 'error'
}
```

---

## 4. Implementation Architecture

### Phase 1: Data Collection (Hours 1-2)
- [ ] Create DETS export service layer (`detsServices.js`)
- [ ] Query student completion certificates
- [ ] Aggregate instruction time from daily_activity_logs
- [ ] Validate all required fields present
- [ ] Build export record generator

### Phase 2: API Integration (Hours 3-4)
- [ ] Create Cloud Function: `exportDETSReport` (callable)
  - Accepts: courseId, dateRange, studentIds (optional)
  - Returns: validation results + record count
  - Stores report for upload
  
- [ ] Create Cloud Function: `submitDETSToState` (callable)
  - Accepts: reportId
  - Calls DETS API endpoint
  - Handles auth (API key / certificate)
  - Returns: submission confirmation or error

### Phase 3: UI & Manual Upload (Hours 5-7)
- [ ] Create admin UI component: `DETSExportPanel.jsx`
  - Date range selector
  - Course selector
  - Export button
  - Progress indicator
  - Report history display
  - Manual submit button
  
- [ ] Create report storage structure
  - Firestore collection: `dets_reports`
  - Track: status, export date, submission date, errors, record count

### Phase 4: Automated Triggers (Hours 7-8)
- [ ] Add certificate generation trigger
  - On completion certificate generation
  - Add `readyForDETSExport: true` flag to certificate
  
- [ ] Create scheduled Cloud Function: `processPendingDETSReports`
  - Runs daily at 03:00 UTC (after audit retention cleanup)
  - Finds certificates ready for export
  - Batches into report (max 500 per report)
  - Auto-submits if configured

### Phase 5: Testing & Documentation (Hours 8-10)
- [ ] Unit tests for DETS validation
- [ ] Integration tests for export flow
- [ ] E2E test: completion → certificate → DETS export
- [ ] Error handling tests
- [ ] Documentation & deployment guide

---

## 5. Implementation Structure

### Frontend Services (`src/api/admin/detsServices.js`)
```javascript
// Export & submission functions
- generateDETSReport(courseId, startDate, endDate, studentIds)
- submitDETSReport(reportId)
- getDETSReports(limit, offset)
- getDETSReportById(reportId)
- retryDETSSubmission(reportId)
- validateDETSRecord(record)
- exportReportAsCSV(reportId)
```

### Cloud Functions (`functions/src/compliance/detsFunctions.js`)
```javascript
// DETS export and state submission
- exportDETSReport() // Generate and validate
- submitDETSToState() // Submit to DETS API
- processPendingDETSReports() // Scheduled batch processor
- validateDETSData() // Validation helper
```

### Admin UI Component (`src/pages/Admin/DETSExportPanel.jsx`)
```javascript
// Tab for admin panel
- Date range picker
- Course selector
- Export progress
- Report history table
- Manual submit button
- Download CSV option
```

### Firestore Collections
```
dets_reports/{reportId}
├── courseId: string
├── exportDate: timestamp
├── submissionDate: timestamp (null until submitted)
├── status: 'draft' | 'ready' | 'submitted' | 'confirmed' | 'error'
├── recordCount: number
├── records: [] (array or stored separately)
├── errors: [] (validation errors)
└── detsResponse: {} (API response)

dets_export_logs/{logId}
├── reportId: string
├── studentId: string
├── certificateId: string
├── status: 'ready' | 'submitted' | 'error'
├── exportedAt: timestamp
└── error: string (if failed)
```

---

## 6. Environment Configuration

### Required Environment Variables
```env
# DETS API Configuration
REACT_APP_DETS_API_ENDPOINT=https://dets.ohio.gov/api/v1 (or sandbox)
REACT_APP_DETS_ENABLED=true|false (toggle feature)

# Firebase Functions config
DETS_API_KEY=<secret>  (stored in Firebase Secrets Manager)
DETS_AUTH_METHOD=api_key|certificate|oauth
DETS_BATCH_SIZE=500 (max records per submission)
DETS_AUTO_SUBMIT=true|false
```

### Firebase Secrets Manager
```bash
firebase functions:config:set dets.api_key="xxx"
firebase functions:config:set dets.endpoint="https://..."
firebase functions:config:set dets.auth_method="api_key"
```

---

## 7. Validation Rules

### Driver License Format
- Format: `^[A-Z]{2}\d{6}$` (e.g., 'OH123456')
- Must be 8 characters
- First 2 chars: state code
- Last 6 chars: numeric only

### DOB Format
- ISO 8601: `YYYY-MM-DD`
- Must be valid date
- Must be at least 14 years old (driving age)

### Instruction Time
- Minimum: 1,440 minutes (24 hours)
- Must match server-side heartbeat tracking
- Cannot be manually edited (audit log verified)

### Exam Score
- Range: 0-100 (percentage)
- Pass threshold: 75%
- Verified via exam_attempts collection

### Date Validation
- All dates in UTC ISO 8601 format
- Completion date: after enrollment date
- Export date: after completion date

---

## 8. Error Handling Strategy

### Validation Errors (Client-side)
```javascript
{
  code: 'INVALID_DETS_RECORD',
  field: 'driverLicense',
  message: 'Driver license format invalid',
  expected: 'OH123456',
  actual: 'OH12345' // missing digit
}
```

### API Errors (Server-side)
```javascript
{
  code: 'DETS_API_ERROR',
  status: 400|401|500,
  message: 'DETS API rejected submission',
  detsErrorCode: 'DUPLICATE_RECORD',
  retryable: true|false
}
```

### Retry Logic
- Transient errors (5xx, timeout): retry up to 3x with exponential backoff
- Authentication errors (401): refresh credentials and retry
- Validation errors (400): log and mark as failed (no retry)

---

## 9. Security & Compliance

### Data Protection
- [ ] PII fields encrypted in transit (HTTPS only)
- [ ] API credentials stored in Firebase Secrets Manager
- [ ] Audit log all DETS submissions (who, what, when)
- [ ] Never log PII to console (driver license, DOB)
- [ ] Firestore rules: DETS data read/write by admin only

### Audit Trail
```javascript
// Audit log event type
{
  eventType: 'DETS_REPORT_EXPORTED',
  userId: adminId,
  courseId: courseId,
  recordCount: 150,
  status: 'success',
  timestamp: '2025-12-03T...',
  exportedBy: 'admin@school.edu'
}

{
  eventType: 'DETS_SUBMISSION_SUBMITTED',
  userId: adminId,
  reportId: reportId,
  recordCount: 150,
  detsResponse: { code: 'SUCCESS', ... },
  timestamp: '2025-12-03T...'
}
```

---

## 10. Testing Strategy

### Unit Tests
- [ ] DETS record validation (license, DOB, score formats)
- [ ] Date validation (timezone, range checks)
- [ ] Data aggregation from multiple sources
- [ ] Error message generation

### Integration Tests
- [ ] End-to-end: certificate generation → DETS export → API submission
- [ ] Retry logic: transient failures → successful submission
- [ ] Batch processing: max record limits, pagination

### E2E Tests
- [ ] Student completes course → completion certificate awarded
- [ ] Admin generates DETS report → validates records
- [ ] Admin submits to DETS → receives confirmation
- [ ] Report history displays all previous submissions

### Security Tests
- [ ] Unauthorized admin cannot access DETS submissions
- [ ] Student data properly encrypted in transit
- [ ] API credentials not exposed in logs or errors

---

## 11. Deployment Steps

### Before Going Live
1. Obtain DETS API documentation & sandbox credentials
2. Test API connectivity with sample data
3. Deploy functions to staging environment
4. Test end-to-end workflow
5. Verify audit logging
6. Load test with 1000+ records
7. Document rollback procedure

### Deployment Commands
```bash
# Deploy DETS functions
firebase deploy --only functions:exportDETSReport,functions:submitDETSToState,functions:processPendingDETSReports

# Set environment config
firebase functions:config:set dets.api_key="xxx" dets.endpoint="https://..."

# Monitor logs
firebase functions:log --limit 50
```

### Post-Deployment
1. Verify functions deployed successfully
2. Monitor error logs for 24 hours
3. Test manual export on staging data
4. Confirm audit logs capturing DETS events
5. Schedule regular export (daily/weekly)

---

## 12. Next Steps (Immediate)

### Week 1: Research & Setup
- [ ] Request DETS API documentation from Ohio ODEW
- [ ] Obtain sandbox API credentials
- [ ] Document exact data requirements
- [ ] Set up environment variables

### Week 2: Implementation
- [ ] Build DETS service layer
- [ ] Create Cloud Functions
- [ ] Implement admin UI panel
- [ ] Write tests

### Week 3: Testing & Deployment
- [ ] Full integration testing
- [ ] Staging environment test
- [ ] Production deployment
- [ ] Monitor and support

---

## Appendix: Reference Information

### DETS Contact & Resources
- **Ohio Department of Education & Workforce (ODEW)**
  - Website: https://education.ohio.gov/
  - Driver Education: https://education.ohio.gov/Topics/Transportation
  - Contact: (to be filled in after research)

### Related OAC Rules
- **OAC Chapter 4501-7**: High School Driver Education Program
- Section 4501-7-05: Requirements for Driver Education Schools
- Section 4501-7-08: Curriculum & Instruction Requirements
- Section 4501-7-14: Record Keeping & Reporting Requirements

### Similar Implementations
- NHTSA state reporting systems
- DMV course completion tracking
- CMS education data exchange formats

