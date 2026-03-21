# Reservation Rules

## Time Model

- Reservation timezone is `Asia/Seoul`.
- Timeline range is `06:00` to `24:00`.
- Slot interval is 30 minutes.
- Reservation start and end must land on 30-minute boundaries.
- End must be later than start.
- Minimum duration is 30 minutes.

## Date Rules

- Past dates cannot be booked.
- For today, start times earlier than now cannot be created.
- Existing reservations can be edited only before the start time.
- Reservations can be cancelled even after the start time.

## Conflict Rules

- Same-room overlapping windows are blocked.
- Adjacent windows are allowed when one ends exactly as the next starts.
- Client-side blocking is helpful but server-side validation is authoritative.

## Safety Notes

- Changes around `getKstDateKey`, selected date parsing, or timeline slot math are high-risk.
- Verify midnight and near-midnight KST behavior before shipping.
