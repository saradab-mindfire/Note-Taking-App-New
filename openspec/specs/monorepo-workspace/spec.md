### Requirement: pnpm workspace contains frontend, backend, and shared packages
The repository SHALL be a pnpm workspace with three members: `apps/frontend`, `apps/backend`, and `packages/shared`. A root `pnpm-workspace.yaml` SHALL declare all three glob patterns.

#### Scenario: Workspace members are recognized
- **WHEN** a developer runs `pnpm list -r` from the repo root
- **THEN** the output SHALL list `frontend`, `backend`, and `shared` as workspace packages

### Requirement: packages/shared is a dependency of both apps
Both `apps/frontend` and `apps/backend` SHALL declare `packages/shared` as a dependency using the `workspace:*` protocol in their respective `package.json` files.

#### Scenario: shared package resolves in frontend
- **WHEN** `apps/frontend` imports a type from `packages/shared`
- **THEN** TypeScript SHALL resolve the import without errors and the build SHALL succeed

#### Scenario: shared package resolves in backend
- **WHEN** `apps/backend` imports a Zod schema from `packages/shared`
- **THEN** TypeScript SHALL resolve the import without errors and the build SHALL succeed

### Requirement: Root build, lint, and test scripts run across all packages
The root `package.json` SHALL define `build`, `lint`, and `test` scripts that execute the equivalent scripts in all workspace packages via `pnpm -r run <script>` or equivalent.

#### Scenario: Root build succeeds
- **WHEN** a developer runs `pnpm build` from the repo root
- **THEN** `packages/shared`, `apps/backend`, and `apps/frontend` SHALL all compile without errors

#### Scenario: Root lint succeeds
- **WHEN** a developer runs `pnpm lint --max-warnings 0` from the repo root
- **THEN** ESLint SHALL report zero errors and zero warnings across all packages

#### Scenario: Root test succeeds
- **WHEN** a developer runs `pnpm test` from the repo root
- **THEN** all Vitest tests in `apps/backend` and `packages/shared` SHALL pass

### Requirement: apps/frontend is scaffolded with the required stack
`apps/frontend` SHALL be a Vite + React 19 + TypeScript application. It SHALL include dependencies for Zustand, TanStack Query, TipTap, and shadcn/ui.

#### Scenario: Frontend dev server starts
- **WHEN** a developer runs `pnpm --filter frontend dev`
- **THEN** the Vite development server SHALL start and serve the application on a local port without errors

### Requirement: apps/backend is scaffolded with the required stack
`apps/backend` SHALL be a Node.js 22 + Express 5 + TypeScript application. It SHALL include Prisma as an ORM dependency and ts-node or tsx for local development.

#### Scenario: Backend server starts
- **WHEN** a developer runs `pnpm --filter backend dev`
- **THEN** the Express server SHALL start on a configured port without errors

### Requirement: packages/shared exports Zod schemas and TypeScript types
`packages/shared` SHALL contain Zod schemas and derived TypeScript types for all domain entities defined in the SDS. It SHALL be compiled with `tsc` and expose an `exports` map in its `package.json`.

#### Scenario: Shared package builds
- **WHEN** a developer runs `pnpm --filter shared build`
- **THEN** TypeScript SHALL emit declaration files (`.d.ts`) and compiled JavaScript to the `dist/` directory without errors

#### Scenario: Shared package exports are importable
- **WHEN** consumer code imports from `@notepad/shared`
- **THEN** TypeScript SHALL resolve all exported types and Zod schemas without `any` or missing-module errors
