import type { Page } from '@playwright/test';

export class NoteEditorPage {
  constructor(private page: Page) {}

  async goto(noteId?: string) {
    const path = noteId ? `/notes/${noteId}` : '/notes/new';
    await this.page.goto(path);
    await this.page.waitForSelector('input[placeholder="Note title"]');
  }

  async setTitle(title: string) {
    const input = this.page.locator('input[placeholder="Note title"]');
    await input.fill(title);
  }

  async typeContent(text: string) {
    const editor = this.page.locator('.tiptap[contenteditable="true"]');
    await editor.click();
    await editor.pressSequentially(text);
  }

  async getContent(): Promise<string> {
    const editor = this.page.locator('.tiptap[contenteditable="true"]');
    return (await editor.textContent()) ?? '';
  }

  async waitForAutosave() {
    await this.page.waitForResponse(
      (res) => res.url().includes('/api/notes/') && res.request().method() === 'PATCH' && res.status() === 200,
      { timeout: 5000 },
    );
  }

  async save() {
    await this.page.getByRole('button', { name: 'Save' }).click();
    await this.page.waitForResponse(
      (res) => res.url().includes('/api/notes') && res.status() < 300,
      { timeout: 5000 },
    );
  }

  async openHistory() {
    await this.page.getByRole('button', { name: 'History' }).click();
  }

  async openShare() {
    await this.page.getByRole('button', { name: 'Share' }).click();
    await this.page.waitForSelector('[role="dialog"]');
  }

  async getSaveStatus(): Promise<string> {
    const span = this.page.locator('span.text-muted-foreground, span.text-destructive').first();
    return (await span.textContent()) ?? '';
  }
}
