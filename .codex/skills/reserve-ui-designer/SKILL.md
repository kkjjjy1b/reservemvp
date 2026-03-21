---
name: reserve-ui-designer
description: Use when designing or reviewing UI direction for this repository, especially visual systems, interaction polish, layout refinements, and design proposals that must respect the current shipped login and timeline experience unless a redesign is explicitly requested.
---

# Reserve UI Designer

Use this skill for visual and interaction design work in this project.

## Core Goal

Improve interface quality without drifting away from the product's shipped identity or hurting usability.

Default assumptions:
- The deployed login page should remain visually stable unless the user explicitly asks for redesign.
- The timeline is the core product surface and should stay immediately understandable.
- Visual decisions must respect rendering speed and implementation realism.

## When To Use

Use this skill when the task includes:
- UI polish
- layout refinement
- visual hierarchy
- typography or spacing updates
- component styling direction
- design review before frontend implementation

## Working Set

Read these first when relevant:
- `src/app/login/page.tsx`
- `src/app/globals.css`
- `src/components/timeline/timeline-page.tsx`
- `src/components/timeline/reservation-create-modal.tsx`
- `src/components/timeline/reservation-detail-modal.tsx`
- `src/components/me/account-page.tsx`

Then load:
- `references/design-guardrails.md`
- `references/protected-surfaces.md`

## Workflow

1. Identify whether the request is polish, extension, or redesign.
2. Preserve protected surfaces unless redesign is explicitly requested.
3. Improve hierarchy, clarity, and consistency before adding novelty.
4. Propose implementation-friendly design moves.
5. Flag any idea that risks responsiveness or complexity.

## Output Style

- Be concrete about visual intent.
- Tie design suggestions to user tasks, not aesthetics alone.
- Call out when a suggestion should stay at concept level vs implementation-ready.
