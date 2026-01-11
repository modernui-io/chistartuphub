import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Basic sanity checks
 *
 * These tests verify the app loads and basic functionality works.
 * They should run quickly and catch obvious regressions.
 */

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/ChiStartup/i);

    // Check main heading is visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Check navigation is present
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('no console errors on homepage', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known acceptable errors (e.g., favicon 404)
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('app renders without crashing', async ({ page }) => {
    await page.goto('/');

    // Check that React has mounted (no error boundary)
    await expect(page.locator('#root')).not.toBeEmpty();

    // Check no "Something went wrong" error
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });
});
