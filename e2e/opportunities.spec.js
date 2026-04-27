import { test, expect } from '@playwright/test';

test.describe('Sunset Opportunities Route', () => {
  test('redirects to events without error', async ({ page }) => {
    let pageError = null;
    page.on('pageerror', (err) => {
      if (!err.message.includes('WebSocket')) {
        pageError = err;
      }
    });

    const response = await page.goto('/opportunities');

    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/events$/i);
    await expect(page.locator('[data-page="events"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });
    expect(pageError).toBeNull();
  });
});
