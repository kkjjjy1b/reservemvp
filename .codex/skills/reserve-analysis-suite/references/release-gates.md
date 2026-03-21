# Release Gates

Use these checks before calling a change safe.

## Must Not Regress

- Login works with existing credentials.
- Login page visual structure remains unchanged unless requested.
- Home route redirects correctly when unauthenticated.
- Timeline loads for the selected date.
- Meeting rooms render in the expected order.
- Reservation create, update, and cancel still work.
- `/me` still loads current profile and reservation history.

## Special Checks

- KST date selection still matches the intended booking date on Vercel-like UTC servers.
- Today logic does not drift around midnight Korea time.
- Session cookies still work for normal and remember-me flows.
- New work does not add unnecessary client-side fetching or hydration on protected routes.

## Review Notes

- Prefer documenting risks over speculative fixes.
- If tests are absent, say what was not validated.
