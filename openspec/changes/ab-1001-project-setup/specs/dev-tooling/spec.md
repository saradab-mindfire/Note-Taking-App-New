## ADDED Requirements

### Requirement: ESLint enforces consistent code style across all packages
A root-level ESLint configuration SHALL be present and SHALL apply TypeScript-aware rules to all `.ts` and `.tsx` files in the monorepo. Each package MAY extend the root config but SHALL NOT disable rules that the root config sets to `error`.

#### Scenario: ESLint runs without errors on a clean scaffold
- **WHEN** a developer runs `pnpm lint --max-warnings 0` on the freshly scaffolded codebase
- **THEN** ESLint SHALL exit with code 0 and report no errors or warnings

#### Scenario: ESLint catches a type-unsafe pattern
- **WHEN** a developer introduces an `any` type annotation in a TypeScript file
- **THEN** ESLint SHALL report an error and `pnpm lint --max-warnings 0` SHALL exit with a non-zero code

### Requirement: Prettier enforces consistent formatting across all packages
A root-level `.prettierrc` configuration SHALL be present. Prettier SHALL be runnable via `pnpm format` and its formatting rules SHALL not conflict with ESLint rules.

#### Scenario: Prettier formats a file idempotently
- **WHEN** a developer runs `pnpm format` twice on any source file
- **THEN** the second run SHALL produce no diff, confirming idempotency

### Requirement: Husky pre-commit hook runs lint and type-check
A Husky pre-commit hook SHALL run `pnpm lint --max-warnings 0` and a TypeScript type-check (`tsc --noEmit`) before each commit. The hook SHALL be installed automatically on `pnpm install` via the `prepare` script.

#### Scenario: Pre-commit hook blocks a commit with lint errors
- **WHEN** a developer attempts to commit a file that contains an ESLint error
- **THEN** the pre-commit hook SHALL fail and the commit SHALL be aborted

#### Scenario: Pre-commit hook blocks a commit with type errors
- **WHEN** a developer attempts to commit a file that contains a TypeScript type error
- **THEN** the pre-commit hook SHALL fail and the commit SHALL be aborted

#### Scenario: Pre-commit hook is installed on fresh clone
- **WHEN** a developer runs `pnpm install` on a fresh clone of the repository
- **THEN** the `.husky/` directory SHALL be populated and the pre-commit hook SHALL be active

### Requirement: commitlint enforces conventional commit messages
A `commitlint.config.cjs` SHALL be present at the repo root configured with `@commitlint/config-conventional`. A Husky `commit-msg` hook SHALL run commitlint on every commit message.

#### Scenario: commitlint rejects a non-conventional message
- **WHEN** a developer attempts to commit with the message `"fixed stuff"`
- **THEN** the `commit-msg` hook SHALL fail and the commit SHALL be aborted

#### Scenario: commitlint accepts a conventional message
- **WHEN** a developer commits with the message `"feat(backend): add health check endpoint AB#1001"`
- **THEN** the `commit-msg` hook SHALL pass and the commit SHALL succeed

### Requirement: Vitest is configured for backend and shared packages
`apps/backend` and `packages/shared` SHALL each have a `vitest.config.ts` (or inline Vitest config in `vite.config.ts`). Running `pnpm test` from the repo root SHALL execute all Vitest test suites.

#### Scenario: Vitest runs with zero tests on clean scaffold
- **WHEN** a developer runs `pnpm test` on the freshly scaffolded codebase
- **THEN** Vitest SHALL exit with code 0 (no failures, zero test suites is acceptable at this stage)

### Requirement: Playwright is configured for the frontend package
`apps/frontend` SHALL include a `playwright.config.ts`. Running `pnpm --filter frontend test:e2e` SHALL invoke the Playwright test runner.

#### Scenario: Playwright config is valid
- **WHEN** a developer runs `pnpm --filter frontend exec playwright --version`
- **THEN** the command SHALL succeed, confirming Playwright is installed and resolvable
