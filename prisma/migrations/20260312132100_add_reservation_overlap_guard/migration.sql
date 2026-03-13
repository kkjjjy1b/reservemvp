CREATE EXTENSION IF NOT EXISTS btree_gist;

DROP INDEX IF EXISTS "reservations_date_room_idx";

CREATE INDEX "reservations_date_room_idx"
ON "reservations" ("reservation_date", "meeting_room_id")
WHERE "status" = 'active';

ALTER TABLE "reservations"
    ADD CONSTRAINT "reservations_no_overlap_excl"
    EXCLUDE USING GIST (
        "meeting_room_id" WITH =,
        tstzrange("start_datetime", "end_datetime", '[)') WITH &&
    )
    WHERE ("status" = 'active');
