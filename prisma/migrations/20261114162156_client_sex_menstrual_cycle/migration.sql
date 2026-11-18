-- AlterTable
ALTER TABLE `check_ins` ADD COLUMN `menstruating` BOOLEAN NULL;

-- AlterTable
ALTER TABLE `client_preferences` ADD COLUMN `sex` ENUM('FEMALE', 'MALE') NULL;

-- AlterTable
ALTER TABLE `nutritionist_clients` ADD COLUMN `ask_menstrual_cycle` BOOLEAN NOT NULL DEFAULT false;
