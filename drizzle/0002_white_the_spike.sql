CREATE TABLE `billing_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text DEFAULT 'BRATTS d.o.o.' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`postal_code` text DEFAULT '' NOT NULL,
	`jib` text DEFAULT '' NOT NULL,
	`vat_id` text DEFAULT '' NOT NULL,
	`iban` text DEFAULT '' NOT NULL,
	`bank` text DEFAULT '' NOT NULL,
	`email` text DEFAULT 'electroace@gmail.com' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plan_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`number` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`base_cents` integer NOT NULL,
	`vat_cents` integer NOT NULL,
	`issuer_json` text NOT NULL,
	`customer_json` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`email_status` text DEFAULT 'not_configured' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plan_requests_number_unique` ON `plan_requests` (`number`);--> statement-breakpoint
CREATE INDEX `idx_plan_requests_user` ON `plan_requests` (`user_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_plan_requests_one_pending` ON `plan_requests` (`user_id`) WHERE `status` = 'pending';--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_companies` (
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
	`status` text DEFAULT 'approved' NOT NULL,
	`plan` text DEFAULT 'free' NOT NULL,
	`price_bam` real DEFAULT 22 NOT NULL,
	`paid_until` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_companies`("user_id", "email", "name", "address", "city", "postal_code", "jib", "vat_id", "vat_registered", "iban", "bank", "phone", "contact_email", "logo_key", "status", "plan", "price_bam", "paid_until", "created_at", "updated_at") SELECT "user_id", "email", "name", "address", "city", "postal_code", "jib", "vat_id", "vat_registered", "iban", "bank", "phone", "contact_email", "logo_key", "status", "plan", "price_bam", NULL, "created_at", "updated_at" FROM `companies`;--> statement-breakpoint
DROP TABLE `companies`;--> statement-breakpoint
ALTER TABLE `__new_companies` RENAME TO `companies`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_companies_status` ON `companies` (`status`);
