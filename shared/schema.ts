import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Playlists table - Extended for premium features
export const playlists = sqliteTable("playlists", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  username: text("username"),
  password: text("password"),
  providerType: text("provider_type").notNull().default("m3u"), // "m3u" or "xtream"
  accessLevel: text("access_level").notNull().default("free"), // "free" or "premium"
  apiEndpoint: text("api_endpoint"), // For Xtream Codes API
  expiresAt: text("expires_at"), // Subscription expiration
  isActive: integer("is_active", { mode: 'boolean' }).default(false),
  createdAt: text("created_at").default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text("updated_at").default('CURRENT_TIMESTAMP').notNull(),
});

// Channels table
export const channels = sqliteTable("channels", {
  id: integer("id").primaryKey(),
  playlistId: integer("playlist_id").references(() => playlists.id).notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  logo: text("logo"),
  epgId: text("epg_id"),
  isFavorite: integer("is_favorite", { mode: 'boolean' }).default(false),
  lastWatched: text("last_watched"),
  createdAt: text("created_at").default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text("updated_at").default('CURRENT_TIMESTAMP').notNull(),
});

// Categories table
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: text("created_at").default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text("updated_at").default('CURRENT_TIMESTAMP').notNull(),
});

// EPG Programs table
export const programs = sqliteTable("programs", {
  id: integer("id").primaryKey(),
  channelEpgId: text("channel_epg_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  category: text("category"),
  imageUrl: text("image_url"),
  createdAt: text("created_at").default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text("updated_at").default('CURRENT_TIMESTAMP').notNull(),
});

// EPG Sources table
export const epgSources = sqliteTable("epg_sources", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  lastUpdated: text("last_updated"),
  createdAt: text("created_at").default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text("updated_at").default('CURRENT_TIMESTAMP').notNull(),
});

// User settings table
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: blob("value", { mode: 'json' }),
  createdAt: text("created_at").default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text("updated_at").default('CURRENT_TIMESTAMP').notNull(),
});

// VOD (Video on Demand) - Movies
export const vodItems = sqliteTable("vod_items", {
  id: integer("id").primaryKey(),
  playlistId: integer("playlist_id").references(() => playlists.id).notNull(),
  name: text("name").notNull(),
  streamUrl: text("stream_url").notNull(),
  containerExtension: text("container_extension"), // mp4, mkv, etc.
  categoryId: integer("category_id").references(() => categories.id),
  plot: text("plot"),
  cast: text("cast"),
  director: text("director"),
  genre: text("genre"),
  releaseDate: text("release_date"),
  rating: text("rating"),
  duration: text("duration"),
  coverBig: text("cover_big"), // Poster image
  backdropPath: text("backdrop_path"),
  tmdbId: text("tmdb_id"), // The Movie Database ID
  createdAt: text("created_at").default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text("updated_at").default('CURRENT_TIMESTAMP').notNull(),
});

// Series
export const series = sqliteTable("series", {
  id: integer("id").primaryKey(),
  playlistId: integer("playlist_id").references(() => playlists.id).notNull(),
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  plot: text("plot"),
  cast: text("cast"),
  director: text("director"),
  genre: text("genre"),
  releaseDate: text("release_date"),
  rating: text("rating"),
  cover: text("cover"),
  backdropPath: text("backdrop_path"),
  tmdbId: text("tmdb_id"),
  createdAt: text("created_at").default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text("updated_at").default('CURRENT_TIMESTAMP').notNull(),
});

// Seasons
export const seasons = sqliteTable("seasons", {
  id: integer("id").primaryKey(),
  seriesId: integer("series_id").references(() => series.id).notNull(),
  seasonNumber: integer("season_number").notNull(),
  name: text("name"),
  coverBig: text("cover_big"),
  plot: text("plot"),
  airDate: text("air_date"),
  createdAt: text("created_at").default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text("updated_at").default('CURRENT_TIMESTAMP').notNull(),
});

// Episodes
export const episodes = sqliteTable("episodes", {
  id: integer("id").primaryKey(),
  seasonId: integer("season_id").references(() => seasons.id).notNull(),
  seriesId: integer("series_id").references(() => series.id).notNull(),
  episodeNum: integer("episode_num").notNull(),
  title: text("title").notNull(),
  streamUrl: text("stream_url").notNull(),
  containerExtension: text("container_extension"),
  plot: text("plot"),
  duration: text("duration"),
  coverBig: text("cover_big"),
  airDate: text("air_date"),
  rating: text("rating"),
  createdAt: text("created_at").default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text("updated_at").default('CURRENT_TIMESTAMP').notNull(),
});

