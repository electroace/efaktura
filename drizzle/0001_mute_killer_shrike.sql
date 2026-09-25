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
	`price_bam` integer DEFAULT 22 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_companies`("user_id", "email", "name", "address", "city", "postal_code", "jib", "vat_id", "vat_registered", "iban", "bank", "phone", "contact_email", "logo_key", "status", "plan", "price_bam", "created_at", "updated_at") SELECT "user_id", "email", "name", "address", "city", "postal_code", "jib", "vat_id", "vat_registered", "iban", "bank", "phone", "contact_email", "logo_key", "status", "plan", "price_bam", "created_at", "updated_at" FROM `companies`;--> statement-breakpoint
DROP TABLE `companies`;--> statement-breakpoint
ALTER TABLE `__new_companies` RENAME TO `companies`;--> statement-breakpoint
UPDATE `companies` SET `status`='approved' WHERE `status`='pending';--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_companies_status` ON `companies` (`status`);
