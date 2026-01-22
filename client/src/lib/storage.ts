export const STORAGE_KEYS = {
  ACTIVE_PLAYLIST: 'active_playlist', // Stores the full playlist object
};

export interface SavedPlaylist {
  name: string;
  type: 'xui' | 'm3u';
  url?: string;
  username?: string;
  password?: string;
  server?: string;
  content?: string; // Cache the M3U content to avoid re-fetching
  channels?: any[]; // Cache parsed channels
}

export function savePlaylist(playlist: SavedPlaylist) {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_PLAYLIST, JSON.stringify(playlist));
}

export function getActivePlaylist(): SavedPlaylist | null {
  const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_PLAYLIST);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse playlist from storage", e);
    return null;
  }
}

export function clearPlaylist() {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_PLAYLIST);
}
