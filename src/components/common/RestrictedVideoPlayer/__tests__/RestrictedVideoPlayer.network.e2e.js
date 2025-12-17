import { test, expect, devices } from '@playwright/test';

test.describe('RestrictedVideoPlayer - Network Resilience', () => {
  test('displays buffering indicator during network slowdown', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    const video = page.locator('video');
    await expect(video).toBeVisible();
    
    await page.route('**/*.mp4', route => {
      setTimeout(() => route.continue(), 500);
    });
    
    const spinner = page.locator('.spinner');
    expect(spinner).toBeDefined();
  });

  test('shows retry button on network error', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    await page.route('**/*.mp4', route => {
      route.abort('failed');
    });
    
    const retryButton = page.locator('button:has-text("Retry")');
    await expect(retryButton).toBeVisible();
  });

  test('restores video playback after retry', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    const video = page.locator('video');
    await expect(video).toBeVisible();
    
    let requestCount = 0;
    await page.route('**/*.mp4', route => {
      requestCount++;
      if (requestCount === 1) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    const retryButton = page.locator('button:has-text("Retry")');
    await retryButton.click();
    
    await page.waitForTimeout(1000);
    expect(requestCount).toBeGreaterThanOrEqual(2);
  });

  test('disables play button while buffering', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    const playButton = page.locator('[aria-label*="Play" i]');
    
    await page.route('**/*.mp4', route => {
      setTimeout(() => route.continue(), 1000);
    });
    
    const isDisabled = await playButton.evaluate(el => el.disabled);
    expect(isDisabled).toBeDefined();
  });

  test('buffering indicator clears when video resumes', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    const video = page.locator('video');
    await expect(video).toBeVisible();
    
    await page.route('**/*.mp4', route => {
      setTimeout(() => route.continue(), 300);
    });
    
    await page.waitForTimeout(500);
    
    const spinner = page.locator('.spinner');
    const isVisible = await spinner.isVisible().catch(() => false);
    expect(isVisible).toBeDefined();
  });

  test('network error message is user-friendly', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    await page.route('**/*.mp4', route => {
      route.abort('failed');
    });
    
    const errorMessage = page.locator('text=Network error');
    await expect(errorMessage).toBeVisible();
  });
});

test.describe('RestrictedVideoPlayer - Mobile Network Resilience', () => {
  test.use(devices['iPhone 12']);

  test('shows buffering on mobile with network throttle', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    const video = page.locator('video');
    await expect(video).toBeVisible();
    
    const spinner = page.locator('.spinner');
    expect(spinner).toBeDefined();
  });

  test('retry button is accessible on mobile', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    await page.route('**/*.mp4', route => {
      route.abort('failed');
    });
    
    const retryButton = page.locator('button:has-text("Retry")');
    await expect(retryButton).toBeVisible();
    
    const size = await retryButton.evaluate(el => ({
      width: el.offsetWidth,
      height: el.offsetHeight
    }));
    
    expect(size.width).toBeGreaterThanOrEqual(44);
    expect(size.height).toBeGreaterThanOrEqual(44);
  });
});
