-- Fitness module: USDA cache, template versioning, nutrition assignments, archive flag, additional exercise fields

-- ============ Enums ============
DO $$ BEGIN
  CREATE TYPE "AssignmentPropagation" AS ENUM ('KEEP_OLD', 'MIGRATE_NEW');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ WorkoutPlan additions ============
ALTER TABLE "workout_plans"
  ADD COLUMN IF NOT EXISTS "goal" TEXT,
  ADD COLUMN IF NOT EXISTS "estimated_minutes" INTEGER,
  ADD COLUMN IF NOT EXISTS "archived_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "workout_plans_coach_id_archived_at_idx"
  ON "workout_plans"("coach_id", "archived_at");

-- ============ WorkoutDayExercise additions ============
ALTER TABLE "workout_day_exercises"
  ADD COLUMN IF NOT EXISTS "weight_kg" DECIMAL(6,2),
  ADD COLUMN IF NOT EXISTS "rpe" DECIMAL(3,1),
  ADD COLUMN IF NOT EXISTS "video_url" TEXT;

-- ============ WorkoutPlanVersion ============
CREATE TABLE IF NOT EXISTS "workout_plan_versions" (
  "id" TEXT NOT NULL,
  "workout_plan_id" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workout_plan_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "workout_plan_versions_plan_version_key"
  ON "workout_plan_versions"("workout_plan_id", "version");

CREATE INDEX IF NOT EXISTS "workout_plan_versions_plan_version_idx"
  ON "workout_plan_versions"("workout_plan_id", "version");

DO $$ BEGIN
  ALTER TABLE "workout_plan_versions"
    ADD CONSTRAINT "workout_plan_versions_workout_plan_id_fkey"
    FOREIGN KEY ("workout_plan_id") REFERENCES "workout_plans"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ WorkoutPlanAssignment additions ============
ALTER TABLE "workout_plan_assignments"
  ADD COLUMN IF NOT EXISTS "plan_version_id" TEXT,
  ADD COLUMN IF NOT EXISTS "pinned_version" INTEGER;

DO $$ BEGIN
  ALTER TABLE "workout_plan_assignments"
    ADD CONSTRAINT "workout_plan_assignments_plan_version_id_fkey"
    FOREIGN KEY ("plan_version_id") REFERENCES "workout_plan_versions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ NutritionPlan additions ============
ALTER TABLE "nutrition_plans"
  ADD COLUMN IF NOT EXISTS "goal" TEXT,
  ADD COLUMN IF NOT EXISTS "water_ml" INTEGER,
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "archived_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "nutrition_plans_coach_id_updated_at_idx"
  ON "nutrition_plans"("coach_id", "updated_at");
CREATE INDEX IF NOT EXISTS "nutrition_plans_coach_id_archived_at_idx"
  ON "nutrition_plans"("coach_id", "archived_at");

-- ============ NutritionPlanVersion ============
CREATE TABLE IF NOT EXISTS "nutrition_plan_versions" (
  "id" TEXT NOT NULL,
  "nutrition_plan_id" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nutrition_plan_versions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "nutrition_plan_versions_plan_version_key"
  ON "nutrition_plan_versions"("nutrition_plan_id", "version");
CREATE INDEX IF NOT EXISTS "nutrition_plan_versions_plan_version_idx"
  ON "nutrition_plan_versions"("nutrition_plan_id", "version");
DO $$ BEGIN
  ALTER TABLE "nutrition_plan_versions"
    ADD CONSTRAINT "nutrition_plan_versions_nutrition_plan_id_fkey"
    FOREIGN KEY ("nutrition_plan_id") REFERENCES "nutrition_plans"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ NutritionPlanAssignment ============
CREATE TABLE IF NOT EXISTS "nutrition_plan_assignments" (
  "id" TEXT NOT NULL,
  "coach_id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  "nutrition_plan_id" TEXT NOT NULL,
  "plan_version_id" TEXT,
  "pinned_version" INTEGER,
  "start_date" TIMESTAMP(3) NOT NULL,
  "end_date" TIMESTAMP(3),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "assigned_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nutrition_plan_assignments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "nutrition_plan_assignments_coach_client_active_idx"
  ON "nutrition_plan_assignments"("coach_id", "client_id", "is_active");
CREATE INDEX IF NOT EXISTS "nutrition_plan_assignments_client_active_start_idx"
  ON "nutrition_plan_assignments"("client_id", "is_active", "start_date");

DO $$ BEGIN
  ALTER TABLE "nutrition_plan_assignments"
    ADD CONSTRAINT "nutrition_plan_assignments_coach_id_fkey"
    FOREIGN KEY ("coach_id") REFERENCES "coaches"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "nutrition_plan_assignments"
    ADD CONSTRAINT "nutrition_plan_assignments_client_id_fkey"
    FOREIGN KEY ("client_id") REFERENCES "clients"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "nutrition_plan_assignments"
    ADD CONSTRAINT "nutrition_plan_assignments_nutrition_plan_id_fkey"
    FOREIGN KEY ("nutrition_plan_id") REFERENCES "nutrition_plans"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "nutrition_plan_assignments"
    ADD CONSTRAINT "nutrition_plan_assignments_plan_version_id_fkey"
    FOREIGN KEY ("plan_version_id") REFERENCES "nutrition_plan_versions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ NutritionLog additions ============
ALTER TABLE "nutrition_logs"
  ADD COLUMN IF NOT EXISTS "log_date" DATE,
  ADD COLUMN IF NOT EXISTS "water_ml" INTEGER;

CREATE INDEX IF NOT EXISTS "nutrition_logs_client_id_log_date_idx"
  ON "nutrition_logs"("client_id", "log_date");

-- ============ FoodCache ============
CREATE TABLE IF NOT EXISTS "food_cache" (
  "id" TEXT NOT NULL,
  "fdc_id" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "brand_owner" TEXT,
  "data_type" TEXT,
  "serving_size" DECIMAL(8,2),
  "serving_size_unit" TEXT,
  "calories_per_100g" DECIMAL(8,2),
  "protein_per_100g" DECIMAL(8,2),
  "carbs_per_100g" DECIMAL(8,2),
  "fats_per_100g" DECIMAL(8,2),
  "fiber_per_100g" DECIMAL(8,2),
  "raw" JSONB,
  "search_vector" TEXT NOT NULL DEFAULT '',
  "hit_count" INTEGER NOT NULL DEFAULT 0,
  "last_fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "food_cache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "food_cache_fdc_id_key" ON "food_cache"("fdc_id");
CREATE INDEX IF NOT EXISTS "food_cache_search_vector_idx" ON "food_cache"("search_vector");
CREATE INDEX IF NOT EXISTS "food_cache_description_idx" ON "food_cache"("description");
