CREATE TABLE `jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`schedule` text NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
