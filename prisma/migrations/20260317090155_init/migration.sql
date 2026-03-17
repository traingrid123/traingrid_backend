-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "CoachingMode" AS ENUM ('ONLINE', 'HYBRID', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "CoachTier" AS ENUM ('ADVANCED', 'PRO', 'ELITE');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'AT_RISK', 'INACTIVE', 'LEAD');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'PRE_WORKOUT', 'POST_WORKOUT');

-- CreateEnum
CREATE TYPE "ChatRoomType" AS ENUM ('DIRECT', 'GROUP', 'BROADCAST');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'VOICE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MISSED_WORKOUT', 'NEW_MESSAGE', 'PAYMENT_REMINDER', 'PLAN_UPDATE_REQUEST', 'INQUIRY_RECEIVED', 'NUDGE_COACH', 'NUDGE_CLIENT', 'INCOMPLETE_PROFILE', 'GENERAL');

-- CreateEnum
CREATE TYPE "DropOffRisk" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('PENDING', 'RESPONDED', 'CONVERTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('IMAGE', 'VIDEO', 'PDF', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('BARBELL', 'DUMBBELL', 'MACHINE', 'BODYWEIGHT', 'CABLE', 'RESISTANCE_BAND', 'KETTLEBELL', 'OTHER');

-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'CORE', 'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'FULL_BODY');

-- CreateEnum
CREATE TYPE "WeekDay" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "coaches" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "full_name" TEXT NOT NULL,
    "gender" "Gender",
    "profile_photo" TEXT,
    "city" TEXT,
    "country" TEXT,
    "years_experience" INTEGER,
    "specialisations" TEXT[],
    "monthly_fee" DECIMAL(10,2),
    "coaching_mode" "CoachingMode",
    "bio" TEXT,
    "instagram_url" TEXT,
    "website_url" TEXT,
    "tier" "CoachTier" NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "profile_slug" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "people_trained_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coaches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "full_name" TEXT NOT NULL,
    "gender" "Gender",
    "profile_photo" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "city" TEXT,
    "country" TEXT,
    "height_cm" DECIMAL(5,2),
    "starting_weight" DECIMAL(5,2),
    "current_weight" DECIMAL(5,2),
    "goal_weight" DECIMAL(5,2),
    "fitness_goal" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuing_body" TEXT,
    "file_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_sessions" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT,
    "client_id" TEXT,
    "device_id" TEXT NOT NULL,
    "device_type" TEXT,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "fcm_token" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_analytics" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "total_clients" INTEGER NOT NULL DEFAULT 0,
    "active_clients" INTEGER NOT NULL DEFAULT 0,
    "weekly_active_clients" INTEGER NOT NULL DEFAULT 0,
    "avg_compliance_rate" DECIMAL(5,2),
    "total_revenue" DECIMAL(12,2),
    "monthly_revenue" DECIMAL(12,2),
    "profile_views" INTEGER NOT NULL DEFAULT 0,
    "total_leads" INTEGER NOT NULL DEFAULT 0,
    "conversion_rate" DECIMAL(5,2),
    "plan_completion_rate" DECIMAL(5,2),
    "last_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coach_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_client_relationships" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "status" "ClientStatus" NOT NULL,
    "workout_plan_id" TEXT,
    "nutrition_plan_id" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "monthly_fee" DECIMAL(10,2),
    "next_payment_due" TIMESTAMP(3),
    "drop_off_risk" "DropOffRisk" NOT NULL DEFAULT 'LOW',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_client_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_plans" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "level" "DifficultyLevel" NOT NULL,
    "duration_weeks" INTEGER,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "is_draft" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_days" (
    "id" TEXT NOT NULL,
    "workout_plan_id" TEXT NOT NULL,
    "title" TEXT,
    "week_number" INTEGER NOT NULL DEFAULT 1,
    "day_of_week" "WeekDay",
    "order_index" INTEGER NOT NULL,
    "is_rest_day" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "muscle_group" "MuscleGroup" NOT NULL,
    "equipment" "EquipmentType" NOT NULL,
    "level" "DifficultyLevel" NOT NULL,
    "video_url" TEXT,
    "thumbnail_url" TEXT,
    "instructions" TEXT,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_day_exercises" (
    "id" TEXT NOT NULL,
    "workout_day_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "sets" INTEGER,
    "reps" TEXT,
    "rest_seconds" INTEGER,
    "duration_secs" INTEGER,
    "tempo" TEXT,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_day_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_plans" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "daily_calories" INTEGER,
    "protein_grams" DECIMAL(6,2),
    "carbs_grams" DECIMAL(6,2),
    "fats_grams" DECIMAL(6,2),
    "fiber_grams" DECIMAL(6,2),
    "duration_weeks" INTEGER,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "is_draft" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nutrition_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_sections" (
    "id" TEXT NOT NULL,
    "nutrition_plan_id" TEXT NOT NULL,
    "meal_type" "MealType" NOT NULL,
    "name" TEXT,
    "day_number" INTEGER NOT NULL DEFAULT 1,
    "week_number" INTEGER NOT NULL DEFAULT 1,
    "target_calories" INTEGER,
    "target_protein" DECIMAL(6,2),
    "target_carbs" DECIMAL(6,2),
    "target_fats" DECIMAL(6,2),
    "order_index" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "calories_per_100g" DECIMAL(6,2) NOT NULL,
    "protein_per_100g" DECIMAL(6,2) NOT NULL,
    "carbs_per_100g" DECIMAL(6,2) NOT NULL,
    "fats_per_100g" DECIMAL(6,2) NOT NULL,
    "fiber_per_100g" DECIMAL(6,2),
    "serving_size_grams" DECIMAL(6,2),
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "food_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_foods" (
    "id" TEXT NOT NULL,
    "meal_section_id" TEXT NOT NULL,
    "food_item_id" TEXT NOT NULL,
    "quantity_grams" DECIMAL(6,2) NOT NULL,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_logs" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "workout_day_id" TEXT,
    "logged_at" TIMESTAMP(3) NOT NULL,
    "is_completed" BOOLEAN NOT NULL,
    "duration_minutes" INTEGER,
    "perceived_effort" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_logs" (
    "id" TEXT NOT NULL,
    "workout_log_id" TEXT NOT NULL,
    "exercise_id" TEXT,
    "exercise_name" TEXT NOT NULL,
    "sets" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_logs" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "meal_section_id" TEXT,
    "logged_at" TIMESTAMP(3) NOT NULL,
    "is_completed" BOOLEAN NOT NULL,
    "calories_consumed" INTEGER,
    "protein_consumed" DECIMAL(6,2),
    "carbs_consumed" DECIMAL(6,2),
    "fats_consumed" DECIMAL(6,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nutrition_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habits" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT,
    "client_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "target_value" TEXT,
    "unit" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_logs" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "habit_id" TEXT NOT NULL,
    "logged_at" TIMESTAMP(3) NOT NULL,
    "is_completed" BOOLEAN NOT NULL,
    "value" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_entries" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "weight_kg" DECIMAL(5,2),
    "body_fat_percent" DECIMAL(4,2),
    "chest_cm" DECIMAL(5,2),
    "waist_cm" DECIMAL(5,2),
    "hips_cm" DECIMAL(5,2),
    "left_arm_cm" DECIMAL(5,2),
    "right_arm_cm" DECIMAL(5,2),
    "left_thigh_cm" DECIMAL(5,2),
    "right_thigh_cm" DECIMAL(5,2),
    "photo_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_rooms" (
    "id" TEXT NOT NULL,
    "type" "ChatRoomType" NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_room_members" (
    "id" TEXT NOT NULL,
    "chat_room_id" TEXT NOT NULL,
    "coach_id" TEXT,
    "client_id" TEXT,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_read_at" TIMESTAMP(3),

    CONSTRAINT "chat_room_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "chat_room_id" TEXT NOT NULL,
    "sender_coach_id" TEXT,
    "sender_client_id" TEXT,
    "type" "MessageType" NOT NULL,
    "content" TEXT,
    "file_url" TEXT,
    "file_name" TEXT,
    "file_mime_type" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT,
    "client_id" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_profiles" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "headline" TEXT,
    "philosophy" TEXT,
    "cta_book_call" BOOLEAN NOT NULL DEFAULT false,
    "cta_ask_question" BOOLEAN NOT NULL DEFAULT false,
    "cta_buy_program" BOOLEAN NOT NULL DEFAULT false,
    "profile_views" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_tiers" (
    "id" TEXT NOT NULL,
    "marketing_profile_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "billing_cycle" TEXT NOT NULL,
    "features" TEXT[],
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL,
    "marketing_profile_id" TEXT NOT NULL,
    "client_id" TEXT,
    "client_name" TEXT NOT NULL,
    "client_photo" TEXT,
    "content" TEXT NOT NULL,
    "rating" INTEGER,
    "before_photo_url" TEXT,
    "after_photo_url" TEXT,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ResourceType" NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_access" (
    "id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "client_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "message" TEXT,
    "source" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'PENDING',
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coaches_email_key" ON "coaches"("email");

-- CreateIndex
CREATE UNIQUE INDEX "coaches_phone_key" ON "coaches"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "coaches_profile_slug_key" ON "coaches"("profile_slug");

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_key" ON "clients"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_phone_key" ON "clients"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "device_sessions_device_id_key" ON "device_sessions"("device_id");

-- CreateIndex
CREATE INDEX "device_sessions_coach_id_idx" ON "device_sessions"("coach_id");

-- CreateIndex
CREATE INDEX "device_sessions_client_id_idx" ON "device_sessions"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "coach_analytics_coach_id_key" ON "coach_analytics"("coach_id");

-- CreateIndex
CREATE INDEX "coach_client_relationships_status_idx" ON "coach_client_relationships"("status");

-- CreateIndex
CREATE UNIQUE INDEX "coach_client_relationships_coach_id_client_id_key" ON "coach_client_relationships"("coach_id", "client_id");

-- CreateIndex
CREATE INDEX "workout_days_workout_plan_id_week_number_order_index_idx" ON "workout_days"("workout_plan_id", "week_number", "order_index");

-- CreateIndex
CREATE INDEX "exercises_muscle_group_equipment_level_idx" ON "exercises"("muscle_group", "equipment", "level");

-- CreateIndex
CREATE INDEX "workout_day_exercises_workout_day_id_order_index_idx" ON "workout_day_exercises"("workout_day_id", "order_index");

-- CreateIndex
CREATE INDEX "meal_sections_nutrition_plan_id_week_number_day_number_orde_idx" ON "meal_sections"("nutrition_plan_id", "week_number", "day_number", "order_index");

-- CreateIndex
CREATE INDEX "meal_foods_meal_section_id_order_index_idx" ON "meal_foods"("meal_section_id", "order_index");

-- CreateIndex
CREATE INDEX "workout_logs_client_id_logged_at_idx" ON "workout_logs"("client_id", "logged_at");

-- CreateIndex
CREATE INDEX "exercise_logs_workout_log_id_idx" ON "exercise_logs"("workout_log_id");

-- CreateIndex
CREATE INDEX "nutrition_logs_client_id_logged_at_idx" ON "nutrition_logs"("client_id", "logged_at");

-- CreateIndex
CREATE INDEX "habit_logs_client_id_logged_at_idx" ON "habit_logs"("client_id", "logged_at");

-- CreateIndex
CREATE INDEX "progress_entries_client_id_recorded_at_idx" ON "progress_entries"("client_id", "recorded_at");

-- CreateIndex
CREATE INDEX "chat_room_members_chat_room_id_idx" ON "chat_room_members"("chat_room_id");

-- CreateIndex
CREATE INDEX "messages_chat_room_id_sent_at_idx" ON "messages"("chat_room_id", "sent_at");

-- CreateIndex
CREATE INDEX "notifications_coach_id_created_at_idx" ON "notifications"("coach_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_client_id_created_at_idx" ON "notifications"("client_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_profiles_coach_id_key" ON "marketing_profiles"("coach_id");

-- CreateIndex
CREATE UNIQUE INDEX "resource_access_resource_id_client_id_key" ON "resource_access"("resource_id", "client_id");

-- CreateIndex
CREATE INDEX "inquiries_coach_id_status_idx" ON "inquiries"("coach_id", "status");

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_sessions" ADD CONSTRAINT "device_sessions_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_sessions" ADD CONSTRAINT "device_sessions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_analytics" ADD CONSTRAINT "coach_analytics_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_client_relationships" ADD CONSTRAINT "coach_client_relationships_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_client_relationships" ADD CONSTRAINT "coach_client_relationships_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_client_relationships" ADD CONSTRAINT "coach_client_relationships_workout_plan_id_fkey" FOREIGN KEY ("workout_plan_id") REFERENCES "workout_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_client_relationships" ADD CONSTRAINT "coach_client_relationships_nutrition_plan_id_fkey" FOREIGN KEY ("nutrition_plan_id") REFERENCES "nutrition_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_days" ADD CONSTRAINT "workout_days_workout_plan_id_fkey" FOREIGN KEY ("workout_plan_id") REFERENCES "workout_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "coaches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_day_exercises" ADD CONSTRAINT "workout_day_exercises_workout_day_id_fkey" FOREIGN KEY ("workout_day_id") REFERENCES "workout_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_day_exercises" ADD CONSTRAINT "workout_day_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_plans" ADD CONSTRAINT "nutrition_plans_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_sections" ADD CONSTRAINT "meal_sections_nutrition_plan_id_fkey" FOREIGN KEY ("nutrition_plan_id") REFERENCES "nutrition_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_items" ADD CONSTRAINT "food_items_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "coaches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_foods" ADD CONSTRAINT "meal_foods_meal_section_id_fkey" FOREIGN KEY ("meal_section_id") REFERENCES "meal_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_foods" ADD CONSTRAINT "meal_foods_food_item_id_fkey" FOREIGN KEY ("food_item_id") REFERENCES "food_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_workout_day_id_fkey" FOREIGN KEY ("workout_day_id") REFERENCES "workout_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_workout_log_id_fkey" FOREIGN KEY ("workout_log_id") REFERENCES "workout_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_logs" ADD CONSTRAINT "nutrition_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_logs" ADD CONSTRAINT "nutrition_logs_meal_section_id_fkey" FOREIGN KEY ("meal_section_id") REFERENCES "meal_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_entries" ADD CONSTRAINT "progress_entries_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_room_members" ADD CONSTRAINT "chat_room_members_chat_room_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_room_members" ADD CONSTRAINT "chat_room_members_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_room_members" ADD CONSTRAINT "chat_room_members_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_room_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_coach_id_fkey" FOREIGN KEY ("sender_coach_id") REFERENCES "coaches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_client_id_fkey" FOREIGN KEY ("sender_client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_profiles" ADD CONSTRAINT "marketing_profiles_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_marketing_profile_id_fkey" FOREIGN KEY ("marketing_profile_id") REFERENCES "marketing_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_marketing_profile_id_fkey" FOREIGN KEY ("marketing_profile_id") REFERENCES "marketing_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_access" ADD CONSTRAINT "resource_access_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_access" ADD CONSTRAINT "resource_access_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
