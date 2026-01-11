import { test, expect } from '@playwright/test';

/**
 * Resources & Related Pages Tests
 *
 * Basic smoke tests for resources, funding, events, community pages.
 */

test.describe('Resources Page', () => {
  test('page loads without error', async ({ page }) => {
    let pageError = null;
    page.on('pageerror', (err) => { pageError = err; });

    const response = await page.goto('/resources');

    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });
    expect(pageError).toBeNull();
  });
});

test.describe('Funding Page', () => {
  test('page loads without error', async ({ page }) => {
    let pageError = null;
    page.on('pageerror', (err) => { pageError = err; });

    const response = await page.goto('/funding');

    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });
    expect(pageError).toBeNull();
  });
});

test.describe('Events Page', () => {
  test('page loads without error', async ({ page }) => {
    let pageError = null;
    page.on('pageerror', (err) => { pageError = err; });

    const response = await page.goto('/events');

    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });
    expect(pageError).toBeNull();
  });
});

test.describe('Community Page', () => {
  test('page loads without error', async ({ page }) => {
    let pageError = null;
    page.on('pageerror', (err) => { pageError = err; });

    const response = await page.goto('/community');

    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15000 });
    expect(pageError).toBeNull();
  });
});
