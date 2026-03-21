# Product Contract

These are the current invariants to preserve unless the user explicitly changes them.

## Protected UX

- Login page layout, copy hierarchy, and overall interaction should remain stable.
- Main product flow is the daily meeting-room timeline.
- `/me` remains the user self-service surface for profile and reservation history.

## Reservation Rules

- Daily view only.
- Reservation window is `06:00` to `24:00`.
- Slot size is 30 minutes.
- Users can create, edit, cancel only within the documented policy.
- Same-room overlap is blocked.
- Cancelled reservations do not appear in the timeline by default.

## Platform Rules

- Service is Korea-centric.
- Reservation time calculations are based on `Asia/Seoul`.
- Pages and route handlers currently prefer region `icn1`.

## Delivery Rule

- Changes that alter deployed behavior, visible UI, or perceived rendering speed require explicit user approval.
