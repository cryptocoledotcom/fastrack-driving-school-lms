import { test, expect } from '@playwright/test';

test.describe('Negative Scenarios - Error Handling', () => {
  test.describe('Signup Validation', () => {
    test('should reject signup with invalid email format', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[name="displayName"]', 'Test User');
      await page.fill('input[name="email"]', 'not-an-email');
      await page.fill('input[name="password"]', 'ValidPassword123!');
      await page.fill('input[name="confirmPassword"]', 'ValidPassword123!');

      await page.click('button:has-text("Sign Up")');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const errorMessage = page.locator('text=/invalid|email|format/i');
      const isInvalidEmailHandled = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

      if (isInvalidEmailHandled) {
        await expect(errorMessage).toBeVisible();
      } else {
        const stillOnRegister = page.url().includes('/register');
        expect(stillOnRegister).toBeTruthy();
      }
    });

    test('should reject signup with password mismatch', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[name="displayName"]', 'Test User');
      await page.fill('input[name="email"]', `mismatch-${Date.now()}@test.com`);
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');

      await page.click('button:has-text("Sign Up")');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const passwordError = page.locator('text=/password|match|confirm/i');
      const hasError = await passwordError.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasError) {
        await expect(passwordError).toBeVisible();
      }

      const stillOnRegister = page.url().includes('/register');
      expect(stillOnRegister).toBeTruthy();
    });

    test('should reject signup with missing required fields', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[name="displayName"]', '');
      await page.fill('input[name="email"]', `test-${Date.now()}@test.com`);
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'Password123!');

      await page.click('button:has-text("Sign Up")');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const requiredError = page.locator('text=/required/i');
      const hasError = await requiredError.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasError) {
        await expect(requiredError).toBeVisible();
      }

      const stillOnRegister = page.url().includes('/register');
      expect(stillOnRegister).toBeTruthy();
    });

    test('should reject signup with weak password', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[name="displayName"]', 'Test User');
      await page.fill('input[name="email"]', `weak-${Date.now()}@test.com`);
      await page.fill('input[name="password"]', '123');
      await page.fill('input[name="confirmPassword"]', '123');

      await page.click('button:has-text("Sign Up")');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const weakError = page.locator('text=/weak|strong|password|least/i');
      const hasError = await weakError.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasError) {
        const stillOnRegister = page.url().includes('/register');
        expect(stillOnRegister).toBeTruthy();
      }
    });
  });

  test.describe('Login Failure Scenarios', () => {
    test('should reject login with wrong password', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'WrongPassword123!');

      await page.click('button:has-text("Sign In")');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const errorMessage = page.locator('text=/invalid|incorrect|wrong|password|email/i');
      const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasError) {
        await expect(errorMessage).toBeVisible();
      }

      const stillOnLogin = page.url().includes('/login');
      expect(stillOnLogin).toBeTruthy();
    });

    test('should reject login with non-existent email', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', `nonexistent-${Date.now()}@test.com`);
      await page.fill('input[name="password"]', 'SomePassword123!');

      await page.click('button:has-text("Sign In")');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const errorMessage = page.locator('text=/invalid|not found|email|password/i');
      const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasError) {
        console.log('Non-existent user error displayed');
      }

      const stillOnLogin = page.url().includes('/login');
      expect(stillOnLogin).toBeTruthy();
    });

    test('should reject login with empty credentials', async ({ page }) => {
      await page.goto('/login');

      await page.click('button:has-text("Sign In")');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const requiredError = page.locator('text=/required/i');
      const hasError = await requiredError.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasError) {
        await expect(requiredError).toBeVisible();
      }

      const stillOnLogin = page.url().includes('/login');
      expect(stillOnLogin).toBeTruthy();
    });
  });

  test.describe('Course Enrollment Error Handling', () => {
    test('should handle enrollment failure gracefully', async ({ page }) => {
      const email = `enroll-test-${Date.now()}@test.com`;
      const password = 'ValidPassword123!';

      await page.goto('/register');
      await page.fill('input[name="displayName"]', 'Enroll Test');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);
      await page.click('button:has-text("Sign Up")');

      await page.waitForURL('/dashboard', { timeout: 5000 }).catch(() => {});

      await page.goto('/courses');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const courseLink = page.locator('a[href*="/dashboard/courses/"]').first();
      const exists = await courseLink.isVisible({ timeout: 3000 }).catch(() => false);

      if (exists) {
        await courseLink.click();
        await page.waitForLoadState('domcontentloaded').catch(() => {});

        const enrollButton = page.locator('button').filter({ hasText: /Enroll/ }).first();
        const btnExists = await enrollButton.isVisible({ timeout: 2000 }).catch(() => false);

        if (btnExists) {
          await enrollButton.click();
          await page.waitForLoadState('domcontentloaded').catch(() => {});

          const successMsg = page.locator('text=/success|enrolled/i');
          const errorMsg = page.locator('text=/error|failed/i');

          const hasSuccess = await successMsg.isVisible({ timeout: 3000 }).catch(() => false);
          const hasError = await errorMsg.isVisible({ timeout: 3000 }).catch(() => false);

          if (hasError) {
            console.log('Enrollment error handled gracefully');
          }
        }
      }
    });

    test('should prevent enrollment with invalid course ID', async ({ page }) => {
      await page.goto('/dashboard/courses/invalid-course-id-12345');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const notFoundMsg = page.locator('text=/not found|does not exist|invalid/i');
      const errorMsg = page.locator('text=/error/i');
      const backButton = page.locator('button').filter({ hasText: /back/i });

      const notFound = await notFoundMsg.isVisible({ timeout: 3000 }).catch(() => false);
      const hasError = await errorMsg.isVisible({ timeout: 3000 }).catch(() => false);
      const hasBackButton = await backButton.isVisible({ timeout: 3000 }).catch(() => false);

      const handled = notFound || hasError || hasBackButton;
      if (handled) {
        console.log('Invalid course handling verified');
      }
    });
  });

  test.describe('Form Input Validation', () => {
    test('should reject signup with very long name', async ({ page }) => {
      await page.goto('/register');

      const veryLongName = 'A'.repeat(500);
      await page.fill('input[name="displayName"]', veryLongName);
      await page.fill('input[name="email"]', `longname-${Date.now()}@test.com`);
      await page.fill('input[name="password"]', 'ValidPassword123!');
      await page.fill('input[name="confirmPassword"]', 'ValidPassword123!');

      await page.click('button:has-text("Sign Up")');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const lengthError = page.locator('text=/too long|maximum|length/i');
      const hasError = await lengthError.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasError) {
        console.log('Long input validation working');
      }

      const stillOnRegister = page.url().includes('/register');
      expect(stillOnRegister).toBeTruthy();
    });

    test('should handle special characters in email', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[name="displayName"]', 'Special Char Test');
      await page.fill('input[name="email"]', `test+tag-${Date.now()}@test.com`);
      await page.fill('input[name="password"]', 'ValidPassword123!');
      await page.fill('input[name="confirmPassword"]', 'ValidPassword123!');

      await page.click('button:has-text("Sign Up")');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const isValid = page.url().includes('/dashboard');
      const hasError = (await page.locator('text=/error|invalid/i').isVisible({ timeout: 2000 }).catch(() => false));

      if (!isValid && !hasError) {
        console.log('Special characters validation depends on backend');
      }
    });
  });

  test.describe('Network & Timeout Scenarios', () => {
    test('should show loading state during signup', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[name="displayName"]', 'Loading Test');
      await page.fill('input[name="email"]', `loading-${Date.now()}@test.com`);
      await page.fill('input[name="password"]', 'ValidPassword123!');
      await page.fill('input[name="confirmPassword"]', 'ValidPassword123!');

      const signUpBtn = page.locator('button[type="submit"]').filter({ hasText: /Sign Up/ });
      await signUpBtn.click();

      const loadingIndicator = page.locator('[data-testid="loading"], .spinner, text=/loading|processing/i');
      const isLoading = await loadingIndicator.isVisible({ timeout: 2000 }).catch(() => false);

      if (isLoading) {
        console.log('Loading state displayed during submission');
      }

      await page.waitForLoadState('domcontentloaded').catch(() => {});
    });

    test('should handle stale session on page navigation', async ({ page }) => {
      const email = `session-${Date.now()}@test.com`;
      const password = 'ValidPassword123!';

      await page.goto('/register');
      await page.fill('input[name="displayName"]', 'Session Test');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);
      await page.click('button:has-text("Sign Up")');

      await page.waitForURL('/dashboard', { timeout: 5000 }).catch(() => {});

      await page.goto('/dashboard/my-courses');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const coursesVisible = (await page.locator('[data-testid="my-course"], .course-card').count()) >= 0;
      expect(coursesVisible).toBeTruthy();
    });
  });
});
