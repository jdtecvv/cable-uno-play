import { Channel, Category, Playlist, Program } from "@shared/schema";

// Extended channel type with category included
export interface ChannelWithCategory {
  channel: Channel;
  category: Category | null;
}

// Type for a channel with its current program information
export interface ChannelWithProgram extends ChannelWithCategory {
  currentProgram?: Program;
  nextProgram?: Program;
}

// Type for grouped channels by category
export interface ChannelsByCategory {
  category: Category;
  channels: ChannelWithCategory[];
}

// M3U Playlist entry type
export interface M3UEntry {
  name: string;
  url: string;
  username?: string;
  password?: string;
  tvg: {
    id?: string;
    name?: string;
    logo?: string;
    url?: string;
  };
  group: {
    title?: string;
  };
  http: {
    referrer?: string;
    "user-agent"?: string;
  };
  timeshift?: string;
  catchup?: {
    type?: string;
    days?: string;
    source?: string;
  };
}

// M3U Playlist parsed result
export interface M3UPlaylist {
  header: {
    attrs: Record<string, string>;
    raw: string;
  };
  items: M3UEntry[];
}

// XMLTV Program type
export interface XMLTVProgram {
  channel: string;
  start: Date;
  stop: Date;
  title: string;
  description?: string;
  category?: string;
  language?: string;
  icon?: string;
}

// XMLTV Channel type
export interface XMLTVChannel {
  id: string;
  displayName: string;
  icon?: string;
  url?: string;
}

// XMLTV Parsed result
export interface XMLTVData {
  channels: XMLTVChannel[];
  programs: XMLTVProgram[];
}

// Player Settings type
export interface PlayerSettings {
  volume: number;
  autoplay: boolean;
  rememberLastChannel: boolean;
  bufferingTime: number;
}

// Type for local storage data
export interface StorageData {
  recentChannels: Channel[];
  favoriteChannels: Channel[];
  activePlaylist?: Playlist;
  playerSettings: PlayerSettings;
}
