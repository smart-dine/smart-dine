# Smart Dine

Smart Dine is a full-stack restaurant platform for discovery, reservations, cashier workflows, kiosk operations, and role-based administration.

## What Is Included

- Monorepo powered by pnpm workspaces + Turborepo
- NestJS API with Better Auth, RBAC, Swagger, and Socket.IO
- React 19 frontend built with TanStack Router + TanStack Query
- Shared Drizzle ORM package for schema and database access
- Shared UI package for reusable components and styles
- Reservation, order, staff, and restaurant management flows
- Kiosk realtime updates for order lifecycle events

## Documentation

Project-level docs in this repository:

- [TESTING.md](docs/TESTING.md)
- [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [USER_GUIDE.md](docs/USER_GUIDE.md)
- [apps/api/README.md](apps/api/README.md)

## Requirements

- Node.js 24+
- pnpm 10+
- PostgreSQL (or compatible connection string)

## Environment Variables

Smart Dine uses app-specific environment variables.

- API runtime values are loaded through `apps/api` and can be provided via `api.env` in Docker.
- Web runtime values are validated in `apps/web/src/env.ts` and require:
  - `VITE_API_URL`
  - `VITE_API_BASE_PATH`
  - `VITE_API_AUTH_PATH`
- API commonly needs:
  - `PORT`
  - `DATABASE_URL`
  - `BETTER_AUTH_URL`
  - `BETTER_AUTH_SECRET`
  - `CORS_ORIGIN`
  - `CORS_DOMAIN`

For full API-side runtime requirements, see [apps/api/README.md](apps/api/README.md).

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the app in development mode:

```bash
pnpm dev
```

This runs workspace `dev` scripts through Turborepo.

Target a single app when needed:

```bash
pnpm --filter @smartdine/api dev
pnpm --filter @smartdine/web dev
```

## Build and Run Production Locally

```bash
pnpm build
pnpm start
```

Or run per package:

```bash
pnpm --filter @smartdine/api build
pnpm --filter @smartdine/api start

pnpm --filter @smartdine/web build
pnpm --filter @smartdine/web start
```

## Lint

```bash
pnpm lint
```

## Docker

Build and run with docker compose:

```bash
docker compose up --build
```

Current compose setup:

- Builds `api` from `apps/api/Dockerfile`
- Builds `web` from `apps/web/Dockerfile`
- Uses `api.env` for API runtime configuration
- Publishes services behind Traefik router labels (`sdapi.${DOMAIN}`, `sd.${DOMAIN}`)

**Before running compose in your environment:**

- Update `docker-compose.yaml` values (for example domains, labels, network, and env-related settings) to match your local or deployment environment.
- Ensure an existing database is already running locally and that `DATABASE_URL` points to it.

## Project Structure (High Level)

- `apps/api/` NestJS backend modules, auth, RBAC, and realtime gateway
- `apps/web/` TanStack Router frontend and UI composition
- `packages/db/` shared Drizzle schema and database factory
- `ui/` shared component and style package (`@smartdine/ui`)
- `eslint-config/` and `typescript-config/` shared tooling presets
- `db/` SQL dump and database artifacts

## Key Behaviors

- Public restaurant discovery and detail views
- Authenticated reservation creation and reservation history
- Staff workspace and restaurant-scoped admin management
- Site-level administration for users and restaurants
- Realtime kiosk order updates over Socket.IO namespace `/kiosk`

## Notes

- This repository contains both frontend and backend applications.
- API routes are served under `/api/v1` and auth endpoints under `/api/auth`.
- Swagger UI is exposed at `/docs`.
