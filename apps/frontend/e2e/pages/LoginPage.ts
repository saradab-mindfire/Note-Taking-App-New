import type { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForSelector('text=Sign in');
  }

  async login(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }

  async getErrorMessage(): Promise<string | null> {
    const el = this.page.locator('p.text-destructive');
    if (await el.isVisible()) return el.textContent();
    return null;
  }
}
