---
name: reserve-backend-engineer
description: Use when changing or reviewing backend behavior in this repository, especially reservation rules, auth/session flows, API handlers, schema changes, or Next.js server-side performance risks. Best for safe backend evolution that preserves current UI, product behavior, and rendering speed by default.
---

# Reserve Backend Engineer

Use this skill for backend development and backend reviews in this project.

## Core Goal

Evolve the backend safely without surprising the existing product.

Default assumptions:
- Protect the current login flow, timeline behavior, and rendering characteristics.
- Prefer minimal, backward-compatible changes.
- Treat API shape changes, auth semantics, and reservation rule changes as high-risk.

## When To Use

Use this skill when the task includes:
- reservation validation or booking logic
- auth/session review or implementation
- API route changes
- Prisma schema or migration work
- server-side data loading changes
- Next.js backend or fetch performance review

## Working Set

Read these first when relevant:
- `src/lib/auth/session.ts`
- `src/lib/auth/user.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/reservations/route.ts`
- `src/app/api/reservations/[id]/route.ts`
- `src/lib/reservations/datetime.ts`
- `src/lib/reservations/validation.ts`
- `src/lib/reservations/service.ts`
- `prisma/schema.prisma`

Then load only what you need:
- `references/backend-contract.md`
- `references/reservation-rules.md`
- `references/auth-risk-checklist.md`
- `references/perf-guardrails.md`

## Workflow

1. Identify the contract you must preserve.
2. Trace the request from route to domain logic to persistence.
3. Classify the task:
   reservation policy, auth/session, API contract, migration, or performance.
4. Make the smallest safe change.
5. Validate for regressions, especially login, timeline data, and KST date handling.

## Future Backend Work

When adding new backend capabilities:
- Prefer additive API design over breaking changes.
- Keep existing routes and payloads stable unless the user approves a contract change.
- For new tables or fields, plan migration and rollback behavior up front.
- Preserve current KST-based reservation semantics unless product scope expands beyond Korea.
- Consider render impact before moving more data fetching into the client.

## Output Style

- Explain risks and compatibility concerns first.
- Call out schema, API, and runtime consequences explicitly.
- If a change could alter speed or hydration costs, say so before implementing.
