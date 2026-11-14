-- AlterTable
ALTER TABLE `users` ADD COLUMN `reviewed_at` DATETIME(3) NULL,
    ADD COLUMN `verification_note` VARCHAR(1000) NULL;
