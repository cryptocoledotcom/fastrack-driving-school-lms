import { test, expect } from '@playwright/test';

test.describe('RestrictedVideoPlayer - Browser Compatibility', () => {
  test('video player displays in Chrome', async ({ page, browserName }) => {
    if (browserName !== 'chromium') return;

    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    const video = page.locator('video');
    await expect(video).toBeVisible();
    
    const playButton = page.locator('[aria-label*="Play" i]');
    await expect(playButton).toBeVisible();
  });

  test('play/pause button works in Chrome', async ({ page, browserName }) => {
    if (browserName !== 'chromium') return;

    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    const playButton = page.locator('[aria-label*="Play" i]');
    await playButton.click();
    
    await page.waitForTimeout(500);
    const pauseButton = page.locator('[aria-label*="Pause" i]');
    await expect(pauseButton).toBeVisible();
  });

  test('seeking is prevented in Chrome', async ({ page, browserName }) => {
    if (browserName !== 'chromium') return;

    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    const progressBar = page.locator('.progressContainer');
    const initialTime = await page.locator('[aria-label*="Play"]').evaluate(el => {
      const video = el.closest('div').querySelector('video');
      return video ? video.currentTime : 0;
    });

    await progressBar.click();
    
    await page.waitForTimeout(200);
    const finalTime = await page.locator('[aria-label*="Play"]').evaluate(el => {
      const video = el.closest('div').querySelector('video');
      return video ? video.currentTime : 0;
    });

    expect(finalTime).toBeLessThanOrEqual(initialTime + 1);
  });

  test('video player displays in Firefox', async ({ page, browserName }) => {
    if (browserName !== 'firefox') return;

    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    const video = page.locator('video');
    await expect(video).toBeVisible();
    
    const playButton = page.locator('[aria-label*="Play" i]');
    await expect(playButton).toBeVisible();
  });

  test('play/pause button works in Firefox', async ({ page, browserName }) => {
    if (browserName !== 'firefox') return;

    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    const playButton = page.locator('[aria-label*="Play" i]');
    await playButton.click();
    
    await page.waitForTimeout(500);
    const pauseButton = page.locator('[aria-label*="Pause" i]');
    await expect(pauseButton).toBeVisible();
  });

  test('seeking is prevented in Firefox', async ({ page, browserName }) => {
    if (browserName !== 'firefox') return;

    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    const progressBar = page.locator('.progressContainer');
    const initialTime = await page.locator('[aria-label*="Play"]').evaluate(el => {
      const video = el.closest('div').querySelector('video');
      return video ? video.currentTime : 0;
    });

    await progressBar.click();
    
    await page.waitForTimeout(200);
    const finalTime = await page.locator('[aria-label*="Play"]').evaluate(el => {
      const video = el.closest('div').querySelector('video');
      return video ? video.currentTime : 0;
    });

    expect(finalTime).toBeLessThanOrEqual(initialTime + 1);
  });

  test('video player displays in Safari', async ({ page, browserName }) => {
    if (browserName !== 'webkit') return;

    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    const video = page.locator('video');
    await expect(video).toBeVisible();
    
    const playButton = page.locator('[aria-label*="Play" i]');
    await expect(playButton).toBeVisible();
  });

  test('play/pause button works in Safari', async ({ page, browserName }) => {
    if (browserName !== 'webkit') return;

    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    const playButton = page.locator('[aria-label*="Play" i]');
    await playButton.click();
    
    await page.waitForTimeout(500);
    const pauseButton = page.locator('[aria-label*="Pause" i]');
    await expect(pauseButton).toBeVisible();
  });

  test('seeking is prevented in Safari', async ({ page, browserName }) => {
    if (browserName !== 'webkit') return;

    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    const progressBar = page.locator('.progressContainer');
    const initialTime = await page.locator('[aria-label*="Play"]').evaluate(el => {
      const video = el.closest('div').querySelector('video');
      return video ? video.currentTime : 0;
    });

    await progressBar.click();
    
    await page.waitForTimeout(200);
    const finalTime = await page.locator('[aria-label*="Play"]').evaluate(el => {
      const video = el.closest('div').querySelector('video');
      return video ? video.currentTime : 0;
    });

    expect(finalTime).toBeLessThanOrEqual(initialTime + 1);
  });

  test('controls styling consistent across browsers', async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    const playButton = page.locator('[aria-label*="Play" i]');
    const size = await playButton.evaluate(el => ({
      width: el.offsetWidth,
      height: el.offsetHeight
    }));
    
    expect(size.width).toBeGreaterThanOrEqual(44);
    expect(size.height).toBeGreaterThanOrEqual(44);
  });

  test('error message displays correctly in all browsers', async ({ page }) => {
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

  test('no console errors in Chrome', async ({ page, browserName }) => {
    if (browserName !== 'chromium') return;

    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    await page.waitForTimeout(1000);
    
    const videoErrors = consoleMessages.filter(msg => !msg.includes('AbortError'));
    expect(videoErrors.length).toBe(0);
  });

  test('no console errors in Firefox', async ({ page, browserName }) => {
    if (browserName !== 'firefox') return;

    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    await page.waitForTimeout(1000);
    
    const videoErrors = consoleMessages.filter(msg => !msg.includes('AbortError'));
    expect(videoErrors.length).toBe(0);
  });

  test('no console errors in Safari', async ({ page, browserName }) => {
    if (browserName !== 'webkit') return;

    const consoleMessages = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    await page.goto('http://localhost:3001/login');
    await page.fill('[name="email"]', 'cole@fastrackdrive.com');
    await page.fill('[name="password"]', 'B0w3r$0ckC013');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForURL('**/dashboard');
    await page.click('text=Fastrack Online');
    
    await page.waitForTimeout(1000);
    
    const videoErrors = consoleMessages.filter(msg => !msg.includes('AbortError'));
    expect(videoErrors.length).toBe(0);
  });
});
