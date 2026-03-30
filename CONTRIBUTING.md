# Contributing to SHOGUN

Thanks for your interest in contributing to SHOGUN. This guide will get you set up and productive quickly.

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **Go** 1.22+ (for container agent)
- **Docker** (optional, for local Supabase)
- A [Supabase](https://supabase.com) project (or local instance)

## Getting Started

```bash
# Clone the repo
git clone https://github.com/selectkk/shogun.git
cd shogun

# Install dependencies
pnpm install

# Copy environment template and fill in values
cp .env.example .env.local

# Start all services
pnpm dev
```

See `docs/SETUP.md` for detailed environment configuration.

## Project Structure

```
apps/web          Next.js 15 — dashboard, chat, files, terminal
apps/api          Hono (Node.js) — REST + WebSocket API
apps/desktop      Electron — screen capture, OCR, transcription
packages/shared   Types, constants, i18n
packages/db       Supabase client + database types
packages/ai       Multi-model AI client + tool definitions
packages/memory   Work memory service
packages/transcription  Whisper API wrapper
packages/infra    Fly.io machine management
packages/ui       Shared React components
supabase/         Schema + migrations
docs/             Architecture + API docs
```

For architecture details, see `docs/ARCHITECTURE.md`.

## Development Workflow

### Branch Naming

```
feature/add-memory-search
fix/terminal-reconnect
docs/update-api-reference
chore/upgrade-dependencies
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(memory): add semantic search with date filters
fix(terminal): handle WebSocket reconnection on network change
docs(api): document rate limiting headers
chore(deps): upgrade Next.js to 15.1
```

### Pull Request Process

1. Create a branch from `main`.
2. Make your changes. Keep PRs focused — one feature or fix per PR.
3. Ensure all checks pass: `pnpm lint && pnpm type-check && pnpm test`.
4. Write a clear PR description explaining what and why.
5. Request review. At least one approval is required to merge.
6. Squash and merge into `main`.

## Running Locally

```bash
# All services
pnpm dev

# Individual services
pnpm --filter @shogun/web dev
pnpm --filter @shogun/api dev

# Type checking
pnpm type-check

# Linting
pnpm lint

# Tests
pnpm test
```

## Code Style

- **TypeScript** in strict mode across all packages.
- **ESLint + Prettier** handle formatting. Run `pnpm lint` to check.
- Auto-formatting is configured — use editor integration or run before committing.
- Tailwind CSS v4 for styling. No CSS modules.

## Common Tasks

### Adding a New Package

```bash
mkdir packages/my-package
cd packages/my-package
pnpm init
```

Add to `pnpm-workspace.yaml` if not already covered by the glob pattern. Export types from an `src/index.ts` entry point. Add the package as a dependency where needed: `"@shogun/my-package": "workspace:*"`.

### Adding a New API Route

1. Create a route file in `apps/api/src/routes/`.
2. Define request/response schemas with Zod.
3. Add auth middleware (`requireAuth`).
4. Register the route in the main router.
5. Document the endpoint in `docs/API.md`.

### Adding a New UI Page

1. Create a directory under `apps/web/src/app/` following Next.js App Router conventions.
2. Use shared components from `packages/ui`.
3. Add translations for any user-facing strings.
4. Add the page to navigation if applicable.

### Adding Translations (i18n)

1. Open locale files in `packages/shared/src/i18n/locales/`.
2. Add the key to all three files: `en.ts`, `ja.ts`, `es.ts`.
3. Use the `t()` function to reference the key in components.

All three languages (EN, JA, ES) must be updated together.

## Security

Do NOT open public issues for security vulnerabilities. See [SECURITY.md](./SECURITY.md) for reporting instructions.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
