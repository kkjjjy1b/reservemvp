CREATE TABLE "teams" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "teams_slug_key" ON "teams"("slug");
CREATE INDEX "teams_is_default_idx" ON "teams"("is_default");

ALTER TABLE "users"
    ADD COLUMN "team_id" UUID,
    ADD COLUMN "avatar_url" TEXT,
    ADD COLUMN "avatar_storage_key" TEXT;

INSERT INTO "teams" ("name", "slug", "is_default")
VALUES ('기본 팀', 'default-team', true);

UPDATE "users"
SET "team_id" = (SELECT "id" FROM "teams" WHERE "slug" = 'default-team' LIMIT 1)
WHERE "team_id" IS NULL;

ALTER TABLE "users"
    ADD CONSTRAINT "users_team_id_fkey"
    FOREIGN KEY ("team_id")
    REFERENCES "teams"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

CREATE INDEX "users_team_active_name_idx" ON "users"("team_id", "is_active", "name");

CREATE TABLE "reservation_participants" (
    "reservation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_participants_pkey" PRIMARY KEY ("reservation_id", "user_id")
);

ALTER TABLE "reservation_participants"
    ADD CONSTRAINT "reservation_participants_reservation_id_fkey"
    FOREIGN KEY ("reservation_id")
    REFERENCES "reservations"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

ALTER TABLE "reservation_participants"
    ADD CONSTRAINT "reservation_participants_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

CREATE INDEX "reservation_participants_user_idx" ON "reservation_participants"("user_id");
