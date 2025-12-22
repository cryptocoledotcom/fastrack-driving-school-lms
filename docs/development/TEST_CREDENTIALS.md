# Test Credentials Management

## Overview

Test credentials are **never hardcoded** in documentation, codebase, or version control. This document explains how to securely access and manage test credentials for Fastrack LMS development and testing.

## Security Principles

✅ **DO:**
- Store credentials in secure credential manager (1Password, LastPass, Bitwarden)
- Use environment variables (`.env.test`, `.env.local`)
- Create temporary test accounts via Firebase Emulator UI
- Reference secure stores in documentation only
- Change test credentials regularly

❌ **DON'T:**
- Hardcode credentials in `.js`, `.jsx`, `.md` files
- Commit credentials to version control
- Share credentials in Slack, email, or unencrypted channels
- Reuse production credentials for testing
- Leave credentials in public documentation

## Setup Options Comparison

| Option | Cost | Setup Time | Auto-fill | Team Share | Best For |
|--------|------|-----------|-----------|-----------|----------|
| **Chrome Settings** | Free | 1 min | ✅ Yes | No | Easiest, solo developers |
| **Google Password Manager** | Free | 2 min | ✅ Yes | No | Mobile + Chrome sync |
| **1Password/LastPass** | $3-5/mo | 10 min | ✅ Yes | ✅ Yes | Teams with shared vault |
| **Environment Variables** | Free | 5 min | No | No | Developers who prefer .env |
| **Firebase Emulator UI** | Free | 1 min | No | No | Testing without credentials |

**Recommendation for Solo Development**: Chrome Settings (Option 1) - built-in, no setup needed

## Setup Options

### Option 1: Secure Credential Store (RECOMMENDED)

**For team members:**

1. **Use your preferred password manager:**
   - **Google Password Manager** (free, auto-saves with Chrome)
   - **Chrome Settings** (built-in, easiest)
   - 1Password
   - LastPass
   - Bitwarden
   - KeePass (open source)

2. **To store test credentials (Google/Chrome method):**
   - Open Chrome
   - Go to `Settings` → `Passwords and passkeys`
   - Click the `+` button (Add password)
   - Fill in:
     - **Website**: `https://localhost:3001` (or your dev URL)
     - **Username**: test admin/student email
     - **Password**: test password from team
   - Click `Save`
   - Done! Chrome will auto-fill on login page

3. **To use in development:**
   - Load login page at `localhost:3001`
   - Chrome auto-fills email/password (blue dropdown)
   - Press Enter to login
   - Never hardcode or write down passwords

### Option 2: Environment Variables

**For local development:**

1. **Copy template:**
   ```bash
   cp .env.test.example .env.test
   ```

2. **Edit `.env.test`** with your credentials:
   ```
   # Test Accounts (do NOT commit this file)
   TEST_ADMIN_EMAIL=your_admin_email@example.com
   TEST_ADMIN_PASSWORD=your_secure_password
   TEST_STUDENT_EMAIL=your_student_email@example.com
   TEST_STUDENT_PASSWORD=your_secure_password
   ```

3. **Load in your scripts:**
   ```javascript
   // In test files
   const adminEmail = process.env.TEST_ADMIN_EMAIL;
   const adminPassword = process.env.TEST_ADMIN_PASSWORD;
   ```

4. **Ensure `.env.test` is in `.gitignore`** (already configured)

### Option 3: Firebase Emulator UI (BEST FOR TESTING)

**For local emulator testing:**

1. **Start emulators:**
   ```bash
   firebase emulators:start
   ```

2. **Open Firestore UI:**
   - Go to http://localhost:4000

3. **Create temporary test accounts:**
   - Click "Auth" tab
   - Click "Add user" button
   - Fill in email and password
   - These accounts exist only in emulator (safe to use any password)

4. **Use in tests/development:**
   ```bash
   # E2E tests automatically use emulator credentials
   npm run test:e2e
   ```

**Advantages:**
- ✅ Isolated to local environment
- ✅ No risk of leaking credentials
- ✅ Fast account creation
- ✅ Test any role/permissions
- ✅ Reset by restarting emulator

## Using Credentials in Code

### For E2E Tests

```javascript
// ✅ CORRECT: Use environment variables
const email = process.env.TEST_STUDENT_EMAIL;
const password = process.env.TEST_STUDENT_PASSWORD;

await page.fill('[name="email"]', email);
await page.fill('[name="password"]', password);
```

```javascript
// ❌ WRONG: Hardcoded credentials
await page.fill('[name="email"]', 'cole@fastrackdrive.com');
await page.fill('[name="password"]', 'B0w3r$0ckC013');
```

### For Unit Tests

```javascript
// ✅ CORRECT: Mock authentication
vi.mock('../config/firebase', () => ({
  auth: { currentUser: { uid: 'test-uid-123' } }
}));

// Or use test user ID from environment
const testUserId = process.env.TEST_USER_ID || 'test-uid-123';
```

### For Development/Manual Testing

1. **Use Firebase Emulator UI** to create temporary accounts
2. **Or ask team lead** for test account credentials from secure store
3. **Never share credentials in messages/chat**

## Emulator Seed Script

The `scripts/seed-emulator.cjs` script creates test accounts automatically:

```bash
node scripts/seed-emulator.cjs
```

**What it creates:**
- Super Admin account (see emulator console output)
- Student account (see emulator console output)
- Instructor account
- Sample courses and content

**Note**: Credentials are printed to console during setup, never stored in version control.

## CI/CD Pipeline

**GitHub Actions** stores credentials securely as repository secrets:

```yaml
# In GitHub Actions workflow
- name: Run E2E Tests
  env:
    TEST_ADMIN_EMAIL: ${{ secrets.TEST_ADMIN_EMAIL }}
    TEST_ADMIN_PASSWORD: ${{ secrets.TEST_ADMIN_PASSWORD }}
  run: npm run test:e2e
```

**Setup:**
1. Go to repo Settings → Secrets and variables → Actions
2. Add secrets: `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`, etc.
3. Reference in workflow with `${{ secrets.SECRET_NAME }}`

## Rotating Credentials

**When to rotate:**
- Team member leaves project
- Credentials suspected compromised
- Regular security review (quarterly recommended)
- After major security incident

**How to rotate:**
1. Update credentials in secure credential store
2. Notify all team members
3. Update CI/CD secrets in GitHub
4. If needed, change password in Firebase Console
5. Update `.env.test.example` documentation (if generic example)

## Troubleshooting

**Q: I don't have test credentials**
A: Ask your team lead to provide access to the secure credential store. They can create a new account or grant you access to existing ones.

**Q: Tests fail with authentication error**
A: Check that:
1. Environment variables are set correctly: `echo $TEST_ADMIN_EMAIL`
2. Firebase Emulator is running (if using local emulator)
3. Credentials are correct in secure store
4. Account hasn't been deleted/disabled

**Q: I accidentally committed a password**
A: Immediately:
1. Change the password in Firebase Console
2. Remove from git history: `git rm --cached .env.test`
3. Run `git filter-branch` or use BFG Repo Cleaner
4. Notify team lead of potential exposure

**Q: How do I use different credentials for different tests?**
A: Create separate `.env` files:
```bash
.env.test.admin    # Admin test credentials
.env.test.student  # Student test credentials
.env.test.instructor  # Instructor test credentials
```

Then load based on test context:
```javascript
if (testContext === 'admin') {
  require('dotenv').config({ path: '.env.test.admin' });
}
```

## References

- [1Password Teams Setup](https://support.1password.com)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Firebase Security Best Practices](https://firebase.google.com/docs/database/security)
- [OWASP: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
