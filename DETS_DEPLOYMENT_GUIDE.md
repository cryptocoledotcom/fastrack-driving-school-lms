# DETS Integration Deployment & Testing Guide

**Last Updated**: December 3, 2025  
**Status**: Ready for Staging Deployment  
**Deployment Timeline**: 2-3 days (research + testing)

---

## Phase 1: DETS API Research & Setup (External - 2-3 hours)

### Step 1: Obtain DETS Documentation
**Contact Information**:
- **Ohio Department of Education and Workforce (ODEW)**
  - Phone: +1-614-466-9191
  - Website: https://education.ohio.gov/
  - Driver Education Coordinator: [to be identified]

**Required Documentation**:
- [ ] DETS API specification/documentation
- [ ] Authentication credentials (API key or certificate)
- [ ] Sandbox/test environment endpoint
- [ ] Production endpoint URL
- [ ] Rate limiting & batch size limits
- [ ] Error codes & response format
- [ ] Required data fields (may differ from our model)

### Step 2: Sandbox Environment Testing
Request sandbox access from ODEW:
- [ ] Sandbox API endpoint (e.g., `https://dets-sandbox.ohio.gov/api/v1`)
- [ ] Test API credentials
- [ ] Sample test records (optional)

### Step 3: Document Integration Specifications
Create a file: `DETS_API_SPECS.md` with:
```markdown
# DETS API Specifications (From ODEW)

## Endpoint
- Production: [URL from ODEW]
- Sandbox: [URL from ODEW]

## Authentication
- Method: [API Key / Certificate / OAuth]
- Header format: [Authorization: Bearer XXX]

## Data Format
- [Required fields from ODEW]
- [Optional fields]
- [Data type constraints]

## Submission Limits
- Max records per request: [from ODEW]
- Rate limit: [from ODEW]
- Batch frequency: [recommended by ODEW]

## Response Format
- Success: [sample from ODEW]
- Error: [sample from ODEW]

## Error Codes
- [List all error codes]
```

---

## Phase 2: Environment Configuration (15 minutes)

### Step 1: Add Environment Variables

Update `functions/.env.local`:
```env
DETS_API_ENDPOINT=https://dets.ohio.gov/api/v1
DETS_API_KEY=your_api_key_here
DETS_AUTH_METHOD=api_key
DETS_BATCH_SIZE=500
DETS_AUTO_SUBMIT=false  # Set to true after testing
```

### Step 2: Configure Firebase Secrets Manager

```bash
# Deploy to Firebase Secrets Manager
cd functions
npm install --save @google-cloud/secret-manager

# Set secrets (do NOT commit to repo)
firebase functions:config:set dets.api_key="YOUR_API_KEY"
firebase functions:config:set dets.endpoint="https://dets.ohio.gov/api/v1"
firebase functions:config:set dets.auth_method="api_key"
firebase functions:config:set dets.auto_submit="false"

# Verify secrets were set
firebase functions:config:get
```

### Step 3: Update Firestore Rules

```bash
# Apply DETS collection security rules
firebase deploy --only firestore:rules

# Verify rules deployed
firebase firestore:delete dets_reports --all --yes  # Optional: clear test data
```

---

## Phase 3: Staging Deployment (1 hour)

### Step 1: Deploy Cloud Functions

```bash
# Navigate to functions directory
cd functions

# Install dependencies (if not already done)
npm install

# Test functions locally (optional)
firebase emulators:start --only functions

# Deploy DETS functions to staging
firebase deploy --only functions:exportDETSReport,functions:submitDETSToState,functions:getDETSReports,functions:validateDETSRecord,functions:processPendingDETSReports

# Monitor deployment
firebase functions:log --limit 50

# Verify all functions deployed
firebase functions:list
```

### Step 2: Test Function Connectivity

In Firebase Console:
1. Go to **Cloud Functions**
2. Click `exportDETSReport`
3. **TESTING** tab
4. Execute with sample data:
```json
{
  "courseId": "fastrack-online",
  "startDate": null,
  "endDate": null,
  "studentIds": null
}
```

