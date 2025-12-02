# Dependency Management

## Dependency Strategy

Guidelines for managing, updating, and securing project dependencies.

---

## Current Dependencies

### Frontend (`package.json`)

| Dependency | Version | Type | Purpose |
|-----------|---------|------|---------|
| react | 18.2.0 | Core | UI library |
| react-dom | 18.2.0 | Core | React rendering |
| react-router-dom | 6.20.0 | Framework | Routing |
| firebase | 10.7.1 | Backend | Firebase client SDK |
| @stripe/react-stripe-js | 5.4.0 | Payment | Stripe integration |
| recharts | 2.10.3 | UI | Charts/graphs |
| react-scripts | 5.0.1 | Build | Build tooling |

### Backend (`functions/package.json`)

| Dependency | Version | Type | Purpose |
|-----------|---------|------|---------|
| firebase-admin | 12.0.0 | Backend | Firebase Admin SDK |
| firebase-functions | 4.5.0 | Backend | Cloud Functions runtime |
| @google-cloud/logging | 10.0.0 | Operations | Cloud Logging |
| cors | 2.8.5 | Middleware | CORS handling |
| stripe | Latest | Payment | Stripe API |

---

## Dependency Security

### Vulnerability Scanning

**Weekly**:
```bash
# Check for vulnerabilities
npm audit

# Production dependencies only
npm audit --production

# Cloud Functions
cd functions
npm audit
```

**Expected Output** (all healthy):
```
0 vulnerabilities found
```

### Fixing Vulnerabilities

**Critical Vulnerabilities**:
1. Identify affected package: `npm audit` output
2. Check latest version: `npm view package-name versions`
3. Update package:
   ```bash
   npm install package-name@latest
   npm audit fix
   ```
4. Test thoroughly: `npm test`
5. Deploy immediately

**Moderate Vulnerabilities**:
1. Schedule for next release cycle
2. Update in weekly maintenance window
3. Test before deployment

**Low Vulnerabilities**:
1. Track in backlog
2. Update quarterly or with next major release

---

## Update Policy

### Patch Updates (1.0.0 → 1.0.1)

**Safety**: Very low risk  
**Frequency**: Immediately for security fixes  
**Testing**: Verify tests pass

```bash
# Update all patch versions
npm update

# Test
npm test
npm run build
```

### Minor Updates (1.0.0 → 1.1.0)

**Safety**: Low risk  
**Frequency**: Monthly or as needed  
**Testing**: Full test suite, manual verification

```bash
# Update to latest minor version
npm install package-name@latest

# Review changelog for breaking changes
npm run test
npm run build

# Test critical features manually
```

### Major Updates (1.0.0 → 2.0.0)

**Safety**: High risk (likely breaking changes)  
**Frequency**: Quarterly or as needed  
**Testing**: Extensive - full manual testing

```bash
# Major version updates require careful planning
# 1. Review changelog for breaking changes
# 2. Update in dev branch
# 3. Run full test suite
# 4. Test critical paths manually
# 5. Deploy to staging
# 6. User acceptance testing

# Update specific package
npm install package-name@2.0.0
```

**Breaking Change Examples**:
- API changes to key functions
- Configuration changes required
- Dependency removals
- File structure changes

---

## Dependency Versioning Strategy

### Fixed Versions (Current Strategy)

```json
{
  "dependencies": {
    "react": "18.2.0",
    "firebase": "10.7.1"
  }
}
```

**Advantages**:
- Predictable updates
- Explicit breaking change control
- Easy to track changes

**Disadvantages**:
- Manual updates required
- Security patches require manual intervention

### Caret Ranges (Allows Minor Updates)

```json
{
  "dependencies": {
    "react": "^18.2.0"
  }
}
```

- Allows 18.2.0 through 18.x.x (not 19.0.0)
- Automatic patch + minor updates
- Risk: Unexpected behavior changes

### Tilde Ranges (Allows Patch Updates)

```json
{
  "dependencies": {
    "react": "~18.2.0"
  }
}
```

- Allows 18.2.0 through 18.2.x (not 18.3.0)
- Very safe, security patches automatically applied
- Risk: Minimal

---

## Quarterly Update Cycle

### Month 1: Planning

- [ ] List all dependencies: `npm list`
- [ ] Check for updates: `npm outdated`
- [ ] Review changelogs for each outdated package
- [ ] Identify breaking changes
- [ ] Plan major updates for staging

### Month 2: Development

- [ ] Update in feature branch
- [ ] Test each update individually
- [ ] Fix any compatibility issues
- [ ] Run full test suite
- [ ] Deploy to staging
- [ ] User acceptance testing

### Month 3: Production

- [ ] If staging successful: Deploy to production
- [ ] Monitor error rates closely
- [ ] Quick rollback plan if needed
- [ ] Document any issues

---

## Specific Dependency Notes

### React (react, react-dom)

**Current**: 18.2.0 (Latest major)  
**Update Strategy**: Major version quarterly  
**Breaking Changes to Watch**: Hooks API changes, rendering changes

**Update Check**:
```bash
npm view react versions --json | tail -20
```

### Firebase SDK

**Frontend** (firebase): 10.7.1  
**Backend** (firebase-admin): 12.0.0  
**Update Strategy**: Monthly for security patches  
**Breaking Changes to Watch**: API deprecations, credential handling

### Stripe

**Current**: Latest via functions config  
**Update Strategy**: As needed, handle API versioning  
**Breaking Changes to Watch**: API endpoint changes

---

## Dependency Audit Checklist

**Monthly**:
- [ ] Run `npm audit`
- [ ] Check for new vulnerabilities
- [ ] Update critical security fixes
- [ ] Review outdated packages: `npm outdated`
- [ ] Plan quarterly major updates

**Quarterly**:
- [ ] Full dependency update cycle
- [ ] Test all updates in staging
- [ ] Deploy updates to production
- [ ] Monitor for issues

**Annually**:
- [ ] Review entire dependency tree
- [ ] Remove unused dependencies
- [ ] Consolidate similar packages
- [ ] Plan major framework updates

---

## Removing Unused Dependencies

**Identify unused packages**:
```bash
# List all dependencies
npm list

# Check if package is used in code
grep -r "from 'package-name'" src/

# If not found, package may be unused
```

**Remove unused packages**:
```bash
npm uninstall package-name
```

**Current unused packages**: None identified

---

## License Compliance

Verify all dependencies have acceptable licenses:

**Acceptable Licenses**:
- MIT
- Apache 2.0
- BSD
- ISC
- GPL (for open source projects)

**Verify**:
```bash
npm ls --depth=0 --json | grep license
```

---

## Dependency Lock Files

**Purpose**: Ensure consistent installs across environments

**Files**:
- `package-lock.json` (Frontend)
- `functions/package-lock.json` (Backend)

**Always commit** lock files to git:
```bash
git add package-lock.json
git add functions/package-lock.json
git commit -m "Update dependencies"
```

---

## Emergency Dependency Fixes

### Security Zero-Day

1. Check if your app is affected
2. If critical: Update immediately
3. Test thoroughly but quickly
4. Deploy as hotfix
5. Notify users if needed

### Breaking Change in Production

1. Identify which dependency caused issue
2. Immediately pin to previous working version:
   ```bash
   npm install package-name@X.Y.Z
   npm run build
   firebase deploy --only hosting
   ```
3. Post-incident: Plan upgrade strategy

---

**Last Updated**: December 2, 2025
