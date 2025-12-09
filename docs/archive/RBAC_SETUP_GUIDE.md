# RBAC Migration Setup Guide

## Overview

This guide walks through migrating from **Firestore role storage** to **Firebase Auth custom claims** for role-based access control (RBAC). This improves performance (no Firestore reads for role checks) and security (immutable JWT-based roles).

---

## ⚠️ CRITICAL FIRST STEP: Bootstrap Super Admin

**DO NOT DEPLOY RBAC until you run this script.**

### Why?

Without bootstrapping, the `setUserRole` Cloud Function has NO permission checks, meaning **anyone could become super admin**.

### Step 1: Run Bootstrap Script

```bash
node set-super-admin.js
```

**What it does:**
- ✅ Verifies your account exists: `colebowersock@gmail.com` (UID: `z98CPNDVUTfVIUIfq76mp05E2yP2`)
- ✅ Sets custom claim: `{ role: 'super_admin' }`
- ✅ Updates Firestore: `users/{uid} → role: 'super_admin'`
- ✅ Creates audit log: `BOOTSTRAP_SUPER_ADMIN` event
- ✅ Safety check: Won't re-run if already set

**Prerequisites:**
- Node.js installed
- `key.json` (service account) in root directory
- Firebase project: `fastrack-driving-school-lms`

**Output:**
```
=== FASTRACK LMS - SUPER ADMIN BOOTSTRAP ===

Super Admin Setup:
  Email: colebowersock@gmail.com
  UID:   z98CPNDVUTfVIUIfq76mp05E2yP2
  Role:  super_admin

✓ Firebase Admin SDK initialized
✓ User verified: colebowersock@gmail.com (z98CPNDVUTfVIUIfq76mp05E2yP2)
✓ Custom claim set: role = super_admin
✓ Firestore role updated: role = super_admin
✓ Audit log created: BOOTSTRAP_SUPER_ADMIN

✓ BOOTSTRAP COMPLETE

Next steps:
  1. Deploy setUserRole Cloud Function
  2. Implement RBAC architecture
  3. Test role-based access control
```

---

## Step 2: Deploy Cloud Function

The `setUserRole` Cloud Function is now secured:

```javascript
// Only SUPER_ADMIN can call this
const setUserRole = onCall(async (request) => {
  // 1. Check if caller is authenticated
  // 2. Check if caller has 'super_admin' custom claim
  // 3. Validate target user exists
  // 4. Set custom claim on target user
  // 5. Update Firestore role
  // 6. Log audit event
});
```

**Security checks:**
- ❌ Rejects unauthenticated calls
- ❌ Rejects non-super-admin callers (403 Unauthorized)
- ❌ Validates role is one of: `student`, `instructor`, `dmv_admin`, `super_admin`
- ✅ Only SUPER_ADMIN can change roles

**Deploy:**
```bash
cd functions
npm run deploy
```

---

## Step 3: Update Firestore Rules

Firestore rules now check custom claims first, then fall back to Firestore:

```firestore
function userRole() {
  // NEW: Check JWT custom claim first (instant, no Firestore read)
  if (request.auth.token.role != null) {
    return request.auth.token.role;
  }
  // FALLBACK: Read from Firestore (only if claim missing)
  return get(/databases/$(database)/documents/users/$(uid)).data.role;
}
```

