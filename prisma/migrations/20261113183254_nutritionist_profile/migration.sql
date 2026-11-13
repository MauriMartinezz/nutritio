-- AlterTable
ALTER TABLE `users` ADD COLUMN `birth_date` DATE NULL,
    ADD COLUMN `dni` VARCHAR(8) NULL,
    ADD COLUMN `license_number` VARCHAR(30) NULL,
    ADD COLUMN `phone` VARCHAR(20) NULL,
    ADD COLUMN `specialty` VARCHAR(100) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_dni_key` ON `users`(`dni`);

