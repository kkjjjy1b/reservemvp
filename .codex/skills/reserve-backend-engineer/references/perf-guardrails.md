# Performance Guardrails

## Current Bias

- Keep the login page simple.
- Keep protected-route redirects cheap.
- Avoid adding extra client fetches on first paint unless clearly justified.

## Watch For

- Moving auth checks from server redirect flow into slower client-side gating.
- Adding unnecessary waterfalls before timeline render.
- Recomputing expensive timeline structures on every render without need.
- Shifting KST logic into heavier or duplicated client work.

## Change Rule

- If a backend change may affect perceived rendering speed, document the risk before implementation.
- Prefer measuring or reasoning from the current fetch/render path over assumptions.
