import { test as base, expect } from '@playwright/test';
import { randomUUID } from 'crypto';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { API_URL } from '../fixtures/auth.fixture';

const test = base;

test.describe('Scenario 1 — Registration and login', () => {
  test('registers a new user, logs in, and redirects to notes list', async ({ page }) => {
    const id = randomUUID();
    const email = `test-${id}@e2e.test`;
    const password = 'TestPassword123!';

    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.register(email, password);

    await page.waitForURL('/login');
    await expect(page.locator('text=Account created')).toBeVisible();

    const loginPage = new LoginPage(page);
    await loginPage.login(email, password);

    await page.waitForURL('/notes');
    await expect(page.locator('h1:has-text("My Notes")')).toBeVisible();
  });

  test('shows error message for invalid login credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('notexist@e2e.test', 'wrongpassword');

    await expect(page.locator('p.text-destructive')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('shows error for duplicate email on registration', async ({ request, page }) => {
    const id = randomUUID();
    const email = `test-${id}@e2e.test`;
    const password = 'TestPassword123!';

    await request.post(`${API_URL}/api/auth/register`, { data: { email, password } });

    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.register(email, password);

    await expect(page.locator('p.text-destructive')).toBeVisible();
  });
});
