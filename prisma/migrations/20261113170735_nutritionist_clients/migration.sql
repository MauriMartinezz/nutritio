-- CreateTable
CREATE TABLE `nutritionist_clients` (
    `id` VARCHAR(191) NOT NULL,
    `nutritionist_id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `requested_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `responded_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `nutritionist_clients_client_id_status_idx`(`client_id`, `status`),
    INDEX `nutritionist_clients_nutritionist_id_status_idx`(`nutritionist_id`, `status`),
    UNIQUE INDEX `nutritionist_clients_nutritionist_id_client_id_key`(`nutritionist_id`, `client_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `nutritionist_clients` ADD CONSTRAINT `nutritionist_clients_nutritionist_id_fkey` FOREIGN KEY (`nutritionist_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nutritionist_clients` ADD CONSTRAINT `nutritionist_clients_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
