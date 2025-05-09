export const APP_NAME = "IPTV Player";

// Menu items for sidebar/navigation
export const MAIN_MENU_ITEMS = [
  { name: "Home", icon: "ri-home-5-line", path: "/" },
  { name: "Live TV", icon: "ri-live-line", path: "/live" },
  { name: "TV Guide", icon: "ri-calendar-line", path: "/guide" },
  { name: "Favorites", icon: "ri-heart-line", path: "/favorites" },
];

// Default categories for channels
export const DEFAULT_CATEGORIES = [
  "Sports",
  "News",
  "Movies",
  "Entertainment",
  "Kids",
  "Documentary",
  "Music",
  "General",
];

// Time slots for EPG guide in hours (24-hour format)
export const EPG_TIME_SLOTS = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 
  12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23
];

// Video player settings
export const DEFAULT_PLAYER_SETTINGS = {
  volume: 70,
  autoplay: true,
  rememberLastChannel: true,
  bufferingTime: 5000, // in milliseconds
};

// Local storage keys
export const STORAGE_KEYS = {
  RECENT_CHANNELS: "iptv-recent-channels",
  FAVORITE_CHANNELS: "iptv-favorite-channels",
  ACTIVE_PLAYLIST: "iptv-active-playlist",
  PLAYER_SETTINGS: "iptv-player-settings",
  THEME: "iptv-theme",
};

// API endpoints
export const API_ENDPOINTS = {
  PLAYLISTS: "/api/playlists",
  ACTIVE_PLAYLIST: "/api/playlists/active",
  CHANNELS: "/api/channels",
  FAVORITES: "/api/channels/favorites",
  RECENT: "/api/channels/recent",
  SEARCH: "/api/channels/search",
  CATEGORIES: "/api/categories",
  EPG_SOURCES: "/api/epg/sources",
  EPG_PROGRAMS: "/api/epg/programs",
  SETTINGS: "/api/settings",
};

// Device detection breakpoints
export const DEVICE_BREAKPOINTS = {
  MOBILE: 640,  // < 640px
  TABLET: 768,  // >= 640px && < 768px
  DESKTOP: 1024, // >= 768px && < 1024px
  TV: 1200,     // >= 1200px
};

// Remote control key mappings
export const REMOTE_KEYS = {
  UP: "ArrowUp",
  DOWN: "ArrowDown",
  LEFT: "ArrowLeft",
  RIGHT: "ArrowRight",
  ENTER: "Enter",
  BACK: "Escape",
  PLAY_PAUSE: " ", // Space
  VOLUME_UP: "+",
  VOLUME_DOWN: "-",
  MUTE: "m",
  FULLSCREEN: "f",
};

// Default image placeholders
export const DEFAULT_IMAGES = {
  CHANNEL_LOGO: "https://via.placeholder.com/80?text=TV",
  CHANNEL_THUMBNAIL: "https://via.placeholder.com/320x180?text=No+Preview",
  USER_AVATAR: "https://via.placeholder.com/40?text=User",
};
