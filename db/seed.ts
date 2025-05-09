import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  try {
    console.log("Seeding database...");
    
    // Seed default categories
    const defaultCategories = [
      { name: "Sports" },
      { name: "News" },
      { name: "Movies" },
      { name: "Entertainment" },
      { name: "Kids" },
      { name: "Documentary" },
      { name: "Music" },
      { name: "General" },
    ];

    // Check if categories already exist to prevent duplicates
    const existingCategories = await db.select().from(schema.categories);
    
    if (existingCategories.length === 0) {
      console.log("Adding default categories...");
      for (const category of defaultCategories) {
        const validated = schema.categoryInsertSchema.parse(category);
        await db.insert(schema.categories).values(validated);
      }
    } else {
      console.log("Categories already exist, skipping...");
    }

    // Seed a default playlist if none exists
    const existingPlaylists = await db.select().from(schema.playlists);
    
    if (existingPlaylists.length === 0) {
      console.log("Adding default playlist...");
      const defaultPlaylist = { 
        name: "Default Playlist", 
        url: "https://iptv-org.github.io/iptv/index.m3u", 
        isActive: true 
      };
      
      const validated = schema.playlistInsertSchema.parse(defaultPlaylist);
      await db.insert(schema.playlists).values(validated);
    } else {
      console.log("Playlist already exists, skipping...");
    }

    // Seed default settings if none exist
    const existingSettings = await db.select().from(schema.settings).where(eq(schema.settings.key, "playerSettings"));
    
    if (existingSettings.length === 0) {
      console.log("Adding default settings...");
      const defaultSettings = {
        key: "playerSettings",
        value: {
          volume: 70,
          autoplay: true,
          rememberLastChannel: true,
          bufferingTime: 5000,
        }
      };
      
      await db.insert(schema.settings).values(defaultSettings);
    } else {
      console.log("Settings already exist, skipping...");
    }

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
