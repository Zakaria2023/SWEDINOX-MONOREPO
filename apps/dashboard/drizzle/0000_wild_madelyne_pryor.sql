CREATE TABLE `Companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` char(36) NOT NULL,
	`company_name` varchar(255) NOT NULL,
	`address_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `Companies_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `CompanyAddresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`company_uuid` char(36),
	`alt_name` varchar(255),
	`po_box` boolean DEFAULT false,
	`street_and_no` varchar(255),
	`postal_code` varchar(50),
	`country` varchar(100),
	`city` varchar(150),
	`region` varchar(150),
	`house` varchar(100),
	`telephone` varchar(100),
	`fax` varchar(100),
	`email` varchar(255),
	`website` varchar(255),
	`billing_attention` varchar(255),
	`billing_attention_additional` varchar(255),
	`sequence_number` int,
	`category` json NOT NULL,
	`need_crane` boolean DEFAULT false,
	`canopy_required` boolean DEFAULT false,
	`bundle_separately` boolean DEFAULT false,
	`address_complete` boolean DEFAULT false,
	`special_transport` boolean DEFAULT false,
	`availableAt` enum('crane_unloading','forklift_unloading'),
	`unloading_start_time` time,
	`unloading_end_time` time,
	`max_length` decimal(10,2),
	`max_bundle_weight` decimal(10,2),
	`loading_instructions` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `CompanyAddresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `CompanyAddresses` ADD CONSTRAINT `fk_company_addresses_company` FOREIGN KEY (`company_uuid`) REFERENCES `Companies`(`uuid`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_company_addresses_company_uuid` ON `CompanyAddresses` (`company_uuid`);