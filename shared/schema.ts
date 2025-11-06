import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Playlists table
export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  username: text("username"),
  password: text("password"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Channels table
export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id").references(() => playlists.id).notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  logo: text("logo"),
  epgId: text("epg_id"),
  isFavorite: boolean("is_favorite").default(false),
  lastWatched: timestamp("last_watched"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// EPG Programs table
export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  channelEpgId: text("channel_epg_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  category: text("category"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// EPG Sources table
export const epgSources = pgTable("epg_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  lastUpdated: timestamp("last_updated"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Establish relationships

export const playlistsRelations = relations(playlists, ({ many }) => ({
  channels: many(channels),
}));

export const channelsRelations = relations(channels, ({ one }) => ({
  playlist: one(playlists, { fields: [channels.playlistId], references: [playlists.id] }),
  category: one(categories, { fields: [channels.categoryId], references: [categories.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  channels: many(channels),
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
