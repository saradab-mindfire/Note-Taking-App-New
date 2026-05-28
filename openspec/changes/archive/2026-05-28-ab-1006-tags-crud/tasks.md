## 1. Shared Package — Zod Schemas and Types

- [x] 1.1 Add `createTagSchema` to `packages/shared/src/schemas/tag.ts` — `name` (string, 1–50 chars, `.trim()`), optional `color` (string)
- [x] 1.2 Add `updateTagSchema` (all fields from `createTagSchema` made optional) to the same file
- [x] 1.3 Add `tagResponseSchema` with `id`, `userId`, `name`, `color`, `noteCount` (number), `createdAt`, `updatedAt`
- [x] 1.4 Export `createTagSchema`, `updateTagSchema`, `tagResponseSchema`, and inferred TypeScript types from `packages/shared/src/index.ts`
- [x] 1.5 Build `packages/shared` and confirm no TypeScript errors (`pnpm --filter shared build`)

## 2. Database — Prisma Schema and Migration

- [x] 2.1 Add `@@unique([userId, name])` to the `Tag` model in `apps/backend/prisma/schema.prisma`
- [x] 2.2 Run `pnpm --filter backend prisma migrate dev --name add-tag-unique-user-name` and commit the generated migration file
- [x] 2.3 Run `pnpm --filter backend prisma generate` to refresh the Prisma client

## 3. Backend — Tags Service

- [x] 3.1 Create `apps/backend/src/tags/tags.service.ts` with `createTag` — trim name, check for duplicate (case-insensitive) per user, insert via Prisma, return tag
- [x] 3.2 Add `listTags` to service — `findMany` filtered by `userId`, include `_count: { select: { noteTags: true } }`, order by `createdAt asc`, map `_count.noteTags` to `noteCount`
- [x] 3.3 Add `updateTag` to service — verify ownership (throw 404 if not found/unowned), check new name for duplicate, update via Prisma
- [x] 3.4 Add `deleteTag` to service — verify ownership (throw 404 if not found/unowned), delete tag (Prisma cascade removes `NoteTag` rows automatically via `onDelete: Cascade`)

## 4. Backend — Controller and Router

- [x] 4.1 Create `apps/backend/src/tags/tags.controller.ts` — four handler functions (`createTag`, `listTags`, `updateTag`, `deleteTag`) that validate request bodies with `createTagSchema` / `updateTagSchema`, call the service, and return standard `{ success, data }` responses
- [x] 4.2 Create `apps/backend/src/tags/tags.router.ts` — register `POST /`, `GET /`, `PATCH /:id`, `DELETE /:id` behind the auth middleware
- [x] 4.3 Register the tags router in `apps/backend/src/app.ts` at `/tags`

## 5. Tests — Integration Tests

- [x] 5.1 Create `apps/backend/src/tags/tags.test.ts` with test setup (create user, obtain JWT)
- [x] 5.2 Write tests for `POST /tags`: success with name only, success with color, duplicate name → 409, missing name → 400, no auth → 401
- [x] 5.3 Write tests for `GET /tags`: returns tags with correct `noteCount`, empty array when no tags, only own tags returned, no auth → 401
- [x] 5.4 Write tests for `PATCH /tags/:id`: rename success, recolor success, duplicate rename → 409, unowned tag → 404, no auth → 401
- [x] 5.5 Write tests for `DELETE /tags/:id`: success → 204, note associations removed, unowned tag → 404, no auth → 401

## 6. Validation

- [x] 6.1 Run `pnpm build` and fix any TypeScript errors
- [x] 6.2 Run `pnpm lint --max-warnings 0` and fix any lint issues
- [x] 6.3 Run `pnpm test` and confirm all tests pass
