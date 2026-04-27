import { test, expect } from '@playwright/test';

/**
 * Navigation Tests
 *
 * Basic smoke tests to verify pages load without crashing.
 * These catch routing issues and broken pages.
 */

test.describe('Navigation', () => {
  const pages = [
    '/',
    '/resources',
    '/funding',
    '/events',
    '/community',
  ];

  for (const path of pages) {
    test(`${path} loads without error`, async ({ page }) => {
      // Track if any uncaught errors occur
      let pageError = null;
      page.on('pageerror', (err) => { pageError = err; });

      const response = await page.goto(path);

      // Page should return success status
      expect(response?.status()).toBeLessThan(400);

      // App root should render
      await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });

      // No uncaught JS errors
      expect(pageError).toBeNull();
    });
  }

  test('404 handling works', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-xyz123');

    // Should either show 404 content or redirect - either is fine
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 10000 });
  });
});
