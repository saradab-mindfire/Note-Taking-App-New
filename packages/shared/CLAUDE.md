# CLAUDE.md — Shared Package

@../../AGENTS.md
@../../CLAUDE.md

## Domain

Shared Zod schemas and TypeScript types. Consumed by both `apps/backend` and `apps/frontend`.

## Structure

```
src/
  schemas/         — Zod schemas (one file per domain)
    auth.ts        — registration, login, token schemas
    note.ts        — create, update, filter, response schemas
    tag.ts         — create, update, tag response schemas
    user.ts        — user response schema
  types/
    index.ts       — TypeScript types inferred from Zod schemas
  index.ts         — re-exports everything
```

## Rules

- **This is the only place** Zod schemas are defined — never in `apps/`
- Every schema exported from `src/index.ts`
- Infer TypeScript types from Zod schemas: `export type Foo = z.infer<typeof FooSchema>`
- No runtime logic — schemas and types only
- No imports from `apps/backend` or `apps/frontend`
- Package name: `@notepad/shared`

## Adding a New Schema

1. Add to the relevant file in `src/schemas/`
2. Export the schema and its inferred type
3. Re-export from `src/index.ts`
4. Run `pnpm --filter shared build` to verify

## Quality Gates

```bash
pnpm --filter shared build
pnpm --filter shared lint --max-warnings 0
pnpm --filter shared test
```