// Favorites (can be channels, vod, or series)
export const favorites = sqliteTable("favorites", {
  id: integer("id").primaryKey(),
  itemType: text("item_type").notNull(), // "channel", "vod", "series"
  itemId: integer("item_id").notNull(), // ID of channel/vod/series
  playlistId: integer("playlist_id").references(() => playlists.id),
  createdAt: text("created_at").default('CURRENT_TIMESTAMP').notNull(),
});

// Viewing History
export const viewingHistory = sqliteTable("viewing_history", {
  id: integer("id").primaryKey(),
  itemType: text("item_type").notNull(), // "channel", "vod", "episode"
  itemId: integer("item_id").notNull(),
  playlistId: integer("playlist_id").references(() => playlists.id),
  watchedAt: text("watched_at").default('CURRENT_TIMESTAMP').notNull(),
  progress: integer("progress").default(0), // Seconds watched
  duration: integer("duration"), // Total duration in seconds
});

// Parental Controls
export const parentalControls = sqliteTable("parental_controls", {
  id: integer("id").primaryKey(),
  pinCode: text("pin_code").notNull(),
  isEnabled: integer("is_enabled", { mode: 'boolean' }).default(false),
  restrictedCategories: blob("restricted_categories", { mode: 'json' }), // Array of category IDs
  restrictedRatings: blob("restricted_ratings", { mode: 'json' }), // Array of ratings (PG, PG-13, R, etc.)
  createdAt: text("created_at").default('CURRENT_TIMESTAMP').notNull(),
  updatedAt: text("updated_at").default('CURRENT_TIMESTAMP').notNull(),
});

// Catch-Up Windows (for time-shift TV)
export const catchupWindows = sqliteTable("catchup_windows", {
  id: integer("id").primaryKey(),
  channelId: integer("channel_id").references(() => channels.id).notNull(),
  programId: integer("program_id").references(() => programs.id),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  catchupUrl: text("catchup_url"), // URL to archived stream
  createdAt: text("created_at").default('CURRENT_TIMESTAMP').notNull(),
});

// Establish relationships

export const playlistsRelations = relations(playlists, ({ many }) => ({
  channels: many(channels),
  vodItems: many(vodItems),
  series: many(series),
}));

export const channelsRelations = relations(channels, ({ one, many }) => ({
  playlist: one(playlists, { fields: [channels.playlistId], references: [playlists.id] }),
  category: one(categories, { fields: [channels.categoryId], references: [categories.id] }),
  catchupWindows: many(catchupWindows),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  channels: many(channels),
  vodItems: many(vodItems),
  series: many(series),
}));

export const vodItemsRelations = relations(vodItems, ({ one }) => ({
  playlist: one(playlists, { fields: [vodItems.playlistId], references: [playlists.id] }),
  category: one(categories, { fields: [vodItems.categoryId], references: [categories.id] }),
}));

export const seriesRelations = relations(series, ({ one, many }) => ({
  playlist: one(playlists, { fields: [series.playlistId], references: [playlists.id] }),
  category: one(categories, { fields: [series.categoryId], references: [categories.id] }),
  seasons: many(seasons),
}));

export const seasonsRelations = relations(seasons, ({ one, many }) => ({
  series: one(series, { fields: [seasons.seriesId], references: [series.id] }),
  episodes: many(episodes),
}));

export const episodesRelations = relations(episodes, ({ one }) => ({
  season: one(seasons, { fields: [episodes.seasonId], references: [seasons.id] }),
  series: one(series, { fields: [episodes.seriesId], references: [series.id] }),
}));

export const catchupWindowsRelations = relations(catchupWindows, ({ one }) => ({
  channel: one(channels, { fields: [catchupWindows.channelId], references: [channels.id] }),
  program: one(programs, { fields: [catchupWindows.programId], references: [programs.id] }),
}));

// Schemas for validation

export const playlistInsertSchema = createInsertSchema(playlists, {
  name: (schema) => schema.min(1, "Playlist name is required"),
  url: (schema) => schema.refine((url) => {
    // Allow empty URL for file uploads or URLs that start with http/https
    return !url || url === '' || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://');
  }, "URL must be empty (for file uploads) or start with http://, https://, or file://"),
});
export type PlaylistInsert = z.infer<typeof playlistInsertSchema>;
export type Playlist = typeof playlists.$inferSelect;