Expected response (should fail with "No eligible records" or generate valid report):
```json
{
  "recordCount": 0,
  "errorCount": 0,
  "status": "ready",
  "reportId": "abc123..."
}
```

---

## Phase 4: End-to-End Testing (2-3 hours)

### Scenario 1: Generate DETS Report (UI Test)

**Prerequisites**:
- Staging Firebase project with test data
- Test user account (admin or DMV admin role)
- At least one completed course enrollment

**Steps**:
1. Log in as admin
2. Navigate to **Admin Panel** → **DETS Export** tab
3. Select course: "Fastrack Online Course"
4. Leave date range empty (exports all)
5. Click **Generate & Export Report**
6. Verify:
   - [ ] Report generates successfully
   - [ ] "Report generated successfully!" message appears
   - [ ] Report appears in "Report History"
   - [ ] Status shows "ready"
   - [ ] Record count matches expected students

**Expected Result**:
- Report created in `dets_reports` collection
- Status: `ready`
- No validation errors

---

### Scenario 2: Validate Report Records

**Steps**:
1. Click on generated report to expand details
2. Verify **Validation Errors** section
3. If errors present, check:
   - [ ] Missing required fields indicated
   - [ ] Field names match DETS requirements
   - [ ] Error messages are clear

**Expected Result**:
- All records pass validation
- "Validation Errors" section empty or not displayed
- All 15 fields populated for each record

---

### Scenario 3: Submit to DETS API (Sandbox)

**Steps**:
1. In DETS Export tab, click report card to expand
2. Click **Submit to DETS** button
3. Monitor submission:
   - [ ] Button disabled during submission
   - [ ] Status updates to "submitted"
   - [ ] Submission date recorded
   - [ ] DETS response displayed

**Expected Result (with valid sandbox API)**:
- Status changes from "ready" to "submitted"
- Response shows: `{ "success": true, "code": "SUCCESS", ... }`
- Can view DETS API response in details

**Expected Result (without API configured)**:
- Status remains "ready" or shows as "error"
- Response shows: `{ "success": true, "code": "MOCK_RESPONSE", "message": "Mock DETS API response..." }`
- This is expected behavior for testing without real API

---

### Scenario 4: Export Report as CSV

**Steps**:
1. Click report card
2. Scroll to action buttons
3. Click **Download CSV**
4. Verify CSV download:
   - [ ] File downloads: `dets-report-{reportId}-{date}.csv`
   - [ ] Headers correct: Student ID, First Name, Last Name, etc.
   - [ ] Data rows match report records
   - [ ] Dates formatted correctly (YYYY-MM-DD)

**Expected Result**:
- CSV file downloads successfully
- Can open in Excel/Google Sheets
- All fields populated
- No encoding issues

---

### Scenario 5: Retry Failed Submission

**Steps**:
1. Simulate failure: Set invalid API endpoint in env vars
2. Click **Submit to DETS** → submission fails
3. Status changes to "error"
4. Click **Retry** button
5. Fix environment variables
6. Click **Retry** again
7. Monitor retry submission

**Expected Result**:
- Retry attempts counter increments
- On successful retry, status changes to "submitted"
- Error message cleared

---

### Scenario 6: Audit Logging

**Steps**:
1. Complete scenarios 1-5 above
2. Navigate to **Admin Panel** → **Audit Logs**
3. Filter by action: "DETS_REPORT_EXPORTED"
4. Verify audit entries:
   - [ ] DETS_REPORT_EXPORTED - record count logged
   - [ ] DETS_SUBMISSION_SUBMITTED - submission details logged
   - [ ] DETS_SUBMISSION_FAILED (if applicable) - error logged
   - [ ] User ID and timestamp correct
   - [ ] IP address captured

**Expected Result**:
- All DETS operations logged in audit trail
- Records immutable (cannot be modified/deleted)
- 3-year retention policy will apply

---

## Phase 5: Performance & Load Testing (Optional - 1 hour)

### Test Scenario: Large Batch Export

