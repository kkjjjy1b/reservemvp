# Repo Map

## Primary Routes

- `src/app/page.tsx`: authenticated home route, redirects to login when no session.
- `src/app/login/page.tsx`: login page shell and layout.
- `src/app/me/page.tsx`: account page route.

## Primary API Surfaces

- `src/app/api/auth/*`: login, logout, current user, password change.
- `src/app/api/reservations/*`: daily timeline query, reservation create, update, cancel.
- `src/app/api/meeting-rooms/route.ts`: active meeting room list.
- `src/app/api/me/*`: profile and current user's reservations.

## Core Domains

- `src/lib/auth/*`: cookie session, password helpers, user lookup.
- `src/lib/reservations/*`: time rules, validation, persistence, serialization, timeline shaping.
- `src/components/timeline/*`: timeline UI, create/detail modals.
- `src/components/me/*`: account page and profile flows.

## Data Layer

- `prisma/schema.prisma`: user, meeting room, reservation, session models.
- `prisma/migrations/*`: DB migrations.
- `prisma/seed.js`: seed data and scenario generation.

## Review Hotspots

- Auth/session consistency: `src/lib/auth/session.ts`
- Timezone and booking rules: `src/lib/reservations/datetime.ts`, `src/lib/reservations/validation.ts`
- Timeline behavior and fetch patterns: `src/components/timeline/timeline-page.tsx`
- Product contract docs: `docs/spec.md`, `docs/change-log.md`, `docs/deployment-handoff.md`
