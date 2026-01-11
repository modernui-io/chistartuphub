import { test, expect } from '@playwright/test';

/**
 * Opportunities Page Tests
 *
 * Basic smoke tests for the opportunities/founder asks page.
 */

test.describe('Opportunities Page', () => {
  test('page loads without error', async ({ page }) => {
    let pageError = null;
    page.on('pageerror', (err) => { pageError = err; });

    const response = await page.goto('/opportunities');

    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });
    expect(pageError).toBeNull();
  });

  test('has interactive elements', async ({ page }) => {
    await page.goto('/opportunities');

    // Should have some buttons (filters, actions, etc.)
    const buttons = page.getByRole('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('search input exists if present', async ({ page }) => {
    await page.goto('/opportunities');

    const searchInput = page.getByPlaceholder(/search/i).or(page.getByRole('searchbox'));

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Search should be usable
      await searchInput.fill('test');
      await page.waitForTimeout(300);

      // App should not crash
      await expect(page.locator('#root')).not.toBeEmpty();
    }
  });
});
