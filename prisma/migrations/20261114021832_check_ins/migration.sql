-- AlterTable
ALTER TABLE `nutritionist_clients` ADD COLUMN `check_in_every_days` INTEGER NULL;

-- CreateTable
CREATE TABLE `check_ins` (
    `id` VARCHAR(191) NOT NULL,
    `link_id` VARCHAR(191) NOT NULL,
    `weight_kg` DECIMAL(5, 2) NOT NULL,
    `sleep` INTEGER NOT NULL,
    `training_adherence` INTEGER NOT NULL,
    `energy` INTEGER NOT NULL,
    `hunger` INTEGER NOT NULL,
    `discomfort` BOOLEAN NOT NULL DEFAULT false,
    `discomfort_notes` VARCHAR(500) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `check_ins_link_id_created_at_idx`(`link_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `check_ins` ADD CONSTRAINT `check_ins_link_id_fkey` FOREIGN KEY (`link_id`) REFERENCES `nutritionist_clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