**Steps**:
1. Create test data with 500+ completed certificates
2. Export all records in one report
3. Monitor:
   - [ ] Export completes without timeout
   - [ ] All 500 records processed
   - [ ] No memory issues in Cloud Function logs
   - [ ] Response time < 30 seconds

**Expected Result**:
- Batch of 500 records processes successfully
- Report status: "ready"
- Ready for DETS submission

---

### Test Scenario: Concurrent Submissions

**Steps**:
1. Generate 5 different reports
2. Submit all 5 reports simultaneously
3. Monitor Cloud Function logs for:
   - [ ] No rate limiting issues
   - [ ] All submissions processed
   - [ ] No data corruption

**Expected Result**:
- All 5 reports submit successfully
- No conflicts or errors
- Audit logs show all submissions

---

## Phase 6: Production Deployment

### Pre-Deployment Checklist

- [ ] DETS API credentials obtained from ODEW
- [ ] Sandbox testing completed successfully
- [ ] All environment variables set in Firebase Secrets Manager
- [ ] Firestore security rules deployed
- [ ] Production Firebase project ready
- [ ] Backup existing data
- [ ] DETS API endpoint confirmed for production

### Deployment Steps

```bash
# 1. Deploy to production
firebase deploy --only functions -P production

# 2. Verify deployment
firebase functions:list -P production

# 3. Monitor logs
firebase functions:log -P production --limit 100

# 4. Enable automatic submissions (if ready)
firebase functions:config:set dets.auto_submit="true" -P production

# 5. Test with production data
# - Generate test report with 10-20 records
# - Submit and verify response
# - Check audit logs

# 6. Schedule automated daily exports
# processPendingDETSReports runs daily at 03:00 UTC
```

### Post-Deployment Monitoring

Monitor for first 24-48 hours:
- [ ] No error spikes in Cloud Function logs
- [ ] Audit logs recording all submissions
- [ ] DETS API responding successfully
- [ ] Firestore rules enforcing access control
- [ ] CSV exports working correctly

---

## Troubleshooting

### Issue: "DETS API connection failed"
**Solution**:
1. Verify API endpoint URL is correct
2. Check API key is valid and not expired
3. Verify firewall/network allows outbound HTTPS
4. Check DETS API status page

### Issue: "Invalid driver license format"
**Solution**:
1. Verify student profile has valid license
2. Check format: `XX######` (2 letters + 6 digits)
3. Update student profile with correct format

### Issue: "Record validation failed"
**Solution**:
1. Check required fields: firstName, lastName, dateOfBirth, driverLicense
2. Verify exam score >= 75%
3. Verify instruction time >= 1440 minutes
4. Review audit logs for specific errors

### Issue: "DETS submission stuck in 'submitted' state"
**Solution**:
1. Check DETS API response in report details
2. If response shows success but status not updated, refresh page
3. If issue persists, contact ODEW support with report ID

### Issue: "Cloud Function timeout (>60 seconds)"
**Solution**:
1. Reduce batch size: Set `DETS_BATCH_SIZE=250`
2. Optimize query: Filter by date range instead of all records
3. Enable scheduled function to process smaller batches

---

## Support & Contact

**For DETS API Issues**:
- Contact: Ohio Department of Education and Workforce
- Phone: +1-614-466-9191
- Website: https://education.ohio.gov/

**For System Issues**:
- Check Cloud Function logs: Firebase Console → Cloud Functions
- Review Firestore rules: Firebase Console → Firestore Security
- Audit log analysis: Admin Panel → Audit Logs

---

## Next Steps After Deployment

1. **Monitor Reports**:
   - Check weekly for any failed submissions
   - Address DETS errors promptly

2. **Student Communication**:
   - Inform students their data is being reported to state
   - Privacy policy may need update

3. **Record Retention**:
   - Ensure 3-year retention policy is active
   - Archive old reports as needed

4. **Compliance Verification**:
   - Obtain confirmation from ODEW that data received
   - Document submission confirmations for audit

5. **Continuous Improvement**:
   - Gather user feedback on DETS export feature
   - Optimize export frequency based on actual needs
   - Consider automating additional data fields

