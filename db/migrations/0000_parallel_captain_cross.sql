CREATE TABLE `catchup_windows` (
	`id` integer PRIMARY KEY NOT NULL,
	`channel_id` integer NOT NULL,
	`program_id` integer,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`catchup_url` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `channels` (
	`id` integer PRIMARY KEY NOT NULL,
	`playlist_id` integer NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`category_id` integer,
	`logo` text,
	`epg_id` text,
	`is_favorite` integer DEFAULT false,
	`last_watched` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `epg_sources` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`last_updated` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `episodes` (
	`id` integer PRIMARY KEY NOT NULL,
	`season_id` integer NOT NULL,
	`series_id` integer NOT NULL,
	`episode_num` integer NOT NULL,
	`title` text NOT NULL,
	`stream_url` text NOT NULL,
	`container_extension` text,
	`plot` text,
	`duration` text,
	`cover_big` text,
	`air_date` text,
	`rating` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`series_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` integer PRIMARY KEY NOT NULL,
	`item_type` text NOT NULL,
	`item_id` integer NOT NULL,
	`playlist_id` integer,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `parental_controls` (
	`id` integer PRIMARY KEY NOT NULL,
	`pin_code` text NOT NULL,
	`is_enabled` integer DEFAULT false,
	`restricted_categories` blob,
	`restricted_ratings` blob,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `playlists` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`username` text,
	`password` text,
	`provider_type` text DEFAULT 'm3u' NOT NULL,
	`access_level` text DEFAULT 'free' NOT NULL,
	`api_endpoint` text,
	`expires_at` text,
	`is_active` integer DEFAULT false,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` integer PRIMARY KEY NOT NULL,
	`channel_epg_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`category` text,
	`image_url` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `seasons` (
	`id` integer PRIMARY KEY NOT NULL,
	`series_id` integer NOT NULL,
	`season_number` integer NOT NULL,
	`name` text,
	`cover_big` text,
	`plot` text,
	`air_date` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`series_id`) REFERENCES `series`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `series` (
	`id` integer PRIMARY KEY NOT NULL,
	`playlist_id` integer NOT NULL,
	`name` text NOT NULL,
	`category_id` integer,
	`plot` text,
	`cast` text,
	`director` text,
	`genre` text,
	`release_date` text,
	`rating` text,
	`cover` text,
	`backdrop_path` text,
	`tmdb_id` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` blob,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE TABLE `viewing_history` (
	`id` integer PRIMARY KEY NOT NULL,
	`item_type` text NOT NULL,
	`item_id` integer NOT NULL,
	`playlist_id` integer,
	`watched_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`progress` integer DEFAULT 0,
	`duration` integer,
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vod_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`playlist_id` integer NOT NULL,
	`name` text NOT NULL,
	`stream_url` text NOT NULL,
	`container_extension` text,
	`category_id` integer,
	`plot` text,
	`cast` text,
	`director` text,
	`genre` text,
	`release_date` text,
	`rating` text,
	`duration` text,
	`cover_big` text,
	`backdrop_path` text,
	`tmdb_id` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
