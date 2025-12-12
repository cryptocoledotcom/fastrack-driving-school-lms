# Next Steps - Payment E2E Test Suite Completion

**Date**: December 12, 2025  
**Current Status**: ✅ Free course enrollment test passing  
**Infrastructure**: ✅ Complete and ready for expansion

---

## 🎯 Immediate Goals

### 1. Complete Paid Course Enrollment Test
**Priority**: HIGH  
**Estimated Time**: 1-2 hours  
**Status**: Infrastructure ready, straightforward implementation

**Implementation Steps**:
```typescript
test('should process payment for paid course', async ({ page }) => {
  // 1. Login as existing student
  await page.goto('/login');
  await page.fill('input[name="email"]', studentEmail);
  await page.fill('input[name="password"]', studentPassword);
  await page.click('button:has-text("Sign In")');

  // 2. Navigate to courses and find paid course
  await page.goto('/courses');
  await expect(page.getByText('Loading courses...')).not.toBeVisible();
  
  // 3. Click enroll on paid course
  const paidCourse = page.locator('h3', { hasText: 'Payment Paid Course Mock' });
  await paidCourse.locator('..').getByRole('button', { name: /Enroll/i }).click();

  // 4. Verify payment modal
  await expect(page.getByText('Complete Your Payment')).toBeVisible();

  // 5. Fill billing form
  await page.fill('input[name="fullName"]', 'Test Student');
  await page.fill('input[name="email"]', studentEmail);
  await page.fill('input[name="address"]', '123 Test St');
  await page.fill('input[name="city"]', 'Columbus');
  await page.fill('input[name="state"]', 'OH');
  await page.fill('input[name="zipCode"]', '43215');

  // 6. Fill Stripe card details (in iframe)
  const stripeFrame = page.frameLocator('.StripeElement iframe');
  await stripeFrame.getByPlaceholder('Card number').fill('4242424242424242');
  await stripeFrame.getByPlaceholder('MM / YY').fill('12/30');
  await stripeFrame.getByPlaceholder('CVC').fill('123');
  await stripeFrame.getByPlaceholder('ZIP').fill('43215');

  // 7. Submit payment
  await page.click('button:has-text("Pay")');

  // 8. Verify success
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('text=Payment Paid Course Mock')).toBeVisible();
});
```

**Expected Outcome**:
- ✅ Payment modal displays for paid course
- ✅ Billing form accepts valid input
- ✅ Stripe iframe loads and accepts test card
- ✅ Payment submission succeeds (mocked)
- ✅ Enrollment created
- ✅ Dashboard redirect occurs
- ✅ Course appears in enrolled courses

---

### 2. Add Billing Form Validation Test
**Priority**: MEDIUM  
**Estimated Time**: 1 hour  
**Status**: Can be implemented in parallel with paid course test

**Test Scenarios**:
```typescript
test.describe('Billing Form Validation', () => {
  test('should reject invalid card number', async ({ page }) => {
    // Setup: Navigate to payment modal
    // Action: Enter invalid card number (1234567890123456)
    // Expected: Error message displays
  });

  test('should require all billing fields', async ({ page }) => {
    // Setup: Navigate to payment modal
    // Action: Leave required fields empty
    // Expected: Form validation prevents submission
  });

  test('should reject invalid expiration date', async ({ page }) => {
    // Setup: Navigate to payment modal
    // Action: Enter past expiration date
    // Expected: Stripe validation error
  });

  test('should reject invalid CVV', async ({ page }) => {
    // Setup: Navigate to payment modal
    // Action: Enter 2-digit CVV
    // Expected: Stripe validation error
  });
});
```

---

### 3. Cleanup and Optimization
**Priority**: LOW  
**Estimated Time**: 30 minutes  
**Status**: Can be done after tests are passing

**Tasks**:
- [ ] Remove `beforeAll` admin setup from test file (lines 14-58)
- [ ] Add TypeScript type definition for `window.MOCK_COURSES`
- [ ] Delete debug log files (`debug_payment_*.txt`)
- [ ] Consolidate mock data into shared factory function

**Example Cleanup**:
```typescript
// Create shared mock factory
function createMockCourse(overrides = {}) {
  return {
    id: 'course-mock-' + Date.now(),
    title: 'Mock Course',
    description: 'A mock course for testing',
    price: 0,
    published: true,
    category: 'online',
    difficulty: 'beginner',
    createdAt: createMockTimestamp(),
    updatedAt: createMockTimestamp(),
    features: ['Mock Feature'],
    enrolledStudents: 0,
    ...overrides
  };
}

// Usage in tests
window.MOCK_COURSES = [
  createMockCourse({ id: 'course-free-123', title: 'Free Course', price: 0 }),
  createMockCourse({ id: 'course-paid-123', title: 'Paid Course', price: 49.99 })
];
```

---

## 🚀 Future Enhancements

### Phase 1: Extended Payment Scenarios (2-3 hours)
- [ ] Split payment flow test (Complete Package)
- [ ] Payment failure scenarios (card decline)
- [ ] Network error handling
- [ ] Timeout scenarios

