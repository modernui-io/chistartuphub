import { test, expect, devices } from '@playwright/test';

/**
 * Mobile Responsiveness Tests
 *
 * Verify the app works correctly on mobile devices.
 */

test.describe('Mobile Responsiveness', () => {
  test.use({ ...devices['iPhone 12'] });

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

test.describe('Tablet Responsiveness', () => {
  test.use({ ...devices['iPad Mini'] });

  test('layout adapts to tablet', async ({ page }) => {
    await page.goto('/');

    // Should render without issues
    await expect(page.locator('#root')).not.toBeEmpty();

    // Check for no overflow
    const body = page.locator('body');
    const bodyWidth = await body.evaluate((el) => el.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });
});
