-- CreateTable
CREATE TABLE `meeting_requests` (
    `id` VARCHAR(191) NOT NULL,
    `link_id` VARCHAR(191) NOT NULL,
    `kind` ENUM('VIDEO_CALL', 'IN_PERSON') NOT NULL,
    `message` VARCHAR(1000) NULL,
    `preferred_times` VARCHAR(300) NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED') NOT NULL DEFAULT 'PENDING',
    `scheduled_for` DATETIME(3) NULL,
    `response_note` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `responded_at` DATETIME(3) NULL,

    INDEX `meeting_requests_link_id_status_idx`(`link_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `meeting_requests` ADD CONSTRAINT `meeting_requests_link_id_fkey` FOREIGN KEY (`link_id`) REFERENCES `nutritionist_clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
