ALTER TABLE `messages` ADD `status` text DEFAULT 'completed' NOT NULL;--> statement-breakpoint
CREATE INDEX `messages_status_idx` ON `messages` (`status`);