-- AlterTable
ALTER TABLE `nutritionist_clients` ADD COLUMN `access_amount` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `access_unit` ENUM('DAY', 'WEEK', 'MONTH') NOT NULL DEFAULT 'MONTH',
    ADD COLUMN `access_until` DATETIME(3) NULL,
    ADD COLUMN `auto_renew` BOOLEAN NOT NULL DEFAULT false;

-- Existing accepted links get one month of access from now, so nobody loses access on deploy.
UPDATE `nutritionist_clients` SET `access_until` = DATE_ADD(NOW(3), INTERVAL 1 MONTH) WHERE `status` = 'ACCEPTED';
