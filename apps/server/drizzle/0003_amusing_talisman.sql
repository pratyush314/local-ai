CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`root_path` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `projects_updated_at_idx` ON `projects` (`updated_at`);--> statement-breakpoint
CREATE TABLE `project_memories` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`kind` text NOT NULL,
	`subject` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`confidence` real,
	`source_type` text NOT NULL,
	`source_message_id` text,
	`source_path` text,
	`source_reference` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`source_message_id`) REFERENCES `messages`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `project_memories_project_status_idx` ON `project_memories` (`project_id`,`status`);--> statement-breakpoint
CREATE INDEX `project_memories_project_kind_idx` ON `project_memories` (`project_id`,`kind`);--> statement-breakpoint
CREATE INDEX `project_memories_source_message_idx` ON `project_memories` (`source_message_id`);--> statement-breakpoint
ALTER TABLE `conversations` ADD `project_id` text REFERENCES projects(id);