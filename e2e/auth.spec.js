import { test, expect } from '@playwright/test';

/**
 * Authentication Tests
 *
 * Verify authentication UI works correctly.
 * Note: These tests don't actually log in (would need test accounts).
 */

test.describe('Authentication', () => {
  test.describe('Login Modal', () => {
    test('login button opens modal', async ({ page }) => {
      await page.goto('/');

      // Find and click login button
      const loginButton = page.getByRole('button', { name: /log ?in|sign ?in/i });

      if (await loginButton.isVisible()) {
        await loginButton.click();

        // Modal should appear
        await expect(page.getByRole('dialog')).toBeVisible();

        // Should have email input
        await expect(page.getByLabel(/email/i)).toBeVisible();

        // Should have password input
        await expect(page.getByLabel(/password/i)).toBeVisible();

        // Should have submit button
        await expect(page.getByRole('button', { name: /sign ?in|log ?in|submit/i })).toBeVisible();
      }
    });

    test('login modal can be closed', async ({ page }) => {
      await page.goto('/');

      const loginButton = page.getByRole('button', { name: /log ?in|sign ?in/i });

      if (await loginButton.isVisible()) {
        await loginButton.click();
        await expect(page.getByRole('dialog')).toBeVisible();

        // Close modal (click X or press Escape)
        await page.keyboard.press('Escape');

        await expect(page.getByRole('dialog')).not.toBeVisible();
      }
    });

    test('shows validation on empty submit', async ({ page }) => {
      await page.goto('/');

      const loginButton = page.getByRole('button', { name: /log ?in|sign ?in/i });

      if (await loginButton.isVisible()) {
        await loginButton.click();

        // Try to submit empty form
        const submitButton = page.getByRole('button', { name: /sign ?in|log ?in|submit/i });
        await submitButton.click();

        // Should show validation (HTML5 or custom)
        const emailInput = page.getByLabel(/email/i);
        const isInvalid =
          (await emailInput.getAttribute('aria-invalid')) === 'true' ||
          (await emailInput.evaluate((el) => !el.checkValidity()));

        expect(isInvalid).toBeTruthy();
      }
    });
  });

  test.describe('Signup Modal', () => {
    test('signup button opens modal', async ({ page }) => {
      await page.goto('/');

      // Find and click signup button
      const signupButton = page.getByRole('button', { name: /sign ?up|get started|join/i });

      if (await signupButton.isVisible()) {
        await signupButton.click();

        // Modal should appear
        await expect(page.getByRole('dialog')).toBeVisible();
      }
    });
  });

  test.describe('Protected Routes', () => {
    test('profile page requires authentication', async ({ page }) => {
      await page.goto('/profile');

      // Should either redirect to login or show auth modal
      const hasLoginPrompt =
        (await page.getByRole('dialog').isVisible().catch(() => false)) ||
        (await page.getByText(/sign in|log in|create account/i).isVisible().catch(() => false)) ||
        page.url().includes('login');

      expect(hasLoginPrompt).toBeTruthy();
    });
  });
});
