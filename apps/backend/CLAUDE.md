# CLAUDE.md — Backend

@../../AGENTS.md
@../../CLAUDE.md

## Domain

Express 5 backend. Node.js 22. TypeScript strict mode.

## Structure

Follow `docs/SDS.md` backend layer order strictly:

```
src/features/<feature>/
  <feature>.router.ts       — Express router, mounts controller handlers
  <feature>.controller.ts   — HTTP layer only: parse req, call service, send res
  <feature>.service.ts      — Business logic only: no HTTP, no direct DB
  <feature>.repository.ts   — Prisma calls only: no business logic
  <feature>.test.ts         — Vitest + Supertest integration tests
```

Shared: `src/lib/`, `src/middleware/`, `src/types/`

## Rules

- No business logic in controllers — delegate to service
- No Prisma calls outside repository files
- No raw SQL except `$queryRaw` for PostgreSQL full-text search
- Soft delete only: set `deletedAt`, never call `prisma.note.delete()`
- All request validation via `validateBody` / `validateQuery` middleware
- Auth protection via `authMiddleware` — applied at router level
- Import Zod schemas from `@notepad/shared` — never define schemas here
- Error responses: `{ success: false, error: { message, code } }` via `AppError`
- Success responses: `{ success: true, data: {} }`

## Testing

- Framework: Vitest + Supertest
- Test files co-located: `src/features/<feature>/<feature>.test.ts`
- Mock Prisma: `vi.mock('../../lib/prisma')`
- Run: `pnpm --filter backend test`

## Quality Gates

```bash
pnpm --filter backend build
pnpm --filter backend lint --max-warnings 0
pnpm --filter backend test
pnpm --filter backend prisma validate
```
