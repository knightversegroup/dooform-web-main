# Dooform Monorepo

This monorepo contains the Dooform web applications:

- **apps/web** - Main Next.js application (forms, templates, user dashboard)
- **apps/salespage** - SvelteKit marketing/landing page

## Tech Stack

### Web App (apps/web)
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Firebase Auth

### Salespage (apps/salespage)
- SvelteKit 2
- Svelte 5
- TypeScript
- Tailwind CSS v4

## Getting Started

### Prerequisites
- Node.js >= 20
- pnpm >= 9

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Run both apps in parallel
pnpm dev

# Run only the web app
pnpm dev:web

# Run only the salespage
pnpm dev:salespage
```

### Build

```bash
# Build all apps
pnpm build

# Build only the web app
pnpm build:web

# Build only the salespage
pnpm build:salespage
```

## Project Structure

```
dooform-web-main/
├── apps/
│   ├── web/              # Next.js main application
│   │   ├── app/          # App router pages and components
│   │   ├── lib/          # Utilities, API client, auth
│   │   └── public/       # Static assets
│   └── salespage/        # SvelteKit marketing site
│       ├── src/
│       │   ├── lib/      # Svelte components
│       │   └── routes/   # SvelteKit pages
│       └── static/       # Static assets
├── packages/             # Shared packages (future)
├── package.json          # Root workspace config
└── pnpm-workspace.yaml   # pnpm workspace definition
```

## Environment Variables

### Web App (apps/web/.env)
```
NEXT_PUBLIC_API_URL=your-api-url
NEXT_PUBLIC_FIREBASE_*=firebase-config
```

### Salespage (apps/salespage/.env)
```
VITE_APP_URL=http://localhost:3000  # URL to main web app
```

## Deployment

Each app can be deployed independently:

- **Web App**: Deploy to Vercel, AWS, or any Node.js hosting
- **Salespage**: Deploy to Vercel, Netlify, Cloudflare Pages, or any static hosting
