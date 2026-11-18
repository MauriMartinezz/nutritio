-- CreateTable
CREATE TABLE `requested_measurements` (
    `link_id` VARCHAR(191) NOT NULL,
    `site` ENUM('CHEST', 'HIPS', 'THIGH', 'ARM', 'NAVEL', 'WAIST', 'BELOW_NAVEL') NOT NULL,

    PRIMARY KEY (`link_id`, `site`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `check_in_measurements` (
    `check_in_id` VARCHAR(191) NOT NULL,
    `site` ENUM('CHEST', 'HIPS', 'THIGH', 'ARM', 'NAVEL', 'WAIST', 'BELOW_NAVEL') NOT NULL,
    `cm` DECIMAL(4, 1) NOT NULL,

    PRIMARY KEY (`check_in_id`, `site`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `requested_measurements` ADD CONSTRAINT `requested_measurements_link_id_fkey` FOREIGN KEY (`link_id`) REFERENCES `nutritionist_clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `check_in_measurements` ADD CONSTRAINT `check_in_measurements_check_in_id_fkey` FOREIGN KEY (`check_in_id`) REFERENCES `check_ins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
