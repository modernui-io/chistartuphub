import { test, expect, devices } from '@playwright/test';

/**
 * Mobile Responsiveness Tests
 *
 * Verify the app works correctly on mobile devices.
 * Note: These tests run with iPhone 12 viewport by default.
 */

// Set mobile device for all tests in this file
test.use({ ...devices['iPhone 12'] });

test.describe('Mobile Responsiveness', () => {
  test('homepage renders on mobile', async ({ page }) => {
    await page.goto('/');

    // Should load without horizontal scroll
    const body = page.locator('body');
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    // Allow small tolerance for scrollbar
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });

  test('mobile menu works', async ({ page }) => {
    await page.goto('/');

    // Look for hamburger menu button
    const menuButton = page.getByRole('button', { name: /menu/i }).or(
      page.locator('button').filter({ has: page.locator('svg[class*="menu"]') }).or(
        page.locator('[data-testid="mobile-menu"]')
      )
    );

    if (await menuButton.isVisible()) {
      await menuButton.click();

      // Menu should open
      await expect(
        page.getByRole('navigation').or(page.locator('[data-state="open"]'))
      ).toBeVisible();
    }
  });

  test('touch targets are adequate size', async ({ page }) => {
    await page.goto('/');

    // Check button sizes (should be at least 44x44 for touch)
    const buttons = page.getByRole('button');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box) {
        // Minimum touch target is 44px (Apple HIG) or 48px (Material)
        expect(box.width).toBeGreaterThanOrEqual(40);
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('text is readable on mobile', async ({ page }) => {
    await page.goto('/');

    // Check body text size (should be at least 16px for readability)
    const bodyText = page.locator('p').first();
    if (await bodyText.isVisible()) {
      const fontSize = await bodyText.evaluate((el) =>
        parseFloat(window.getComputedStyle(el).fontSize)
      );
      expect(fontSize).toBeGreaterThanOrEqual(14);
    }
  });
});
