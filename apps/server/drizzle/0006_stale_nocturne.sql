CREATE TABLE `workspace_files` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_directory_id` text NOT NULL,
	`relative_path` text NOT NULL,
	`name` text NOT NULL,
	`extension` text,
	`size` integer NOT NULL,
	`modified_at` integer NOT NULL,
	`content_hash` text,
	`index_status` text DEFAULT 'pending' NOT NULL,
	`indexed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`workspace_directory_id`) REFERENCES `workspace_directories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workspace_files_directory_id_idx` ON `workspace_files` (`workspace_directory_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `workspace_files_directory_path_unique` ON `workspace_files` (`workspace_directory_id`,`relative_path`);--> statement-breakpoint
CREATE INDEX `workspace_files_index_status_idx` ON `workspace_files` (`index_status`);--> statement-breakpoint
CREATE TABLE `workspace_file_contents` (
	`file_id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`token_count` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`file_id`) REFERENCES `workspace_files`(`id`) ON UPDATE no action ON DELETE cascade
);
