import { test, expect } from '@playwright/test';

/**
 * Authentication Tests
 *
 * Basic tests for auth UI functionality.
 */

test.describe('Authentication', () => {
  test('homepage has sign in button', async ({ page }) => {
    await page.goto('/');

    // Should have some auth-related button
    const authButton = page.getByRole('button', { name: /sign|log|join|get started/i });

    // At least one auth button should exist
    expect(await authButton.count()).toBeGreaterThan(0);
  });

  test('auth button opens modal or navigates', async ({ page }) => {
    await page.goto('/');

    const authButton = page.getByRole('button', { name: /sign in|log in/i }).first();

    if (await authButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await authButton.click();

      // Should either open modal or change URL
      await page.waitForTimeout(500);

      const hasModal = await page.getByRole('dialog').isVisible().catch(() => false);
      const urlChanged = !page.url().endsWith('/');

      expect(hasModal || urlChanged).toBeTruthy();
    }
  });

  test('protected route redirects unauthenticated users', async ({ page }) => {
    await page.goto('/profile');

    // Should not show profile content without auth
    // Either redirects, shows login, or shows auth prompt
    await page.waitForTimeout(1000);

    const onProfilePage = page.url().includes('/profile');
    const hasAuthPrompt = await page.getByRole('dialog').isVisible().catch(() => false);
    const hasLoginText = await page.getByText(/sign in|log in/i).isVisible().catch(() => false);

    // If still on profile, should have auth prompt
    if (onProfilePage) {
      expect(hasAuthPrompt || hasLoginText).toBeTruthy();
    }
    // Otherwise redirect is fine
  });
});
