-- Check-ins record "completed the agreed workouts" as yes/no instead of a 1–5 rating.
-- Existing ratings of 3 or more count as yes.
ALTER TABLE `check_ins` ADD COLUMN `completed_workouts` BOOLEAN NOT NULL DEFAULT false;
UPDATE `check_ins` SET `completed_workouts` = (`training_adherence` >= 3);
ALTER TABLE `check_ins` ALTER COLUMN `completed_workouts` DROP DEFAULT;
ALTER TABLE `check_ins` DROP COLUMN `training_adherence`;
