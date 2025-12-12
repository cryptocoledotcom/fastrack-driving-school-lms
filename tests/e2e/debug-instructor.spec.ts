
import { test, expect } from '@playwright/test';
import fs from 'fs';

test('debug instructor login', async ({ page }) => {
    console.log('DEBUG: Starting login');
    await page.goto('/login');
    await page.fill('input[name="email"]', 'instructor@fastrack.com');
    await page.fill('input[name="password"]', 'password123');
    await page.getByRole('button', { name: 'Login' }).click();
    console.log('DEBUG: Clicked login');

    // Wait 5 seconds to see what happens
    await page.waitForTimeout(5000);

    console.log('DEBUG: Dumping content');
    const content = await page.content();
    const url = page.url();
    console.log(`DEBUG: Final URL: ${url}`);

    fs.writeFileSync('test-results/debug-dump.html', `<!-- URL: ${url} -->\n${content}`);
    console.log('DEBUG: Dump complete');
});
