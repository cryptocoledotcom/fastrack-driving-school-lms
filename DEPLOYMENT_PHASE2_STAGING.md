# Phase 2 Staging Deployment - Quick Start

## What's Completed

✅ **Firestore Rules** - Compliance records now immutable (can't delete/modify)  
✅ **Cloud Logging** - All certificate creation logged for audit trail  
✅ **Audit Function** - New `auditComplianceAccess()` available  
✅ **Syntax & Lint** - All code verified and passing  

## Deploy to Staging (5 minutes)

### 1. Install Dependencies
```bash
cd functions
npm install
cd ..
```

### 2. Deploy Cloud Functions
```bash
firebase deploy --only functions
```

**Wait for**: ✓ functions deployed successfully

### 3. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

**Wait for**: ✓ firestore:rules deployed successfully

### 4. Verify Deployment
```bash
firebase functions:list
firebase functions:log
```

**Look for**:
- ✓ `createCheckoutSession`
- ✓ `createPaymentIntent`
- ✓ `stripeWebhook`
- ✓ `generateCertificate`
- ✓ `auditComplianceAccess` (NEW)

---

## Test Phase 2 in Staging

### Test 1: Try to Delete a Compliance Log (Should Fail)
```javascript
// In Firestore Console or SDK
db.collection('complianceLogs').doc('any-log-id').delete()
// Result: ❌ Permission denied (EXPECTED)
```

### Test 2: Generate a Certificate (Should Log to Audit Trail)
1. Go to staging app UI
2. Enroll in course
3. Complete course + payment
4. Generate certificate
5. Check Cloud Logs (Console → Logs → `compliance-audit-trail`)
6. Should see: `[CREATE] certificate: cert-xxxxx - SUCCESS`

### Test 3: Check Audit Logs Collection
```javascript
// Query audit logs
db.collection('auditLogs')
  .where('resource', '==', 'certificate')
  .limit(5)
  .get()
// Result: ✅ Should see recent certificate creation logs
```

---

## What Was Changed

| File | Change |
|------|--------|
| `firestore.rules` | Added immutable rules for complianceLogs, quizAttempts, identityVerifications, certificates, complianceSessions |
| `functions/index.js` | Added logAuditEvent() helper + auditComplianceAccess() function + audit logging to certificate generation |
| `functions/package.json` | Added @google-cloud/logging dependency |

---

## Files Modified (For Code Review)

1. **firestore.rules** - Lines 76-129
   - New compliance collection security rules
   - Helper functions: isAdmin(), isInstructor()

2. **functions/index.js** - Lines 14, 23, 38-72, 566-583, 606-634
   - Cloud Logging import
   - logAuditEvent() helper function
   - Audit logging in generateCertificate()
   - New auditComplianceAccess() Cloud Function

3. **functions/package.json** - Line 18
   - @google-cloud/logging dependency

---

## Next Steps

### Before Production
- [ ] Test all 3 tests above in staging
- [ ] Verify audit logs in Cloud Console
- [ ] Confirm immutable rules working
- [ ] Begin Phase 3 (Compliance Reporting)

### Phase 3 (Next Week)
- Create `generateComplianceReport()` function
- Support CSV/JSON/PDF exports
- Test with sample student data

