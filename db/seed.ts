import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  if (!db) {
    console.error("Database connection not available");
    process.exit(1);
  }

  try {
    console.log("Seeding database...");

    // Default Categories
    const defaultCategories = [
      { name: "Nacionales", sortOrder: 1, isActive: true },
      { name: "Deportes", sortOrder: 2, isActive: true },
      { name: "Noticias", sortOrder: 3, isActive: true },
      { name: "Películas", sortOrder: 4, isActive: true },
      { name: "Infantiles", sortOrder: 5, isActive: true },
      { name: "Música", sortOrder: 6, isActive: true },
      { name: "Religiosos", sortOrder: 7, isActive: true },
      { name: "Variedades", sortOrder: 8, isActive: true },
      { name: "Internacionales", sortOrder: 9, isActive: true },
    ];

    const existingCategories = await db.select().from(schema.categories);
    if (existingCategories.length === 0) {
      console.log("Inserting default categories...");
      const correctData = defaultCategories.map(c => ({ name: c.name }));
      await db.insert(schema.categories).values(correctData);
    }

    // Default Playlist
    const defaultPlaylist = {
      name: "Lista Principal",
      description: "Lista de canales predeterminada",
      url: "",
      isActive: true,
      syncInterval: 60,
    };

    const existingPlaylists = await db.select().from(schema.playlists);
    if (existingPlaylists.length === 0) {
      console.log("Inserting default playlist...");
      const playlistData = {
        name: defaultPlaylist.name,
        url: defaultPlaylist.url,
        isActive: defaultPlaylist.isActive,
        providerType: "m3u",
        accessLevel: "free"
      };
      
      await db.insert(schema.playlists).values(playlistData);
    }

    // Default Settings
    const defaultSettings = {
      key: "playerSettings",
      value: {
        autoplay: true,
        muted: false,
        defaultQuality: "auto",
        theme: "dark",
      },
    };

    const existingSettings = await db.select().from(schema.settings).where(eq(schema.settings.key, "playerSettings"));
    if (existingSettings.length === 0) {
      console.log("Inserting default settings...");
      await db.insert(schema.settings).values(defaultSettings);
    }

    console.log("Seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
