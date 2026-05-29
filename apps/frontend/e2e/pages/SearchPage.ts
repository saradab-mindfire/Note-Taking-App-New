import type { Page } from '@playwright/test';

export class SearchPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/search');
    await this.page.waitForSelector('input[type="search"], input[placeholder*="earch"]');
  }

  async search(query: string) {
    const input = this.page.locator('input').first();
    await input.fill(query);
    await this.page.waitForResponse(
      (res) => res.url().includes('/api/search') && res.status() === 200,
      { timeout: 5000 },
    );
  }

  async getResults(): Promise<string[]> {
    const items = this.page.locator('[data-result-title], .font-semibold, h2, h3').filter({ hasText: /.+/ });
    const count = await items.count();
    const titles: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent();
      if (text) titles.push(text.trim());
    }
    return titles;
  }

  async openResult(title: string) {
    await this.page.getByText(title).first().click();
    await this.page.waitForURL(/\/notes\/.+/);
  }
}
