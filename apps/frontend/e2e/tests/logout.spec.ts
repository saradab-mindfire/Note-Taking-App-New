import { expect } from '@playwright/test';
import { test } from '../fixtures';

test.describe('Scenario 7 — Logout and protected route enforcement', () => {
  test('logout clears session and redirects to login', async ({ authenticatedPage: page }) => {
    await expect(page.locator('h1:has-text("My Notes")')).toBeVisible();

    const logoutBtn = page.getByRole('button', { name: /logout|sign out|log out/i });
    await logoutBtn.click();

    await page.waitForURL('/login');
    await expect(page.locator('text=Sign in')).toBeVisible();
  });

  test('navigating to /notes without auth redirects to /login', async ({ page }) => {
    await page.goto('/notes');
    await page.waitForURL('/login');
    await expect(page.locator('text=Sign in')).toBeVisible();
  });

  test('navigating to a note editor without auth redirects to /login', async ({ page }) => {
    await page.goto('/notes/some-note-id');
    await page.waitForURL('/login');
  });
});
