CREATE TABLE `catalog_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text DEFAULT 'service' NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`sku` text DEFAULT '' NOT NULL,
	`unit` text DEFAULT 'kom' NOT NULL,
	`price` real DEFAULT 0 NOT NULL,
	`vat` real DEFAULT 17 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_catalog_user_name` ON `catalog_items` (`user_id`,`name`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`postal_code` text DEFAULT '' NOT NULL,
	`jib` text DEFAULT '' NOT NULL,
	`vat_id` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`contact_person` text DEFAULT '' NOT NULL,
	`contact_email` text DEFAULT '' NOT NULL,
	`contact_phone` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_customers_user_name` ON `customers` (`user_id`,`name`);--> statement-breakpoint
ALTER TABLE `companies` ADD `contact_person` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `client_contact` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `show_client_contact` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `show_issuer_contact` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `fiscal_number` text DEFAULT '' NOT NULL;