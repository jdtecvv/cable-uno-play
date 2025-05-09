import { db } from "@db";
import * as schema from "@shared/schema";
import { eq, and, like, desc, sql, inArray, isNull, isNotNull } from "drizzle-orm";

// Playlist-related functions
export async function getPlaylists() {
  return await db.select().from(schema.playlists).orderBy(desc(schema.playlists.createdAt));
}

export async function getPlaylistById(id: number) {
  return await db.select().from(schema.playlists).where(eq(schema.playlists.id, id));
}

export async function getActivePlaylist() {
  return await db.select().from(schema.playlists).where(eq(schema.playlists.isActive, true));
}

export async function createPlaylist(playlist: schema.PlaylistInsert) {
  return await db.insert(schema.playlists).values(playlist).returning();
}

export async function updatePlaylist(id: number, playlist: Partial<schema.PlaylistInsert>) {
  return await db.update(schema.playlists)
    .set({ ...playlist, updatedAt: new Date() })
    .where(eq(schema.playlists.id, id))
    .returning();
}

export async function deletePlaylist(id: number) {
  return await db.delete(schema.playlists).where(eq(schema.playlists.id, id)).returning();
}

export async function setActivePlaylist(id: number) {
  // First, set all playlists to inactive
  await db.update(schema.playlists).set({ isActive: false });
  
  // Then set the specified playlist to active
  return await db.update(schema.playlists)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(schema.playlists.id, id))
    .returning();
}

// Channel-related functions
export async function getChannels(playlistId?: number) {
  const query = db.select({
    channel: schema.channels,
    category: schema.categories,
  })
  .from(schema.channels)
  .leftJoin(schema.categories, eq(schema.channels.categoryId, schema.categories.id))
  .orderBy(schema.channels.name);
  
  if (playlistId) {
    return await query.where(eq(schema.channels.playlistId, playlistId));
  }
  
  return await query;
}

export async function getChannelById(id: number) {
  return await db.select({
    channel: schema.channels,
    category: schema.categories,
  })
  .from(schema.channels)
  .leftJoin(schema.categories, eq(schema.channels.categoryId, schema.categories.id))
  .where(eq(schema.channels.id, id));
}

export async function getChannelsByCategory(categoryId: number, playlistId?: number) {
  const query = db.select({
    channel: schema.channels,
    category: schema.categories,
  })
  .from(schema.channels)
  .leftJoin(schema.categories, eq(schema.channels.categoryId, schema.categories.id))
  .where(eq(schema.channels.categoryId, categoryId))
  .orderBy(schema.channels.name);
  
  if (playlistId) {
    return await query.where(eq(schema.channels.playlistId, playlistId));
  }
  
  return await query;
}

export async function getFavoriteChannels() {
  return await db.select({
    channel: schema.channels,
    category: schema.categories,
  })
  .from(schema.channels)
  .leftJoin(schema.categories, eq(schema.channels.categoryId, schema.categories.id))
  .where(eq(schema.channels.isFavorite, true))
  .orderBy(schema.channels.name);
}

export async function getRecentlyWatchedChannels(limit = 10) {
  return await db.select({
    channel: schema.channels,
    category: schema.categories,
  })
  .from(schema.channels)
  .leftJoin(schema.categories, eq(schema.channels.categoryId, schema.categories.id))
  .where(isNotNull(schema.channels.lastWatched))
  .orderBy(desc(schema.channels.lastWatched))
  .limit(limit);
}

export async function searchChannels(searchTerm: string, playlistId?: number) {
  const query = db.select({
    channel: schema.channels,
    category: schema.categories,
  })
  .from(schema.channels)
  .leftJoin(schema.categories, eq(schema.channels.categoryId, schema.categories.id))
  .where(like(schema.channels.name, `%${searchTerm}%`))
  .orderBy(schema.channels.name);
  
  if (playlistId) {
    return await query.where(eq(schema.channels.playlistId, playlistId));
  }
  
  return await query;
}

export async function createChannel(channel: schema.ChannelInsert) {
  return await db.insert(schema.channels).values(channel).returning();
}

export async function updateChannel(id: number, channel: Partial<schema.ChannelInsert>) {
  return await db.update(schema.channels)
    .set({ ...channel, updatedAt: new Date() })
    .where(eq(schema.channels.id, id))
    .returning();
}

