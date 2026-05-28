# CLAUDE.md — Frontend

@../../AGENTS.md
@../../CLAUDE.md

## Domain

React 19 frontend. TypeScript strict mode. Vite build.

## Structure

Follow `docs/SDS.md` frontend structure:

```
src/
  pages/           — Route-level page components (one per route)
  components/      — Reusable UI components (shadcn/ui + custom)
  hooks/           — Custom React hooks (data fetching, UI state)
  services/        — API call functions (called by TanStack Query hooks)
  store/           — Zustand global state (auth only)
  routes/          — React Router route definitions
  lib/             — Utilities
```

## State Management

- **Zustand**: global auth state only (`store/auth.store.ts`)
- **TanStack Query**: all server state — notes, tags, search results
- No local `useState` for data that belongs in server state

## Rules

- Import Zod schemas and types from `@notepad/shared` — never redefine them
- All API calls go through `services/` — no `fetch`/`axios` in components
- Use TanStack Query `useQuery` / `useMutation` for all data operations
- Rich text editor: TipTap only
- UI components: shadcn/ui — do not build custom components for things shadcn covers
- No `any` types

## Testing

- Framework: Vitest + React Testing Library
- E2E: Playwright (`playwright.config.ts`)
- Run unit: `pnpm --filter frontend test`
- Run E2E: `pnpm --filter frontend test:e2e`

## Quality Gates

```bash
pnpm --filter frontend build
pnpm --filter frontend lint --max-warnings 0
pnpm --filter frontend test
```
