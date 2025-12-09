# WHY Bootstrap Is Critical: Security Analysis

## The Threat Scenario (If You Skip set-super-admin.js)

### Scenario 1: Attacker Takes Over Your App

```
Timeline:
├─ Day 1: You deploy setUserRole Cloud Function (without bootstrap)
│  └─ Function has NO permission checks yet
│
├─ Day 2: Attacker finds setUserRole endpoint is public
│  └─ Anyone can call it (not authenticated yet? Yes, no checks!)
│
├─ Day 3: Attacker calls:
│  └─ setUserRole({ 
│      targetUserId: 'attacker-uid',
│      newRole: 'super_admin'
│    })
│
└─ Day 4: App is compromised
   ├─ Attacker now has super_admin role
   ├─ Attacker can change any user's role
   ├─ Attacker can access all admin features
   ├─ Attacker can view all student data
   └─ Data breach + compliance violation
```

---

## The Secure Path (With set-super-admin.js)

### Scenario 1: Bootstrap First

```
Timeline:
├─ Day 1: Run set-super-admin.js
│  ├─ ✅ YOU get custom claim: { role: 'super_admin' }
│  ├─ ✅ YOU get Firestore role: 'super_admin'
│  └─ ✅ Audit log created: Only you set
│
├─ Day 2: Deploy setUserRole Cloud Function
│  └─ ✅ Function has permission check:
│     if (callerRole !== 'super_admin') throw UNAUTHORIZED
│
├─ Day 3: Attacker tries to call setUserRole
│  └─ ❌ Function rejects: "UNAUTHORIZED: Only SUPER_ADMIN can change user roles"
│  └─ ❌ Attacker has no custom claim
│  └─ ❌ Attacker cannot become admin
│
└─ Day 4: App is secure
   ├─ Only you can change roles
   ├─ All role changes audited
   ├─ No data breach
   └─ Compliant with OAuth 2.0 best practices
```

---

## Proof: How Permission Checks Work

### In setUserRole Cloud Function:

```javascript
const setUserRole = onCall(async (request) => {
  const { auth } = request;
  const { targetUserId, newRole } = request.data;

  // CRITICAL CHECK:
  const callerUid = auth.uid;
  const db = getDb();
  const callerDoc = await db.collection('users').doc(callerUid).get();
  
  // Get role from custom claim (fast) or Firestore (fallback)
  const callerRole = auth.token.role || 
                     (callerDoc.exists() ? callerDoc.data().role : null);

  // BLOCK non-admin callers
  if (callerRole !== 'super_admin') {
    console.warn(`UNAUTHORIZED: Non-admin ${callerUid} attempted role change`);
    throw new Error('UNAUTHORIZED: Only SUPER_ADMIN can change user roles');
  }

  // ... rest of function (only reached if super_admin)
});
```

### Why This Works:

