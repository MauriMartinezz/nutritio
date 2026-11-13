-- CreateTable
CREATE TABLE `foods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `source` ENUM('USDA_FOUNDATION', 'USDA_SR_LEGACY') NOT NULL,
    `fdc_id` INTEGER NULL,
    `name_en` VARCHAR(255) NOT NULL,
    `name_es` VARCHAR(255) NULL,
    `category` VARCHAR(100) NULL,
    `kcal` DECIMAL(7, 2) NULL,
    `protein_g` DECIMAL(6, 2) NULL,
    `carbs_g` DECIMAL(6, 2) NULL,
    `fat_g` DECIMAL(6, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `foods_fdc_id_key`(`fdc_id`),
    INDEX `foods_name_es_idx`(`name_es`),
    INDEX `foods_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
