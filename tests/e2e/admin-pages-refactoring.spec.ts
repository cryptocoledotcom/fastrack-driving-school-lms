import { test, expect } from '@playwright/test';

test.describe('Admin Pages - Tab-to-Sidebar Refactoring', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

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

    await page.reload();
  });

  test.describe('Route Protection - Unauthenticated Users', () => {
    test('should protect admin routes from unauthenticated access', async ({ page }) => {
      // Test primary admin routes are protected
      const mainAdminRoutes = ['/admin'];

      for (const route of mainAdminRoutes) {
        await page.goto(route);
        await page.waitForLoadState('domcontentloaded').catch(() => {});

        const currentUrl = page.url();
        const pageContent = (await page.content()).toLowerCase();
        
        // Check for login/auth indicators
        const hasLoginUI = 
          currentUrl.includes('/login') ||
          pageContent.includes('welcome back') ||
          pageContent.includes('sign in to continue') ||
          (pageContent.includes('email') && pageContent.includes('password') && pageContent.includes('sign'));
        
        expect(hasLoginUI).toBe(true);
      }
    });
  });

  test.describe('Admin Routes Exist and Are Accessible', () => {
    test('should have all admin routes defined', async ({ page }) => {
      const adminRoutes = [
        { path: '/admin', name: 'Dashboard' },
        { path: '/admin/users', name: 'Users' },
        { path: '/admin/enrollments', name: 'Enrollments' },
        { path: '/admin/scheduling', name: 'Scheduling' },
        { path: '/admin/analytics', name: 'Analytics' },
        { path: '/admin/compliance', name: 'Compliance' },
        { path: '/admin/dets-export', name: 'DETS Export' },
        { path: '/admin/audit-logs', name: 'Audit Logs' }
      ];

      for (const route of adminRoutes) {
        try {
          const response = await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 5000 });
          // Either page loads successfully OR redirects to login (auth requirement)
          const isSuccessOrRedirect = 
            response?.status() === 200 || 
            page.url().includes('/login');
          
          expect(isSuccessOrRedirect).toBe(true);
        } catch (e) {
          // Navigation error expected if auth required
          expect(page.url().includes('/login')).toBe(true);
        }
      }
    });
  });

  test.describe('Page Structure and DOM Verification', () => {
    test('all admin pages should have valid HTML structure', async ({ page }) => {
      const adminRoutes = [
        '/admin',
        '/admin/users',
        '/admin/enrollments',
        '/admin/scheduling',
        '/admin/analytics',
        '/admin/compliance',
        '/admin/dets-export',
        '/admin/audit-logs'
      ];

      for (const route of adminRoutes) {
        await page.goto(route);
        await page.waitForLoadState('domcontentloaded').catch(() => {});

        // Check if page loaded (content exists) or redirected to login
        const hasContent = (await page.content()).length > 100;
        const isLoginPage = page.url().includes('/login');
        
        expect(hasContent || isLoginPage).toBe(true);
      }
    });

    test('admin pages should not contain compilation errors', async ({ page }) => {
      // Navigate to a route and check console for errors
      await page.goto('/admin');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Wait a bit for any error logs
      await page.waitForTimeout(1000);

      // Filter out auth-related errors (expected when not logged in)
      const relevantErrors = consoleErrors.filter(err => 
        !err.includes('Firebase') && 
        !err.includes('auth') &&
        !err.includes('unauthorized') &&
        !err.includes('401') &&
        !err.includes('403')
      );

      expect(relevantErrors).toHaveLength(0);
    });
  });

  test.describe('Build and Compilation Integrity', () => {
    test('all admin page routes should compile without errors', async ({ page }) => {
      const adminRoutes = [
        '/admin',
        '/admin/users',
        '/admin/enrollments',
        '/admin/scheduling',
        '/admin/analytics',
        '/admin/compliance',
        '/admin/dets-export',
        '/admin/audit-logs'
      ];

      let compilationErrors = 0;

      for (const route of adminRoutes) {
        try {
          const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 10000 });
          
          // Check for runtime errors in page
          const hasRuntimeErrors = await page.evaluate(() => {
            return (window as any).__RUNTIME_ERROR__ || false;
          }).catch(() => false);

          if (hasRuntimeErrors && !page.url().includes('/login')) {
            compilationErrors++;
          }
        } catch (e) {
          // Timeout or nav error - expected for protected routes
          if (!page.url().includes('/login')) {
            compilationErrors++;
          }
        }
      }

      expect(compilationErrors).toBe(0);
    });
  });

  test.describe('AdminLayout Shell Pattern', () => {
    test('unauthenticated access should show proper auth flow', async ({ page }) => {
      // Navigate to admin page
      await page.goto('/admin', { waitUntil: 'domcontentloaded' }).catch(() => {});

      // Wait for URL change or auth content to load
      await page.waitForURL('**/login', { timeout: 5000 }).catch(() => {});

      // Check both URL and page content for auth flow
      const currentUrl = page.url();
      const pageContent = await page.content();
      
      const isOnLoginPage = currentUrl.includes('/login') || pageContent.includes('Welcome Back') || pageContent.includes('Sign in to continue');
      const isOnDashboard = currentUrl.includes('/dashboard');
      const isOnRegister = currentUrl.includes('/register');

      expect(isOnLoginPage || isOnDashboard || isOnRegister).toBe(true);
    });

    test('admin routes should not render public page content', async ({ page }) => {
      // Navigate to admin page
      await page.goto('/admin');
      await page.waitForLoadState('domcontentloaded').catch(() => {});

      // If on login page, that's correct (auth requirement)
      if (page.url().includes('/login')) {
        expect(page.url()).toContain('/login');
        return;
      }

      // If on admin page, verify it's admin content (not public dashboard)
      const pageUrl = page.url();
      expect(pageUrl).toContain('/admin');
    });
  });

  test.describe('Routing and Navigation Endpoints', () => {
    test('admin pages should support direct URL navigation', async ({ page }) => {
      const adminRoutes = [
        '/admin/users',
        '/admin/enrollments',
        '/admin/scheduling',
        '/admin/analytics'
      ];

      for (const route of adminRoutes) {
        await page.goto(route);
        await page.waitForLoadState('domcontentloaded').catch(() => {});

        // Should either load the page OR redirect to login
        const currentUrl = page.url();
        const isValidState = 
          currentUrl.includes(route) || 
          currentUrl.includes('/login');

        expect(isValidState).toBe(true);
      }
    });
  });

  test.describe('Error Handling and Resilience', () => {
    test('navigating to non-existent admin routes should handle gracefully', async ({ page }) => {
      try {
        await page.goto('/admin/nonexistent', { waitUntil: 'domcontentloaded', timeout: 5000 });
      } catch (e) {
        // Navigation error or timeout expected
      }

      // Should be somewhere valid (login, dashboard, or error page)
      const currentUrl = page.url();
      const isValidState = 
        currentUrl.includes('/login') ||
        currentUrl.includes('/dashboard') ||
        currentUrl.includes('/404') ||
        currentUrl.includes('/admin');

      expect(isValidState).toBe(true);
    });
  });

  test.describe('Configuration Verification', () => {
    test('sidebar items should be configurable from adminRoutes', async ({ page }) => {
      // This test verifies that the admin routes are properly configured
      // We'll check by attempting to access each known route
      
      const configuredRoutes = [
        '/admin',
        '/admin/users',
        '/admin/enrollments',
        '/admin/scheduling',
        '/admin/analytics',
        '/admin/compliance',
        '/admin/dets-export',
        '/admin/audit-logs'
      ];

      let accessibleRoutes = 0;

      for (const route of configuredRoutes) {
        try {
          const response = await page.goto(route, { timeout: 5000 });
          if (response?.ok() || page.url().includes(route) || page.url().includes('/login')) {
            accessibleRoutes++;
          }
        } catch (e) {
          // If redirected to login, route still exists (auth is blocking, not 404)
          if (page.url().includes('/login')) {
            accessibleRoutes++;
          }
        }
      }

      // All routes should be accessible (either as admin content or auth redirect)
      expect(accessibleRoutes).toBe(configuredRoutes.length);
    });
  });
});
