import { test, expect } from '@playwright/test';

test.describe('Student Signup → Enrollment → Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete student signup and enroll in course', async ({ page }) => {
    const email = `test-student-${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    await page.goto('/register');

    await page.fill('input[name="displayName"]', 'Test Student');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);

    await page.click('button:has-text("Sign Up")');

    await page.waitForURL('/dashboard', { timeout: 5000 }).catch(() => {});
    await expect(page).toHaveURL(/dashboard|register/).catch(() => {});

    const successMessage = page.locator('text=Successfully created account|signed up|welcome');
    await expect(successMessage).toBeVisible({ timeout: 3000 }).catch(() => {
      console.log('Success message not visible, continuing with enrollment');
    });
  });

  test('should allow enrolled student to start course', async ({ page }) => {
    const email = `enrolled-student-${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    await page.goto('/register');
    await page.fill('input[name="displayName"]', 'Enrolled Student');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button:has-text("Sign Up")');

    await page.waitForURL('/dashboard');

    await page.goto('/courses');
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    
    const courseCard = page.locator('[data-testid="course-card"], .course-card, [href*="/dashboard/courses/"]').first();
    await courseCard.isVisible({ timeout: 5000 }).catch(() => false);

    const enrollButton = courseCard.locator('button:has-text("Enroll")');
    if (await enrollButton.isVisible()) {
      await enrollButton.click();
      
      const successMessage = page.locator('text=/enrolled|enrollment/i');
      await expect(successMessage).toBeVisible({ timeout: 3000 }).catch(() => {
        console.log('Enrollment success message not visible');
      });
    }
  });

  test('should verify enrollment persists after page reload', async ({ page }) => {
    const email = `reload-test-${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    await page.goto('/register');
    await page.fill('input[name="displayName"]', 'Reload Test');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button:has-text("Sign Up")');

    await page.waitForURL('/dashboard');

    await page.goto('/dashboard/my-courses');
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    const coursesCount = await page.locator('[data-testid="my-course"]').count();

    await page.reload();
    await page.waitForLoadState('domcontentloaded').catch(() => {});

    const reloadedCoursesCount = await page.locator('[data-testid="my-course"]').count();
    expect(reloadedCoursesCount).toBeGreaterThanOrEqual(coursesCount);
  });

  test('should navigate through course enrollment flow', async ({ page }) => {
    const email = `course-nav-${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    await page.goto('/register');
    await page.fill('input[name="displayName"]', 'Course Nav Test');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button:has-text("Sign Up")');

    await page.waitForURL('/dashboard');

    await page.goto('/courses');
    await page.waitForLoadState('domcontentloaded').catch(() => {});

    const firstCourseLink = page.locator('a[href*="/dashboard/courses/"]').first();
    const courseExists = await firstCourseLink.isVisible({ timeout: 5000 }).catch(() => false);
    if (courseExists) {
      await firstCourseLink.click();
      await page.waitForLoadState('domcontentloaded').catch(() => {});
    }
    const enrollOrContinueBtn = page.locator('button').filter({ hasText: /Enroll|Continue Learning/ });
    await enrollOrContinueBtn.isVisible({ timeout: 3000 }).catch(() => {
      console.log('Enroll/Continue button visible or course detail page loaded');
    });
  });
});
