-- AlterTable
ALTER TABLE `check_ins` ADD COLUMN `gym_performance` ENUM('IMPROVED', 'SAME', 'DROPPED') NULL;
