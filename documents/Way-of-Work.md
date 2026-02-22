# Way of Work (WoW)

## Monorepo Overview

This project uses **Nx** with **pnpm workspaces** to manage multiple Next.js apps and shared libraries in a single repository.

### Structure

```
dooform-web-main/
├── apps/
│   ├── dooform-frontend/        # Legacy app
│   ├── dooform-backoffice/      # Back-office admin app
│   ├── dooform-console/         # Console app
│   ├── dooform-salespage/       # Sales/landing page app
│   ├── dooform-backoffice-e2e/  # E2E tests for backoffice
│   ├── dooform-console-e2e/     # E2E tests for console
│   └── dooform-salespage-e2e/   # E2E tests for salespage
├── libs/
│   └── shared/                  # @dooform/shared — shared utilities, API client, auth, constants
├── documents/                   # Project documentation
├── nx.json                      # Nx configuration
├── tsconfig.base.json           # Shared TypeScript config
├── pnpm-workspace.yaml          # Workspace definition (apps/*, libs/*)
├── package.json                 # Root scripts & workspace-level deps
├── commitlint.config.mjs        # Conventional commit enforcement
└── .env                         # Environment variables (symlinked to apps)
```

### Projects

| Project | Type | Description |
|---------|------|-------------|
| `dooform-frontend` | App | Main user-facing Next.js app |
| `dooform-backoffice` | App | Admin back-office app |
| `dooform-console` | App | Console management app |
| `dooform-salespage` | App | Sales/landing page |
| `@dooform/shared` | Library | Shared code (API client, auth, utils, constants, firebase) |

---

## Scripts

### Root-level (`pnpm <script>`)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run **all** apps in dev mode (parallel) |
| `pnpm dev:frontend` | Run only `dooform-frontend` |
| `pnpm dev:backoffice` | Run only `dooform-backoffice` |
| `pnpm build` | Build all projects |
| `pnpm lint` | Lint all projects |
| `pnpm test` | Run tests across all projects (watch mode) |
| `pnpm test:run` | Run tests across all projects (single run) |
| `pnpm graph` | Open Nx dependency graph |

### Running a specific project with Nx

```bash
# Dev server
npx nx dev dooform-frontend

# Build
npx nx build dooform-backoffice

# Test
npx nx test dooform-frontend

# Lint
npx nx lint dooform-console
```

---

## Installing Dependencies

Use `--filter` to install packages in a specific project from the root — no need to `cd`.

```bash
# Install to a specific app
pnpm --filter dooform-frontend add firebase

# Install dev dependency
pnpm --filter dooform-frontend add -D vitest

# Install to shared lib
pnpm --filter @dooform/shared add -D @types/react

# Install to root (workspace tooling only)
pnpm add -Dw some-tool
```

---

## Shared Library (`@dooform/shared`)

The shared library at `libs/shared/` is published as `@dooform/shared` (workspace protocol). Apps depend on it via:

```json
"dependencies": {
  "@dooform/shared": "workspace:*"
}
```

### Importing from shared

```typescript
// Named imports from barrel export
import { apiClient, useAuth, logger } from '@dooform/shared';

// Deep imports for specific modules
import { apiClient } from '@dooform/shared/api/client';
import { useAuth } from '@dooform/shared/auth/hooks';
import { SECTION_COLORS } from '@dooform/shared/constants/colors';
```

### What's in shared

- `api/` — API client, types, address service
- `auth/` — Auth context, hooks, types
- `constants/` — Colors, shared constants
- `firebase/` — Firebase config
- `utils/` — Logger, error handler, field types

---

## Adding a New App

```bash
npx nx generate @nx/next:application --name=my-app --directory=apps/my-app
```

Then add `@dooform/shared` as a dependency in the new app's `package.json`:

```json
"dependencies": {
  "@dooform/shared": "workspace:*"
}
```

---

## Git Workflow

### Commit Convention

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) enforced by **commitlint** + **husky**.

```
feat: add new feature
fix: resolve login bug
chore: update dependencies
docs: update Way-of-Work
refactor: extract shared utils
```

### Pre-commit Hook

On every commit, the pre-commit hook runs `nx run-many -t test:run` to execute tests across all projects.

### Branch Naming

- `main` — production
- `feat/<name>` — new features
- `fix/<name>` — bug fixes
- `chore/<name>` — maintenance

---

## Environment Variables

The `.env` file lives at the repo root and is symlinked into each app directory. Next.js loads `.env` from the project root (where `next.config.ts` lives).

Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

---

## Useful Nx Commands

```bash
# See all projects
npx nx show projects

# See dependency graph
npx nx graph

# Run affected tests only (based on git changes)
npx nx affected -t test

# Run affected builds
npx nx affected -t build

# Reset Nx cache
npx nx reset
```
