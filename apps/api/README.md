# Smart Dine API

This package provides the Smart Dine backend API built with NestJS, Drizzle ORM, Better Auth, and Socket.IO.

## Base URL and Versioning

- Base prefix: `/api`
- Versioning style: URI
- Current version: `v1`

## Authentication

Authentication is provided by Better Auth under `/api/auth`.

- Unauthenticated routes use `@AllowAnonymous()`.
- All other routes require an authenticated session.

## Authorization Model

Authorization combines:

- Platform role from `users.role`: `user`, `admin`
- Restaurant scope role from `staff_roles.role`: `owner`, `employee`

Permission checks are handled by the RBAC guard and decorators.

## Primary REST Endpoints

### Public Discovery

- `GET /api/v1/restaurants`
- `GET /api/v1/restaurants/:restaurantId`
- `GET /api/v1/restaurants/:restaurantId/menu-items`
- `GET /api/v1/restaurants/:restaurantId/floor-map`

### Reservations

- `GET /api/v1/restaurants/:restaurantId/availability`
- `POST /api/v1/restaurants/:restaurantId/reservations`
- `GET /api/v1/me/reservations`
- `GET /api/v1/restaurants/:restaurantId/reservations`
- `PATCH /api/v1/reservations/:reservationId/status`
- `PATCH /api/v1/reservations/:reservationId/cancel`

### Orders

- `POST /api/v1/restaurants/:restaurantId/orders`
- `GET /api/v1/restaurants/:restaurantId/orders`
- `GET /api/v1/orders/:orderId`
- `PATCH /api/v1/orders/:orderId/status`

### Staff and Owner

- `GET /api/v1/my/restaurants`
- `GET /api/v1/restaurants/:restaurantId/staff`
- `POST /api/v1/restaurants/:restaurantId/staff`
- `PATCH /api/v1/restaurants/:restaurantId/staff/:staffRoleId`
- `DELETE /api/v1/restaurants/:restaurantId/staff/:staffRoleId`

### Owner Restaurant Management

- `PATCH /api/v1/restaurants/:restaurantId`
- `POST /api/v1/restaurants/:restaurantId/images`
- `POST /api/v1/restaurants/:restaurantId/images/upload`
- `DELETE /api/v1/restaurants/:restaurantId/images`
- `POST /api/v1/restaurants/:restaurantId/menu-items`
- `POST /api/v1/restaurants/:restaurantId/menu-items/:menuItemId/image/upload`
- `PATCH /api/v1/restaurants/:restaurantId/menu-items/:menuItemId`
- `DELETE /api/v1/restaurants/:restaurantId/menu-items/:menuItemId`

### Site Administration

- `GET /api/v1/admin/restaurants`
- `POST /api/v1/admin/restaurants`
- `DELETE /api/v1/admin/restaurants/:restaurantId`
- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/restaurants/:restaurantId/owner`

## Realtime Kiosk

Socket.IO namespace:

- `/kiosk`

Client message:

- `kiosk.join` with payload `{ restaurantId }`

Server events:

- `order.created`
- `order.status.updated`
- `order.completed`

## Reservation Slot Logic

Reservation overlap logic uses a fixed 90-minute slot window.

A table is considered unavailable if an existing `pending` or `confirmed` reservation overlaps with the requested time window.

## Image Management

The API accepts multipart image uploads for restaurant and menu item assets, uploads them to Cloudflare R2, and persists the resulting public URL in the database.

Required Cloudflare environment variables:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_R2_BUCKET`
- `CLOUDFLARE_PUBLIC_BASE_URL`
- `CLOUDFLARE_S3_API_URL`

Supported upload endpoints:

- `POST /api/v1/restaurants/:restaurantId/images/upload`
- `POST /api/v1/restaurants/:restaurantId/menu-items/:menuItemId/image/upload`

Accepted image MIME types are jpeg, png, and webp with a 5 MB maximum file size.
