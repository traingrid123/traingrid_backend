-- Workout hardening: versioning, assignments, idempotent logs, and indexing

-- 1) Workout plan version for optimistic concurrency
ALTER TABLE "workout_plans"
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- 2) Add log_date and source_event_id for idempotent workout completion
ALTER TABLE "workout_logs"
  ADD COLUMN "log_date" DATE,
  ADD COLUMN "source_event_id" TEXT;

UPDATE "workout_logs"
SET "log_date" = DATE("logged_at")
WHERE "log_date" IS NULL;

ALTER TABLE "workout_logs"
  ALTER COLUMN "log_date" SET NOT NULL;

-- 3) Assignment history table
CREATE TABLE "workout_plan_assignments" (
  "id" TEXT NOT NULL,
  "coach_id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  "workout_plan_id" TEXT NOT NULL,
  "start_date" TIMESTAMP(3) NOT NULL,
  "end_date" TIMESTAMP(3),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "assigned_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "workout_plan_assignments_pkey" PRIMARY KEY ("id")
);

-- 4) New indexes and uniqueness guards
CREATE INDEX "workout_plans_coach_id_updated_at_idx" ON "workout_plans"("coach_id", "updated_at");
CREATE INDEX "workout_logs_client_id_log_date_idx" ON "workout_logs"("client_id", "log_date");
CREATE UNIQUE INDEX "workout_logs_source_event_id_key" ON "workout_logs"("source_event_id");
CREATE UNIQUE INDEX "workout_logs_client_id_workout_day_id_log_date_key" ON "workout_logs"("client_id", "workout_day_id", "log_date");

CREATE UNIQUE INDEX "workout_days_workout_plan_id_week_number_order_index_key"
  ON "workout_days"("workout_plan_id", "week_number", "order_index");

CREATE UNIQUE INDEX "workout_day_exercises_workout_day_id_order_index_key"
  ON "workout_day_exercises"("workout_day_id", "order_index");

CREATE INDEX "workout_plan_assignments_coach_id_client_id_is_active_idx"
  ON "workout_plan_assignments"("coach_id", "client_id", "is_active");

CREATE INDEX "workout_plan_assignments_client_id_is_active_start_date_idx"
  ON "workout_plan_assignments"("client_id", "is_active", "start_date");

-- 5) Foreign keys
ALTER TABLE "workout_plan_assignments"
  ADD CONSTRAINT "workout_plan_assignments_coach_id_fkey"
  FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workout_plan_assignments"
  ADD CONSTRAINT "workout_plan_assignments_client_id_fkey"
  FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workout_plan_assignments"
  ADD CONSTRAINT "workout_plan_assignments_workout_plan_id_fkey"
  FOREIGN KEY ("workout_plan_id") REFERENCES "workout_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
