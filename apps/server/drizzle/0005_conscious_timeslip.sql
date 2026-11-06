CREATE TABLE `workspace_directories` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workspace_directories_project_id_idx` ON `workspace_directories` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_directories_project_path_unique` ON `workspace_directories` (`project_id`,`path`);--> statement-breakpoint
ALTER TABLE `projects` DROP COLUMN `root_path`;