import { test } from '@playwright/test';
import fs from 'fs';

fs.writeFileSync('sanity-debug.txt', 'Sanity Loaded');

test('sanity', async ({ page }) => {
    console.log('Sanity running');
    fs.writeFileSync('sanity-run.txt', 'Sanity Ran');
});
