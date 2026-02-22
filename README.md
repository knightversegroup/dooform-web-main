# Dooform Monorepo

An Nx-powered monorepo containing the Dooform platform — a form builder and document management system.

## Applications

| App | Description | Path |
|-----|-------------|------|
| **dooform-frontend** | Main web app (forms, templates, user dashboard, admin) | `apps/dooform-frontend` |
| **dooform-backoffice** | Admin back-office panel | `apps/dooform-backoffice` |
| **dooform-console** | Console management dashboard | `apps/dooform-console` |
| **dooform-salespage** | Marketing / landing page | `apps/dooform-salespage` |

## Tech Stack

- **Framework:** Next.js 16 + React 19
- **Language:** TypeScript ~5.9
- **Styling:** Tailwind CSS v4
- **Auth:** Firebase Authentication
- **Build System:** Nx 22
- **Package Manager:** pnpm 10
- **Testing:** Vitest + Jest (unit), Playwright (E2E)
- **Linting:** ESLint 9 (flat config) + Prettier
- **Git Hooks:** Husky + Commitlint (conventional commits)

## Getting Started

## Way of Work
Please refer to the [Contributing Guidelines](./documents/Way-of-Work.md) for information on how to contribute to this project.

### Prerequisites

- Node.js >= 20
- pnpm >= 9

### Installation

```bash
pnpm install
```

### Development

```bash
# Run all apps
pnpm dev

# Run specific apps
pnpm dev:frontend
pnpm dev:backoffice
```

### Build

```bash
# Build all apps
pnpm build

# Build via Nx directly
pnpm exec nx build dooform-frontend
```

### Testing

```bash
# Run unit tests (watch mode)
pnpm test

# Run unit tests (single run)
pnpm test:run

# Run E2E tests
pnpm exec nx e2e dooform-backoffice-e2e
```

### Linting

```bash
pnpm lint
```

## Project Structure

```
dooform-monorepo/
├── apps/
│   ├── dooform-frontend/        # Main Next.js application
│   │   ├── app/                 # App router (pages, layouts, components)
│   │   ├── components/          # Shared UI components
│   │   ├── lib/                 # Utilities, hooks
│   │   └── public/              # Static assets
│   ├── dooform-backoffice/      # Back-office Next.js app
│   ├── dooform-console/         # Console Next.js app
│   ├── dooform-salespage/       # Landing page Next.js app
│   ├── dooform-backoffice-e2e/  # Playwright E2E tests
│   ├── dooform-console-e2e/
│   └── dooform-salespage-e2e/
├── libs/
│   └── shared/                  # @dooform/shared library
│       └── src/
│           ├── api/             # API client, types, address service
│           ├── auth/            # AuthProvider, hooks (useAuth, useIsAdmin, useQuota)
│           ├── constants/       # Colors, design tokens
│           ├── firebase/        # Firebase config & initialization
│           └── utils/           # Error handler, logger, field utilities
├── documents/                   # Internal documentation
├── nx.json                      # Nx workspace configuration
├── pnpm-workspace.yaml          # pnpm workspace definition
└── package.json                 # Root scripts & dependencies
```

## Shared Library

The `@dooform/shared` package (`libs/shared`) provides common utilities across all apps:

```typescript
import { useAuth, apiClient, AuthProvider } from '@dooform/shared';
```

**Exports:** API client, Firebase auth context & hooks, color constants, error handling, and logging utilities.

## Installing Dependencies

```bash
# Add to a specific app
pnpm --filter dooform-frontend add <package>

# Add dev dependency to shared lib
pnpm --filter @dooform/shared add -D <package>

# Add to root workspace
pnpm add -Dw <package>
```

## Environment Variables

A root `.env` file is symlinked into each app. Key variables:

```
NEXT_PUBLIC_API_URL=<api-url>
NEXT_PUBLIC_FIREBASE_*=<firebase-config>
NEXT_PUBLIC_POSTHOG_KEY=<posthog-key>
NEXT_PUBLIC_MAINTENANCE_MODE=false
```

## Nx Commands

```bash
# Visualize dependency graph
pnpm graph

# Run a target for a specific project
pnpm exec nx <target> <project>

# Run a target across all projects
pnpm exec nx run-many -t <target>
```

## Git Workflow

- **Conventional commits** enforced via commitlint (`feat:`, `fix:`, `chore:`, etc.)
- **Pre-commit hook** runs `nx run-many -t test:run` to validate all tests pass
- **Branch strategy:** `main` (production), `dev` (development), feature branches

## Deployment

Each app can be deployed independently to Vercel or any Node.js-compatible hosting.
