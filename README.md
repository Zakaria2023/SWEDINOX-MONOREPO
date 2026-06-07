# SWEDINOX-MONOREPO

A pnpm + Turborepo monorepo powering the Swedinox admin dashboard.

## Structure

```
SWEDINOX-MONOREPO/
├── apps/
│   └── dashboard/        # Admin dashboard  → http://localhost:3000
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

```bash
pnpm dev        # http://localhost:3000
```

### Build

```bash
pnpm build
```

### Lint & Format

```bash
pnpm lint
pnpm format
pnpm format:check
```
