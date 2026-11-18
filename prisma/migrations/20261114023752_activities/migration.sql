-- CreateTable
CREATE TABLE `activities` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `type` ENUM('STRENGTH', 'GYM', 'CALISTHENICS', 'FOOTBALL', 'RUNNING', 'CYCLING', 'SWIMMING', 'WALKING', 'YOGA', 'OTHER') NOT NULL,
    `custom_name` VARCHAR(60) NULL,
    `performed_on` DATE NOT NULL,
    `duration_minutes` INTEGER NOT NULL,
    `intensity` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
    `notes` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activities_user_id_performed_on_idx`(`user_id`, `performed_on`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
