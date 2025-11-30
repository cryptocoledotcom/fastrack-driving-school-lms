# Documentation Organization Guide

**Effective:** November 30, 2025

This guide explains how all documentation is now organized in the `/docs` folder structure.

---

## Folder Structure

```
docs/
├── INDEX.md                          ← START HERE
├── ORGANIZATION_GUIDE.md             ← This file
│
├── phases/                           Phase progress & completion
│   ├── PHASE1_COMPLETE.md
│   ├── PHASE2_PROGRESS.md
│   └── PHASE2_COMPLETION.md
│
├── testing/                          Testing & verification docs
│   ├── MANUAL_TEST_CASES.md         Your manual test checklist
│   ├── ERROR_SCENARIOS.md           Edge case testing checklist
│   ├── LOAD_TEST_GUIDE.md           100 concurrent payment test
│   └── ATOMIC_OPERATIONS_REFERENCE.md
│
├── deployment/                       Deployment guides
│   ├── STAGING_DEPLOYMENT.md        How to deploy to staging
│   └── PRODUCTION_CHECKLIST.md       Production readiness & go-live
│
├── setup/                           Initial setup & reference
│   ├── PROJECT_STRUCTURE.md         Complete file & folder reference
│   ├── SETUP_GUIDE.md               Project setup instructions
│   ├── ARCHITECTURE.md              System design overview
│   └── COMMANDS.md                  Useful commands
│
├── compliance/                      Compliance features
│   ├── COMPLIANCE_IMPLEMENTATION_COMPLETE.md
│   └── compliance_verification.md
│
└── reference/                       General reference
    ├── API.md                       API endpoints & data models
    ├── FEATURES.md                  Feature descriptions
    └── CODE_IMPROVEMENT_PLAN.md     Future improvements
```

---

## Quick Links by Use Case

### I want to...

**Deploy to staging next**
→ Read: `docs/deployment/STAGING_DEPLOYMENT.md`

**Run manual tests before deploying**
→ Read: `docs/testing/MANUAL_TEST_CASES.md`

**Understand the atomic operations fix**
→ Read: `docs/testing/ATOMIC_OPERATIONS_REFERENCE.md`

**Check if error handling is covered**
→ Read: `docs/testing/ERROR_SCENARIOS.md`

**Prepare for production deployment**
→ Read: `docs/deployment/PRODUCTION_CHECKLIST.md`

**Check Phase 2 progress**
→ Read: `docs/phases/PHASE2_COMPLETION.md`

**Look up an API endpoint**
→ Read: `docs/reference/API.md`

**Understand the architecture**
→ Read: `docs/setup/ARCHITECTURE.md`

**Find a useful command**
→ Read: `docs/setup/COMMANDS.md`

**See all compliance features**
→ Read: `docs/compliance/COMPLIANCE_IMPLEMENTATION_COMPLETE.md`

---

## Navigation Hub

**Start here:** `docs/INDEX.md`

This file provides:
- 📋 Phase progress links
- 🧪 Testing & verification links
- 🚀 Deployment links
- 📚 Setup & architecture links
- ✅ Compliance features links
- 📖 Reference links
- 🎯 Current status summary

---

## Old Files Location

**Legacy documentation (can be archived or deleted after verification):**

- Root folder files moved to `docs/` subfolders
- `.zencoder/rules/` files consolidated into `docs/`

**Files now in `docs/`:**
```
OLD LOCATION → NEW LOCATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE1_COMPLETE.md → docs/phases/
SETUP_GUIDE.md → docs/setup/
ARCHITECTURE.md → docs/setup/
COMMANDS.md → docs/setup/
API.md → docs/reference/
FEATURES.md → docs/reference/
CODE_IMPROVEMENT_PLAN.md → docs/reference/
COMPLIANCE_IMPLEMENTATION_COMPLETE.md → docs/compliance/
PHASE2_PROGRESS.md → docs/phases/ (from .zencoder/rules/)
LOAD_TEST_GUIDE.md → docs/testing/ (from .zencoder/rules/)
ATOMIC_OPERATIONS_REFERENCE.md → docs/testing/ (from .zencoder/rules/)
compliance_verification.md → docs/compliance/ (from .zencoder/rules/)
```

---

## Clean Up Instructions (Optional)

Once you've verified the new structure is working:

```bash
# Delete old root-level markdown files (after backing up if needed)
del PHASE1_COMPLETE.md
del SETUP_GUIDE.md
del ARCHITECTURE.md
del COMMANDS.md
del API.md
del FEATURES.md
del CODE_IMPROVEMENT_PLAN.md
del COMPLIANCE_IMPLEMENTATION_COMPLETE.md

# Optionally remove old .zencoder/rules documentation
del .zencoder\rules\PHASE2_PROGRESS.md
del .zencoder\rules\LOAD_TEST_GUIDE.md
del .zencoder\rules\ATOMIC_OPERATIONS_REFERENCE.md
del .zencoder\rules\compliance_verification.md
del .zencoder\rules\*.md  (to remove all old docs from here)
```

---

## Documentation Standards

### For New Documentation:

1. **Decide which category** (phases, testing, deployment, setup, compliance, reference)
2. **Create in appropriate folder** under `docs/`
3. **Update `docs/INDEX.md`** with link to new file
4. **Use clear, consistent naming** (e.g., `FEATURE_DESCRIPTION.md`)

### File Naming Convention:

- **All caps for titles** (e.g., `MANUAL_TEST_CASES.md`)
- **Clear, descriptive names** (avoid abbreviations)
- **Underscores between words** (not spaces or hyphens)

### Content Structure:

Each markdown should have:
- **Title** (# Main Title)
- **Status badge** (✅ Complete, ⚠️ In Progress, etc.)
- **Quick summary** (what does this document cover?)
- **Detailed content**
- **Last updated date** (at bottom)

---

## Updating References

Whenever you reference another doc, use **relative links**:

```markdown
See: [Manual Test Cases](./testing/MANUAL_TEST_CASES.md)
See: [Staging Guide](../deployment/STAGING_DEPLOYMENT.md)
See: [Architecture](./setup/ARCHITECTURE.md)
```

---

## Benefits of This Organization

✅ **Easy Navigation** — All docs in one place, organized by topic

✅ **Reduced Clutter** — Root directory is clean, only has project files

✅ **Scalable** — Easy to add more docs as project grows

✅ **Team Friendly** — Everyone knows where to find what they need

✅ **Onboarding** — New team members start at `docs/INDEX.md`

✅ **Version Control** — All docs tracked in git with code

---

## Questions?

1. **Need to find something?** → Start with `docs/INDEX.md`
2. **Want to add new docs?** → Follow "For New Documentation" section
3. **Something unclear?** → Add a note to this file

---

**Created:** November 30, 2025
**Organized By:** Zencoder
**Status:** ✅ Active
