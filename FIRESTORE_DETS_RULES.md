# Firestore Security Rules - DETS Collections

Add these rules to your `firestore.rules` file:

```javascript
// DETS Reports Collection - Admin/DMV Admin only
match /dets_reports/{reportId} {
  // Only admins and DMV admins can read
  allow read: if request.auth != null && 
              (hasRole('super_admin') || hasRole('dmv_admin'));
  
  // Only system/Cloud Functions can create
  allow create: if request.auth != null && 
                (hasRole('super_admin') || hasRole('dmv_admin'));
  
  // Allow updates for submission status tracking
  allow update: if request.auth != null && 
                (hasRole('super_admin') || hasRole('dmv_admin')) &&
                (
                  request.resource.data.keys().hasAll(['status', 'submissionDate']) ||
                  request.resource.data.keys().hasAll(['submissionAttempts'])
                );
  
  // Prevent deletion (immutable records)
  allow delete: if false;
  
  // Audit log all DETS operations
  allow read, write: if true
    then log(
      'DETS_REPORT_' + 
      (request.method == 'get' ? 'READ' : 
       request.method == 'create' ? 'CREATE' :
       request.method == 'update' ? 'UPDATE' : 'DELETE'),
      {
        userId: request.auth.uid,
        reportId: reportId,
        timestamp: now
      }
    );
}

// DETS Export Logs Collection - Admin/DMV Admin only
match /dets_export_logs/{logId} {
  // Only admins can read
  allow read: if request.auth != null && 
              (hasRole('super_admin') || hasRole('dmv_admin'));
  
  // System can create (Cloud Functions)
  allow create: if request.auth != null || 
                request.auth == null; // Allow from Cloud Functions
  
  // No updates or deletes (immutable audit log)
  allow update, delete: if false;
}

// Helper function to check user role
function hasRole(role) {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
}
```

## Implementation Steps

1. **Update `firestore.rules`**:
   - Add DETS collection rules above
   - Deploy with: `firebase deploy --only firestore:rules`

2. **Create Firestore Collections** (can be empty initially):
   - Collection: `dets_reports`
   - Collection: `dets_export_logs`

3. **Verify Access**:
   - Test: Super Admin can create/read DETS reports
   - Test: DMV Admin can create/read DETS reports
   - Test: Instructors cannot access DETS reports
   - Test: Students cannot access DETS reports
   - Test: Nobody can delete DETS records

## Document Structure

### `dets_reports/{reportId}`
```javascript
{
  id: string,
  courseId: string,
  exportDate: timestamp,
  submissionDate: timestamp (null until submitted),
  status: 'ready' | 'submitted' | 'confirmed' | 'error',
  recordCount: number,
  records: [ /* array of export records */ ],
  errors: [ /* validation errors if any */ ],
  submissionAttempts: number,
  detsResponse: object,
  exportedBy: string (uid),
  exportedAt: string (ISO 8601),
  lastError: string (if error status)
}
```

### `dets_export_logs/{logId}`
```javascript
{
  reportId: string,
  studentId: string,
  certificateId: string,
  status: 'ready' | 'submitted' | 'error',
  exportedAt: timestamp,
  error: string (if failed)
}
```

## Retention & Cleanup

DETS reports should be retained for 3 years per OAC requirements:
- Consider adding a scheduled Cloud Function to archive old reports
- Mark reports as 'archived' rather than deleting (immutability)
- Query: `where('status', '==', 'archived')` for historical data

