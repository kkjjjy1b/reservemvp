CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE "ReservationStatus" AS ENUM ('active', 'cancelled');

CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "password_changed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "meeting_rooms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_rooms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reservations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "meeting_room_id" UUID NOT NULL,
    "reservation_date" DATE NOT NULL,
    "start_datetime" TIMESTAMPTZ(6) NOT NULL,
    "end_datetime" TIMESTAMPTZ(6) NOT NULL,
    "purpose" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_company_email_key" ON "users"("company_email");
CREATE UNIQUE INDEX "meeting_rooms_name_key" ON "meeting_rooms"("name");
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

CREATE INDEX "meeting_rooms_active_sort_idx" ON "meeting_rooms"("is_active", "sort_order", "name");
CREATE INDEX "reservations_date_room_idx" ON "reservations"("reservation_date", "meeting_room_id");
CREATE INDEX "reservations_user_idx" ON "reservations"("user_id", "reservation_date" DESC);
CREATE INDEX "sessions_user_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

ALTER TABLE "users"
    ADD CONSTRAINT "users_company_email_format_chk"
    CHECK (position('@' in "company_email") > 1);

ALTER TABLE "reservations"
    ADD CONSTRAINT "reservations_time_order_chk"
    CHECK ("end_datetime" > "start_datetime");

ALTER TABLE "reservations"
    ADD CONSTRAINT "reservations_30min_boundary_chk"
    CHECK (
        extract(minute from "start_datetime") in (0, 30)
        and extract(second from "start_datetime") = 0
        and extract(minute from "end_datetime") in (0, 30)
        and extract(second from "end_datetime") = 0
    );

ALTER TABLE "reservations"
    ADD CONSTRAINT "reservations_min_duration_chk"
    CHECK ("end_datetime" - "start_datetime" >= interval '30 minutes');

ALTER TABLE "reservations"
    ADD CONSTRAINT "reservations_same_day_chk"
    CHECK (
        "reservation_date" = ("start_datetime" AT TIME ZONE 'Asia/Seoul')::date
        and "reservation_date" = (("end_datetime" - interval '1 second') AT TIME ZONE 'Asia/Seoul')::date
    );

ALTER TABLE "sessions"
    ADD CONSTRAINT "sessions_expiry_chk"
    CHECK ("expires_at" > "created_at");

ALTER TABLE "reservations"
    ADD CONSTRAINT "reservations_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reservations"
    ADD CONSTRAINT "reservations_meeting_room_id_fkey"
    FOREIGN KEY ("meeting_room_id") REFERENCES "meeting_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sessions"
    ADD CONSTRAINT "sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
