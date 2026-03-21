---
name: reserve-frontend-engineer
description: Use when implementing or reviewing frontend work in this repository, including timeline UI, account screens, responsive behavior, and frontend integration with existing APIs. Best for changes that preserve the current deployed UX and rendering speed unless the user explicitly requests a redesign.
---

# Reserve Frontend Engineer

Use this skill for frontend implementation and frontend reviews in this project.

## Core Goal

Improve or extend the frontend without destabilizing the shipped experience.

Default assumptions:
- The current login screen should not change unless the user explicitly asks.
- The daily timeline remains the primary product surface.
- Rendering speed and perceived responsiveness matter as much as visuals.

## When To Use

Use this skill when the task includes:
- timeline UI work
- modal behavior
- responsive layout fixes
- account page UX work
- frontend integration with reservation APIs
- accessibility or interaction review

## Working Set

Read these first when relevant:
- `src/app/login/page.tsx`
- `src/components/auth/login-form.tsx`
- `src/app/page.tsx`
- `src/components/timeline/timeline-page.tsx`
- `src/components/timeline/reservation-create-modal.tsx`
- `src/components/timeline/reservation-detail-modal.tsx`
- `src/components/me/account-page.tsx`

Then load only what you need:
- `references/ui-invariants.md`
- `references/frontend-guardrails.md`

## Workflow

1. Identify the visible user journey being touched.
2. Check whether the requested change conflicts with protected UI invariants.
3. Keep visual and interaction changes minimal unless a redesign is explicitly requested.
4. Preserve existing API contracts and client data flow.
5. Re-check desktop and mobile behavior.

## Output Style

- Call out visible regressions before making changes.
- Prefer incremental UI changes over large rewrites.
- Mention any performance or hydration tradeoff explicitly.
