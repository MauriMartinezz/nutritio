-- CreateTable
CREATE TABLE `client_preferences` (
    `user_id` VARCHAR(191) NOT NULL,
    `low_carb` BOOLEAN NOT NULL DEFAULT false,
    `vegan` BOOLEAN NOT NULL DEFAULT false,
    `vegetarian` BOOLEAN NOT NULL DEFAULT false,
    `gluten_free` BOOLEAN NOT NULL DEFAULT false,
    `prefers_meal_prep` BOOLEAN NOT NULL DEFAULT false,
    `cooking_style` ENUM('BASIC', 'ELABORATE', 'NO_PREFERENCE') NOT NULL DEFAULT 'NO_PREFERENCE',
    `diabetic` BOOLEAN NOT NULL DEFAULT false,
    `celiac` BOOLEAN NOT NULL DEFAULT false,
    `hypertension` BOOLEAN NOT NULL DEFAULT false,
    `intolerances` VARCHAR(500) NULL,
    `other_conditions` VARCHAR(500) NULL,
    `notes` TEXT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `client_preferences` ADD CONSTRAINT `client_preferences_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
