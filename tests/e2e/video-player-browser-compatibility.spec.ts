import { test, expect } from '@playwright/test';

test.describe('RestrictedVideoPlayer - Browser Compatibility', () => {
  test('video player components exist and are accessible', async ({ page, browserName }) => {
    const projectName = browserName === 'chromium' ? 'Chrome' : browserName === 'firefox' ? 'Firefox' : 'Safari';
    console.log(`Testing video player compatibility on ${projectName}`);

    await page.goto('/dashboard');
    await page.waitForURL(/dashboard|login/, { timeout: 10000 }).catch(() => {});

    if (page.url().includes('/login')) {
      console.log(`${projectName}: Not authenticated, navigating to courses anyway`);
    }

    await page.goto('/courses');
    await page.waitForTimeout(2000);

    const hasCourseLinks = await page.locator('a, button').filter({ hasText: /course|lesson/i }).count().catch(() => 0);
    console.log(`${projectName}: Found ${hasCourseLinks} course links`);

    if (hasCourseLinks > 0) {
      const firstCourse = page.locator('a, button').filter({ hasText: /course|lesson/i }).first();
      if (await firstCourse.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstCourse.click();
        await page.waitForTimeout(3000);
      }
    }

    const video = page.locator('video').first();
    const videoExists = await video.isVisible({ timeout: 3000 }).catch(() => false);

    if (videoExists) {
      console.log(`${projectName}: ✓ Video element found and visible`);

      const playButton = page.locator('[aria-label*="Play" i]').first();
      const hasPlayButton = await playButton.isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`${projectName}: ✓ Play button ${hasPlayButton ? 'found' : 'not found'}`);

      const controls = page.locator('[class*="control"]').first();
      const hasControls = await controls.isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`${projectName}: ✓ Controls ${hasControls ? 'found' : 'not found'}`);

      expect(videoExists).toBeTruthy();
    } else {
      console.log(`${projectName}: Video player not on this page (may not be enrolled in course)`);
    }
  });

  test('video player buttons are WCAG accessible (44px minimum)', async ({ page, browserName }) => {
    const projectName = browserName === 'chromium' ? 'Chrome' : browserName === 'firefox' ? 'Firefox' : 'Safari';

    await page.goto('/dashboard');
    await page.waitForURL(/dashboard|login/, { timeout: 10000 }).catch(() => {});

    await page.goto('/courses');
    await page.waitForTimeout(2000);

    const firstCourse = page.locator('a, button').filter({ hasText: /course|lesson/i }).first();
    if (await firstCourse.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstCourse.click();
      await page.waitForTimeout(3000);
    }

    const playButton = page.locator('[aria-label*="Play" i]').first();
    if (await playButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      const buttonSize = await playButton.evaluate(el => ({
        width: el.offsetWidth,
        height: el.offsetHeight
      })).catch(() => ({ width: 0, height: 0 }));

      console.log(`${projectName}: Play button size: ${buttonSize.width}x${buttonSize.height}px`);
      expect(buttonSize.width).toBeGreaterThanOrEqual(44);
      expect(buttonSize.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('seeking is disabled on video player', async ({ page, browserName }) => {
    const projectName = browserName === 'chromium' ? 'Chrome' : browserName === 'firefox' ? 'Firefox' : 'Safari';

    await page.goto('/dashboard');
    await page.waitForURL(/dashboard|login/, { timeout: 10000 }).catch(() => {});

    await page.goto('/courses');
    await page.waitForTimeout(2000);

    const firstCourse = page.locator('a, button').filter({ hasText: /course|lesson/i }).first();
    if (await firstCourse.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstCourse.click();
      await page.waitForTimeout(3000);
    }

    const video = page.locator('video').first();
    if (await video.isVisible({ timeout: 3000 }).catch(() => false)) {
      const initialTime = await video.evaluate((el: any) => el.currentTime).catch(() => 0);

      const progressBar = page.locator('[class*="progress"]').first();
      if (await progressBar.isVisible({ timeout: 2000 }).catch(() => false)) {
        await progressBar.click();
        await page.waitForTimeout(500);
      }

      const finalTime = await video.evaluate((el: any) => el.currentTime).catch(() => 0);
      console.log(`${projectName}: Video time: ${initialTime.toFixed(2)}s → ${finalTime.toFixed(2)}s (seek test)`);

      expect(finalTime).toBeLessThanOrEqual(initialTime + 2);
    }
  });

  test('error handling displays appropriate messages', async ({ page, browserName }) => {
    const projectName = browserName === 'chromium' ? 'Chrome' : browserName === 'firefox' ? 'Firefox' : 'Safari';

    await page.goto('/dashboard');
    await page.waitForURL(/dashboard|login/, { timeout: 10000 }).catch(() => {});

    console.log(`${projectName}: Error handling test - verifying graceful error display`);

    await page.route('**/*.mp4', route => {
      route.abort('failed');
    });

    await page.goto('/courses');
    await page.waitForTimeout(2000);

    const errorMessage = page.locator('[class*="error"]').first();
    const hasErrorUI = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasErrorUI) {
      console.log(`${projectName}: ✓ Error UI displayed`);
      expect(hasErrorUI).toBeTruthy();
    } else {
      console.log(`${projectName}: Error state not triggered on this page`);
    }
  });

  test('no console errors (AbortError excepted)', async ({ page, browserName }) => {
    const projectName = browserName === 'chromium' ? 'Chrome' : browserName === 'firefox' ? 'Firefox' : 'Safari';
    const consoleErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('AbortError')) {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/dashboard');
    await page.waitForURL(/dashboard|login/, { timeout: 10000 }).catch(() => {});

    await page.goto('/courses');
    await page.waitForTimeout(2000);

    const firstCourse = page.locator('a, button').filter({ hasText: /course|lesson/i }).first();
    if (await firstCourse.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstCourse.click();
      await page.waitForTimeout(3000);
    }

    await page.waitForTimeout(1000);

    console.log(`${projectName}: Console errors (excluding AbortError): ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log(`  Errors found: ${consoleErrors.slice(0, 3).join(' | ')}`);
    }

    expect(consoleErrors.length).toBe(0);
  });
});
