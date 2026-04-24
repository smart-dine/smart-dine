# Architecture

This document describes how Smart Dine organizes state, folders, and navigation across the monorepo.

## Tech Stack

- Turborepo + pnpm workspaces
- NestJS 11 API
- React 19
- TypeScript
- TanStack Router + TanStack Query (web)
- Tailwind CSS v4 + `@smartdine/ui` shared components
- Better Auth (API + web client)
- Drizzle ORM (shared in `packages/db`)
- Socket.IO for realtime kiosk updates

## State Management

The frontend uses a pragmatic multi-layer approach with TanStack Query and local component state.

### 1) Auth Session State (Global, Context-based)

- Auth state is provided by Better Auth client hooks (`authClient.useSession()`).
- Session values are read directly in route/components that need them.
- Route-access helpers in `apps/web/src/lib/auth/access.ts` combine session + staff memberships.
- This keeps auth checks close to navigation and feature entry points.

Why this works:

- Better Auth remains the single source of truth for user identity.
- Route-level checks avoid over-centralized custom auth stores.

### 2) Page and Component State (Local useState/useEffect)

Most feature state is local to the route/page that owns it:

- Restaurant discovery: search term, pagination offset, UI filtering.
- Reservation flows: selected date/time/table and validation UX state.
- Restaurant admin pages: form draft values, dialogs, selection state.
- Kiosk page: connection status, live order map, highlighting, and fullscreen state.

Why this works:

- State remains close to where it is used.
- UI behavior is isolated from transport and API contract layers.

### 3) Remote Server State (API client + effects)

- Web server state is managed with TanStack Query.
- Query option factories in `apps/web/src/lib/api/*` define cache keys and fetchers.
- Components consume data with `useQuery` and mutate with `useMutation`.
- Writes typically invalidate scoped query keys to keep views consistent.

### 4) Real-time Chat State (Socket lifecycle in hook)

Realtime concerns are isolated in the kiosk connection helper:

- `apps/web/src/lib/realtime/kiosk.ts` owns Socket.IO connect/join/reconnect behavior.
- The kiosk route subscribes to order lifecycle events and patches local/query state.
- The API gateway (`apps/api/src/realtime/kiosk.gateway.ts`) enforces auth + permission checks before room joins.

## Data Flow Patterns

### Read flow

1. Route component computes query params from URL or local input.
2. `useQuery` runs with a stable query key and fetcher.
3. Cached data is rendered immediately when available.
4. Background refetch keeps data fresh.
5. Errors are surfaced by route-level fallback UI.

### Write flow

1. User interaction triggers action.
2. `useMutation` performs the API request.
3. On success, relevant query keys are invalidated.
4. Local UI state is reconciled (dialogs, pending flags, selection).
5. On failure, route-level error state communicates actionable feedback.

Example: admin and kiosk order changes update local state and invalidate `restaurants/orders` query keys.

## Folder Strategy

The monorepo is a hybrid of application boundaries plus route/layer organization.

## Route-based surface (`apps/web/src/routes`)

The web app uses TanStack Router file-based routes:

- Route files map directly to URL segments.
- Nested routes model restaurant-specific admin, kiosk, cashier, and reservation paths.
- `routeTree.gen.ts` is generated and should not be edited manually.

## Layer-based shared modules

- `apps/web/src/components/`: reusable UI composition.
- `apps/web/src/lib/`: API clients, auth utilities, formatters, realtime helpers.
- `apps/web/src/integrations/`: framework integrations (Better Auth, TanStack Query).
- `apps/api/src/*`: domain modules (`restaurants`, `reservations`, `orders`, `staff`, `admin`, `rbac`, `realtime`).
- `packages/db/src`: shared schema and database factory used by API/auth.

## Database ERD

Database at a glance:

- Core domains: auth, restaurants, reservations, orders, menu, and staff roles.
- Primary entity tables: `users`, `restaurants`, `restaurant_tables`, `reservations`, `orders`, `order_items`, `menu_items`, `menu_item_categories`, `staff_roles`.
- Status enums used in workflow state:
  - Reservation: `pending`, `confirmed`, `cancelled`, `completed`
  - Order: `placed`, `completed`
  - Order item: `placed`, `completed`
- Role enums:
  - Platform user role: `user`, `admin`
  - Restaurant staff role: `owner`, `employee`
- Key relationship highlights:
  - One restaurant has many tables, menu items, categories, reservations, and orders.
  - Reservations link a customer (`users`) to one restaurant and one table.
  - Orders link one operator (`users`) and one table; each order has many order items.
  - Menu items and categories are many-to-many through `menu_items_to_categories`.

![Smart Dine database ERD](../db/smart-dine-erd.png)

### Practical classification

- Route files orchestrate data loading, access checks, and page-level UX.
- Domain services/controllers live in API modules.
- Shared contracts/helpers stay in `lib` and shared packages.

This is closest to app-boundary slicing with route-first frontend feature ownership.

## Navigation Architecture

Navigation is handled by TanStack Router primitives:

- Declarative links with `Link` for standard navigation.
- Route definitions with `createFileRoute` and generated route tree.
- Redirect-style behavior with `Navigate` and route-access checks.

### Top-level navigation

- Global header is mounted in the root route shell.
- Primary links expose restaurant discovery and contact routes.
- Auth-aware actions are rendered from Better Auth session data.

### Protected route handling

Protected experiences are enforced by session-aware route access helpers and API authorization:

- Web route access helper checks session + staff/admin roles for workspace/admin/kiosk pages.
- API controllers and gateway methods enforce permission decorators and RBAC guard checks.
- Unauthorized users are redirected to sign-in or denied by API/socket guards.

This ensures the UI and backend both apply role and scope constraints.

### Dynamic routes

- `/restaurants/$restaurantId` for restaurant detail.
- `/restaurants/$restaurantId/reservation` for reservation creation.
- `/restaurants/$restaurantId/admin/*` for restaurant management areas.
- `/restaurants/$restaurantId/kiosk` and `/restaurants/$restaurantId/cashier` for operations views.

### Navigation behavior highlights

- Public users can browse restaurants without authentication.
- Reservation and workspace flows require sign-in.
- Admin and restaurant-staff areas are role-scoped.
- Kiosk route listens to realtime events and reflects live order state transitions.

## Architectural Strengths

- Clear monorepo boundaries for web, API, and shared packages.
- Query-driven frontend data layer with predictable caching/invalidation.
- Strong API authorization model using Better Auth + RBAC permissions.
- Shared database schema package reduces drift between modules.
- Realtime kiosk updates are isolated from core request/response code.

## Known Trade-offs

- Manual query invalidation is still required after many mutations.
- Frontend route files can grow large when orchestration and presentation are mixed.
- REST contracts are maintained in code rather than generated from a shared OpenAPI client.

If complexity grows, consider introducing:

- route-level data loaders for consistent prefetch behavior
- generated API client contracts from OpenAPI schema
- tighter extraction of repeated page sections into focused feature components
