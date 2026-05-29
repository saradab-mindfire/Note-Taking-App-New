import type { Page, APIRequestContext } from '@playwright/test';

export class ShareModal {
  constructor(private page: Page) {}

  async generateLink(): Promise<string> {
    await Promise.all([
      this.page.waitForResponse(
        (res) => res.url().includes('/api/notes/') && res.url().includes('/share') && res.status() === 201,
        { timeout: 8000 },
      ),
      this.page.getByRole('button', { name: /Generate link/i }).click(),
    ]);
    const urlSpan = this.page.locator('span.truncate').first();
    return (await urlSpan.textContent()) ?? '';
  }

  async close() {
    await this.page.keyboard.press('Escape');
  }

  async getShareUrls(): Promise<string[]> {
    const spans = this.page.locator('span.truncate');
    const count = await spans.count();
    const urls: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await spans.nth(i).textContent();
      if (text?.includes('/share/')) urls.push(text.trim());
    }
    return urls;
  }
}

export async function fetchPublicShare(request: APIRequestContext, shareUrl: string) {
  const res = await request.get(shareUrl);
  return { status: res.status(), body: await res.json() as Record<string, unknown> };
}
