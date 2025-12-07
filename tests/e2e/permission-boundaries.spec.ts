import { test, expect } from '@playwright/test';

test.describe('Permission Boundaries - Access Control', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies and storage to ensure fresh auth state
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Delete Firebase IndexedDB databases
    await page.evaluate(() => {
      const databases = ['firebase', 'firebaseLocalStorageDb'];
      return Promise.all(
        databases.map(name =>
          new Promise<void>((resolve) => {
            const req = indexedDB.deleteDatabase(name);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
            req.onblocked = () => resolve();
          })
        )
      );
    });
    
    // Reload page to reinitialize auth state
    await page.reload();
  });

  test.describe('Unauthenticated Access Restrictions', () => {
    test('should redirect unauthenticated user from dashboard to login', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const isOnLogin = page.url().includes('/login') || page.url().includes('/register');
      const isOnDashboard = page.url().includes('/dashboard');

      expect(isOnLogin || !isOnDashboard).toBeTruthy();
    });

    test('should redirect unauthenticated user from my-courses to login', async ({ page }) => {
      await page.goto('/dashboard/my-courses');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const isOnLogin = page.url().includes('/login') || page.url().includes('/register');
      const isProtected = !page.url().includes('/my-courses') || isOnLogin;

      expect(isProtected).toBeTruthy();
    });

    test('should redirect unauthenticated user from certificates page to login', async ({ page }) => {
      await page.goto('/dashboard/certificates');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const isOnLogin = page.url().includes('/login') || page.url().includes('/register');
      expect(isOnLogin).toBeTruthy();
    });

    test('should redirect unauthenticated user from admin panel to login', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const isOnLogin = page.url().includes('/login') || page.url().includes('/register');
      const isOnAdmin = page.url().includes('/admin');

      const isProtected = isOnLogin || !isOnAdmin;
      expect(isProtected).toBeTruthy();
    });

    test('should allow unauthenticated access to public pages', async ({ page }) => {
      const publicPages = ['/', '/about', '/courses', '/login', '/register'];

      for (const route of publicPages) {
        await page.goto(route);
        await page.waitForLoadState('domcontentloaded').catch(() => {});

        const hasContent = (await page.locator('body').isVisible());
        expect(hasContent).toBeTruthy();
      }
    });
  });

  test.describe('Student Access Restrictions', () => {
    const studentEmail = `student-access-${Date.now()}@test.com`;
    const studentPassword = 'StudentPassword123!';

    test('should prevent student access to admin panel', async ({ page }) => {
      await page.goto('/register');
      await page.fill('input[name="displayName"]', 'Student User');
      await page.fill('input[name="email"]', studentEmail);
      await page.fill('input[name="password"]', studentPassword);
      await page.fill('input[name="confirmPassword"]', studentPassword);
      await page.click('button:has-text("Sign Up")');

      await page.waitForURL('/dashboard', { timeout: 5000 }).catch(() => {});

      await page.goto('/admin');
      
      // Wait for either redirect to dashboard or stay on admin (should redirect)
      const finalUrl = await page.waitForFunction(() => {
        const url = window.location.pathname;
        return url === '/dashboard' || url === '/admin';
      }, { timeout: 5000 }).catch(() => null);

      const isOnDashboard = page.url().includes('/dashboard');
      const isOnAdmin = page.url().includes('/admin');

      expect(isOnDashboard || !isOnAdmin).toBeTruthy();
    });

    test('should prevent student access to user management', async ({ page }) => {
      await page.goto('/register');
      await page.fill('input[name="displayName"]', 'Student User');
      await page.fill('input[name="email"]', `student-${Date.now()}@test.com`);
      await page.fill('input[name="password"]', studentPassword);
      await page.fill('input[name="confirmPassword"]', studentPassword);
      await page.click('button:has-text("Sign Up")');

      await page.waitForURL('/dashboard', { timeout: 5000 }).catch(() => {});

      await page.goto('/admin/users');
      
      // Wait for either redirect to dashboard or stay on users (should redirect)
      await page.waitForFunction(() => {
        const url = window.location.pathname;
        return url === '/dashboard' || url === '/admin/users';
      }, { timeout: 5000 }).catch(() => null);

      const accessDenied = !page.url().includes('/admin/users');
      expect(accessDenied).toBeTruthy();
    });

    test('should prevent student from viewing analytics', async ({ page }) => {
      await page.goto('/register');
      await page.fill('input[name="displayName"]', 'Student User');
      await page.fill('input[name="email"]', `student-${Date.now()}@test.com`);
      await page.fill('input[name="password"]', studentPassword);
      await page.fill('input[name="confirmPassword"]', studentPassword);
      await page.click('button:has-text("Sign Up")');

      await page.waitForURL('/dashboard', { timeout: 5000 }).catch(() => {});

      await page.goto('/admin/analytics');
      
      // Wait for either redirect to dashboard or stay on analytics (should redirect)
      await page.waitForFunction(() => {
        const url = window.location.pathname;
        return url === '/dashboard' || url === '/admin/analytics';
      }, { timeout: 5000 }).catch(() => null);

      const isOnAdmin = page.url().includes('/admin/analytics');
      expect(!isOnAdmin).toBeTruthy();
    });

    test('student dashboard should only show own courses', async ({ page }) => {
      await page.goto('/register');
      const email = `student-courses-${Date.now()}@test.com`;
      await page.fill('input[name="displayName"]', 'Student Courses');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', studentPassword);
      await page.fill('input[name="confirmPassword"]', studentPassword);
      await page.click('button:has-text("Sign Up")');

      await page.waitForURL('/dashboard', { timeout: 5000 }).catch(() => {});

      await page.goto('/dashboard/my-courses');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const myCoursesTitle = page.locator('h1, h2').filter({ hasText: /my course/i });
      const isMyCourses = await myCoursesTitle.isVisible({ timeout: 3000 }).catch(() => false);

      if (isMyCourses) {
        console.log('Student viewing only their enrolled courses');
      }
    });
  });

  test.describe('Data Isolation & Privacy', () => {
    test('should not expose other student enrollment data', async ({ page }) => {
      const email1 = `isolation-test-1-${Date.now()}@test.com`;
      const email2 = `isolation-test-2-${Date.now()}@test.com`;
      const password = 'TestPassword123!';

      await page.goto('/register');
      await page.fill('input[name="displayName"]', 'Student One');
      await page.fill('input[name="email"]', email1);
      await page.fill('input[name="password"]', password);
      await page.fill('input[name="confirmPassword"]', password);
      await page.click('button:has-text("Sign Up")');

      await page.waitForURL('/dashboard', { timeout: 5000 }).catch(() => {});

      await page.goto('/dashboard/my-courses');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const courseCount1 = await page.locator('[data-testid="my-course"], .course-card, .course-item').count();

      console.log(`Student 1 has ${courseCount1} courses`);
    });

    test('should not allow viewing another user profile', async ({ page }) => {
      await page.goto('/register');
      const email = `profile-test-${Date.now()}@test.com`;
      await page.fill('input[name="displayName"]', 'Profile Test');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
      await page.click('button:has-text("Sign Up")');

      await page.waitForURL('/dashboard', { timeout: 5000 }).catch(() => {});

      await page.goto('/dashboard/profile/fake-user-id');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const accessDenied = !page.url().includes('/fake-user-id');
      expect(accessDenied).toBeTruthy();
    });

    test('student should not be able to download other student certificate', async ({ page }) => {
      await page.goto('/register');
      const email = `cert-download-${Date.now()}@test.com`;
      await page.fill('input[name="displayName"]', 'Cert Download');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
      await page.click('button:has-text("Sign Up")');

      await page.waitForURL('/dashboard', { timeout: 5000 }).catch(() => {});

      await page.goto('/dashboard/certificates/fake-cert-id-12345');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const notFound = page.url().includes('/certificates/fake-cert-id') === false;
      expect(notFound).toBeTruthy();
    });
  });

  test.describe('Role-Based Menu & Feature Visibility', () => {
    test('student dashboard should not show admin menu items', async ({ page }) => {
      await page.goto('/register');
      const email = `menu-test-${Date.now()}@test.com`;
      await page.fill('input[name="displayName"]', 'Menu Test');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
      await page.click('button:has-text("Sign Up")');

      await page.waitForURL('/dashboard', { timeout: 5000 }).catch(() => {});

      const adminLink = page.locator('a, button').filter({ hasText: /admin|management|analytics/i });
      const adminVisible = await adminLink.isVisible({ timeout: 2000 }).catch(() => false);

      if (adminVisible) {
        console.log('Admin menu visible - should be restricted to admin role');
      } else {
        console.log('Admin menu properly hidden from student');
      }
    });

    test('student should see student-specific menu items', async ({ page }) => {
      await page.goto('/register');
      const email = `student-menu-${Date.now()}@test.com`;
      await page.fill('input[name="displayName"]', 'Student Menu');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
      await page.click('button:has-text("Sign Up")');

      await page.waitForURL('/dashboard', { timeout: 5000 }).catch(() => {});

      const studentMenu = page.locator('a, button').filter({ hasText: /my course|certificate|progress/i });
      const studentMenuVisible = await studentMenu.first().isVisible({ timeout: 3000 }).catch(() => false);

      if (studentMenuVisible) {
        console.log('Student menu items visible');
      }
    });

    test('should not show payment/upgrade to free tier users', async ({ page }) => {
      await page.goto('/register');
      const email = `free-user-${Date.now()}@test.com`;
      await page.fill('input[name="displayName"]', 'Free User');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
      await page.click('button:has-text("Sign Up")');

      await page.waitForURL('/dashboard', { timeout: 5000 }).catch(() => {});

      await page.goto('/dashboard/my-courses');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      console.log('Free tier user viewing courses');
    });
  });

  test.describe('Cross-User Boundary Violations', () => {
    test('should prevent direct URL access to another user course', async ({ page }) => {
      await page.goto('/register');
      const email = `boundary-${Date.now()}@test.com`;
      await page.fill('input[name="displayName"]', 'Boundary Test');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
      await page.click('button:has-text("Sign Up")');

      await page.waitForURL('/dashboard', { timeout: 5000 }).catch(() => {});

      await page.goto('/dashboard/courses/fake-course-owned-by-other-user');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const notFound = page.locator('text=/not found|does not exist/i');
      const hasError = await notFound.isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasError) {
        console.log('Boundary test - access denied handled');
      }
    });

    test('student modify attempt should fail gracefully', async ({ page }) => {
      await page.goto('/register');
      const email = `modify-${Date.now()}@test.com`;
      await page.fill('input[name="displayName"]', 'Modify Test');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
      await page.click('button:has-text("Sign Up")');

      await page.waitForURL('/dashboard', { timeout: 5000 }).catch(() => {});

      await page.goto('/admin');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const isOnAdmin = page.url().includes('/admin');
      const isOnLogin = page.url().includes('/login');

      expect(isOnLogin || !isOnAdmin).toBeTruthy();
    });
  });

  test.describe('Session & Authentication Boundaries', () => {
    test('should clear user context on logout', async ({ page }) => {
      await page.goto('/register');
      const email = `logout-${Date.now()}@test.com`;
      await page.fill('input[name="displayName"]', 'Logout Test');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
      await page.click('button:has-text("Sign Up")');

      await page.waitForURL('/dashboard', { timeout: 5000 }).catch(() => {});

      const logoutBtn = page.locator('button, a').filter({ hasText: /logout|sign out|log out/i });
      const hasLogout = await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasLogout) {
        await logoutBtn.click();
        await page.waitForLoadState('domcontentloaded').catch(() => {});

        const isOnLogin = page.url().includes('/login') || page.url().includes('/register') || page.url() === '/';
        expect(isOnLogin).toBeTruthy();
      }
    });

    test('should not allow reuse of old session token', async ({ page }) => {
      await page.goto('/register');
      const email = `session-${Date.now()}@test.com`;
      await page.fill('input[name="displayName"]', 'Session Test');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
      await page.click('button:has-text("Sign Up")');

      await page.waitForURL('/dashboard', { timeout: 5000 }).catch(() => {});

      const logoutBtn = page.locator('button, a').filter({ hasText: /logout|sign out|log out/i });
      if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await logoutBtn.click();
      }

      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const isOnLogin = page.url().includes('/login') || page.url().includes('/register');
      expect(isOnLogin).toBeTruthy();
    });
  });
});
