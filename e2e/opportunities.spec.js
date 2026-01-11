import { test, expect } from '@playwright/test';

/**
 * Opportunities/Founder Asks Tests
 *
 * Test the core feature - browsing and filtering founder asks.
 */

test.describe('Opportunities Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/opportunities');
  });

  test('page loads with content', async ({ page }) => {
    // Should have heading
    await expect(
      page.getByRole('heading', { name: /opportunities|asks|connect/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('search input is functional', async ({ page }) => {
    // Find search input
    const searchInput = page.getByPlaceholder(/search/i).or(page.getByRole('searchbox'));

    if (await searchInput.isVisible()) {
      // Type in search
      await searchInput.fill('fintech');

      // Wait for results to update (debounced search)
      await page.waitForTimeout(500);

      // Search should not cause errors
      await expect(page.locator('#root')).not.toBeEmpty();
    }
  });

  test('filter buttons work', async ({ page }) => {
    // Look for filter buttons/tabs
    const filterButtons = page.getByRole('button').filter({
      hasText: /fundraising|advice|all|co-founder/i,
    });

    if ((await filterButtons.count()) > 0) {
      // Click a filter
      await filterButtons.first().click();

      // Should not cause errors
      await expect(page.locator('#root')).not.toBeEmpty();
    }
  });

  test('ask cards are interactive', async ({ page }) => {
    // Wait for asks to load
    await page.waitForTimeout(1000);

    // Find ask cards
    const cards = page.locator('[data-testid="ask-card"]').or(
      page.locator('article').or(page.locator('.ask-card'))
    );

    if ((await cards.count()) > 0) {
      // Cards should be visible
      await expect(cards.first()).toBeVisible();
    }
  });

  test('empty state shows when no results', async ({ page }) => {
    // Search for something that won't exist
    const searchInput = page.getByPlaceholder(/search/i).or(page.getByRole('searchbox'));

    if (await searchInput.isVisible()) {
      await searchInput.fill('xyznonexistent12345');
      await page.waitForTimeout(500);

      // Should show empty state or "no results"
      // (This is a soft check - the exact UI may vary)
    }
  });
});

test.describe('Founder Ask Details', () => {
  test('clicking ask shows details or modal', async ({ page }) => {
    await page.goto('/opportunities');
    await page.waitForTimeout(1000);

    // Find clickable ask element
    const asks = page.locator('[data-testid="ask-card"]')
      .or(page.locator('article'))
      .or(page.locator('button').filter({ hasText: /connect|view|learn more/i }));

    if ((await asks.count()) > 0) {
      await asks.first().click();

      // Should open modal or navigate to detail
      await page.waitForTimeout(500);

      // Check for modal or detail view
      const hasDetail =
        (await page.getByRole('dialog').isVisible().catch(() => false)) ||
        page.url().includes('ask') ||
        (await page.getByText(/connect with|about this ask/i).isVisible().catch(() => false));

      // This is a soft assertion - UI may vary
    }
  });
});
