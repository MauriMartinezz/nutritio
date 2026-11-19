-- CreateEnum
CREATE TYPE "FoodPreparation" AS ENUM ('RAW', 'COOKED');

-- CreateEnum
CREATE TYPE "FoodSource" AS ENUM ('USDA_FOUNDATION', 'USDA_SR_LEGACY');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'NUTRITIONIST', 'CLIENT');

-- CreateEnum
CREATE TYPE "FeeCurrency" AS ENUM ('ARS', 'USD');

-- CreateEnum
CREATE TYPE "NutritionistStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AccessUnit" AS ENUM ('DAY', 'WEEK', 'MONTH');

-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CookingStyle" AS ENUM ('BASIC', 'ELABORATE', 'NO_PREFERENCE');

-- CreateEnum
CREATE TYPE "MeasurementSite" AS ENUM ('CHEST', 'HIPS', 'THIGH', 'ARM', 'NAVEL', 'WAIST', 'BELOW_NAVEL');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('FEMALE', 'MALE');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('STRENGTH', 'GYM', 'CALISTHENICS', 'FOOTBALL', 'RUNNING', 'CYCLING', 'SWIMMING', 'WALKING', 'YOGA', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityIntensity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "MeetingKind" AS ENUM ('VIDEO_CALL', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "GymPerformance" AS ENUM ('IMPROVED', 'SAME', 'DROPPED');

-- CreateTable
CREATE TABLE "foods" (
    "id" SERIAL NOT NULL,
    "source" "FoodSource" NOT NULL,
    "fdc_id" INTEGER,
    "name_en" VARCHAR(255) NOT NULL,
    "name_es" VARCHAR(255),
    "category" VARCHAR(100),
    "category_es" VARCHAR(100),
    "group_key" VARCHAR(100),
    "preparation" "FoodPreparation",
    "preparation_note_es" VARCHAR(50),
    "kcal" DECIMAL(7,2),
    "protein_g" DECIMAL(6,2),
    "carbs_g" DECIMAL(6,2),
    "fat_g" DECIMAL(6,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "nutritionist_status" "NutritionistStatus",
    "verification_note" VARCHAR(1000),
    "reviewed_at" TIMESTAMP(3),
    "dni" VARCHAR(8),
    "license_number" VARCHAR(30),
    "birth_date" DATE,
    "phone" VARCHAR(20),
    "specialty" VARCHAR(100),
    "bio" TEXT,
    "education" VARCHAR(500),
    "plan_includes" TEXT,
    "fee_amount" DECIMAL(10,2),
    "fee_currency" "FeeCurrency" NOT NULL DEFAULT 'ARS',
    "fee_description" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "ip_address" VARCHAR(255),
    "user_agent" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "account_id" VARCHAR(255) NOT NULL,
    "provider_id" VARCHAR(255) NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" VARCHAR(255) NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutritionist_clients" (
    "id" TEXT NOT NULL,
    "nutritionist_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "status" "LinkStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "access_amount" INTEGER NOT NULL DEFAULT 1,
    "access_unit" "AccessUnit" NOT NULL DEFAULT 'MONTH',
    "access_until" TIMESTAMP(3),
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "check_in_every_days" INTEGER,
    "ask_menstrual_cycle" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nutritionist_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plans" (
    "id" TEXT NOT NULL,
    "nutritionist_id" TEXT NOT NULL,
    "client_id" TEXT,
    "name" VARCHAR(120) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meals" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "position" INTEGER NOT NULL,
    "servings" INTEGER NOT NULL DEFAULT 1,
    "extras" VARCHAR(500),

    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_items" (
    "id" TEXT NOT NULL,
    "meal_id" TEXT NOT NULL,
    "food_id" INTEGER NOT NULL,
    "grams" INTEGER NOT NULL,
    "note" VARCHAR(200),
    "position" INTEGER NOT NULL,

    CONSTRAINT "meal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_preferences" (
    "user_id" TEXT NOT NULL,
    "low_carb" BOOLEAN NOT NULL DEFAULT false,
    "vegan" BOOLEAN NOT NULL DEFAULT false,
    "vegetarian" BOOLEAN NOT NULL DEFAULT false,
    "gluten_free" BOOLEAN NOT NULL DEFAULT false,
    "prefers_meal_prep" BOOLEAN NOT NULL DEFAULT false,
    "cooking_style" "CookingStyle" NOT NULL DEFAULT 'NO_PREFERENCE',
    "diabetic" BOOLEAN NOT NULL DEFAULT false,
    "celiac" BOOLEAN NOT NULL DEFAULT false,
    "hypertension" BOOLEAN NOT NULL DEFAULT false,
    "intolerances" VARCHAR(500),
    "other_conditions" VARCHAR(500),
    "notes" TEXT,
    "sex" "Sex",
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_preferences_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "link_id" TEXT NOT NULL,
    "weight_kg" DECIMAL(5,2) NOT NULL,
    "sleep" INTEGER NOT NULL,
    "completed_workouts" BOOLEAN NOT NULL,
    "gym_performance" "GymPerformance",
    "energy" INTEGER NOT NULL,
    "hunger" INTEGER NOT NULL,
    "diet_adherence" INTEGER,
    "discomfort" BOOLEAN NOT NULL DEFAULT false,
    "discomfort_notes" VARCHAR(500),
    "notes" TEXT,
    "menstruating" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requested_measurements" (
    "link_id" TEXT NOT NULL,
    "site" "MeasurementSite" NOT NULL,

    CONSTRAINT "requested_measurements_pkey" PRIMARY KEY ("link_id","site")
);

-- CreateTable
CREATE TABLE "check_in_measurements" (
    "check_in_id" TEXT NOT NULL,
    "site" "MeasurementSite" NOT NULL,
    "cm" DECIMAL(4,1) NOT NULL,

    CONSTRAINT "check_in_measurements_pkey" PRIMARY KEY ("check_in_id","site")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "custom_name" VARCHAR(60),
    "performed_on" DATE NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "intensity" "ActivityIntensity" NOT NULL,
    "notes" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_requests" (
    "id" TEXT NOT NULL,
    "link_id" TEXT NOT NULL,
    "kind" "MeetingKind" NOT NULL,
    "message" VARCHAR(1000),
    "preferred_times" VARCHAR(300),
    "status" "MeetingStatus" NOT NULL DEFAULT 'PENDING',
    "scheduled_for" TIMESTAMP(3),
    "response_note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "meeting_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "foods_fdc_id_key" ON "foods"("fdc_id");

-- CreateIndex
CREATE INDEX "foods_name_es_idx" ON "foods"("name_es");

-- CreateIndex
CREATE INDEX "foods_category_idx" ON "foods"("category");

-- CreateIndex
CREATE INDEX "foods_group_key_idx" ON "foods"("group_key");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_dni_key" ON "users"("dni");

-- CreateIndex
CREATE INDEX "users_role_nutritionist_status_idx" ON "users"("role", "nutritionist_status");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

-- CreateIndex
CREATE INDEX "nutritionist_clients_client_id_status_idx" ON "nutritionist_clients"("client_id", "status");

-- CreateIndex
CREATE INDEX "nutritionist_clients_nutritionist_id_status_idx" ON "nutritionist_clients"("nutritionist_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "nutritionist_clients_nutritionist_id_client_id_key" ON "nutritionist_clients"("nutritionist_id", "client_id");

-- CreateIndex
CREATE INDEX "meal_plans_nutritionist_id_client_id_idx" ON "meal_plans"("nutritionist_id", "client_id");

-- CreateIndex
CREATE INDEX "meal_plans_client_id_created_at_idx" ON "meal_plans"("client_id", "created_at");

-- CreateIndex
CREATE INDEX "meals_plan_id_position_idx" ON "meals"("plan_id", "position");

-- CreateIndex
CREATE INDEX "meal_items_meal_id_position_idx" ON "meal_items"("meal_id", "position");

-- CreateIndex
CREATE INDEX "check_ins_link_id_created_at_idx" ON "check_ins"("link_id", "created_at");

-- CreateIndex
CREATE INDEX "activities_user_id_performed_on_idx" ON "activities"("user_id", "performed_on");

-- CreateIndex
CREATE INDEX "meeting_requests_link_id_status_idx" ON "meeting_requests"("link_id", "status");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutritionist_clients" ADD CONSTRAINT "nutritionist_clients_nutritionist_id_fkey" FOREIGN KEY ("nutritionist_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutritionist_clients" ADD CONSTRAINT "nutritionist_clients_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_nutritionist_id_fkey" FOREIGN KEY ("nutritionist_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meals" ADD CONSTRAINT "meals_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "meal_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_preferences" ADD CONSTRAINT "client_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "nutritionist_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requested_measurements" ADD CONSTRAINT "requested_measurements_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "nutritionist_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_in_measurements" ADD CONSTRAINT "check_in_measurements_check_in_id_fkey" FOREIGN KEY ("check_in_id") REFERENCES "check_ins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_requests" ADD CONSTRAINT "meeting_requests_link_id_fkey" FOREIGN KEY ("link_id") REFERENCES "nutritionist_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
