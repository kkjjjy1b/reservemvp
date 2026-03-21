---
name: reserve-analysis-suite
description: Use when exploring this repository, checking product-spec alignment, reviewing release readiness, or assessing change impact without changing deployed behavior. Best for tasks that combine repo exploration, spec verification, and release review for the reserve MVP.
---

# Reserve Analysis Suite

Use this skill for read-heavy work on this repository when the goal is to understand the codebase, compare it to the product contract, or decide whether a change is safe to ship.

## Core Goal

Protect the currently deployed service while improving clarity.

Default assumptions:
- Do not change the deployed login UI, core timeline UX, or current rendering behavior unless the user explicitly asks.
- Treat the existing product docs as the contract unless the user says the contract changed.
- Prefer impact analysis, risk framing, and release gates before proposing implementation.

## When To Use

Use this skill when the task includes one or more of these:
- repo exploration
- feature impact analysis
- spec-vs-implementation checks
- release review
- deployment readiness review
- regression risk analysis

## Working Set

Read these first when relevant:
- `docs/spec.md`
- `docs/change-log.md`
- `docs/deployment-handoff.md`
- `src/app/page.tsx`
- `src/app/login/page.tsx`
- `src/components/timeline/timeline-page.tsx`
- `src/lib/auth/session.ts`
- `src/lib/reservations/datetime.ts`

Then load only the reference file you need:
- `references/repo-map.md` for entry points and module ownership
- `references/product-contract.md` for non-negotiable behavior
- `references/release-gates.md` for ship/no-ship review criteria

## Workflow

1. Identify the user-facing surface involved.
2. Check whether the request touches a protected invariant.
3. Trace the affected files and runtime flow.
4. Compare behavior against the documented product contract.
5. Report risks first, then safe next steps.

## Output Style

- Be concise and concrete.
- For reviews, lead with findings and file references.
- Separate confirmed facts from inference.
- If a change would risk UI, behavior, or rendering speed, say so explicitly.
