ALTER TABLE `companies` ADD `invoice_title` text DEFAULT 'Faktura' NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` ADD `offer_title` text DEFAULT 'Ponuda' NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` ADD `show_discount` integer DEFAULT false NOT NULL;