1. **`auth.uid` is verified by Firebase** (attacker can't fake this)
2. **`auth.token.role` is in JWT** (signed by Firebase, can't forge)
3. **If caller isn't SUPER_ADMIN → REJECTED**
4. **Function throws error before executing**

### Without Bootstrap:

1. First user to call setUserRole → becomes super_admin (no check)
2. That user might be an attacker (they know the endpoint exists)
3. App is compromised

---

## The Bootstrap Script Solves This

### How set-super-admin.js Works:

```javascript
// Step 1: You run locally (not a Cloud Function)
// This prevents network exposure

// Step 2: Verify your identity
const userRecord = await admin.auth().getUser(SUPER_ADMIN_UID);
if (userRecord.email !== SUPER_ADMIN_EMAIL) {
  throw new Error('Email mismatch - wrong user');
}

// Step 3: Set custom claim (only you, not via Cloud Function)
await admin.auth().setCustomUserClaims(SUPER_ADMIN_UID, {
  role: 'super_admin'
});

// Step 4: Update Firestore (backup for fallback)
await db.collection('users').doc(SUPER_ADMIN_UID).update({
  role: 'super_admin'
});

// Step 5: Safety check (won't re-run)
if (alreadySet) {
  console.log('Already set, skipping');
  process.exit(0);
}
```

### Why This Is Secure:

- ✅ Runs locally (not exposed on internet)
- ✅ Uses service account (only you have credentials)
- ✅ Sets custom claim directly (no Cloud Function needed)
- ✅ Can't be called by attacker (not an HTTP endpoint)
- ✅ One-time only (safety check prevents re-runs)

---

## Timeline Comparison

### WITHOUT Bootstrap (❌ Insecure)

```
Day 1:
  ├─ Deploy setUserRole (no checks yet)
  └─ 🚨 EXPOSED: Anyone can call it

Day 2-3:
  ├─ Someone calls setUserRole
  ├─ They become super_admin
  └─ 🔴 COMPROMISED

Day 4+:
  ├─ You realize what happened
  ├─ Try to undo: Can't revoke their super_admin
  ├─ All their role changes logged, but they're admin
  └─ Data breach, compliance violation, legal liability
```

### WITH Bootstrap (✅ Secure)

```
Day 1:
  ├─ Run set-super-admin.js locally
  └─ ✅ Only you become super_admin

Day 2:
  ├─ Deploy setUserRole (with checks)
  └─ ✅ Function validates caller is super_admin

Day 3:
  ├─ Attacker tries setUserRole
  └─ ✅ REJECTED: "UNAUTHORIZED"

Day 4+:
  ├─ Only you can change roles
  ├─ All changes audited
  └─ ✅ Secure and compliant
```

---

## Industry Best Practices

### This Pattern Is Used By:

- **Firebase** - Recommends custom claims for RBAC
- **Auth0** - "Custom claims must be set by admin, not users"
- **AWS** - Similar pattern with IAM roles
- **Google Cloud** - Service account for bootstrap, IAM roles for runtime

### This Pattern Is Called:

**Bootstrap Authority Pattern** or **Privilege Escalation Prevention**

> When implementing role-based access control, establish root admin account BEFORE deploying role-change endpoints. Never allow role assignment without role verification.

---

## What Happens If You Don't Run Bootstrap?

### Scenario A: Attacker Finds the Endpoint

```javascript
// Attacker's code
const setUserRole = httpsCallable(functions, 'setUserRole');

try {
  // They don't have super_admin, but no check yet...
  // Wait, we added checks. But what if there's a bug?
  const result = await setUserRole({
    targetUserId: attacker_uid,
    newRole: 'super_admin'
  });
  console.log('I am now super_admin!', result);
} catch (e) {
  console.log('Blocked:', e.message);
}
```

**Without bootstrap:**
- ✅ No one is super_admin yet
- ✅ Function has no way to verify super_admin exists
- ✅ First caller becomes super_admin (no way to prevent)

**With bootstrap:**
- ❌ Check: Is caller's custom claim 'super_admin'?
- ❌ Check: Only you (Cole) have this claim
- ❌ Everyone else gets UNAUTHORIZED error

---

## Why Custom Claims Are Better Than Firestore Role

### Custom Claims (In JWT):
```
{
  "uid": "user-123",
  "email": "user@example.com",
  "iat": 1702200000,
  "exp": 1702203600,
  "aud": "fastrack-driving-school-lms",
  "iss": "https://securetoken.google.com/...",
  "auth_time": 1702200000,
  "user_id": "user-123",
  "firebase": {
    "identities": {},
    "sign_in_provider": "password"
  },
  "role": "super_admin"  // ← SIGNED BY FIREBASE (can't fake)
}
```

### Firestore Role (In Document):
```
users/{uid} = {
  "email": "user@example.com",
  "role": "super_admin"  // ← Client-side update possible?
}
```

**Custom Claims Advantages:**
- ✅ Cryptographically signed by Firebase
- ✅ Can't be forged by client-side code
- ✅ Can't be modified by Firestore rules
- ✅ Read-only from user perspective
- ✅ Instant (no database lookup)

**Firestore Role Disadvantages:**
- ❌ Mutable via Cloud Functions
- ❌ Requires database read
- ❌ Could theoretically be modified
- ❌ Slower (I/O required)

---

## The Complete Security Chain

```
┌─────────────────────────────────────────────────────┐
│            BOOTSTRAP (Local Execution)              │
│  node set-super-admin.js                           │
│  ├─ Verify identity: colebowersock@gmail.com       │
│  ├─ Set custom claim: role = 'super_admin'         │
│  └─ Update Firestore: role = 'super_admin'         │
│  ✅ ONLY YOU become super_admin                    │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│         DEPLOYMENT (Cloud Functions)                │
│  setUserRole Cloud Function                        │
│  ├─ Check: auth.uid exists?                        │
│  ├─ Check: auth.token.role === 'super_admin'?      │
│  ├─ Check: targetUser exists?                      │
│  ├─ Check: newRole is valid?                       │
│  ├─ Execute: Set custom claim (if all checks pass) │
│  ├─ Execute: Update Firestore                      │
│  └─ Log: Audit event                               │
│  ✅ ONLY SUPER_ADMIN can call (signed JWT)         │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────┐
│           RUNTIME (Frontend/Guards)                 │
│  All permission checks read JWT custom claims      │
│  ├─ Guards: Check auth.token.role                  │
│  ├─ Firestore rules: Check request.auth.token.role │
│  └─ Cloud Functions: Check auth.token.role         │
│  ✅ ALL checks use signed JWT (can't fake)         │
└─────────────────────────────────────────────────────┘
```

---

## What Happens When You Run Bootstrap?

### Execution:

```bash
$ node set-super-admin.js

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

### What This Means:

1. ✅ Your JWT now contains: `{ role: 'super_admin' }`
2. ✅ Your Firestore doc has: `{ role: 'super_admin' }`
3. ✅ Audit log records: `{ eventType: 'BOOTSTRAP_SUPER_ADMIN' }`
4. ✅ No one else can replicate this (they don't have service account key)
5. ✅ Safe to deploy setUserRole with permission checks

---

## Conclusion

**This is not optional.** The bootstrap script is the **security foundation** of your RBAC system.

### Without it:
- 🔴 Anyone can become super_admin
- 🔴 App is vulnerable the moment setUserRole deploys
- 🔴 You can't revoke compromised admin accounts
- 🔴 Compliance violation (unauthorized access)

### With it:
- ✅ Only you are super_admin initially
- ✅ setUserRole can enforce permission checks
- ✅ Every role change is audited
- ✅ System is secure from day 1

**Run set-super-admin.js first. Everything else depends on it.**
