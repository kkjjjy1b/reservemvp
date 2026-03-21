# Backend Contract

## Current Architecture

- Authentication is implemented with signed HTTP-only cookies.
- Reservation rules are enforced in server code and supported by DB-level constraints.
- Main timeline data is fetched client-side from `/api/reservations` after auth redirect.

## Protected Contracts

- `/api/auth/login` must keep current login semantics unless explicitly changed.
- `/api/reservations?date=YYYY-MM-DD` remains the main timeline data source.
- Existing reservation payload expectations should stay backward compatible.
- Auth failures should continue to produce the current route-level behavior.

## Change Bias

- Prefer additive response fields to breaking field renames.
- Prefer internal refactors over endpoint redesigns.
- Avoid moving protected page logic to slower or more complex render paths without evidence.
