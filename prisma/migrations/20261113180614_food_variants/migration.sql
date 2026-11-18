-- AlterTable
ALTER TABLE `foods` ADD COLUMN `category_es` VARCHAR(100) NULL,
    ADD COLUMN `group_key` VARCHAR(100) NULL,
    ADD COLUMN `preparation` ENUM('RAW', 'COOKED') NULL,
    ADD COLUMN `preparation_note_es` VARCHAR(50) NULL;

-- CreateIndex
CREATE INDEX `foods_group_key_idx` ON `foods`(`group_key`);
