-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `open_id` VARCHAR(128) NOT NULL,
    `union_id` VARCHAR(128) NULL,
    `nickname` VARCHAR(100) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `membership_type` ENUM('FREE', 'MONTHLY', 'YEARLY') NOT NULL DEFAULT 'FREE',
    `membership_expire_at` DATETIME(3) NULL,
    `purchased_quota` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('ACTIVE', 'SUSPENDED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_open_id_key`(`open_id`),
    UNIQUE INDEX `users_union_id_key`(`union_id`),
    INDEX `users_open_id_idx`(`open_id`),
    INDEX `users_membership_type_membership_expire_at_idx`(`membership_type`, `membership_expire_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `content_scenarios` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `slug` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(200) NULL,
    `platform` VARCHAR(50) NOT NULL,
    `input_schema` JSON NOT NULL,
    `system_prompt` TEXT NOT NULL,
    `default_tone_style` VARCHAR(50) NOT NULL DEFAULT 'ENTHUSIASTIC',
    `max_length` INTEGER NOT NULL DEFAULT 500,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `content_scenarios_slug_key`(`slug`),
    INDEX `content_scenarios_slug_idx`(`slug`),
    INDEX `content_scenarios_is_active_sort_order_idx`(`is_active`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tone_styles` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `slug` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `prompt_modifier` TEXT NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tone_styles_slug_key`(`slug`),
    INDEX `tone_styles_is_active_sort_order_idx`(`is_active`, `sort_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `content_records` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `scenario_id` VARCHAR(191) NOT NULL,
    `tone_style` VARCHAR(50) NOT NULL,
    `user_input` JSON NOT NULL,
    `generated_content` TEXT NOT NULL,
    `is_edited` BOOLEAN NOT NULL DEFAULT false,
    `edited_content` TEXT NULL,
    `generation_time` INTEGER NULL,
    `ai_model` VARCHAR(50) NOT NULL DEFAULT 'deepseek-chat',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `content_records_user_id_created_at_idx`(`user_id`, `created_at` DESC),
    INDEX `content_records_scenario_id_created_at_idx`(`scenario_id`, `created_at` DESC),
    INDEX `content_records_tone_style_created_at_idx`(`tone_style`, `created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usage_quota` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `daily_limit` INTEGER NOT NULL,
    `used_today` INTEGER NOT NULL DEFAULT 0,
    `last_reset_date` DATE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usage_quota_user_id_key`(`user_id`),
    INDEX `usage_quota_last_reset_date_idx`(`last_reset_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `order_no` VARCHAR(32) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `order_type` ENUM('MEMBERSHIP', 'PAY_PER_USE') NOT NULL,
    `membership_type` ENUM('FREE', 'MONTHLY', 'YEARLY') NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `amount` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `payment_method` VARCHAR(50) NOT NULL DEFAULT 'WECHAT_PAY',
    `transaction_id` VARCHAR(100) NULL,
    `paid_at` DATETIME(3) NULL,
    `refunded_at` DATETIME(3) NULL,
    `refund_reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_order_no_key`(`order_no`),
    INDEX `orders_order_no_idx`(`order_no`),
    INDEX `orders_user_id_status_created_at_idx`(`user_id`, `status`, `created_at` DESC),
    INDEX `orders_status_created_at_idx`(`status`, `created_at` DESC),
    INDEX `orders_transaction_id_idx`(`transaction_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedbacks` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `feedback_type` ENUM('NEW_TONE', 'NEW_SCENARIO', 'FEATURE_REQUEST', 'BUG_REPORT') NOT NULL,
    `content` TEXT NOT NULL,
    `status` ENUM('SUBMITTED', 'IN_PROGRESS', 'ADOPTED', 'REPLIED', 'CLOSED') NOT NULL DEFAULT 'SUBMITTED',
    `admin_reply` TEXT NULL,
    `replied_at` DATETIME(3) NULL,
    `replied_by` VARCHAR(100) NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `feedbacks_user_id_feedback_type_created_at_idx`(`user_id`, `feedback_type`, `created_at` DESC),
    INDEX `feedbacks_status_priority_created_at_idx`(`status`, `priority` DESC, `created_at` DESC),
    INDEX `feedbacks_feedback_type_status_idx`(`feedback_type`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `content_records` ADD CONSTRAINT `content_records_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_records` ADD CONSTRAINT `content_records_scenario_id_fkey` FOREIGN KEY (`scenario_id`) REFERENCES `content_scenarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usage_quota` ADD CONSTRAINT `usage_quota_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feedbacks` ADD CONSTRAINT `feedbacks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
