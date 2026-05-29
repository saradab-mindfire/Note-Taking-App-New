import type { Page } from '@playwright/test';

export class RegisterPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/register');
    await this.page.waitForSelector('text=Create account');
  }

  async register(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').first().fill(password);
    await this.page.getByLabel('Confirm password').fill(password);
    await this.page.getByRole('button', { name: 'Create account' }).click();
  }

  async getErrorMessage(): Promise<string | null> {
    const el = this.page.locator('p.text-destructive');
    if (await el.isVisible()) return el.textContent();
    return null;
  }
}
