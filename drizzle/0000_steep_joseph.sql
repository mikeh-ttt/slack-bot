CREATE TABLE `nudges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`user_email` text,
	`user_name` text,
	`nudged_at` integer NOT NULL
);
