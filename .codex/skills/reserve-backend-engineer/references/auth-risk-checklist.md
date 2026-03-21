# Auth Risk Checklist

## Current Known Risks

- Session secret fallback is too permissive.
- Session payload is trusted without reloading the user from DB on each request.
- Prisma `Session` model exists, but runtime auth is stateless cookie-based.

## Review Checklist

- Does the change preserve existing login behavior?
- Does it keep remember-me semantics intact?
- Could a deactivated or modified user continue using an old cookie unexpectedly?
- Are cookie security flags still correct for production?
- Are auth errors still mapped to the current route behavior?

## Migration Caution

- Do not change session architecture casually.
- If moving toward DB-backed sessions, plan compatibility and rollout explicitly.
