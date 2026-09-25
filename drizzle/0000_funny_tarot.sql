CREATE TABLE `companies` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`city` text NOT NULL,
	`postal_code` text DEFAULT '' NOT NULL,
	`jib` text NOT NULL,
	`vat_id` text DEFAULT '' NOT NULL,
	`vat_registered` integer DEFAULT false NOT NULL,
	`iban` text DEFAULT '' NOT NULL,
	`bank` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`contact_email` text DEFAULT '' NOT NULL,
	`logo_key` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`plan` text DEFAULT 'free' NOT NULL,
	`price_bam` integer DEFAULT 22 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_companies_status` ON `companies` (`status`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`number` text NOT NULL,
	`issue_date` text NOT NULL,
	`due_date` text DEFAULT '' NOT NULL,
	`client_name` text NOT NULL,
	`client_address` text DEFAULT '' NOT NULL,
	`client_id` text DEFAULT '' NOT NULL,
	`currency` text DEFAULT 'KM' NOT NULL,
	`items_json` text NOT NULL,
	`issuer_json` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`month` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_documents_owner_number` ON `documents` (`user_id`,`number`);--> statement-breakpoint
CREATE INDEX `idx_documents_owner_date` ON `documents` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_documents_owner_month` ON `documents` (`user_id`,`month`);