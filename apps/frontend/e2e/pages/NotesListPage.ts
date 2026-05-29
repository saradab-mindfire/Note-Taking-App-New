import type { Page } from '@playwright/test';

export class NotesListPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/notes');
    await this.page.waitForSelector('h1:has-text("My Notes")');
  }

  async openNote(title: string) {
    await this.page.getByRole('link', { name: title }).click();
    await this.page.waitForURL(/\/notes\/.+/);
  }

  async filterByTag(tagName: string) {
    await this.page.getByRole('button', { name: tagName }).click();
    await this.page.waitForResponse((res) => res.url().includes('/api/notes') && res.status() === 200);
  }

  async getNoteTitles(): Promise<string[]> {
    const cards = this.page.locator('h3');
    const count = await cards.count();
    const titles: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await cards.nth(i).textContent();
      if (text) titles.push(text.trim());
    }
    return titles;
  }

  async getNewNoteButton() {
    return this.page.getByRole('link', { name: 'New note' });
  }
}
