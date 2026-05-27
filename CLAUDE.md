# CLAUDE.md

@AGENTS.md

## Rules

- Ask [y/n] before every file write
- Run build, lint, test after every phase
- Use shared package for all schemas and types
- Never duplicate zod schemas
- Use Prisma ORM only
- Use PostgreSQL full-text search only
- Use conventional commits

## Commands

```bash
pnpm build
pnpm lint --max-warnings 0
pnpm test
```

## Branch Naming

feature/{domain}/AB-{ticket}-{name}

## Commit Format

feat(scope): description AB#ticket
