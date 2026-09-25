ALTER TABLE `companies` ADD `default_note` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` ADD `responsible_person` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` ADD `electronic_notice` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` ADD `show_signature_line` integer DEFAULT false NOT NULL;