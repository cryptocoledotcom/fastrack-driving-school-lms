# Production Deployment Checklist

**CRITICAL:** Do NOT deploy to production unless all items are completed and verified.

---

## Pre-Deployment Requirements

### Code Quality
- [ ] All tests passing: `npm test`
- [ ] No ESLint warnings: `npx eslint src/`
- [ ] No console.log or debug code
- [ ] No hardcoded secrets or credentials
- [ ] Code reviewed by at least one other developer

### Testing
- [ ] Manual test cases all passing (see `docs/testing/MANUAL_TEST_CASES.md`)
- [ ] Error scenarios tested (see `docs/testing/ERROR_SCENARIOS.md`)
- [ ] Load testing verified (see `docs/testing/LOAD_TEST_GUIDE.md`)
- [ ] Staging deployment successful for 24+ hours
- [ ] No unresolved bugs in staging

### Environment
- [ ] Production Firebase project configured
- [ ] Production environment variables set
- [ ] Database backups configured
- [ ] Logging enabled
- [ ] Error tracking (Sentry/equivalent) configured
- [ ] Analytics enabled

### Security
- [ ] `.gitignore` includes all secrets (serviceAccountKey.json, .env files)
- [ ] No credentials in repository history
- [ ] Firebase security rules reviewed and locked down
- [ ] Authentication properly enforced
- [ ] No console errors about missing auth
- [ ] SSL/HTTPS configured
- [ ] CORS properly configured

### Documentation
- [ ] All docs updated and current
- [ ] Deployment steps documented
- [ ] Rollback procedure documented
- [ ] Team trained on monitoring
- [ ] Support process documented

---

## Pre-Deployment Sign-Off

**Development Team:**
- [ ] Code ready: _______________ (Developer Name)
- [ ] Testing complete: _______________ (QA/Tester Name)

**Operations/DevOps:**
- [ ] Infrastructure ready: _______________ (DevOps Name)
- [ ] Monitoring configured: _______________ (DevOps Name)

**Business/Product:**
- [ ] Feature approved: _______________ (Product Owner Name)
- [ ] Legal/Compliance checked: _______________ (Compliance Name)

---

## Deployment Steps

### Step 1: Final Verification

```bash
# 1. Verify nothing else is being deployed
git status
# Should be: "On branch main, nothing to commit"

# 2. Tag release
git tag -a v1.0.0-production -m "Production release - Phase 2 complete"
git push origin v1.0.0-production

# 3. Final build
npm run build

# 4. Test build locally
npm install -g serve
serve -s build
# Manually verify at localhost:3000
```

### Step 2: Deploy Production

```bash
# Option A: Firebase Hosting
firebase deploy --only hosting:fastrack-prod

# Option B: Manual deployment
# Copy build/ to production server
# Run deploy/restart scripts
```

### Step 3: Verify Production

```bash
# 1. Check site is live
curl https://fastrack-lms.com/health

# 2. Manual smoke test
# - Visit homepage
# - Login with test account
# - Enroll in course
# - Make payment
# - Access course player
# - Verify all features work

# 3. Check monitoring
# - Firebase Console → Logs
# - No errors in console
# - Database queries performing well
```

---

## Post-Deployment

### Immediate (First 1 Hour)

- [ ] Monitor application logs continuously
- [ ] Check for JavaScript errors in production (Sentry/equivalent)
- [ ] Verify database queries are responsive
- [ ] Test payment processing with real payment gateway
- [ ] Have team on standby for rapid rollback if needed

### First Day

- [ ] Monitor user sessions
- [ ] Track payment processing
- [ ] Check database performance
- [ ] Review security logs
- [ ] Gather feedback from early users

### First Week

- [ ] Daily monitoring check-ins
- [ ] Performance metrics review
- [ ] Error tracking dashboard review
- [ ] User feedback collection
- [ ] Production hotfix process readiness

### Ongoing

- [ ] Daily log reviews
- [ ] Weekly performance reports
- [ ] Monthly security audits
- [ ] Quarterly disaster recovery drills

---

## Rollback Procedure

**If critical issues found after deployment:**

```bash
# 1. STOP accepting payments immediately
# (Update UI to show maintenance message)

# 2. Identify last stable version
git log --oneline | head -10

# 3. Rollback deployment
firebase deploy --only hosting:fastrack-prod --archive [previous-version].tar

# Or
git revert [bad-commit-hash]
npm run build
firebase deploy --only hosting:fastrack-prod

# 4. Verify rollback
curl https://fastrack-lms.com/health

# 5. Notify users
# - Send email about temporary maintenance
# - Post status on website
# - Contact active users if payments affected

# 6. Root cause analysis
# - Review logs from failed deployment
# - Identify what went wrong
# - Document prevention measures
# - Re-test before next deployment
```

---

## Monitoring Dashboard

**Set up alerts for:**
- Database connection failures
- High error rates (>1% of requests)
- Payment processing failures
- Authentication failures
- Performance degradation (page load > 3s)

**Daily Checks:**
```
✓ Application is responding
✓ No unhandled JavaScript errors
✓ Database is healthy
✓ Payments are processing
✓ User sessions are valid
✓ Logs are normal
```

---

## Success Criteria

**After 7 days in production:**

- [ ] Zero critical bugs
- [ ] Zero data loss incidents
- [ ] 99% uptime
- [ ] Payment success rate > 99%
- [ ] Average response time < 2 seconds
- [ ] User feedback positive
- [ ] No security incidents

---

## Post-Launch Follow-Up

**1-2 Weeks After Launch:**
- [ ] Collect user feedback
- [ ] Review analytics
- [ ] Monitor for issues
- [ ] Plan Phase 3 improvements
- [ ] Document lessons learned

---

## Emergency Contacts

**If production is down:**

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Lead Developer | _____________ | _____________ | _____________ |
| DevOps | _____________ | _____________ | _____________ |
| Product Owner | _____________ | _____________ | _____________ |
| CEO | _____________ | _____________ | _____________ |

---

## Deployment Log

**Deployment Date:** _______________

**Deployed By:** _______________

**Time Started:** _______________

**Time Completed:** _______________

**Issues Encountered:** 

___________________________________________________________________

___________________________________________________________________

**Resolution:** 

___________________________________________________________________

___________________________________________________________________

**Status:** [ ] Successful / [ ] Rolled Back / [ ] Partial Success

**Notes:** 

___________________________________________________________________

___________________________________________________________________

---

**Last Updated:** November 30, 2025
