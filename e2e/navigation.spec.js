import { test, expect } from '@playwright/test';

/**
 * Navigation Tests
 *
 * Verify all main pages are accessible and render correctly.
 * These tests catch routing issues and broken pages.
 */

test.describe('Navigation', () => {
  test.describe('Main Pages Load', () => {
    const pages = [
      { path: '/', title: /ChiStartup/i, heading: true },
      { path: '/resources', title: /Resources/i, heading: true },
      { path: '/funding', title: /Funding/i, heading: true },
      { path: '/events', title: /Events/i, heading: true },
      { path: '/community', title: /Community/i, heading: true },
      { path: '/workspaces', title: /Workspaces/i, heading: true },
      { path: '/accelerators-incubators', title: /Accelerators/i, heading: true },
      { path: '/stories', title: /Stories|Blueprints/i, heading: true },
      { path: '/opportunities', title: /Opportunities|Asks/i, heading: true },
      { path: '/about', title: /About/i, heading: true },
      { path: '/contact', title: /Contact/i, heading: true },
    ];

    for (const { path, title, heading } of pages) {
      test(`${path} loads correctly`, async ({ page }) => {
        await page.goto(path);

        // Page should load without error
        await expect(page.locator('#root')).not.toBeEmpty();

        // Should have a heading
        if (heading) {
          await expect(
            page.getByRole('heading', { level: 1 }).or(page.getByRole('heading', { level: 2 }))
          ).toBeVisible({ timeout: 10000 });
        }
      });
    }
  });

  test.describe('Header Navigation', () => {
    test('navigation links work', async ({ page }) => {
      await page.goto('/');

      // Click Resources link
      await page.getByRole('link', { name: /resources/i }).first().click();
      await expect(page).toHaveURL(/resources/);

      // Click Funding link
      await page.getByRole('link', { name: /funding/i }).first().click();
      await expect(page).toHaveURL(/funding/);

      // Click Events link
      await page.getByRole('link', { name: /events/i }).first().click();
      await expect(page).toHaveURL(/events/);
    });

    test('logo navigates to homepage', async ({ page }) => {
      await page.goto('/resources');

      // Click logo/brand
      await page.getByRole('link', { name: /chistartuphub|home/i }).first().click();
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('404 Handling', () => {
    test('unknown route shows 404 or redirects', async ({ page }) => {
      await page.goto('/this-page-does-not-exist-12345');

      // Either shows 404 page or redirects to home
      const is404 = await page.getByText(/404|not found|page doesn't exist/i).isVisible().catch(() => false);
      const isHome = page.url().endsWith('/');

      expect(is404 || isHome).toBeTruthy();
    });
  });
});
