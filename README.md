# SWEDINOX-MONOREPO

A pnpm + Turborepo monorepo containing two Next.js 16 applications.

## Structure

```
SWEDINOX-MONOREPO/
├── apps/
│   ├── dashboard/        # Admin dashboard  → http://localhost:3000
│   └── marketing/        # Marketing page   → http://localhost:3001
├── packages/             # Shared packages (add as needed)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9

```bash
npm install -g pnpm
```

### Install dependencies

```bash
pnpm install
```

### Development

Run both apps at the same time:

```bash
pnpm dev
```

Run a single app:

```bash
pnpm dev:dashboard   # http://localhost:3000
pnpm dev:marketing   # http://localhost:3001
```

### Build

```bash
pnpm build                  # Build all apps
pnpm build:dashboard        # Build dashboard only
pnpm build:marketing        # Build marketing only
```

### Lint & Format

```bash
pnpm lint
pnpm format
```

## Apps

| App         | Port | Package name           |
| ----------- | ---- | ---------------------- |
| `dashboard` | 3000 | `@swedinox/dashboard`  |
| `marketing` | 3001 | `@swedinox/marketing`  |
