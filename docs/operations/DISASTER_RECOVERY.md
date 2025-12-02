# Disaster Recovery Plan

## Business Continuity Strategy

Complete procedures for recovering from disasters while minimizing downtime and data loss.

**RTO** (Recovery Time Objective): 4 hours  
**RPO** (Recovery Point Objective): 1 hour

---

## Backup Strategy

### Firestore Automated Backups

**Frequency**: Daily at 2 AM UTC  
**Retention**: 30 days  
**Location**: Google Cloud Storage (automatic)

**Verify Backups**:
```bash
# Via Firebase Console
Firestore Database → Backups

# Via gcloud CLI
gcloud firestore backups list --project=fastrack-driving-school-lms
```

### Manual Backup (Before Major Changes)

```bash
# Export Firestore data
gcloud firestore export gs://fastrack-backups/backup-$(date +%Y%m%d-%H%M%S)

# Backup Cloud Functions code
git tag backup-$(date +%Y%m%d-%H%M%S)
git push origin --tags

# Backup .env file (store securely, not in code)
# Keep in secure password manager
```

### Configuration Backups

- Firebase project settings
- Firestore security rules: `firestore.rules`
- Firebase index definitions: `.firebaserc`
- Cloud Functions deployment config: `firebase.json`

---

## Disaster Scenarios & Recovery

### Scenario 1: Data Corruption

**Detection**: Data appears invalid, user complaints of missing data

**Recovery Steps**:
1. **Stop accepting new data** (if critical)
2. **Identify affected collections** in Firestore
3. **Locate clean backup**: 
   ```bash
   gcloud firestore backups list --project=fastrack-driving-school-lms
   ```
4. **Restore from backup**:
   ```bash
   gcloud firestore restore gs://fastrack-backups/backup-YYYYMMDD-HHMMSS \
     --project=fastrack-driving-school-lms
   ```
5. **Verify data integrity**: Spot-check collections
6. **Notify affected users**: Send notification about data recovery

**Prevention**:
- Firestore security rules prevent invalid data
- Field validation in Cloud Functions
- Regular backup verification
- Read-only mode for backups (prevent modification)

---

### Scenario 2: Cloud Functions Failure

**Detection**: Functions return errors or timeout

**Recovery Steps**:
1. **Check function logs**:
   ```bash
   firebase functions:log --lines 100
   ```
2. **Identify affected function**
3. **Redeploy from previous working version**:
   ```bash
   git checkout <previous-working-commit>
   cd functions
   npm run deploy
   ```
4. **Verify function operational**:
   ```bash
   firebase functions:list
   ```
5. **Monitor for errors**: `firebase functions:log --follow`

**Prevention**:
- Test all changes locally before deployment
- Use Cloud Functions versioning
- Keep previous version tags in git
- Gradual rollout to small traffic percentage

---

### Scenario 3: Firebase Authentication Down

**Detection**: Users cannot login

**Recovery Steps**:
1. **Check Firebase status**: https://status.firebase.google.com
2. **Check project status**: Firebase Console → Notifications
3. **If temporary**: Notify users, wait for restoration
4. **If prolonged (> 1 hour)**:
   - Implement fallback authentication (if available)
   - Notify affected users
   - Provide estimated recovery time

**Prevention**:
- Use Firebase as primary (highly available)
- Monitor auth endpoints for timeouts
- Have communication plan ready

---

### Scenario 4: Database Quota Exceeded

**Detection**: Firestore operations start failing with quota errors

**Recovery Steps**:
1. **Check Firestore usage**: Firebase Console → Firestore → Stats
2. **Identify heavy operations**:
   - Most read-intensive queries
   - Most write-intensive operations
3. **Optimize queries**:
   - Add composite indexes
   - Filter early in queries
   - Reduce data retrieved
4. **If immediate relief needed**:
   - Temporarily disable non-critical features
   - Request quota increase: Firebase Console → Quotas
5. **Implement caching**: Cache frequently accessed data

**Prevention**:
- Monitor daily quota usage
- Set up alerts: Usage > 80%
- Implement query caching
- Use batch operations

---

### Scenario 5: Storage Quota Exceeded

**Detection**: Cannot store new files or backups failing

**Recovery Steps**:
1. **Check Cloud Storage usage**: Firebase Console → Storage → Files
2. **Identify large files**:
   - Old certificates (if storing as files)
   - Temporary files
3. **Clean up old data**:
   ```bash
   # Delete files older than 90 days (if applicable)
   ```
4. **Request storage increase**: Firebase Console → Billing
5. **Archive old data**: Move historical data to cheaper cold storage

