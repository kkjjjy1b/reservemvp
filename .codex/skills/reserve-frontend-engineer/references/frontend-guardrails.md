# Frontend Guardrails

## Rendering

- Avoid adding unnecessary client state or effects on initial render paths.
- Avoid introducing extra fetch waterfalls for protected screens.
- Prefer keeping server redirects and existing load order intact.

## UX

- Match the current visual language unless a redesign is requested.
- Preserve mobile usability.
- Keep modals and feedback messages consistent with current behavior.

## Integration

- Do not silently change API payload assumptions.
- Verify changes against login, timeline, and account flows.