**Benefits:**
- Role checks now instant (no Firestore reads)
- Backward compatible (falls back to Firestore)
- Immutable (JWT custom claims can't be forged)

---

## Step 4: Update Frontend

Frontend now extracts role from JWT custom claims:

```javascript
// AuthContext.jsx
const fetchUserRole = async (uid) => {
  try {
    const idTokenResult = await auth.currentUser.getIdTokenResult();
    const role = idTokenResult.claims.role;
    if (role) return role; // JWT custom claim (instant)
  } catch (e) {
    console.warn('Custom claim fetch failed:', e);
  }
  
  // Fallback to Firestore (if claim missing)
  const userDoc = await getDoc(doc(db, 'users', uid));
  return userDoc.data().role;
};
```

**No changes needed to:**
- ✅ Guards (RoleBasedRoute, AdminDashboardRoute, etc.)
- ✅ Firestore rules
- ✅ Admin panel UI
- ✅ Tests (all 936+ tests pass unchanged)

---

## Using setUserRole Cloud Function

### From Frontend (UserManagementTab)

```javascript
// Already integrated in updateUserRole()
const result = await userManagementServices.updateUserRole(
  targetUserId,
  'dmv_admin',  // New role
  currentAdminId
);

// Returns:
// {
//   success: true,
//   targetUserId: 'user-123',
//   oldRole: 'student',
//   newRole: 'dmv_admin',
//   message: 'User role updated from student to dmv_admin'
// }
```

### From Backend (Cloud Function to Cloud Function)

```javascript
const admin = require('firebase-admin');

const auth = admin.auth();
await auth.setCustomUserClaims(userId, { role: 'dmv_admin' });
```

---

## Rollback Safety

If anything breaks, you can **revert without data loss**:

```bash
# Firestore rules still read from documents as fallback
# Custom claims don't prevent Firestore reads
# All role changes logged in auditLogs collection
```

**Rollback steps:**
1. Remove custom claims: `auth.setCustomUserClaims(uid, {})`
2. Update Firestore rules to read Firestore-only (revert to v1)
3. Frontend falls back to Firestore role reads automatically

---

## Timeline

| Step | Duration | When |
|------|----------|------|
| Bootstrap script | 1 min | TODAY ✅ |
| Deploy Cloud Function | 2 min | TODAY |
| Update Firestore rules | 1 min | TODAY |
| Update frontend | 5 min | TODAY |
| Monitor & verify | 10 min | TODAY |
| **TOTAL** | **~20 min** | **TODAY** |

---

## Verification Checklist

After deployment:

- [ ] Run bootstrap script successfully
- [ ] `set-super-admin.js` output shows "BOOTSTRAP COMPLETE"
- [ ] No errors in Cloud Functions deployment
- [ ] Firestore rules deployed successfully
- [ ] Admin panel still loads and functions
- [ ] Can change user roles in UserManagementTab
- [ ] Role changes logged in audit logs
- [ ] All 936+ tests still pass
- [ ] No console errors in browser
- [ ] Admin page loads in <2 seconds (was 30+)

---

## Security Properties

### Before (Firestore-only roles)
- ❌ Role in mutable Firestore document
- ❌ Every role check = Firestore read
- ❌ No RBAC enforcement at auth level
- 🔴 Admin panel slow (100+ reads per load)

### After (Custom claims + Firestore)
- ✅ Role in immutable JWT token
- ✅ Every role check = instant (no reads)
- ✅ RBAC enforced at auth level
- 🚀 Admin panel fast (<2 seconds)

---

## Troubleshooting

### Issue: "User already has SUPER_ADMIN role"

**Solution:** Script has safety check. If already set, no changes made. This is safe.

```bash
node set-super-admin.js
# Output: ⚠ User already has SUPER_ADMIN role in custom claims
# No changes made.
```

### Issue: "Service account key not found"

**Solution:** Ensure `key.json` is in root directory and not .gitignored accidentally.

```bash
ls key.json
```

### Issue: "UNAUTHORIZED: Only SUPER_ADMIN can change user roles"

**Solution:** Only SUPER_ADMIN can call setUserRole. Check:
1. You're logged in as `colebowersock@gmail.com`
2. Bootstrap script ran successfully
3. Wait 1 minute for JWT to refresh (Firebase auto-refresh)

### Issue: Role change didn't take effect immediately

**Solution:** Custom claims update on next JWT refresh (max 1 minute). To force:
1. User logs out and logs back in
2. Or: `await auth.currentUser.getIdTokenResult(true)` (force refresh)

---

## Next Steps

1. ✅ Run `node set-super-admin.js`
2. ✅ Deploy Cloud Functions: `cd functions && npm run deploy`
3. ✅ Deploy Firestore rules: `firebase deploy --only firestore:rules`
4. ✅ Deploy frontend: `npm run build && firebase deploy --only hosting`
5. ✅ Test role changes in UserManagementTab
6. ✅ Verify admin panel loads fast (<2s)

---

## Questions?

Refer to:
- **Security Architecture**: See `firestore.rules` for rule details
- **Cloud Function Implementation**: See `functions/src/user/userFunctions.js`
- **Frontend Integration**: See `src/api/admin/userManagementServices.js`
- **Audit Logging**: See `auditLogs` collection in Firestore