**Prevention**:
- Monitor storage usage weekly
- Set retention policies
- Archive old data automatically
- Regular cleanup schedules

---

### Scenario 6: Frontend Deployment Issue

**Detection**: Website not loading, build failed

**Recovery Steps**:
1. **Check deployment status**: Firebase Hosting → Deployments
2. **Identify failed deployment**
3. **Rollback to previous version**:
   ```bash
   # See previous deployments
   firebase hosting:channel:list
   
   # Redeploy previous version
   git checkout <previous-commit>
   npm run build
   firebase deploy --only hosting
   ```
4. **Verify site loads**: https://fastrack-xxx.web.app
5. **Monitor for issues**: Check browser console for errors

**Prevention**:
- Test build locally before deployment
- Use staging environment for testing
- Keep git history clean for easy rollback
- Tag releases: `git tag v1.0.0`

---

### Scenario 7: Security Breach

**Detection**: Unauthorized access detected, data exfiltration suspected

**Recovery Steps** (IMMEDIATE):
1. **Secure infrastructure**:
   - Rotate all API keys: Stripe, Firebase service account
   - Reset admin passwords
   - Revoke compromised access tokens
2. **Contain the breach**:
   ```bash
   # Disable user accounts if compromised
   # Temporarily disable payments if payment data at risk
   # Activate read-only mode if needed
   ```
3. **Investigate**:
   - Review audit logs for unauthorized access
   - Check access tokens and sessions
   - Identify when breach occurred
4. **Notify users** (if required by law):
   - Send security notification
   - Recommend password changes
   - Provide support resources
5. **Patch vulnerability**:
   - Update security rules
   - Patch code vulnerability
   - Redeploy with fix
6. **Monitor closely**: Watch for signs of re-entry

**Prevention**:
- Implement security checklist (SECURITY_CHECKLIST.md)
- Regular security audits
- Use strong API keys and secrets management
- Implement rate limiting on auth endpoints
- Monitor for suspicious activity

---

## Recovery Procedures

### Full System Restore (Last Resort)

**Use only if all other recovery methods fail**

**Timeline**: 8-12 hours

**Steps**:
1. **Request complete database restore**:
   - Contact Google Cloud support
   - Provide backup timestamp
   - Verify backup integrity
2. **Redeploy infrastructure**:
   ```bash
   firebase deploy --only hosting,functions,firestore:rules
   ```
3. **Verify all services**: Check each major feature
4. **Gradual rollout**: Redirect 10% traffic initially
5. **Monitor heavily**: Watch for issues
6. **Communicate with users**: Notify of recovery

---

## Communication Plan

### During Incident

**Immediately**:
- [ ] Assess severity
- [ ] Estimate recovery time
- [ ] Post status update if public-facing

**Per 30 minutes**:
- [ ] Update recovery status
- [ ] Post progress updates
- [ ] Manage expectations

### After Resolution

- [ ] Detailed incident report
- [ ] Root cause analysis
- [ ] Action items for prevention
- [ ] Share lessons learned

### Communication Channels

- **Primary**: Affected users (email if data loss)
- **Status Page**: If public status page exists
- **Support**: Direct support inquiries to team
- **Documentation**: Update runbooks after incident

---

## Recovery Testing

### Monthly Recovery Drill

Test restore procedures without affecting production:

```bash
# 1. Restore from backup to separate project (dev)
gcloud firestore restore gs://fastrack-backups/latest-backup \
  --project=fastrack-dev-lms

# 2. Test all major functions work
firebase --project=fastrack-dev-lms functions:log

# 3. Verify data integrity
# - Check collection counts
# - Verify sample documents
# - Test critical queries

# 4. Document any issues
# - Recovery time actual vs target
# - Issues encountered
# - Improvements needed

# 5. Clean up test restore
# Delete test restore after verification
```

---

## Disaster Recovery Checklist

**Before Launch**:
- [ ] Automated backups configured: Firestore
- [ ] Backup retention verified: 30+ days
- [ ] Manual backup procedure documented
- [ ] Restore procedure tested
- [ ] RTO/RPO defined and documented
- [ ] Communication plan created
- [ ] Key contacts identified
- [ ] Recovery tools accessible

**Monthly**:
- [ ] Backup verification: Backups exist and valid
- [ ] Recovery drill: Test restore procedure
- [ ] Documentation update: Keep procedures current
- [ ] Team training: Ensure knowledge of procedures

**Annually**:
- [ ] Full disaster recovery test
- [ ] Update RTO/RPO if needed
- [ ] Review communication plan
- [ ] Train new team members (if applicable)

---

**Last Updated**: December 2, 2025
