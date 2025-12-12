import { test, expect } from '@playwright/test';

test.describe('Admin Workflows', () => {
    test.beforeEach(async ({ page }) => {
        // Login as Super Admin (Cole)
        await page.goto('/login');
        await page.fill('input[name="email"]', 'colebowersock@gmail.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Verify redirection to Dashboard
        await expect(page).toHaveURL('/dashboard');

        // Navigate to Admin Dashboard
        await page.goto('/admin');
        await expect(page).toHaveURL('/admin');
    });

    test('should create a new course', async ({ page }) => {
        const uniqueTitle = `Automated Course ${Date.now()}`;

        await page.click('a[href="/admin/courses"]');
        await expect(page).toHaveURL('/admin/courses');

        await page.click('button:has-text("Add Course")');

        await page.fill('input[name="title"]', uniqueTitle);
        await page.selectOption('select[name="category"]', { value: 'Adult Remedial' });
        await page.fill('textarea[name="description"]', 'Description');
        await page.selectOption('select[name="difficulty"]', { value: 'beginner' });
        await page.fill('input[name="price"]', '49.99');
        await page.click('button:has-text("Create Course")');

        await expect(page.locator('text=Course created successfully')).toBeVisible();
        await expect(page.locator(`text=${uniqueTitle}`)).toBeVisible();
    });

    test('should create a new lesson', async ({ page }) => {
        const uniqueTitle = `Automated Lesson ${Date.now()}`;

        await page.click('a[href="/admin/lessons"]');
        await expect(page).toHaveURL('/admin/lessons');

        // Select the seeded course in the filter to enable "Add Lesson"
        await page.selectOption('select', { value: 'fastrack-online' });

        const addLessonBtn = page.locator('button:has-text("Add Lesson")');
        // Now wait for it to be enabled (it should be after logic runs)
        await expect(addLessonBtn).toBeEnabled({ timeout: 10000 });
        await addLessonBtn.click();

        // Modal opens. Course should be pre-selected locally, but good to verify or ensure.
        // Since we selected it in filter, handleOpenModal uses selectedCourseId.
        // We just need to select the Module.

        await expect(page.locator('select[name="moduleId"]')).toBeVisible();
        await page.waitForTimeout(1000); // Allow fetch
        await page.selectOption('select[name="moduleId"]', { value: 'module-intro' });

        await page.fill('input[name="title"]', uniqueTitle);
        await page.selectOption('select[name="type"]', { value: 'text' });
        await page.fill('textarea[name="content"]', 'Content');
        await page.click('button:has-text("Create Lesson")');

        await expect(page.locator('text=Lesson created successfully').first()).toBeVisible();
        await expect(page.locator(`text=${uniqueTitle}`)).toBeVisible();
    });

    test('should edit an existing course', async ({ page }) => {
        const createTitle = `Edit Course ${Date.now()}`;
        const editTitle = `Edited Course ${Date.now()}`;

        // 1. Create
        await page.goto('/admin/courses');
        await page.click('button:has-text("Add Course")');
        await page.fill('input[name="title"]', createTitle);
        await page.selectOption('select[name="category"]', { value: 'Adult Remedial' });
        await page.fill('textarea[name="description"]', 'Desc');
        await page.selectOption('select[name="difficulty"]', { value: 'beginner' });
        await page.fill('input[name="price"]', '100');
        await page.click('button:has-text("Create Course")');
        await expect(page.locator('text=Course created successfully').first()).toBeVisible();

        // 2. Click Edit
        const courseRow = page.locator('tr', { hasText: createTitle });
        await courseRow.locator('button:has-text("Edit")').click();

        // 3. Update
        await expect(page.locator('h2:has-text("Edit Course")')).toBeVisible();
        await page.fill('input[name="title"]', editTitle);
        await page.fill('input[name="price"]', '199');
        await page.click('button:has-text("Update Course")');

        // 4. Verify
        await expect(page.locator('text=Course updated successfully').first()).toBeVisible({ timeout: 15000 });
        await expect(page.locator(`text=${editTitle}`)).toBeVisible();
        await expect(page.locator('text=$199')).toBeVisible();
    });

    test('should delete an existing course', async ({ page }) => {
        const deleteTitle = `Delete Course ${Date.now()}`;

        // 1. Create
        await page.goto('/admin/courses');
        await page.click('button:has-text("Add Course")');
        await page.fill('input[name="title"]', deleteTitle);
        await page.selectOption('select[name="category"]', { value: 'Adult Remedial' });
        await page.fill('textarea[name="description"]', 'Desc');
        await page.selectOption('select[name="difficulty"]', { value: 'beginner' });
        await page.fill('input[name="price"]', '100');
        await page.click('button:has-text("Create Course")');
        await expect(page.locator('text=Course created successfully').first()).toBeVisible();

        // 2. Setup dialog
        page.on('dialog', dialog => dialog.accept());

        // 3. Delete
        const courseRow = page.locator('tr', { hasText: deleteTitle });
        await courseRow.locator('button:has-text("Delete")').click();

        // 4. Verify
        await expect(page.locator('text=Course deleted successfully').first()).toBeVisible();
        await expect(page.locator(`text=${deleteTitle}`)).not.toBeVisible();
    });

    test('should edit an existing lesson', async ({ page }) => {
        const createTitle = `Edit Lesson ${Date.now()}`;
        const editTitle = `Edited Lesson ${Date.now()}`;

        await page.goto('/admin/lessons');
        // Select Filter
        await page.selectOption('select', { value: 'fastrack-online' });

        const addLessonBtn = page.locator('button:has-text("Add Lesson")');
        await expect(addLessonBtn).toBeEnabled({ timeout: 10000 });

        await addLessonBtn.click();
        // Modal opens
        await expect(page.locator('select[name="moduleId"]')).toBeVisible();
        await page.waitForTimeout(1000);
        await page.selectOption('select[name="moduleId"]', { value: 'module-intro' });

        await page.fill('input[name="title"]', createTitle);
        await page.selectOption('select[name="type"]', { value: 'text' });
        await page.fill('textarea[name="content"]', 'Content');
        await page.click('button:has-text("Create Lesson")');
        await expect(page.locator('text=Lesson created successfully').first()).toBeVisible();

        const lessonRow = page.locator('tr', { hasText: createTitle });
        await lessonRow.locator('button:has-text("Edit")').click();

        await expect(page.locator('h2:has-text("Edit Lesson")')).toBeVisible();
        await page.fill('input[name="title"]', editTitle);
        await page.click('button:has-text("Update Lesson")');

        await expect(page.locator('text=Lesson updated successfully').first()).toBeVisible();
        await expect(page.locator(`text=${editTitle}`)).toBeVisible();
    });

    test('should delete an existing lesson', async ({ page }) => {
        const deleteTitle = `Delete Lesson ${Date.now()}`;

        await page.goto('/admin/lessons');
        // Select Filter
        await page.selectOption('select', { value: 'fastrack-online' });

        const addLessonBtn = page.locator('button:has-text("Add Lesson")');
        await expect(addLessonBtn).toBeEnabled({ timeout: 10000 });

        await addLessonBtn.click();
        await expect(page.locator('select[name="moduleId"]')).toBeVisible();
        await page.waitForTimeout(1000);
        await page.selectOption('select[name="moduleId"]', { value: 'module-intro' });

        await page.fill('input[name="title"]', deleteTitle);
        await page.selectOption('select[name="type"]', { value: 'text' });
        await page.click('button:has-text("Create Lesson")');
        await expect(page.locator('text=Lesson created successfully').first()).toBeVisible();

        page.on('dialog', dialog => dialog.accept());

        const lessonRow = page.locator('tr', { hasText: deleteTitle });
        await lessonRow.locator('button:has-text("Delete")').click();

        await expect(page.locator('text=Lesson deleted successfully').first()).toBeVisible();
        await expect(page.locator(`text=${deleteTitle}`)).not.toBeVisible();
    });
});
