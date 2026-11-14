-- AlterTable
ALTER TABLE `users` ADD COLUMN `bio` TEXT NULL,
    ADD COLUMN `education` VARCHAR(500) NULL,
    ADD COLUMN `fee_amount` DECIMAL(10, 2) NULL,
    ADD COLUMN `fee_currency` ENUM('ARS', 'USD') NOT NULL DEFAULT 'ARS',
    ADD COLUMN `fee_description` VARCHAR(200) NULL,
    ADD COLUMN `plan_includes` TEXT NULL;
