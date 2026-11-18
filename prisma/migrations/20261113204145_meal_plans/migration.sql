-- CreateTable
CREATE TABLE `meal_plans` (
    `id` VARCHAR(191) NOT NULL,
    `nutritionist_id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NULL,
    `name` VARCHAR(120) NOT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `meal_plans_nutritionist_id_client_id_idx`(`nutritionist_id`, `client_id`),
    INDEX `meal_plans_client_id_created_at_idx`(`client_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meals` (
    `id` VARCHAR(191) NOT NULL,
    `plan_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `position` INTEGER NOT NULL,

    INDEX `meals_plan_id_position_idx`(`plan_id`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meal_items` (
    `id` VARCHAR(191) NOT NULL,
    `meal_id` VARCHAR(191) NOT NULL,
    `food_id` INTEGER NOT NULL,
    `grams` INTEGER NOT NULL,
    `note` VARCHAR(200) NULL,
    `position` INTEGER NOT NULL,

    INDEX `meal_items_meal_id_position_idx`(`meal_id`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `meal_plans` ADD CONSTRAINT `meal_plans_nutritionist_id_fkey` FOREIGN KEY (`nutritionist_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meal_plans` ADD CONSTRAINT `meal_plans_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meals` ADD CONSTRAINT `meals_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `meal_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meal_items` ADD CONSTRAINT `meal_items_meal_id_fkey` FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meal_items` ADD CONSTRAINT `meal_items_food_id_fkey` FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
