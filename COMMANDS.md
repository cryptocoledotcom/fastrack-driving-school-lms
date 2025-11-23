# Deployment Commands - Quick Copy-Paste

## Deploy Phase 2 to Staging

### One-Liner (PowerShell - use semicolons)
```bash
cd functions; npm install; cd ..; firebase deploy --only functions firestore:rules
```

### One-Liner (Bash/Git Bash - use &&)
```bash
cd functions && npm install && cd .. && firebase deploy --only functions firestore:rules
```

### Step-by-Step

**Step 1: Install Dependencies**
```bash
cd functions
npm install
cd ..
```

**Step 2: Deploy Functions**
```bash
firebase deploy --only functions
```

**Step 3: Deploy Firestore Rules**
```bash
firebase deploy --only firestore:rules
```

**Step 4: Verify Deployment**
```bash
firebase functions:list
```

---

## Verification Commands

### Check Syntax
```bash
cd functions && node -c index.js
```

### Check Linting
```bash
cd functions && npm run lint
```

### View Function Logs
```bash
firebase functions:log
```

### List All Functions
```bash
firebase functions:list
```

### Emulate Locally (Optional)
```bash
cd functions && npm run serve
```

---

## Firestore Testing Commands

### Query Audit Logs (Use Firebase Console)
1. Go to: https://console.firebase.google.com
2. Select your project
3. Firestore Database → auditLogs collection
4. View entries

### Check Immutability (Try to Delete - Will Fail)
```javascript
// In Firestore Console JavaScript console:
db.collection('complianceLogs').doc('any-id').delete()
// Expected: Permission denied error
```

---

## Debugging

### View Cloud Logs for Errors
```bash
firebase functions:log
```

### Check if Function Deployed
```bash
firebase functions:list | grep auditComplianceAccess
```

### Redeploy (If Needed)
```bash
firebase deploy --force
```

---

## Rollback (If Needed)

### Revert Firestore Rules to Previous Version
```bash
# Get previous version number
firebase firestore:indexes

# Deploy previous rules
firebase deploy --only firestore:rules
```

### Revert Functions
```bash
firebase deploy --only functions
```

---

## View Results

### Check Cloud Logging
1. Go to: https://console.cloud.google.com/logs
2. Filter: `compliance-audit-trail`
3. Look for certificate creation logs

### Query Firestore Audit Logs
1. Go to: Firebase Console → Firestore Database
2. Collection: `auditLogs`
3. Filter by `resource == "certificate"`

---

## Common Issues

### "Module not found"
```bash
cd functions && npm install
```

### "Permission denied on deploy"
```bash
firebase login
firebase deploy
```

### "Rules have errors"
Check `firestore.rules` for syntax errors, then:
```bash
firebase deploy --only firestore:rules
```

### "Function didn't deploy"
Check logs:
```bash
firebase functions:log
```

---

## All Commands in Order

```bash
# 1. Install dependencies
cd functions
npm install
cd ..

# 2. Check syntax
cd functions && node -c index.js

# 3. Check linting
npm run lint
cd ..

# 4. Deploy
firebase deploy --only functions firestore:rules

# 5. Verify
firebase functions:list

# 6. Check logs
firebase functions:log
```

---

## Need Help?

- **Syntax Error?** → `node -c functions/index.js`
- **Won't Deploy?** → `firebase functions:log`
- **Rules Error?** → Check `firestore.rules` lines 76-129
- **Can't connect?** → `firebase login`

