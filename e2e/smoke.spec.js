import { test, expect } from '@playwright/test';

/**
 * Smoke Tests
 *
 * Quick sanity checks to verify the app loads.
 * These run first and should catch obvious breakages.
 */

test.describe('Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    const response = await page.goto('/');

    // Should return success status
    expect(response?.status()).toBeLessThan(400);

    // App should render
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });
  });

  test('no uncaught exceptions', async ({ page }) => {
    let pageError = null;
    page.on('pageerror', (err) => { pageError = err; });

    await page.goto('/');
    await page.waitForTimeout(2000);

    expect(pageError).toBeNull();
  });

  test('app is interactive', async ({ page }) => {
    await page.goto('/');

    // Should have at least one clickable button
    const buttons = page.getByRole('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });
});