export async function deleteChannel(id: number) {
  return await db.delete(schema.channels).where(eq(schema.channels.id, id)).returning();
}

export async function toggleFavorite(id: number) {
  // First get the current state
  const [channel] = await db.select({ isFavorite: schema.channels.isFavorite })
    .from(schema.channels)
    .where(eq(schema.channels.id, id));
  
  if (!channel) return null;
  
  // Then toggle it
  return await db.update(schema.channels)
    .set({ 
      isFavorite: !channel.isFavorite,
      updatedAt: new Date()
    })
    .where(eq(schema.channels.id, id))
    .returning();
}

export async function updateLastWatched(id: number) {
  return await db.update(schema.channels)
    .set({ 
      lastWatched: new Date(),
      updatedAt: new Date()
    })
    .where(eq(schema.channels.id, id))
    .returning();
}

export async function bulkInsertChannels(channels: schema.ChannelInsert[]) {
  if (channels.length === 0) return [];
  return await db.insert(schema.channels).values(channels).returning();
}

// Category-related functions
export async function getCategories() {
  return await db.select().from(schema.categories).orderBy(schema.categories.name);
}

export async function getCategoryById(id: number) {
  return await db.select().from(schema.categories).where(eq(schema.categories.id, id));
}

export async function createCategory(category: schema.CategoryInsert) {
  return await db.insert(schema.categories).values(category).returning();
}

export async function updateCategory(id: number, category: Partial<schema.CategoryInsert>) {
  return await db.update(schema.categories)
    .set({ ...category, updatedAt: new Date() })
    .where(eq(schema.categories.id, id))
    .returning();
}

export async function deleteCategory(id: number) {
  return await db.delete(schema.categories).where(eq(schema.categories.id, id)).returning();
}

// EPG-related functions
export async function getEpgSources() {
  return await db.select().from(schema.epgSources).orderBy(schema.epgSources.name);
}

export async function getEpgSourceById(id: number) {
  return await db.select().from(schema.epgSources).where(eq(schema.epgSources.id, id));
}

export async function createEpgSource(source: schema.EpgSourceInsert) {
  return await db.insert(schema.epgSources).values(source).returning();
}

export async function updateEpgSource(id: number, source: Partial<schema.EpgSourceInsert>) {
  return await db.update(schema.epgSources)
    .set({ ...source, updatedAt: new Date() })
    .where(eq(schema.epgSources.id, id))
    .returning();
}

export async function deleteEpgSource(id: number) {
  return await db.delete(schema.epgSources).where(eq(schema.epgSources.id, id)).returning();
}

export async function getProgramsByChannelEpgId(channelEpgId: string, startTime?: Date, endTime?: Date) {
  let query = db.select()
    .from(schema.programs)
    .where(eq(schema.programs.channelEpgId, channelEpgId))
    .orderBy(schema.programs.startTime);
  
  if (startTime) {
    query = query.where(sql`${schema.programs.startTime} >= ${startTime}`);
  }
  
  if (endTime) {
    query = query.where(sql`${schema.programs.endTime} <= ${endTime}`);
  }
  
  return await query;
}

export async function getCurrentProgram(channelEpgId: string) {
  const now = new Date();
  return await db.select()
    .from(schema.programs)
    .where(and(
      eq(schema.programs.channelEpgId, channelEpgId),
      sql`${schema.programs.startTime} <= ${now}`,
      sql`${schema.programs.endTime} > ${now}`
    ))
    .limit(1);
}

export async function bulkInsertPrograms(programs: schema.ProgramInsert[]) {
  if (programs.length === 0) return [];
  return await db.insert(schema.programs).values(programs).returning();
}

// Settings-related functions
export async function getSetting(key: string) {
  return await db.select().from(schema.settings).where(eq(schema.settings.key, key));
}

export async function updateSetting(key: string, value: any) {
  // Check if setting exists
  const [existingSetting] = await db.select()
    .from(schema.settings)
    .where(eq(schema.settings.key, key));
  
  if (existingSetting) {
    return await db.update(schema.settings)
      .set({ 
        value, 
        updatedAt: new Date() 
      })
      .where(eq(schema.settings.key, key))
      .returning();
  } else {
    return await db.insert(schema.settings)
      .values({ key, value })
      .returning();
  }
}
