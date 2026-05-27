## Context

The project starts as an empty repository. All three packages — `apps/frontend`, `apps/backend`, `packages/shared` — must be bootstrapped from scratch in a single ticket to avoid cross-ticket blocking. The SDS defines the stack and database schema; this design translates those choices into a concrete directory layout, dependency wiring, and tooling configuration.

## Goals / Non-Goals

**Goals:**
- Single `pnpm-workspace.yaml` managing all three packages
- TypeScript strict mode enabled everywhere; `packages/shared` is a local dependency of both apps
- ESLint + Prettier enforced at the root; Husky pre-commit hook runs lint + type-check; commitlint enforces conventional commits
- Prisma schema covering all seven tables from the SDS with correct relations and soft-delete convention
- Vitest configured for `apps/backend` and `packages/shared`; Playwright configured for `apps/frontend`
- `pnpm build`, `pnpm lint`, `pnpm test` work from the repo root

**Non-Goals:**
- Implementing any business logic (auth, notes, search, etc.)
- Docker / CI pipeline configuration
- Environment variable management beyond `.env.example`
- Database seeding or migrations beyond the initial schema

## Decisions

### 1. Package layout: `apps/` + `packages/` pattern
Using `apps/frontend`, `apps/backend`, and `packages/shared` separates deployable applications from shared library code.  
**Alternative considered**: flat `frontend/`, `backend/`, `shared/` — rejected because it doesn't scale when more packages are added (e.g., `packages/types`, `packages/ui`).

### 2. TypeScript project references for `packages/shared`
`packages/shared` is compiled with `tsc --build` and consumed via the `exports` field in its `package.json`. Both apps reference it via `workspace:*` in their `package.json`.  
**Alternative considered**: Path aliases only (no separate build) — rejected because it couples the apps' build processes too tightly and doesn't produce a clean publishable package boundary.

### 3. Prisma in `apps/backend` only
The Prisma client and schema live entirely in `apps/backend/prisma/`. `packages/shared` exports Zod schemas derived from the same shape but never imports Prisma types directly.  
**Alternative considered**: Prisma in a separate `packages/db` package — rejected as over-engineering for a single-backend app; can be extracted later if needed.

### 4. Single root ESLint + Prettier config
One `.eslintrc.cjs` and one `.prettierrc` at the root; each package extends/inherits the root config. This avoids config drift between packages.  
**Alternative considered**: Per-package configs — rejected because it duplicates rules and makes global rule changes expensive.

### 5. Husky pre-commit runs `pnpm lint --max-warnings 0` and `pnpm tsc --noEmit`
Failing fast on lint and type errors before commit prevents broken code from entering the history. The `--max-warnings 0` flag ensures warnings are treated as errors.  
**Alternative considered**: Running full tests in pre-commit — rejected because test runs are too slow for a pre-commit hook; tests belong in CI.

### 6. Initial Prisma schema uses `String @db.Text` for note content
Note content can be large (TipTap JSON or HTML). Using `TEXT` in PostgreSQL avoids `varchar(255)` truncation.

### 7. GIN index on `notes` for full-text search deferred to the search ticket
The SDS specifies PostgreSQL FTS with `tsvector`/`tsquery`. Adding the GIN index now would be premature — it belongs in the dedicated search ticket where the column definition and query patterns are fully specified.

## Risks / Trade-offs

- **Risk**: TypeScript project references add build-step complexity → **Mitigation**: `packages/shared` has a simple `tsc` build with no bundler; `apps/backend` and `apps/frontend` use `tsc` and Vite respectively and both support `workspace:*` deps natively.
- **Risk**: pnpm workspace version mismatches between apps → **Mitigation**: All devDependencies pinned at the root via `pnpm` catalog or explicit versions; `pnpm lint` catches peer dep issues.
- **Risk**: Prisma schema drift from Zod schemas in `packages/shared` → **Mitigation**: Zod schemas are hand-authored once at setup; a note in `packages/shared/README.md` documents that they must be kept in sync with the Prisma schema. Automated sync (e.g., `zod-prisma`) is a future concern.
- **Risk**: Husky not installed on fresh clone → **Mitigation**: `prepare` script in root `package.json` runs `husky install` automatically on `pnpm install`.

## Migration Plan

1. Run `pnpm install` from repo root — installs all workspace deps and runs `husky install` via `prepare` script.
2. Run `pnpm build` to compile `packages/shared` and verify TypeScript project references resolve.
3. Copy `.env.example` to `.env`, fill in `DATABASE_URL`, then run `pnpm --filter backend prisma migrate dev --name init` to apply the initial migration.
4. Run `pnpm lint --max-warnings 0` and `pnpm test` to confirm green baseline before merging.

**Rollback**: Delete the branch. No database state exists until the migration is explicitly run.

## Open Questions

- None blocking for this ticket. Future tickets will decide: JWT secret rotation strategy, Docker Compose setup for local Postgres, and whether to add `zod-prisma` for schema sync.
