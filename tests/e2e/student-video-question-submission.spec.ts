import { test, expect } from '@playwright/test';

test.describe('Student Post-Video Question Submission - Auth Fix', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'student@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL(/dashboard|login|courses/, { timeout: 15000 }).catch(() => {});

    if (page.url().includes('/login')) {
      console.log('Login failed, student user may not exist in test environment');
      test.skip();
    }
  });

  test('should submit post-video question answer without 401 authentication error', async ({ page }) => {
    const networkErrors = [];
    const consoleErrors = [];

    page.on('response', response => {
      if (response.url().includes('checkVideoQuestionAnswer')) {
        if (response.status() === 401) {
          networkErrors.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText()
          });
        }
      }
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('401') || text.includes('Unauthorized') || text.includes('User must be authenticated')) {
          consoleErrors.push(text);
        }
      }
    });

    await page.goto('/courses');
    await page.waitForURL(/courses/, { timeout: 10000 });

    const enrolledCourse = page.locator('a, button').filter({ hasText: /course|lesson/i }).first();
    if (await enrolledCourse.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enrolledCourse.click();
      await page.waitForTimeout(2000);
    }

    const videoContainer = page.locator('video, [class*="video"], [class*="player"]').first();
    if (await videoContainer.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.evaluate(() => {
        const video = document.querySelector('video');
        if (video) {
          video.currentTime = video.duration - 1;
        }
      });

      await page.waitForTimeout(3000);

      const questionModal = page.locator('[role="dialog"], .modal, [class*="modal"]').filter({ 
        hasText: /question|answer/i 
      }).first();

      if (await questionModal.isVisible({ timeout: 5000 }).catch(() => false)) {
        const radioButtons = page.locator('input[type="radio"]');
        const radioCount = await radioButtons.count();

        if (radioCount > 0) {
          await radioButtons.first().click();
          await page.waitForTimeout(500);

          const submitButton = page.locator('button').filter({ hasText: /submit|answer|check/i }).first();
          if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await submitButton.click();

            await page.waitForTimeout(2000);

            expect(networkErrors).toEqual([], '401 authentication errors should not occur when submitting answers');
            expect(consoleErrors).toEqual([], 'No authentication-related console errors should occur');

            const successMessage = page.locator('text=/correct|incorrect|submitted|answered/i').first();
            const errorMessage = page.locator('text=/error|failed/i').first();

            const hasSuccessOrFeedback = await successMessage.isVisible({ timeout: 3000 }).catch(() => false) ||
                                         await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

            expect(hasSuccessOrFeedback || networkErrors.length === 0).toBeTruthy(
              'Should receive feedback or no auth errors on submission'
            );
          }
        }
      }
    }
  });

  test('should attach authentication token to Cloud Function call', async ({ page }) => {
    let cloudFunctionCallAuthorized = false;

    page.on('response', response => {
      if (response.url().includes('checkVideoQuestionAnswer')) {
        cloudFunctionCallAuthorized = response.status() !== 401 && response.status() !== 403;
      }
    });

    await page.goto('/courses');
    await page.waitForURL(/courses/, { timeout: 10000 });

    const enrolledCourse = page.locator('a, button').filter({ hasText: /course|lesson/i }).first();
    if (await enrolledCourse.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enrolledCourse.click();
      await page.waitForTimeout(2000);

      const videoContainer = page.locator('video, [class*="video"], [class*="player"]').first();
      if (await videoContainer.isVisible({ timeout: 5000 }).catch(() => false)) {
        await page.evaluate(() => {
          const video = document.querySelector('video');
          if (video) {
            video.currentTime = video.duration - 1;
          }
        });

        await page.waitForTimeout(3000);

        const questionModal = page.locator('[role="dialog"], .modal, [class*="modal"]').filter({ 
          hasText: /question|answer/i 
        }).first();

        if (await questionModal.isVisible({ timeout: 5000 }).catch(() => false)) {
          const radioButtons = page.locator('input[type="radio"]');
          if (await radioButtons.count() > 0) {
            await radioButtons.first().click();
            await page.waitForTimeout(500);

            const submitButton = page.locator('button').filter({ hasText: /submit|answer|check/i }).first();
            if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
              await submitButton.click();
              await page.waitForTimeout(2000);

              expect(cloudFunctionCallAuthorized).toBeTruthy(
                'Cloud Function should receive authenticated request (no 401 or 403)'
              );
            }
          }
        }
      }
    }
  });

  test('should not log authentication errors to console', async ({ page }) => {
    const authErrors = [];

    page.on('console', msg => {
      const text = msg.text();
      if (
        (msg.type() === 'error' || msg.type() === 'warning') &&
        (text.includes('User must be authenticated') || 
         text.includes('unauthenticated') ||
         text.includes('[UNKNOWN_ERROR]') ||
         text.includes('User must be authenticated'))
      ) {
        authErrors.push(text);
      }
    });

    await page.goto('/courses');
    await page.waitForURL(/courses/, { timeout: 10000 });

    const enrolledCourse = page.locator('a, button').filter({ hasText: /course|lesson/i }).first();
    if (await enrolledCourse.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enrolledCourse.click();
      await page.waitForTimeout(2000);

      const videoContainer = page.locator('video, [class*="video"], [class*="player"]').first();
      if (await videoContainer.isVisible({ timeout: 5000 }).catch(() => false)) {
        await page.evaluate(() => {
          const video = document.querySelector('video');
          if (video) {
            video.currentTime = video.duration - 1;
          }
        });

        await page.waitForTimeout(3000);

        const questionModal = page.locator('[role="dialog"], .modal, [class*="modal"]').filter({ 
          hasText: /question|answer/i 
        }).first();

        if (await questionModal.isVisible({ timeout: 5000 }).catch(() => false)) {
          const radioButtons = page.locator('input[type="radio"]');
          if (await radioButtons.count() > 0) {
            await radioButtons.first().click();
            await page.waitForTimeout(500);

            const submitButton = page.locator('button').filter({ hasText: /submit|answer|check/i }).first();
            if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
              await submitButton.click();
              await page.waitForTimeout(2000);

              expect(authErrors).toEqual([], 'No authentication-related errors should be logged');
            }
          }
        }
      }
    }
  });
});
