ALTER TABLE `messages` ADD `sequence` integer NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `messages_conversation_sequence_unique_idx` ON `messages` (`conversation_id`,`sequence`);