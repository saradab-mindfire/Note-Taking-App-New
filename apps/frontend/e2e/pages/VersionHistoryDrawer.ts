import type { Page } from '@playwright/test';

export class VersionHistoryDrawer {
  constructor(private page: Page) {}

  async waitForOpen() {
    await this.page.waitForSelector('[data-state="open"][role="dialog"], [data-testid="version-history-drawer"], .version-history', { timeout: 5000 });
  }

  async getVersionCount(): Promise<number> {
    const items = this.page.locator('[role="listitem"], li').filter({ hasText: /Restore|version/i });
    return items.count();
  }

  async restoreVersion(index: number) {
    const restoreButtons = this.page.getByRole('button', { name: /Restore/i });
    await restoreButtons.nth(index).click();
    await this.page.waitForResponse(
      (res) => res.url().includes('/restore') && res.status() === 200,
      { timeout: 5000 },
    );
  }

  async close() {
    const closeBtn = this.page.getByRole('button', { name: /close|dismiss/i }).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await this.page.keyboard.press('Escape');
    }
  }
}
