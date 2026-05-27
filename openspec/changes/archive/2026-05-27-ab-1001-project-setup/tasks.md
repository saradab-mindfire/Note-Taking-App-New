## 1. Workspace Root

- [x] 1.1 Create `pnpm-workspace.yaml` declaring `apps/*` and `packages/*` globs
- [x] 1.2 Create root `package.json` with `name`, `private: true`, and `scripts`: `build`, `lint`, `test`, `format`, `prepare`
- [x] 1.3 Create root `tsconfig.json` in composite/references mode; add project references for all three packages
- [x] 1.4 Add root `.eslintrc.cjs` with `@typescript-eslint` recommended rules and `no-explicit-any: error`
- [x] 1.5 Add root `.prettierrc` with project formatting defaults (single quotes, 2-space indent, trailing commas)
- [x] 1.6 Add `.gitignore` covering `node_modules`, `dist`, `.env`, Prisma client, and Playwright artifacts
- [x] 1.7 Add `.env.example` with `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `PORT`

## 2. Dev Tooling

- [x] 2.1 Install Husky (`husky`) and add `prepare` script to root `package.json` (`husky install`)
- [x] 2.2 Create `.husky/pre-commit` hook that runs `pnpm lint --max-warnings 0` and `pnpm tsc --noEmit`
- [x] 2.3 Install `@commitlint/cli` and `@commitlint/config-conventional`; create `commitlint.config.cjs`
- [x] 2.4 Create `.husky/commit-msg` hook that runs `commitlint --edit $1`
- [x] 2.5 Verify hooks fire correctly on a test commit (lint passes, bad commit message is rejected)

## 3. packages/shared

- [x] 3.1 Create `packages/shared/package.json` with `name: "@notepad/shared"`, `exports` map, and `build` script (`tsc --build`)
- [x] 3.2 Create `packages/shared/tsconfig.json` extending root config with `composite: true` and `declaration: true`
- [x] 3.3 Install `zod` as a dependency of `packages/shared`
- [x] 3.4 Create `packages/shared/src/schemas/user.ts` with Zod schemas for User (create, update)
- [x] 3.5 Create `packages/shared/src/schemas/note.ts` with Zod schemas for Note (create, update)
- [x] 3.6 Create `packages/shared/src/schemas/tag.ts` with Zod schemas for Tag (create, update)
- [x] 3.7 Create `packages/shared/src/schemas/auth.ts` with Zod schemas for login, register, refresh-token
- [x] 3.8 Create `packages/shared/src/types/index.ts` exporting all inferred TypeScript types from schemas
- [x] 3.9 Create `packages/shared/src/index.ts` as the barrel export for all schemas and types
- [x] 3.10 Run `pnpm --filter shared build` and confirm `dist/` is emitted with `.d.ts` files

## 4. apps/backend

- [x] 4.1 Create `apps/backend/package.json` with `name: "backend"`, `workspace:*` dep on `@notepad/shared`, Express 5, Prisma, and dev deps (tsx, typescript)
- [x] 4.2 Create `apps/backend/tsconfig.json` extending root config with a project reference to `packages/shared`
- [x] 4.3 Configure Vitest in `apps/backend/vitest.config.ts` with `globals: true` and `environment: 'node'`
- [x] 4.4 Create `apps/backend/prisma/schema.prisma` with `provider = "postgresql"` and all seven models: `User`, `RefreshToken`, `Note`, `Tag`, `NoteTag`, `SharedLink`, `NoteVersion`
- [x] 4.5 Add correct Prisma relations: User→Note, User→RefreshToken, User→Tag, Note→NoteTag, Tag→NoteTag, Note→SharedLink, Note→NoteVersion
- [x] 4.6 Add `deletedAt DateTime?` to the `Note` model for soft delete
- [x] 4.7 Run `pnpm --filter backend prisma validate` and confirm no schema errors
- [x] 4.8 Run `pnpm --filter backend prisma generate` and confirm Prisma client generates without errors
- [x] 4.9 Create `apps/backend/src/index.ts` with a minimal Express app that starts on `PORT` (health check at `GET /health` returning `{ status: "ok" }`)
- [x] 4.10 Add `dev` script to `apps/backend/package.json` using `tsx watch src/index.ts`
- [x] 4.11 Run `pnpm --filter backend dev` and confirm server starts without errors

## 5. apps/frontend

- [x] 5.1 Scaffold `apps/frontend` using `pnpm create vite` with React + TypeScript template
- [x] 5.2 Add `workspace:*` dep on `@notepad/shared` to `apps/frontend/package.json`
- [x] 5.3 Create `apps/frontend/tsconfig.json` extending root config with a project reference to `packages/shared`
- [x] 5.4 Install Zustand, TanStack Query (`@tanstack/react-query`), TipTap core packages
- [x] 5.5 Install and initialize shadcn/ui (`pnpm dlx shadcn-ui@latest init`)
- [x] 5.6 Install Playwright and create `apps/frontend/playwright.config.ts` pointing to `http://localhost:5173`
- [x] 5.7 Run `pnpm --filter frontend dev` and confirm Vite dev server starts without errors
- [x] 5.8 Run `pnpm --filter frontend exec playwright --version` and confirm Playwright is installed

## 6. Validation

- [x] 6.1 Run `pnpm build` from repo root and confirm all three packages compile without errors
- [x] 6.2 Run `pnpm lint --max-warnings 0` from repo root and confirm zero errors and warnings
- [x] 6.3 Run `pnpm test` from repo root and confirm Vitest exits with code 0
- [ ] 6.4 Apply the initial Prisma migration against a local PostgreSQL 16 database: `pnpm --filter backend prisma migrate dev --name init`
- [ ] 6.5 Confirm all seven tables exist in the database after migration
