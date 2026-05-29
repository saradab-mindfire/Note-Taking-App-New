import { randomUUID } from 'crypto';
import type { APIRequestContext } from '@playwright/test';
import { API_URL } from './auth.fixture';

export interface CreatedNote {
  id: string;
  title: string;
}

export interface CreatedTag {
  id: string;
  name: string;
}

export interface CreatedShareLink {
  token: string;
  shareUrl: string;
}

export async function createNote(
  request: APIRequestContext,
  accessToken: string,
  overrides: { title?: string; content?: string; tagIds?: string[] } = {},
): Promise<CreatedNote> {
  const title = overrides.title ?? `Test Note ${randomUUID()}`;
  const res = await request.post(`${API_URL}/api/notes`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { title, content: overrides.content ?? '', tagIds: overrides.tagIds ?? [] },
  });
  if (!res.ok()) throw new Error(`createNote failed: ${await res.text()}`);
  const body = await res.json() as { success: boolean; data: { id: string; title: string } };
  return { id: body.data.id, title: body.data.title };
}

export async function updateNote(
  request: APIRequestContext,
  accessToken: string,
  noteId: string,
  data: { title?: string; content?: string; tagIds?: string[] },
): Promise<void> {
  const res = await request.patch(`${API_URL}/api/notes/${noteId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data,
  });
  if (!res.ok()) throw new Error(`updateNote failed: ${await res.text()}`);
}

export async function deleteNote(
  request: APIRequestContext,
  accessToken: string,
  noteId: string,
): Promise<void> {
  await request.delete(`${API_URL}/api/notes/${noteId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function createTag(
  request: APIRequestContext,
  accessToken: string,
  overrides: { name?: string; color?: string } = {},
): Promise<CreatedTag> {
  const name = overrides.name ?? `tag-${randomUUID().slice(0, 8)}`;
  const color = overrides.color ?? '#6366f1';
  const res = await request.post(`${API_URL}/api/tags`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { name, color },
  });
  if (!res.ok()) throw new Error(`createTag failed: ${await res.text()}`);
  const body = await res.json() as { success: boolean; data: { id: string; name: string } };
  return { id: body.data.id, name: body.data.name };
}

export async function deleteTag(
  request: APIRequestContext,
  accessToken: string,
  tagId: string,
): Promise<void> {
  await request.delete(`${API_URL}/api/tags/${tagId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function createShareLink(
  request: APIRequestContext,
  accessToken: string,
  noteId: string,
  options: { expiresAt?: string } = {},
): Promise<CreatedShareLink> {
  const res = await request.post(`${API_URL}/api/notes/${noteId}/share`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { expiresAt: options.expiresAt },
  });
  if (!res.ok()) throw new Error(`createShareLink failed: ${await res.text()}`);
  const body = await res.json() as { success: boolean; data: { token: string; shareUrl: string } };
  return { token: body.data.token, shareUrl: body.data.shareUrl };
}