### Phase 2: Advanced Features (3-4 hours)
- [ ] Stripe webhook mock events
- [ ] Refund flow testing
- [ ] Payment history verification
- [ ] Receipt generation test

### Phase 3: Integration Testing (4-5 hours)
- [ ] Real Firestore integration (when emulator fixed)
- [ ] End-to-end payment with real Stripe test mode
- [ ] Performance testing (load times, payment processing)

---

## 📊 Success Criteria

### Test Coverage Goals
- ✅ Free course enrollment (COMPLETE)
- ⏸️ Paid course enrollment (READY)
- ⏸️ Billing form validation (READY)
- 🔜 Split payment flow
- 🔜 Payment failure scenarios

### Quality Metrics
- **Pass Rate**: 100% (all tests passing)
- **Execution Time**: <20s per test
- **Code Coverage**: >80% of payment-related code
- **Reliability**: No flaky tests

### Documentation Goals
- ✅ Comprehensive walkthrough (COMPLETE)
- ✅ Payment E2E test report (COMPLETE)
- ✅ Updated README.md (COMPLETE)
- ⏸️ Best practices guide (READY)

---

## 🛠 Development Workflow

### Running Tests During Development

**NOTE**: We have implemented an environment toggle `VITE_USE_EMULATORS`.
- `npm run dev` (default): Connects to **Production** Firebase (Port 3000). Use this for normal development and checking the real app.
- Tests automatically set `VITE_USE_EMULATORS=true` and run on **Port 3001** to use Emulators.

```bash
# Terminal 1: Start emulators
npx firebase emulators:start --only auth,firestore,functions --project demo-test

# Terminal 2: Seed data
node scripts/seed-emulator.cjs

# Terminal 3: Run tests (Playwright automatically starts server on port 3001)
npx playwright test tests/e2e/payment-integration.spec.ts --project chromium

# OR if you want to inspect the emulator version manually:
# npm run dev -- --port 3001
# (Then check console to confirm "Connected to Emulators")
```

### Debugging Tips

1. **Use Playwright Inspector**:
   ```bash
   npx playwright test tests/e2e/payment-integration.spec.ts --debug
   ```

2. **Check Console Logs**:
   - Look for "Returning MOCKED Courses" messages
   - Verify mock data structure in console

3. **Screenshot on Failure**:
   - Automatically saved to `test-results/` directory
   - Review for UI state at failure point

4. **Slow Motion Mode**:
   ```bash
   npx playwright test tests/e2e/payment-integration.spec.ts --headed --slow-mo=1000
   ```

---

## 📝 Implementation Checklist

### Before Starting
- [x] Emulators running
- [x] Seed data loaded
- [x] Dev server running
- [x] Mock infrastructure tested

### During Implementation
- [ ] Write test code
- [ ] Run test to verify passing
- [ ] Check console logs for mock injection
- [ ] Verify no Firestore errors
- [ ] Review screenshots if test fails

### After Completion
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Code committed and pushed
- [ ] Test report updated

---

## 🎓 Key Learnings

### Mock-Based Testing Benefits
1. **Speed**: Tests run in ~15s vs 30-60s with real database
2. **Reliability**: No dependency on emulator connectivity
3. **Isolation**: Tests don't interfere with each other
4. **Flexibility**: Easy to test edge cases

### Application Improvements
1. **Dynamic Pricing**: CoursesPage now supports admin-created courses
2. **Service Layer**: More flexible with mock support
3. **Firebase Config**: Better emulator compatibility

### Best Practices
1. **Mock Data Structure**: Always match production schema
2. **Service Layer Checks**: Check for mocks before database queries
3. **Test Isolation**: Each test injects its own mock data
4. **Cleanup**: Page reload clears mock data automatically

---

## 🤝 Getting Help

### Resources
- **Walkthrough**: [`walkthrough.md`](file:///C:/Users/Cole/.gemini/antigravity/brain/639304f3-9970-4eca-ba9f-7f85633cc24f/walkthrough.md)
- **Test Report**: [`PAYMENT_E2E_TEST_REPORT.md`](file:///c:/Users/Cole/Documents/Antigravity%20Fastrack%20Workspace/Fastrack-Learning_Management-System/docs/PAYMENT_E2E_TEST_REPORT.md)
- **Task List**: [`task.md`](file:///C:/Users/Cole/.gemini/antigravity/brain/639304f3-9970-4eca-ba9f-7f85633cc24f/task.md)

### Common Issues
1. **Mock data not loading**: Check `page.addInitScript()` is in `beforeEach`
2. **Firestore errors**: Verify `demo-test` project ID is set
3. **Payment modal not showing**: Check course price is > 0
4. **Stripe iframe not loading**: Verify Stripe is loaded in test environment

---

**Ready to proceed!** The infrastructure is complete and the next tests are straightforward to implement. Start with the paid course enrollment test, then add billing validation.

**Estimated Total Time**: 2-3 hours for complete payment test suite  
**Current Progress**: 33% complete (1/3 core tests passing)  
**Next Milestone**: 100% payment test coverage
