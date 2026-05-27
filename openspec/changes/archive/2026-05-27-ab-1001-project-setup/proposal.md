## Why

The note-taking application requires a fully-configured pnpm monorepo as its foundation before any feature work can begin. Setting up the workspace now establishes consistent tooling, shared types, and database schema that all future tickets will depend on.

## What Changes

- Initialize pnpm workspace with three packages: `apps/frontend`, `apps/backend`, `packages/shared`
- Scaffold `apps/frontend` with React 19, TypeScript, Vite, Zustand, TanStack Query, TipTap, and shadcn/ui
- Scaffold `apps/backend` with Node.js 22, Express 5, TypeScript, and Prisma ORM
- Create `packages/shared` containing all Zod schemas, shared TypeScript types, and API contracts
- Configure root-level ESLint, Prettier, Husky, and commitlint
- Configure Vitest for unit testing across backend and shared packages; Playwright for frontend E2E
- Define the initial Prisma schema covering all seven tables (users, refresh_tokens, notes, tags, note_tags, shared_links, note_versions)
- Wire TypeScript path aliases so `apps/frontend` and `apps/backend` consume `packages/shared`

## Capabilities

### New Capabilities

- `monorepo-workspace`: pnpm workspace structure, TypeScript project references, and shared package wiring for frontend and backend
- `dev-tooling`: Root-level ESLint, Prettier, Husky pre-commit hooks, and commitlint enforcement
- `database-schema`: Initial Prisma schema with all tables, relations, and soft-delete convention

### Modified Capabilities

<!-- None — this is the initial project setup; no existing specs exist -->

## Impact

- **All future tickets**: Depend on this workspace structure; nothing else can be implemented without this foundation
- **packages/shared**: Establishes the single source of truth for types and Zod schemas used by both apps
- **Database**: Creates the canonical schema; all subsequent migrations branch from this initial state
- **CI/Tooling**: Husky and commitlint enforce conventional commits from the first commit