export const channelInsertSchema = createInsertSchema(channels, {
  name: (schema) => schema.min(1, "Channel name is required"),
  url: (schema) => schema.min(1, "Valid stream URL is required"),
});
export type ChannelInsert = z.infer<typeof channelInsertSchema>;
export type Channel = typeof channels.$inferSelect;

export const categoryInsertSchema = createInsertSchema(categories, {
  name: (schema) => schema.min(1, "Category name is required"),
});
export type CategoryInsert = z.infer<typeof categoryInsertSchema>;
export type Category = typeof categories.$inferSelect;

export const programInsertSchema = createInsertSchema(programs, {
  title: (schema) => schema.min(1, "Program title is required"),
  channelEpgId: (schema) => schema.min(1, "Channel EPG ID is required"),
  startTime: (schema) => schema,
  endTime: (schema) => schema,
});
export type ProgramInsert = z.infer<typeof programInsertSchema>;
export type Program = typeof programs.$inferSelect;

export const epgSourceInsertSchema = createInsertSchema(epgSources, {
  name: (schema) => schema.min(1, "EPG source name is required"),
  url: (schema) => schema.min(5, "Valid EPG URL is required"),
});
export type EpgSourceInsert = z.infer<typeof epgSourceInsertSchema>;
export type EpgSource = typeof epgSources.$inferSelect;

export const settingsInsertSchema = createInsertSchema(settings, {
  key: (schema) => schema.min(1, "Settings key is required"),
});
export type SettingsInsert = z.infer<typeof settingsInsertSchema>;
export type Settings = typeof settings.$inferSelect;

// VOD Schemas
export const vodItemInsertSchema = createInsertSchema(vodItems, {
  name: (schema) => schema.min(1, "Movie name is required"),
  streamUrl: (schema) => schema.min(1, "Stream URL is required"),
});
export type VodItemInsert = z.infer<typeof vodItemInsertSchema>;
export type VodItem = typeof vodItems.$inferSelect;

// Series Schemas
export const seriesInsertSchema = createInsertSchema(series, {
  name: (schema) => schema.min(1, "Series name is required"),
});
export type SeriesInsert = z.infer<typeof seriesInsertSchema>;
export type Series = typeof series.$inferSelect;

// Season Schemas
export const seasonInsertSchema = createInsertSchema(seasons, {
  seasonNumber: (schema) => schema.min(1, "Season number is required"),
});
export type SeasonInsert = z.infer<typeof seasonInsertSchema>;
export type Season = typeof seasons.$inferSelect;

// Episode Schemas
export const episodeInsertSchema = createInsertSchema(episodes, {
  title: (schema) => schema.min(1, "Episode title is required"),
  episodeNum: (schema) => schema.min(1, "Episode number is required"),
  streamUrl: (schema) => schema.min(1, "Stream URL is required"),
});
export type EpisodeInsert = z.infer<typeof episodeInsertSchema>;
export type Episode = typeof episodes.$inferSelect;

// Favorites Schemas
export const favoriteInsertSchema = createInsertSchema(favorites, {
  itemType: (schema) => schema.min(1, "Item type is required"),
  itemId: (schema) => schema.min(1, "Item ID is required"),
});
export type FavoriteInsert = z.infer<typeof favoriteInsertSchema>;
export type Favorite = typeof favorites.$inferSelect;

// Viewing History Schemas
export const viewingHistoryInsertSchema = createInsertSchema(viewingHistory, {
  itemType: (schema) => schema.min(1, "Item type is required"),
  itemId: (schema) => schema.min(1, "Item ID is required"),
});
export type ViewingHistoryInsert = z.infer<typeof viewingHistoryInsertSchema>;
export type ViewingHistory = typeof viewingHistory.$inferSelect;

// Parental Controls Schemas
export const parentalControlsInsertSchema = createInsertSchema(parentalControls, {
  pinCode: (schema) => schema.min(4, "PIN must be at least 4 characters"),
});
export type ParentalControlsInsert = z.infer<typeof parentalControlsInsertSchema>;
export type ParentalControls = typeof parentalControls.$inferSelect;

// Catch-Up Windows Schemas
export const catchupWindowInsertSchema = createInsertSchema(catchupWindows, {
  channelId: (schema) => schema.min(1, "Channel ID is required"),
});
export type CatchupWindowInsert = z.infer<typeof catchupWindowInsertSchema>;
export type CatchupWindow = typeof catchupWindows.$inferSelect;
