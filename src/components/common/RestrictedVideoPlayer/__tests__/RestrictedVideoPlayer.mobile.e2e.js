import { test, expect, devices } from '@playwright/test';

test.describe('RestrictedVideoPlayer - Mobile Controls (Task 1.2)', () => {
  test.use(devices['iPhone 12']);

  test('play button is at least 44x44px (WCAG compliance)', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    const playButton = page.locator('[aria-label*="Play" i]');
    await expect(playButton).toBeVisible();
    
    const size = await playButton.evaluate(el => ({
      width: el.offsetWidth,
      height: el.offsetHeight
    }));
    
    expect(size.width).toBeGreaterThanOrEqual(44);
    expect(size.height).toBeGreaterThanOrEqual(44);
  });

  test('fullscreen button is hidden on mobile', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    const fullscreenBtn = page.locator('button[aria-label*="fullscreen" i]');
    const isVisible = await fullscreenBtn.isVisible().catch(() => false);
    
    expect(isVisible).toBe(false);
  });

  test('seeking prevention persists on mobile touch', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    const video = page.locator('video');
    await expect(video).toBeVisible();
    
    const initialTime = await video.evaluate(v => v.currentTime);
    
    const progressContainer = page.locator('.progressContainer');
    await progressContainer.tap({ position: { x: 200, y: 0 } });
    
    const newTime = await video.evaluate(v => v.currentTime);
    expect(newTime).toBe(initialTime);
  });
});

test.describe('RestrictedVideoPlayer - Mobile Controls (Android)', () => {
  test.use(devices['Pixel 5']);

  test('play button is functional and sized correctly on Android', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    const playButton = page.locator('[aria-label*="Play" i]');
    await expect(playButton).toBeVisible();
    
    const size = await playButton.evaluate(el => ({
      width: el.offsetWidth,
      height: el.offsetHeight
    }));
    
    expect(size.width).toBeGreaterThanOrEqual(44);
    expect(size.height).toBeGreaterThanOrEqual(44);
    
    await playButton.tap();
    await page.waitForTimeout(500);
    
    const isPlaying = await page.locator('video').evaluate(v => !v.paused);
    expect(isPlaying).toBe(true);
  });

  test('fullscreen is blocked on Android', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    const videoElement = page.locator('video');
    const controlsList = await videoElement.getAttribute('controlsList');
    expect(controlsList).toContain('nofullscreen');
  });
});
