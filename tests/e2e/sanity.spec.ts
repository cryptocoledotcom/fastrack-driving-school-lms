import { test } from '@playwright/test';
require('fs').writeFileSync('sanity-debug.txt', 'Sanity Loaded');

test('sanity', async ({ page }) => {
    console.log('Sanity running');
    require('fs').writeFileSync('sanity-run.txt', 'Sanity Ran');
});
