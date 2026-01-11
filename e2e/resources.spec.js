import { test, expect } from '@playwright/test';

/**
 * Resources Page Tests
 *
 * Test the founder toolkit/resources functionality.
 */

test.describe('Resources Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resources');
  });

  test('page loads with sections', async ({ page }) => {
    // Should have main heading
    await expect(
      page.getByRole('heading', { name: /resources|toolkit|founder/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('accordion sections expand', async ({ page }) => {
    // Find accordion triggers
    const accordionTriggers = page.getByRole('button').filter({
      has: page.locator('[data-state]'),
    });

    // Alternative: look for collapsible sections
    const sections = page.locator('[data-state="closed"]');

    if ((await sections.count()) > 0) {
      // Click first closed section
      await sections.first().click();

      // Should expand
      await expect(
        page.locator('[data-state="open"]')
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('resource links are valid', async ({ page }) => {
    // Find external links
    const links = page.locator('a[href^="http"]');
    const count = await links.count();

    // Check first few links have href
    for (let i = 0; i < Math.min(count, 5); i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toMatch(/^https?:\/\//);
    }
  });

  test('save/bookmark button appears for resources', async ({ page }) => {
    // Look for heart/bookmark icons
    const bookmarkButtons = page.getByRole('button').filter({
      has: page.locator('svg'),
    });

    // Resources should have some interactive elements
    expect(await bookmarkButtons.count()).toBeGreaterThan(0);
  });
});

test.describe('Funding Page', () => {
  test('funding opportunities load', async ({ page }) => {
    await page.goto('/funding');

    // Should have heading
    await expect(
      page.getByRole('heading', { name: /funding|capital|investors/i })
    ).toBeVisible({ timeout: 10000 });

    // Should have some content (cards, list items, etc.)
    await page.waitForTimeout(1000);
    await expect(page.locator('#root')).not.toBeEmpty();
  });

  test('funding filters work', async ({ page }) => {
    await page.goto('/funding');

    // Look for filter/sort options
    const filters = page.getByRole('combobox').or(
      page.getByRole('button').filter({ hasText: /filter|sort|type/i })
    );

    if ((await filters.count()) > 0) {
      // Interact with filter
      await filters.first().click();
      await page.waitForTimeout(300);

      // Should show options
      const options = page.getByRole('option').or(page.getByRole('menuitem'));
      if ((await options.count()) > 0) {
        await options.first().click();
      }

      // Should not cause errors
      await expect(page.locator('#root')).not.toBeEmpty();
    }
  });
});

test.describe('Events Page', () => {
  test('events page loads', async ({ page }) => {
    await page.goto('/events');

    await expect(
      page.getByRole('heading', { name: /events|calendar|upcoming/i })
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Community Page', () => {
  test('community page loads', async ({ page }) => {
    await page.goto('/community');

    await expect(
      page.getByRole('heading', { name: /community|communities|groups/i })
    ).toBeVisible({ timeout: 10000 });
  });
});
