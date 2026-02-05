CREATE TABLE "users" (
  "id" UUID PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "applications" (
  "id" UUID PRIMARY KEY,
  "user_id" UUID NOT NULL,
  "company" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "applied_date" TIMESTAMP(3) NOT NULL,
  "location" TEXT NOT NULL,
  "deadline" TIMESTAMP(3),
  "notes" TEXT,
  "source" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "applications_user_id_deleted_at_idx" ON "applications"("user_id", "deleted_at");
CREATE INDEX "applications_user_id_status_idx" ON "applications"("user_id", "status");
CREATE INDEX "applications_user_id_applied_date_idx" ON "applications"("user_id", "applied_date");
