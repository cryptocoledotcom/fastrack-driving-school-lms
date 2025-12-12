
import { test, expect } from '@playwright/test';

test.describe('Instructor Workflow', () => {

    test('should allow instructor to view dashboard and courses', async ({ page }) => {
        try {
            console.log('TEST: Starting verification');
            page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));

            // Log in as instructor
            await page.goto('/login');
            await page.fill('input[name="email"]', 'instructor@fastrack.com');
            await page.fill('input[name="password"]', 'password123');
            await page.getByRole('button', { name: 'Sign In', exact: true }).click();
            console.log('TEST: Login button clicked');

            // Wait for navigation or error
            await page.waitForTimeout(2000);
            console.log(`TEST: Current URL: ${page.url()}`);

            if (await page.getByText(/invalid/i).isVisible()) {
                console.log('TEST: Login error detected');
            }

            await expect(page).toHaveURL('/dashboard');

            // Verify Student Dashboard Access (landing page)
            await expect(page.getByText(/Welcome back/i)).toBeVisible();

            // Navigate to Instructor Panel via Sidebar
            await page.getByRole('link', { name: 'Instructor Panel' }).click();

            // Verify Admin/Instructor Dashboard
            await expect(page).toHaveURL(/\/admin/);
            await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();

            // Check for specific widgets
            await expect(page.getByText('Overview of system activity')).toBeVisible();
        } catch (e) {
            console.log('TEST FAILED: Catch block entered');
            console.error('TEST ERROR:', e);
            throw e;
        }
    });

});
